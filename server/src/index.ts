import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { calculatePPPPrice } from './pricingEngine.js';
import { generateLocalizedPitch } from './aiEngine.js';
import requestIp from 'request-ip';
import geoip from 'geoip-lite';
import { getCountryList } from './pricingEngine.js';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import Strategy from './models/Strategy.js';
import { protect } from './middleware/authMiddleware.js';
import User from './models/User.js';
import { initializeDynamicPayment, verifyPaystackPayment } from './paystack.js';



dotenv.config();
const app = express();
app.use(cors());

app.use(cors({
    origin: ["https://priceparityai.vercel.app", "http://localhost:5173"],
    credentials: true
}));
app.use(express.json());

// THE CORE SaaS ROUTE
// A user sends: { "price": 100, "country": "NG" }
// The app returns: { "suggestedPrice": 25, "discount": 75% }
app.post('/api/calculate', protect, async (req: any, res) => {
    const { price, country, productName } = req.body;
    
    try {
        // 1. Fetch the user FRESH from the database every time
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const pricing = calculatePPPPrice(price, country);

        // 2. Logic Check: If they are Pro, give the real pitch. If not, give the "Upgrade" message.
        let pitch = "Upgrade to Pro to unlock AI Marketing Pitches";
        if (user.isPro) {
            pitch = await generateLocalizedPitch(productName, pricing.localPriceFormatted, country);
        }

        const newStrategy = new Strategy({
            user: user._id,
            productName,
            originalPrice: price,
            suggestedPrice: pricing.suggestedPrice,
            country,
            pitch: pitch
        });
        await newStrategy.save();

        // 3. Return the result AND the absolute truth about their Pro status
        res.json({
            ...pricing,
            productName,
            localizedPitch: pitch,
            isPro: user.isPro // This tells the frontend if they are allowed to see it
        });
    } catch (error) {
        res.status(500).json({ error: "Error generating strategy" })
    }
});

app.post('/api/paystack/initialize', protect, async (req: any, res) => {
    try {
        const user = await User.findById(req.user.id);
        const { planType } = req.body;
        if (!user) return res.status(404).json({ error: "User not found" });

        const basePriceUSD = planType === 'annual' ? 99 : 12;

        const clientIp = requestIp.getClientIp(req) || "";
        const geo = geoip.lookup(clientIp);
        const countryCode = geo ? geo.country : "US";

        const ppp = calculatePPPPrice(basePriceUSD, countryCode);

        // --- GLOBAL CORRECTION ---
        // Paystack Nigeria expects Kobo. We must convert everything to Naira.
        // Even if the user is in the US, we charge them the Naira equivalent of their price.
        const EXCHANGE_RATE = 1363; // Current market rate
        
        // SuggestedPrice (in USD) * Current Rate * 100 (for Kobo)
        const amountInKobo = Math.round(ppp.suggestedPrice * EXCHANGE_RATE * 100);

        const metadata = {
            user_id: user.id,
            plan_type: planType || 'monthly'
        };

        const paymentData = await initializeDynamicPayment(user.email, amountInKobo, user.id, metadata);
        
        res.json(paymentData); 
    } catch (error) {
        res.status(500).json({ error: "Init crash" });
    }
});

// Get all saved strategies for the logged-in user
app.get('/api/strategies', protect, async (req: any, res) => {
    try {
        const history = await Strategy.find({ user: req.user.id }).sort({
            createdAt: -1
        });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: "Could not fetch history"});
    }
});

// Route for the frontend to get the searchable list of countries
app.get('/api/countries', (req, res) => {
    res.json(getCountryList());
});

// 1. Ensure this route exists below your initialize route
app.get('/api/paystack/verify', async (req, res) => {
    const { reference } = req.query;
    if (!reference) return res.status(400).json({ error: "No reference" });

    try {
        const data = await verifyPaystackPayment(reference as string);
        
        if (data && data.status === 'success') {
            // SAFE ACCESS: Check if metadata exists before reading it
            const userId = data.metadata?.user_id;
            const planType = data.metadata?.plan_type || 'monthly';

            if (!userId) {
                console.error("Verify Error: No user_id in metadata");
                return res.status(400).json({ error: "Metadata missing" });
            }

            // Calculate Expiry
            const expiryDate = new Date();
            if (planType === 'annual') {
                expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            } else {
                expiryDate.setDate(expiryDate.getDate() + 30);
            }

            // Update User
            await User.findByIdAndUpdate(userId, { 
                isPro: true, 
                proExpiry: expiryDate 
            });

            console.log(`User ${userId} upgraded successfully to ${planType}`);
            return res.json({ success: true, isPro: true });
        }
        
        res.status(400).json({ success: false, message: "Payment failed at gateway" });

    } catch (error) {
        console.error("CRITICAL VERIFY ERROR:", error);
        res.status(500).json({ error: "Server crashed during verification" });
    }
});

app.get('/api/paystack/manage', protect, async (req: any, res) => {
    // This allows the user to update their card or cancel on Paystack's secure site
    // You would typically redirect them to: https://dashboard.paystack.com/external/portal/CUSTOMER_CODE
    res.json({ message: "Subscription management coming soon via Paystack Portal" });
});

app.post('/api/create-checkout-session', protect, async (req: any, res) => {
    try {
        const session = await createCheckoutSession(req.user.id);
        res.json({ url: session.url }); // Send stripe link to the frontend
    } catch (error) { 
        res.status(500).json({ error: "Could not create session" });
    }
});

// This route will be called by "Widget" on other people's websites
// 1. We use (req, res) as standard Express parameters

app.get('/api/widget', async (req: any, res: any) => { // Added :any to parameters
    try {
        const originalPrice = Number(req.query.price);
        const clientIp = requestIp.getClientIp(req) || "";
        const geo = geoip.lookup(clientIp);
        const countryCode = (req.query.test_country as string) || (geo ? geo.country : "US");

        // 1. Get result and tell TS to treat it as "any" to clear the property errors
        const result = calculatePPPPrice(100, countryCode) as any;
        
        // 2. Fix the exchangeRate math (Cleaning the string to get just numbers)
        const numericLocalPrice = Number(result.localPriceFormatted.replace(/[^0-9.]/g, ''));
        const exchangeRate = numericLocalPrice / result.suggestedPrice;
        const symbol = result.symbol;

        res.setHeader('Content-Type', 'application/javascript');
        
        res.send(`
            (function() {
                const multiplier = ${result.discountPercentage > 0 ? (result.suggestedPrice / 100) : 1};
                const exchangeRate = ${exchangeRate};
                const symbol = "${symbol}";
                const country = "${result.countryName}";

                function updatePrices() {
                    const priceElements = document.querySelectorAll('[data-pp-price]');
                    priceElements.forEach(el => {
                        const originalPrice = parseFloat(el.getAttribute('data-pp-price'));
                        if (isNaN(originalPrice)) return;

                        const fairUSD = originalPrice * multiplier;
                        const fairLocal = Math.round(fairUSD * exchangeRate);
                        const formatted = symbol + fairLocal.toLocaleString();

                        el.innerHTML = ' ' + country + ' Offer: <b>' + formatted + '</b>';
                        el.style.display = 'inline-flex';
                        el.style.alignItems = 'center';
                        el.style.gap = '8px';
                        el.style.background = 'rgba(37, 99, 235, 0.05)';
                        el.style.color = '#2563eb';
                        el.style.padding = '8px 16px';
                        el.style.borderRadius = '99px';
                        el.style.fontSize = '12px';
                        el.style.fontWeight = '700';
                        el.style.border = '1px solid rgba(37, 99, 235, 0.1)';
                    });
                }

                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', updatePrices);
                } else {
                    updatePrices();
                }
            })();
        `);
    } catch (error) {
        console.error("Widget Error:", error);
        res.status(500).send('console.error("PriceParity Widget Load Failed");');
    }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI as string)
    .then(() => console.log("Saas Database Connected"))
    .catch(err => console.log(err));

    app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`PriceParity AI Engine running on port ${PORT}`);
});