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
// ADDED THIS IMPORT: Pulling the checkout initializer from your lemonsqueezy.ts helper
import { createLemonSqueezyCheckout } from './lemonsqueezy.js'; 

// 2. Database Models
import Strategy from './models/Strategy.js';
import User from './models/User.js';

dotenv.config();
const app = express();

const isProduction = process.env.NODE_ENV === 'production';
const testCountryEnabled = process.env.ALLOW_TEST_COUNTRY === 'true' && !isProduction;

app.use(cors({
    origin: ["https://priceparityai.com",
             "https://www.priceparityai.com",
             "https://priceparityai.vercel.app", 
             "http://localhost:5173"
            ],
    credentials: true
}));

app.use(express.json({
    verify: (req: any, _res: any, buf: Buffer) => { req.rawBody = buf; }
}));

app.get('/health', (_req: Request, res: Response) => {
    const databaseReady = mongoose.connection.readyState === 1;
    res.status(databaseReady ? 200 : 503).json({
        status: databaseReady ? 'ok' : 'degraded',
        database: databaseReady ? 'connected' : 'disconnected'
    });
});

// --- ROUTES ---

app.post('/api/calculate', protect, async (req: any, res: Response) => {
    const { price, country, productName } = req.body;
    try {
        if (!Number.isFinite(price) || price <= 0 || price > 100000000) {
            return res.status(400).json({ message: "Price must be a positive number." });
        }
        if (typeof country !== 'string' || !/^[A-Z]{2}$/i.test(country)) {
            return res.status(400).json({ message: "Country must be a two-letter country code." });
        }
        if (typeof productName !== 'string' || productName.trim().length < 1 || productName.length > 200) {
            return res.status(400).json({ message: "Product name is required and must be under 200 characters." });
        }
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


app.post('/api/webhook/lemonsqueezy', async (req: any, res: any) => {
    try {
        if (!process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || !req.rawBody) {
            return res.status(503).send('Webhook is not configured');
        }
        const hmac = crypto.createHmac('sha256', process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || "");
        const digest = Buffer.from(hmac.update(req.rawBody).digest('hex'), 'utf8');
        const signature = Buffer.from(req.get('X-Signature') || '', 'utf8');

        if (digest.length !== signature.length || !crypto.timingSafeEqual(digest, signature)) {
            return res.status(401).send('Invalid signature');
        }

        const { data, meta } = req.body;
        if (!meta || !data?.attributes) {
            return res.status(400).send('Invalid webhook payload');
        }
        
        if (meta.event_name === 'order_created' || meta.event_name === 'subscription_created') {
            const userId = meta.custom_data?.user_id;
            
            if (!userId) {
                console.error("Webhook Error: Missing user_id in metadata custom fields.");
                return res.status(400).send('Missing user configuration details');
            }

            const variantId = String(data?.attributes?.variant_id || '');
            const ANNUAL_VARIANT_ID = "1b4152a4-5463-4208-9cd8-50a9f3ec7a89"; 

            const expiryDate = new Date();
            
            if (variantId === ANNUAL_VARIANT_ID) {
                expiryDate.setUTCFullYear(expiryDate.getUTCFullYear() + 1);
            } else {
                expiryDate.setUTCDate(expiryDate.getUTCDate() + 30);
            }

            const eventId = String(data.id || '');
            if (!eventId) return res.status(400).send('Missing webhook event ID');

            const updatedUser = await User.findOneAndUpdate(
                { _id: userId, lastPaymentReference: { $ne: eventId } },
                {
                isPro: true, 
                proExpiry: expiryDate,
                lastPaymentReference: eventId
                },
                { new: true }
            );

            if (!updatedUser) return res.status(200).send('Already processed');

            console.log(`Success: Account ${userId} upgraded to Pro. Expires on: ${expiryDate.toISOString()}`);
        }
        
        res.status(200).send('OK');
    } catch (err: any) { 
        console.error("Webhook Processing Exception:", err.message);
        res.status(500).send('Internal Error'); 
    }
});


app.get('/api/strategies', protect, async (req: any, res: Response) => {
    try {
        const history = await Strategy.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(history);
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.get('/api/countries', (_req: Request, res: Response) => res.json(getCountryList()));


app.get('/api/widget', async (req: any, res: any) => {
  try {
        const originalPrice = Number(req.query.price) || 12;
        if (!Number.isFinite(originalPrice) || originalPrice <= 0 || originalPrice > 100000000) {
            return res.status(400).send('Invalid price');
        }
    const clientIp = requestIp.getClientIp(req) || "";
    const geo = geoip.lookup(clientIp);

        const requestedTestCountry = (req.query.test_country as string)?.toUpperCase();
        if (requestedTestCountry && !testCountryEnabled) {
            return res.status(400).send('Test country is disabled');
        }
        const countryCode = requestedTestCountry || (geo ? geo.country : "US");
    const result = calculatePPPPrice(originalPrice, countryCode) || {} as any;

    const tierMultipliers: Record<string, number> = {
      NONE: 1,      
      LOW: 0.8,     
      MID: 0.5,     
      HIGH: 0.3     
    };

    const verifiedTier = (result.discountTier as string) || "NONE";
    const pppMultiplier = tierMultipliers[verifiedTier] ?? 1;

    const countryConfig = pppData[countryCode];
    const currentRate = countryConfig && typeof countryConfig.rate === 'number' ? countryConfig.rate : 1;
    
    const symbol = result.symbol || "$";
    const countryName = result.countryName || "your country";

    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(`
      (function() {
        const urlParams = new URLSearchParams(window.location.search);
        const urlTestCountry = urlParams.get('test_country');
        const currentScriptUrl = new URL(document.currentScript.src);

        if (urlTestCountry && !currentScriptUrl.searchParams.get('test_country')) {
          const newScript = document.createElement('script');
          newScript.src = currentScriptUrl.origin + currentScriptUrl.pathname + '?price=${originalPrice}&test_country=' + urlTestCountry;
          document.body.appendChild(newScript);
          return;
        }

        function inject() {
          const targets = document.querySelectorAll('[data-pp-price]');
          targets.forEach(el => {
            if (el.getAttribute('data-pp-done') === 'true') return;
            
            const p = parseFloat(el.getAttribute('data-pp-price'));
            if (isNaN(p)) return;

            const localValue = Math.round(p * ${pppMultiplier} * ${currentRate});
            if (isNaN(localValue)) return;

            const formatted = "${symbol} " + localValue.toLocaleString();
            const isSmall = (el.offsetWidth || el.parentElement.offsetWidth || 300) < 250;
            const message = isSmall ? ' Pay <b>' + formatted + '</b>' : ' Residents of ${countryName} pay only <b>' + formatted + '</b>';
            
            el.innerHTML = message;
            el.style.cssText = "display: flex !important; width: 100% !important; flex-basis: 100% !important; margin-top: 8px !important; color: #2563eb !important; font-size: 11px !important; font-family: system-ui, sans-serif !important; border-top: 1px dashed rgba(37,99,235,0.2) !important; padding-top: 8px !important; line-height: 1.2 !important; white-space: normal !important;";
            el.setAttribute('data-pp-done', 'true');
          });
        }

        document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', inject) : inject();
        setInterval(inject, 1500);
      })();
    `);
  } catch (e) {
    res.status(500).send("");
  }
});

app.get('/sitemap.xml', (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://sitemaps.org">
  <url>
    <loc>https://priceparityai.com</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- Add additional sub-page blocks here if you have internal routes -->
</urlset>`);
});


// --- NEW CHECKOUT ROUTE INTEGRATED FLUIDLY HERE ---
app.post('/api/checkout', protect, async (req: any, res: any) => {
    try {
        const { variantId, email, discountTier } = req.body;
        if (typeof variantId !== 'string' || !/^\d+$/.test(variantId)) {
            return res.status(400).json({ error: "A valid Lemon Squeezy variant ID is required." });
        }
        if (typeof email !== 'string' || !email.includes('@') || email.length > 320) {
            return res.status(400).json({ error: "A valid email is required." });
        }
        if (!['LOW', 'MID', 'HIGH', 'NONE'].includes(discountTier)) {
            return res.status(400).json({ error: "A valid discount tier is required." });
        }
        // Accessing the verified user ID from your protect authentication middleware context safely
        const userId = req.user?.id; 

        if (!userId) {
            return res.status(401).json({ error: "User authentication identification failed." });
        }

        // Map frontend user geo tiers cleanly into the active Lemon Squeezy dashboard configurations
        let appliedCode = "";
        if (discountTier === "LOW")  appliedCode = "C4MZQWOA";
        if (discountTier === "MID")  appliedCode = "MYMTQYNQ";
        if (discountTier === "HIGH") appliedCode = "Q2MTCYMW";

        const checkoutUrl = await createLemonSqueezyCheckout(
            process.env.LEMON_SQUEEZY_STORE_ID || "",
            variantId,
            email,
            userId,
            appliedCode // Forward the mapped coupon string directly to the API generator
        );

        return res.json({ url: checkoutUrl });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

// --- SERVER INSTANTIATION CONFIGURATIONS ---
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI || "")
  .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch((err) => console.log(err));
