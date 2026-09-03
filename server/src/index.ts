import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import requestIp from 'request-ip';
import geoip from 'geoip-lite';
import mongoose from 'mongoose';

// 1. Imports from local files
import { calculatePPPPrice, getCountryList, pppData } from './pricingEngine.js';
import { generateLocalizedPitch } from './aiEngine.js';
import authRoutes from './routes/auth.js';
import { protect } from './middleware/authMiddleware.js';

// 2. Database Models
import Strategy from './models/Strategy.js';
import User from './models/User.js';

dotenv.config();
const app = express();

app.use(cors({
    origin: ["https://priceparityai.vercel.app/", "https://priceparityai.com", "http://localhost:5173"],
    credentials: true
}));

app.use(express.json({
    verify: (req: any, res, buf) => { req.rawBody = buf; }
}));

// --- ROUTES ---

app.post('/api/calculate', protect, async (req: any, res: Response) => {
    const { price, country, productName } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const result = calculatePPPPrice(price, country);
        let pitch = "Upgrade to Pro to unlock AI Marketing Pitches 🚀";
        
        if (user.isPro) {
            pitch = await generateLocalizedPitch(productName, result.localPriceFormatted, result.suggestedPrice, country);
        }

        const newStrategy = new Strategy({
            user: user._id,
            productName,
            originalPrice: price,
            suggestedPrice: result.suggestedPrice,
            country,
            pitch
        });
        await newStrategy.save();

        res.json({ ...result, productName, localizedPitch: pitch, isPro: user.isPro });
    } catch (error) {
        res.status(500).json({ error: "Error generating strategy" });
    }
});

app.post('/api/webhook/lemonsqueezy', async (req: any, res: Response) => {
    try {
        const hmac = crypto.createHmac('sha256', process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || "");
        const digest = Buffer.from(hmac.update(req.rawBody).digest('hex'), 'utf8');
        const signature = Buffer.from(req.get('X-Signature') || '', 'utf8');

        if (!crypto.timingSafeEqual(digest, signature)) return res.status(401).send('Invalid signature');

        const { meta } = req.body;
        if (meta.event_name === 'order_created' || meta.event_name === 'subscription_created') {
            const userId = meta.custom_data.user_id;
            const expiryDate = new Date();
            expiryDate.setUTCDate(expiryDate.getUTCDate() + 30);
            await User.findByIdAndUpdate(userId, { isPro: true, proExpiry: expiryDate });
        }
        res.status(200).send('OK');
    } catch (err) { res.status(500).send('Internal Error'); }
});

app.get('/api/strategies', protect, async (req: any, res: Response) => {
    try {
        const history = await Strategy.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(history);
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.get('/api/countries', (req, res) => res.json(getCountryList()));

app.get('/api/widget', async (req: any, res: Response) => {
    try {
        const originalPrice = Number(req.query.price) || 12;
        const clientIp = requestIp.getClientIp(req) || "";
        const geo = geoip.lookup(clientIp);
        const countryCode = (req.query.test_country as string) || (geo ? geo.country : "US");

        const result = calculatePPPPrice(originalPrice, countryCode);
        
        let discountCode = "";
        if (result.discountTier === "LOW") discountCode = "GLOBAL20";
        if (result.discountTier === "MID") discountCode = "GLOBAL50";
        if (result.discountTier === "HIGH") discountCode = "GLOBAL70";

        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Access-Control-Allow-Origin', '*');

        res.send(`
            (function() {
                function inject() {
                    const targets = document.querySelectorAll('[data-pp-price]');
                    targets.forEach(el => {
                        const p = parseFloat(el.getAttribute('data-pp-price'));
                        if (isNaN(p)) return;
                        el.innerHTML = '✨ Local Offer: Residents of ${result.countryName} pay only <b>${result.localPriceFormatted}</b>';
                        el.style.cssText = "display:inline-flex; align-items:center; gap:8px; background:rgba(37,99,235,0.05); color:#2563eb; padding:8px 16px; border-radius:99px; font-size:13px; font-weight:700; border:1px solid rgba(37,99,235,0.1); animation: pulse 2s infinite; font-family:sans-serif;";
                    });

                    if ("${discountCode}") {
                        document.querySelectorAll('a[href*="lemonsqueezy.com"], a[href*="gumroad.com"]').forEach(link => {
                            const url = new URL(link.href);
                            url.searchParams.set('checkout[discount_code]', "${discountCode}");
                            link.href = url.toString();
                        });
                    }
                }
                document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', inject) : inject();
            })();
        `);
    } catch (e) { res.status(500).send(""); }
});

mongoose.connect(process.env.MONGO_URI as string)
    .then(() => console.log("PriceParity SaaS DB Connected"))
    .catch(err => console.error("Database connection failure:", err));

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`PriceParity Engine Live on Port ${PORT}`);
});