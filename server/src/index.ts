import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { calculatePPPPrice } from './pricingEngine.js';
import { generateLocalizedPitch } from './aiEngine.js';
import requestIp from 'request-ip';
import { getCountryList } from './pricingEngine.js';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import Strategy from './models/Strategy.js';
import { protect } from './middleware/authMiddleware.js';
import User from './models/User.js';
import { initializePaystackPayment, verifyPaystackPayment } from './paystack.js';


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
        // 1. Get user from DB using the ID from the token
        const user = await User.findById(req.user.id);
        
        if (!user || !user.email) {
            return res.status(400).json({ error: "User email not found" });
        }

        // 2. Pass the real email from the database
        const paymentData = await initializePaystackPayment(user.email, 19, user.id.toString());
        
        res.json(paymentData); 
    } catch (error) {
        console.error("Paystack Error:", error); // This helps you see the real error in the terminal
        res.status(500).json({ error: "Paystack initialization failed" });
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

// This route will be called by "Widget" on other people's websites
// 1. We use (req, res) as standard Express parameters
app.get('/api/widget', async (req, res) => {
    try {
        // 2. We get the price from the URL (e.g. ?price=100)
        const originalPrice = Number(req.query.price) || 0;

        // 3. We use the library 'requestIp' (imported at the top) to get the IP from 'req'
        const clientIp = requestIp.getClientIp(req);
        
        // In a real production server, we'd use a Geo-IP library here. 
        // For now, let's keep the logic consistent.
        const country = "NG"; 

        const result = calculatePPPPrice(originalPrice, country);

        // 4. CRUCIAL: We tell the browser this is a JavaScript file
        res.setHeader('Content-Type', 'application/javascript');

        // 5. Return the script
        res.send(`
            (function() {
                const element = document.getElementById('price-parity-display');
                if (element) {
                    element.innerHTML = 'Special price for you in ${country}: <b>$${result.suggestedPrice}</b>';
                    element.style.padding = '10px';
                    element.style.background = '#f0f9ff';
                    element.style.border = '1px solid #bae6fd';
                    element.style.borderRadius = '8px';
                    element.style.color = '#0369a1';
                    element.style.display = 'inline-block';
                }
            })();
        `);
    } catch (error) {
        res.status(500).send('console.error("PriceParity Widget Error");');
    }
});

// 1. Ensure this route exists below your initialize route
app.get('/api/paystack/verify', async (req, res) => {
    const { reference } = req.query;

    if (!reference) {
        return res.status(400).json({ error: "No reference provided" });
    }

    try {
        // This calls the function in your paystack.ts file
        const data = await verifyPaystackPayment(reference as string);

        if (data.status === 'success') {
            // Find the user ID we hid in the metadata earlier
            const userId = data.metadata.custom_fields[0].value;

            // Update the user to Pro in the Database
            await User.findByIdAndUpdate(userId, { isPro: true });

            res.json({ success: true, isPro: true });
        } else {
            res.status(400).json({ success: false, message: "Payment failed" });
        }
    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ error: "Internal Server Error during verification" });
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


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI as string)
    .then(() => console.log("Saas Database Connected"))
    .catch(err => console.log(err));

    app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`PriceParity AI Engine running on port ${PORT}`);
});