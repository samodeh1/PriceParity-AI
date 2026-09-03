import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import requestIp from 'request-ip';
import geoip from 'geoip-lite';
import mongoose from 'mongoose';

// 1. Imports from local files
import { calculatePPPPrice, getCountryList, pppTiers } from './pricingEngine.js';
import { generateLocalizedPitch } from './aiEngine.js';
import authRoutes from './routes/auth.js';
import { protect } from './middleware/authMiddleware.js';

// 2. Database Models
import Strategy from './models/Strategy.js';
import User from './models/User.js';

dotenv.config();
const app = express();

app.use(cors({
    origin: ["https://priceparityai.com",
             "https://www.priceparityai.com",
             "https://priceparityai.vercel.app", 
             "http://localhost:5173"],
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
        let pitch = "Upgrade to Pro to unlock AI Marketing Pitches ";
        
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

app.get('/api/widget', async (req: any, res: any) => {
    try {
        // 1. Get price from query (default to your 12 for the landing page)
        const originalPrice = Number(req.query.price) || 12;
        const clientIp = requestIp.getClientIp(req) || "";
        const geo = geoip.lookup(clientIp);
        const countryCode = (req.query.test_country as string) || (geo ? geo.country : "US");

        // 2. Get the result from our pricing engine
        const result = calculatePPPPrice(originalPrice, countryCode);
        
        // 3. THE MATH FIX: Calculate the EXACT multiplier 
        // (e.g. 4.2 / 12 = 0.35)
        const pppMultiplier = result.suggestedPrice / originalPrice;
        
        // 4. Get the specific exchange rate for this country from our pppTiers
        const currentRate = pppTiers[countryCode.toUpperCase()]?.rate || 1;

        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Access-Control-Allow-Origin', '*'); 

        res.send(`
            (function() {
                function inject() {
                    const targets = document.querySelectorAll('[data-pp-price]');
                    targets.forEach(el => {
                        if (el.getAttribute('data-pp-done') === 'true') return;

                        const p = parseFloat(el.getAttribute('data-pp-price'));
                        if (isNaN(p)) return;

                        // Calculate: Local Price = Original Price * Regional Discount * Exchange Rate
                        const localValue = Math.round(p * ${pppMultiplier} * ${currentRate});
                        const formatted = "${result.symbol} " + localValue.toLocaleString();

                        el.innerHTML = ' Local Offer: Residents of ${result.countryName} pay only <b>' + formatted + '</b>';
                        
                        //  DESIGN FIX: Ensuring enough width so text doesn't cut off
                        el.style.cssText = "display:inline-flex; align-items:center; gap:8px; background:rgba(37,99,235,0.05); 
                        color:#2563eb; padding:8px 20px; border-radius:99px; font-size:13px; font-weight:700; border:1px solid rgba(37,99,235,0.1); 
                        animation: pulse 2s infinite; white-space: nowrap;";
                        
                        el.setAttribute('data-pp-done', 'true');
                    });
                }
                document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', inject) : inject();
                // Check for new products every second (for React apps)
                setInterval(inject, 1000);
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