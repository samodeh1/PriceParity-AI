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

// app.get('/api/widget', async (req: any, res: any) => {
//     try {
//         const originalPrice = Number(req.query.price) || 12;
//         const clientIp = requestIp.getClientIp(req) || "";
//         const geo = geoip.lookup(clientIp);
//         const countryCode = (req.query.test_country as string) || (geo ? geo.country : "US");

//         // 1. Run the math on the server
//         const result = calculatePPPPrice(originalPrice, countryCode);

//         res.setHeader('Content-Type', 'application/javascript');
//         res.setHeader('Access-Control-Allow-Origin', '*'); 

//         // 2. We send the ALREADY FORMATTED localPriceFormatted
//         // This stops NaN because the browser does 0 math.
//         res.send(`
//             (function() {
//                 function inject() {
//                     const targets = document.querySelectorAll('[data-pp-price]');
//                     targets.forEach(el => {
//                         if (el.getAttribute('data-pp-done') === 'true') return;
                        
//                         const p = parseFloat(el.getAttribute('data-pp-price'));
                        
//                         // If it is our own landing page (price is 12), use the server result
//                         // Otherwise, we do a simple safe calculation for their custom price
//                         let finalDisplayPrice = "${result.localPriceFormatted}";
                        
//                         if (p !== ${originalPrice}) {
//                            const multiplier = ${result.suggestedPrice / originalPrice};
//                            const localVal = Math.round(p * multiplier * ${pppData[countryCode.toUpperCase()]?.rate || 1});
//                            finalDisplayPrice = "${result.symbol} " + localVal.toLocaleString();
//                         }

//                         el.innerHTML = ' Local Offer: ' + "${result.countryName}" + ' <b>' + finalDisplayPrice + '</b>';
                        
//                         el.style.cssText = "display: inline-flex; align-items: center; gap: 8px; background: rgba(37, 99, 235, 0.05); color: #2563eb; padding: 8px 16px; border-radius: 99px; font-size: 13px; font-weight: 700; border: 1px solid rgba(37, 99, 235, 0.1); animation: pulse 2s infinite; font-family: sans-serif; white-space: nowrap;";
                        
//                         el.setAttribute('data-pp-done', 'true');
//                     });
//                 }
//                 document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', inject) : inject();
//                 setInterval(inject, 1500); 
//             })();
//         `);
//     } catch (e) { 
//         res.status(500).send("console.error('PriceParity Error')"); 
//     }
// });

// server/src/index.ts -> /api/widget

// app.get('/api/widget', async (req: any, res: any) => {
//     try {
//         const originalPrice = Number(req.query.price) || 12;
//         const clientIp = requestIp.getClientIp(req) || "";
//         const geo = geoip.lookup(clientIp);
//         const countryCode = (req.query.test_country as string) || (geo ? geo.country : "US");

//         const result = calculatePPPPrice(originalPrice, countryCode);
//         const pppMultiplier = result.suggestedPrice / originalPrice;
//         const currentRate = pppData[countryCode.toUpperCase()]?.rate || 1;

//         res.setHeader('Content-Type', 'application/javascript');
//         res.setHeader('Access-Control-Allow-Origin', '*'); 

//         res.send(`
//             (function() {
//                 function inject() {
//                     const targets = document.querySelectorAll('[data-pp-price]');
//                     targets.forEach(el => {
//                         if (el.getAttribute('data-pp-done') === 'true') return;

//                         const p = parseFloat(el.getAttribute('data-pp-price'));
//                         if (isNaN(p)) return;

//                         const localValue = Math.round(p * ${pppMultiplier} * ${currentRate});
//                         const formatted = "${result.symbol} " + localValue.toLocaleString();

//                         const isSmall = (el.offsetWidth || el.parentElement.offsetWidth || 300) < 250;
//                         const message = isSmall 
//                             ? ' Pay <b>' + formatted + '</b>' 
//                             : ' Residents of ${result.countryName} pay only <b>' + formatted + '</b>';

//                         el.innerHTML = message;
                        
//                         // --- THE PRO LAYOUT FIX ---
//                         // 1. We use 'flex' with 'width: 100%' to force it to a new line
//                         // 2. We use '!important' so it overrides any subscriber's CSS
//                         el.style.cssText = "display: flex !important; width: 100% !important; flex-basis: 100% !important; margin-top: 8px !important; color: #2563eb !important; font-size: 11px !important; font-family: system-ui, sans-serif !important; border-top: 1px dashed rgba(37,99,235,0.2) !important; padding-top: 8px !important; line-height: 1.2 !important; white-space: normal !important;";
                        
//                         el.setAttribute('data-pp-done', 'true');
//                     });
//                 }
//                 document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', inject) : inject();
//                 setInterval(inject, 1500); 
//             })();
//         `);
//     } catch (e) { 
//         res.status(500).send(""); 
//     }
// });

// server/src/index.ts -> /api/widget

// app.get('/api/widget', async (req: any, res: any) => {
//     try {
//         const originalPrice = Number(req.query.price) || 12;
//         const clientIp = requestIp.getClientIp(req) || "";
//         const geo = geoip.lookup(clientIp);
        
//         // 1. Prioritize the query param, then the IP lookup
//         let countryCode = (req.query.test_country as string)?.toUpperCase() || (geo ? geo.country : "US");

//         const result = calculatePPPPrice(originalPrice, countryCode);
//         const pppMultiplier = result.multiplier || 0.4;
//         const countryConfig = pppData[countryCode];
//         const currentRate = countryConfig ? countryConfig.rate : 1;

//         res.setHeader('Content-Type', 'application/javascript');
//         res.setHeader('Access-Control-Allow-Origin', '*'); 

//         res.send(`
//             (function() {
//                 // --- SENIOR TEST LOGIC ---
//                 // This checks the SUBSCRIBER'S URL bar for ?test_country
//                 const urlParams = new URLSearchParams(window.location.search);
//                 const urlTestCountry = urlParams.get('test_country');
//                 const currentScriptUrl = new URL(document.currentScript.src);

//                 // If user typed a test country in the address bar but the script 
//                 // doesn't have it yet, we reload the script with that country.
//                 if (urlTestCountry && !currentScriptUrl.searchParams.get('test_country')) {
//                     const newScript = document.createElement('script');
//                     newScript.src = currentScriptUrl.origin + currentScriptUrl.pathname + '?price=${originalPrice}&test_country=' + urlTestCountry;
//                     document.body.appendChild(newScript);
//                     return; // Stop this version, the new one is coming
//                 }

//                 function inject() {
//                     const targets = document.querySelectorAll('[data-pp-price]');
//                     targets.forEach(el => {
//                         if (el.getAttribute('data-pp-done') === 'true') return;
//                         const p = parseFloat(el.getAttribute('data-pp-price'));
//                         if (isNaN(p)) return;

//                         const localValue = Math.round(p * ${pppMultiplier} * ${currentRate});
//                         const formatted = "${result.symbol} " + localValue.toLocaleString();

//                         const isSmall = (el.offsetWidth || el.parentElement.offsetWidth || 300) < 250;
//                         const message = isSmall ? ' Pay <b>' + formatted + '</b>' : ' Residents of ${result.countryName} pay only <b>' + formatted + '</b>';

//                         el.innerHTML = message;
//                         el.style.cssText = "display: flex !important; width: 100% !important; flex-basis: 100% !important; margin-top: 8px !important; color: #2563eb !important; font-size: 11px !important; font-family: system-ui, sans-serif !important; border-top: 1px dashed rgba(37,99,235,0.2) !important; padding-top: 8px !important; line-height: 1.2 !important; white-space: normal !important;";
//                         el.setAttribute('data-pp-done', 'true');
//                     });
//                 }
//                 document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', inject) : inject();
//                 setInterval(inject, 1500); 
//             })();
//         `);
//     } catch (e) { res.status(500).send(""); }
// });

// app.get('/api/widget', async (req: any, res: any) => {
//   try {
//     const originalPrice = Number(req.query.price) || 12;
//     const clientIp = requestIp.getClientIp(req) || "";
//     const geo = geoip.lookup(clientIp);

//     // 1. Prioritize the query param, then the IP lookup
//     let countryCode = (req.query.test_country as string)?.toUpperCase() || (geo ? geo.country : "US");
    
//     const result = calculatePPPPrice(originalPrice, countryCode) || {} as any;

//     const tierMultipliers: Record<string, number> = {
//       NONE: 1,
//       LOW: 0.8,
//       MID: 0.5,
//       HIGH: 0.3
//     };
//     const pppMultiplier = tierMultipliers[(result.discountTier as string) || "MID"] ?? 0.4;

//     const countryConfig = pppData[countryCode];
//     const currentRate = countryConfig && typeof countryConfig.rate === 'number' ? countryConfig.rate : 1;
    
//     const symbol = result.symbol || "$";
//     const countryName = result.countryName || "your country";

//     res.setHeader('Content-Type', 'application/javascript');
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.send(`
//       (function() {
//         // --- SENIOR TEST LOGIC ---
//         const urlParams = new URLSearchParams(window.location.search);
//         const urlTestCountry = urlParams.get('test_country');
//         const currentScriptUrl = new URL(document.currentScript.src);

//         if (urlTestCountry && !currentScriptUrl.searchParams.get('test_country')) {
//           const newScript = document.createElement('script');
//           newScript.src = currentScriptUrl.origin + currentScriptUrl.pathname + '?price=${originalPrice}&test_country=' + urlTestCountry;
//           document.body.appendChild(newScript);
//           return;
//         }

//         function inject() {
//           const targets = document.querySelectorAll('[data-pp-price]');
//           targets.forEach(el => {
//             if (el.getAttribute('data-pp-done') === 'true') return;
            
//             const p = parseFloat(el.getAttribute('data-pp-price'));
//             // Safety check: if the DOM attribute itself isn't a valid number, skip it
//             if (isNaN(p)) return;

//             // Compute local value using the specific item's price 'p' instead of the global originalPrice
//             const localValue = Math.round(p * ${pppMultiplier} * ${currentRate});
            
//             // If the calculation still fails for any reason, fall back gracefully
//             if (isNaN(localValue)) return;

//             const formatted = "${symbol} " + localValue.toLocaleString();
//             const isSmall = (el.offsetWidth || el.parentElement.offsetWidth || 300) < 250;
//             const message = isSmall ? ' Pay <b>' + formatted + '</b>' : ' Residents of ${countryName} pay only <b>' + formatted + '</b>';
            
//             el.innerHTML = message;
//             el.style.cssText = "display: flex !important; width: 100% !important; flex-basis: 100% !important; margin-top: 8px !important; color: #2563eb !important; font-size: 11px !important; font-family: system-ui, sans-serif !important; border-top: 1px dashed rgba(37,99,235,0.2) !important; padding-top: 8px !important; line-height: 1.2 !important; white-space: normal !important;";
//             el.setAttribute('data-pp-done', 'true');
//           });
//         }

//         document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', inject) : inject();
//         setInterval(inject, 1500);
//       })();
//     `);
//   } catch (e) {
//     res.status(500).send("");
//   }
// });

app.get('/api/widget', async (req: any, res: any) => {
    try {
        // 1. Production-Grade IP & Country Detection
        const clientIp = requestIp.getClientIp(req) || "";
        const geo = geoip.lookup(clientIp);
        const countryCode = (req.query.test_country as string)?.toUpperCase() || (geo ? geo.country : "US");
        
        // 2. Fetch Data from your Pricing Engine
        const result = calculatePPPPrice(Number(req.query.price) || 12, countryCode);

        // 3. Map Tiers to Universal Code Names
        let discountCode = "";
        if (result.discountTier === "LOW") discountCode = "GLOBAL20";
        if (result.discountTier === "MID") discountCode = "GLOBAL50";
        if (result.discountTier === "HIGH") discountCode = "GLOBAL70";

        // 4. Secure Headers
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Access-Control-Allow-Origin', '*');

        res.send(`
            (function() {
                const CODE = "${discountCode}";
                const COUNTRY = "${result.countryName}";
                const LOCAL_PRICE = "${result.localPriceFormatted}";

                // --- 1. THE NETWORK INTERCEPTOR (HARDENED) ---
                const originalFetch = window.fetch;
                window.fetch = function() {
                    // Only intercept if the first argument is a string (URL)
                    if (typeof arguments[0] === 'string' && 
                       (arguments[0].includes('checkout') || arguments[0].includes('buy') || arguments[0].includes('pay'))) {
                        try {
                            const url = new URL(arguments[0], window.location.origin);
                            url.searchParams.set('discount_code', CODE);
                            url.searchParams.set('coupon', CODE);
                            url.searchParams.set('checkout[discount_code]', CODE);
                            arguments[0] = url.toString();
                        } catch(e) { console.warn("PriceParity: Non-standard URL skip"); }
                    }
                    return originalFetch.apply(this, arguments);
                };

                // --- 2. THE UI & LINK INJECTOR ---
                function updateUI() {
                    // Display Badge Update
                    document.querySelectorAll('[data-pp-price]').forEach(el => {
                        if (el.getAttribute('data-pp-done')) return;
                        el.innerHTML = ' ' + COUNTRY + ' Offer: <b>' + LOCAL_PRICE + '</b>';
                        el.style.cssText = "display:inline-flex !important; align-items:center !important; gap:8px !important; background:rgba(37,99,235,0.05) !important; color:#2563eb !important; padding:8px 16px !important; border-radius:99px !important; font-size:13px !important; font-weight:700 !important; border:1px solid rgba(37,99,235,0.1) !important; margin:10px 0 !important; font-family:sans-serif !important;";
                        el.setAttribute('data-pp-done', 'true');
                    });

                    // Global Element Interception (Buttons and Links)
                    document.querySelectorAll('a, button').forEach(el => {
                        const text = (el.innerText || "").toLowerCase();
                        const isPurchase = text.includes('buy') || text.includes('pay') || text.includes('checkout') || text.includes('order') || text.includes('subscribe');
                        
                        if (isPurchase) {
                            // Link Rewriting
                            if (el.tagName === 'A' && el.href && !el.href.includes('discount_code')) {
                                try {
                                    const url = new URL(el.href);
                                    url.searchParams.set('discount_code', CODE);
                                    url.searchParams.set('checkout[discount_code]', CODE);
                                    url.searchParams.set('coupon', CODE);
                                    el.href = url.toString();
                                } catch(e) {}
                            }
                            
                            // Event Capture (The 100% Fail-Safe)
                            if (!el.getAttribute('data-pp-click-set')) {
                                el.addEventListener('click', () => {
                                    localStorage.setItem('priceparity_coupon', CODE);
                                    console.log("PriceParity: Coupon cached for session.");
                                });
                                el.setAttribute('data-pp-click-set', 'true');
                            }
                        }
                    });
                }

                // --- 3. THE AUTO-APPLIED BADGE ---
                if (CODE && !document.getElementById('pp-helper')) {
                    const badge = document.createElement('div');
                    badge.id = 'pp-helper';
                    badge.innerHTML = "🏷️ " + COUNTRY + " Discount: <b>" + CODE + "</b> (Auto-Applied)";
                    badge.style.cssText = "position:fixed; bottom:20px; left:20px; z-index:999999; background:#1e293b; color:white; padding:12px 24px; border-radius:16px; font-size:12px; font-family:sans-serif; box-shadow:0 15px 35px rgba(0,0,0,0.3); border-left:4px solid #3b82f6; transition: opacity 0.5s ease;";
                    document.body.appendChild(badge);
                    setTimeout(() => badge.style.opacity = '0.6', 8000); 
                }

                // Initial run + Periodic scan for Dynamic Apps
                updateUI();
                setInterval(updateUI, 2000);
            })();
        `);
    } catch (e) { 
        console.error("Critical Widget Failure:", e);
        res.status(500).send(""); 
    }
});

// app.get('/api/widget', async (req: any, res: any) => {
//     try {
//         const originalPrice = Number(req.query.price) || 12;
//         const clientIp = requestIp.getClientIp(req) || "";
//         const geo = geoip.lookup(clientIp);
//         const countryCode = (req.query.test_country as string)?.toUpperCase() || (geo ? geo.country : "US");

//         const result = calculatePPPPrice(originalPrice, countryCode);

//         // Standard Subscriber Codes (Names used for all customers)
//         const tierToCode = { "LOW": "GLOBAL20", "MID": "GLOBAL50", "HIGH": "GLOBAL70", "NONE": "" };
//         const universalCode = tierToCode[result.discountTier as keyof typeof tierToCode] || "";

//         res.setHeader('Content-Type', 'application/javascript');
//         res.setHeader('Access-Control-Allow-Origin', '*');
//         // VITAL: This tells the browser NOT to cache this script so every visitor gets their own price
//         res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

//         res.send(`
//             (function() {
//                 const MULTIPLIER = ${result.suggestedPrice / originalPrice};
//                 const RATE = ${pppData[countryCode]?.rate || 1};
//                 const SYMBOL = "${result.symbol}";
//                 const COUNTRY = "${result.countryName}";
//                 const CODE = "${universalCode}";

//                 function inject() {
//                     document.querySelectorAll('[data-pp-price]').forEach(el => {
//                         if (el.getAttribute('data-pp-done')) return;
//                         const p = parseFloat(el.getAttribute('data-pp-price'));
//                         if (isNaN(p)) return;

//                         const localVal = Math.round(p * MULTIPLIER * RATE);
//                         const formatted = SYMBOL + " " + localVal.toLocaleString();
//                         const isSmall = (el.offsetWidth || el.parentElement.offsetWidth || 300) < 250;

//                         el.innerHTML = isSmall ? ' ' + formatted : ' Local Offer: Residents of ' + COUNTRY + ' pay only <b>' + formatted + '</b>';
//                         el.style.cssText = "display: inline-flex !important; align-items: center !important; gap: 8px !important; background: rgba(37,99,235,0.05) !important; color: #2563eb !important; padding: 6px 12px !important; border-radius: 10px !important; font-size: 12px !important; font-weight: 700 !important; border: 1px solid rgba(37,99,235,0.1) !important; margin-top: 4px !important; font-family: sans-serif !important; white-space: nowrap !important;";
//                         el.setAttribute('data-pp-done', 'true');
//                     });

//                     if (CODE) {
//                         document.querySelectorAll('a[href*="lemonsqueezy.com"], a[href*="gumroad.com"]').forEach(link => {
//                             try {
//                                 const url = new URL(link.href);
//                                 url.searchParams.set('checkout[discount_code]', CODE);
//                                 url.searchParams.set('discount_code', CODE);
//                                 link.href = url.toString();
//                             } catch(e) {}
//                         });
//                     }
//                 }
//                 document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', inject) : inject();
//                 setInterval(inject, 2000);
//             })();
//         `);
//     } catch (e) { res.status(500).send(""); }
// });

mongoose.connect(process.env.MONGO_URI as string)
    .then(() => console.log("PriceParity SaaS DB Connected"))
    .catch(err => console.error("Database connection failure:", err));

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`PriceParity Engine Live on Port ${PORT}`);
});