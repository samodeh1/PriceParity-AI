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
import { initializeDynamicPayment, initializePaystackSubscription, verifyPaystackPayment } from './paystack.js';



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
        const { planType } = req.body; // 'monthly' or 'annual'

        if (!user) return res.status(404).json({ error: "User not found" });

        // 1. Determine base price
        const basePriceUSD = planType === 'annual' ? 99 : 12;

        // 2. Detect Country
        const clientIp = requestIp.getClientIp(req) || "";
        const geo = geoip.lookup(clientIp);
        const countryCode = geo ? geo.country : "US";

        // 3. Calculate fair price
        const ppp = calculatePPPPrice(basePriceUSD, countryCode);

        // 4. PREPARE METADATA (Very simple format to avoid 500 errors)
        const metadata = {
            user_id: user.id,
            plan_type: planType || 'monthly'
        };

        let paymentData;
        if (ppp.discountPercentage > 0) {
            const rates: Record<string, number> = { "NG": 1363, "IN": 83 };
            const rate = rates[countryCode] || 1;
            const amountInKobo = Math.round(ppp.suggestedPrice * rate * 100);

            // Using the dynamic function
            paymentData = await initializeDynamicPayment(user.email, amountInKobo, user.id, metadata);
        } else {
            // Full price users
            const planCode = planType === 'annual' ? process.env.PAYSTACK_ANNUAL_PLAN : process.env.PAYSTACK_MONTHLY_PLAN;
            paymentData = await initializePaystackSubscription(user.email, planCode as string, user.id);
        }
        
        res.json(paymentData); 
    } catch (error) {
        console.error("Init Error:", error);
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

app.get('/api/widget', async (req, res) => {
    try {
         // 1. Get the price from the URL
        const originalPrice = Number(req.query.price);

        // 2. If the customer forgot the price, stop the script and show an error in console
        if (!originalPrice || isNaN(originalPrice)) {
            res.setHeader('Content-Type', 'application/javascript');
            return res.send('console.error("PriceParity Error: No price provided in script URL");');
        }

        // 1. Get real IP address from headers (Works on Render/Production)
        const forwarded = req.headers['x-forwarded-for'];
        const clientIp = typeof forwarded === 'string' 
            ? forwarded.split(',')[0] 
            : req.socket.remoteAddress || "";

        // 2. Lookup the country using GeoIP
        const geo = geoip.lookup(clientIp);
        
        // 3. Fallback logic: If IP is local (testing) or not found, use a default
        // For development testing, you can force 'NG' here if geo is null
        const countryCode = geo ? geo.country : "US"; 

        // --- TEST MODE FOR SAMUEL ---
        // If you are on localhost, geo will be null.
        // Add ?test_country=GB to your browser URL to test the UK, etc.
        if (req.query.test_country) {
            countryCode = String(req.query.test_country).toUpperCase();
        }

        const result = calculatePPPPrice(originalPrice, countryCode);

        res.setHeader('Content-Type', 'application/javascript');
        
        // 4. Return the Dynamic Script with real data
        res.send(`
            (function() {
                const element = document.getElementById('price-parity-display');
                if (element) {
                    element.innerHTML = ' Special Offer: Residents of ${result.countryName} pay only <b>${result.localPriceFormatted}</b>';
                    element.style.display = 'inline-flex';
                    element.style.alignItems = 'center';
                    element.style.gap = '8px';
                    element.style.background = 'rgba(37, 99, 235, 0.05)';
                    element.style.color = '#2563eb';
                    element.style.padding = '8px 16px';
                    element.style.borderRadius = '99px';
                    element.style.fontSize = '12px';
                    element.style.fontWeight = '700';
                    element.style.border = '1px solid rgba(37, 99, 235, 0.1)';
                }
            })();
        `);
    } catch (error) {
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