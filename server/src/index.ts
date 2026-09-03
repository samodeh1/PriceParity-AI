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
    origin: ["https://priceparityai.com",
             "https://www.priceparityai.com",
             "https://priceparityai.vercel.app", 
             "http://localhost:5173"
            ],
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

// app.get('/api/widget', async (req: any, res: any) => {
//     try {
//         const originalPrice = Number(req.query.price) || 12;
//         const clientIp = requestIp.getClientIp(req) || "";
//         const geo = geoip.lookup(clientIp);
//         const countryCode = (req.query.test_country as string) || (geo ? geo.country : "US");

//         // 1. Calculate values in Node first
//         const result = calculatePPPPrice(originalPrice, countryCode);
//         const pppMultiplier = result.multiplier || 0.4;
//         const countryConfig = pppData[countryCode.toUpperCase()];
//         const currentRate = countryConfig ? countryConfig.rate : 1;
//         const symbol = result.symbol || "$";
//         const countryName = result.countryName || "International";

//         res.setHeader('Content-Type', 'application/javascript');
//         res.setHeader('Access-Control-Allow-Origin', '*');

//         // 2. Inject numbers as raw text to avoid JS token errors
//         res.send(`
//             (function() {
//                 const MULTIPLIER = ${pppMultiplier};
//                 const RATE = ${currentRate};
//                 const SYMBOL = "${symbol}";
//                 const COUNTRY = "${countryName}";

//                 function applyLogic() {
//                     const elements = document.querySelectorAll('[data-pp-price]');
//                     elements.forEach(el => {
//                         if (el.getAttribute('data-pp-done') === 'true') return;

//                         const basePrice = parseFloat(el.getAttribute('data-pp-price'));
//                         if (isNaN(basePrice)) return;

//                         // Calculation
//                         const fairLocal = Math.round(basePrice * MULTIPLIER * RATE);
//                         const formatted = SYMBOL + " " + fairLocal.toLocaleString();

//                         // Use simple string concatenation to avoid backtick crashes
//                         const isSmall = (el.offsetWidth || el.parentElement.offsetWidth || 300) < 250;
//                         el.innerHTML = isSmall ? ' ' + formatted : ' Residents of ' + COUNTRY + ' pay only <b>' + formatted + '</b>';

//                         // 3. SAFE STYLING (No backticks used here)
//                         el.style.display = 'inline-flex';
//                         el.style.alignItems = 'center';
//                         el.style.background = 'rgba(37, 99, 235, 0.05)';
//                         el.style.color = '#2563eb';
//                         el.style.padding = '6px 12px';
//                         el.style.borderRadius = '10px';
//                         el.style.fontSize = '12px';
//                         el.style.fontWeight = '700';
//                         el.style.border = '1px solid rgba(37, 99, 235, 0.1)';
//                         el.style.marginTop = '4px';
//                         el.style.fontFamily = 'system-ui, sans-serif';
//                         el.style.whiteSpace = 'nowrap';
                        
//                         el.setAttribute('data-pp-done', 'true');
//                     });
//                 }

//                 if (document.readyState === 'loading') {
//                     document.addEventListener('DOMContentLoaded', applyLogic);
//                 } else {
//                     applyLogic();
//                 }
//                 setInterval(applyLogic, 1500);
//             })();
//         `);
//     } catch (error) {
//         console.error("Critical Widget Failure:", error);
//         res.status(500).send("");
//     }
// });

// server/src/index.ts -> /api/widget

app.get('/api/widget', async (req: any, res: any) => {
    try {
        const originalPrice = Number(req.query.price) || 12;
        const clientIp = requestIp.getClientIp(req) || "";
        const geo = geoip.lookup(clientIp);
        const countryCode = (req.query.test_country as string) || (geo ? geo.country : "US");

        // 1. Run the math on the server
        const result = calculatePPPPrice(originalPrice, countryCode);

        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Access-Control-Allow-Origin', '*'); 

        // 2. We send the ALREADY FORMATTED localPriceFormatted
        // This stops NaN because the browser does 0 math.
        res.send(`
            (function() {
                function inject() {
                    const targets = document.querySelectorAll('[data-pp-price]');
                    targets.forEach(el => {
                        if (el.getAttribute('data-pp-done') === 'true') return;
                        
                        const p = parseFloat(el.getAttribute('data-pp-price'));
                        
                        // If it is our own landing page (price is 12), use the server result
                        // Otherwise, we do a simple safe calculation for their custom price
                        let finalDisplayPrice = "${result.localPriceFormatted}";
                        
                        if (p !== ${originalPrice}) {
                           const multiplier = ${result.suggestedPrice / originalPrice};
                           const localVal = Math.round(p * multiplier * ${pppData[countryCode.toUpperCase()]?.rate || 1});
                           finalDisplayPrice = "${result.symbol} " + localVal.toLocaleString();
                        }

                        el.innerHTML = '  ${result.countryName} pay only <b>' + finalDisplayPrice + '</b>';
                        
                        el.style.cssText = "display: inline-flex; align-items: center; gap: 8px; background: rgba(37, 99, 235, 0.05); color: #2563eb; padding: 8px 16px; border-radius: 99px; font-size: 13px; font-weight: 700; border: 1px solid rgba(37, 99, 235, 0.1); animation: pulse 2s infinite; font-family: sans-serif; white-space: nowrap;";
                        
                        el.setAttribute('data-pp-done', 'true');
                    });
                }
                document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', inject) : inject();
                setInterval(inject, 1500); 
            })();
        `);
    } catch (e) { 
        res.status(500).send("console.error('PriceParity Error')"); 
    }
});

mongoose.connect(process.env.MONGO_URI as string)
    .then(() => console.log("PriceParity SaaS DB Connected"))
    .catch(err => console.error("Database connection failure:", err));

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`PriceParity Engine Live on Port ${PORT}`);
});