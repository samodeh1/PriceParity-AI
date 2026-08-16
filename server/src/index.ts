import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import requestIp from 'request-ip';
import geoip from 'geoip-lite';
import mongoose from 'mongoose';

// Project logic imports
import { calculatePPPPrice, getCountryList, pppData } from './pricingEngine.js';
import { generateLocalizedPitch } from './aiEngine.js';
import authRoutes from './routes/auth.js';
import { protect } from './middleware/authMiddleware.js';

// Database Models
import Strategy from './models/Strategy.js';
import User from './models/User.js';

dotenv.config();
const app = express();

// --- 1. MIDDLEWARE ---
// 1. Define your allowed origins clearly
const allowedOrigins: string[] = [
  process.env.CLIENT_URL || "https://priceparityai.com",
  "https://priceparityai.vercel.app",
  "http://localhost:5173"
];

// 2. The Type-Safe middleware
app.use(cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (like mobile apps or local tests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            // A more professional error message
            console.error(`CORS Blocked: ${origin} is not in allowed list.`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-auth-token"]
}));

// --- 2. CORE SaaS LOGIC: CALCULATION ---
app.post('/api/calculate', protect, async (req: any, res: any) => {
    const { price, country, productName } = req.body;
    
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const pricing = calculatePPPPrice(price, country);
        let pitch = "Upgrade to Pro to unlock AI Marketing Pitches 🚀";
        
        // Monetization Check: Only call OpenAI if user is a paid Pro member
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

        res.json({
            ...pricing,
            productName,
            localizedPitch: pitch,
            isPro: user.isPro 
        });
    } catch (error) {
        console.error("Calculation Error:", error);
        res.status(500).json({ error: "Error generating strategy" });
    }
});

// --- 3. MONETIZATION: LEMON SQUEEZY WEBHOOK ---
// This handles your automatic user upgrades after a global USD payment
app.post('/api/webhook/lemonsqueezy', async (req: any, res: any) => {
    try {
        const hmac = crypto.createHmac('sha256', process.env.LEMON_SQUEEZY_WEBHOOK_SECRET as string);
        const digest = Buffer.from(hmac.update(JSON.stringify(req.body)).digest('hex'), 'utf8');
        const signature = Buffer.from(req.get('X-Signature') || '', 'utf8');

        // Security Handshake
        if (!crypto.timingSafeEqual(digest, signature)) {
            return res.status(401).send('Invalid signature');
        }

        const { meta } = req.body;
        if (meta.event_name === 'order_created' || meta.event_name === 'subscription_created') {
            const userId = meta.custom_data.user_id;
            
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30); // Valid for 30 days

            await User.findByIdAndUpdate(userId, { 
                isPro: true, 
                proExpiry: expiryDate 
            });
            
            console.log(`Global Fulfillment: User ${userId} upgraded via Lemon Squeezy.`);
        }
        res.status(200).send('Webhook processed');
    } catch (err) {
        console.error('Webhook Error:', err);
        res.status(500).send('Internal Server Error');
    }
});

// --- 4. DATA HISTORY & UTILITIES ---
app.get('/api/strategies', protect, async (req: any, res: any) => {
    try {
        const history = await Strategy.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: "Could not fetch history" });
    }
});

app.get('/api/countries', (req, res) => res.json(getCountryList()));

// --- 5. SUBSCRIBER WIDGET ENGINE (PRO PLUS FEATURE) ---
app.get('/api/widget', async (req: any, res: any) => {
    try {
        const originalPrice = Number(req.query.price) || 12;
        const clientIp = requestIp.getClientIp(req) || "";
        const geo = geoip.lookup(clientIp);
        const countryCode = (req.query.test_country as string) || (geo ? geo.country : "US");

        const result = calculatePPPPrice(originalPrice, countryCode);
        const pppMultiplier = result.discountPercentage > 0 ? (result.suggestedPrice / originalPrice) : 1;
        const currentRate = pppData[countryCode]?.rate || 1;

        res.setHeader('Content-Type', 'application/javascript');
        res.send(`
            (function() {
                function inject() {
                    const target = document.querySelector('[data-pp-price]');
                    if (target) {
                        const p = parseFloat(target.getAttribute('data-pp-price')) || ${originalPrice};
                        const local = Math.round(p * ${pppMultiplier} * ${currentRate});
                        target.innerHTML = '✨ Local Offer: Residents of ${result.countryName} pay only <b>${result.symbol}' + local.toLocaleString() + '</b>';
                        target.style.cssText = "display:inline-flex; align-items:center; background:rgba(37,99,235,0.05); color:#2563eb; padding:8px 16px; border-radius:99px; font-size:13px; font-weight:700; border:1px solid rgba(37,99,235,0.1); animation: pulse 2s infinite;";
                    } else { setTimeout(inject, 500); }
                }
                inject();
            })();
        `);
    } catch (e) { res.status(500).send(""); }
});

// --- 6. DATABASE & SERVER START ---
mongoose.connect(process.env.MONGO_URI as string)
    .then(() => console.log("PriceParity Live DB Connected"))
    .catch(err => console.error("Database Error:", err));

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`PriceParity Engine Live on Port ${PORT}`);
});