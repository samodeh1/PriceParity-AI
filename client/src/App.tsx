import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BarChart3, Lock, ShieldCheck, Sparkles, Zap, LifeBuoy, Mail, MessageSquare } from 'lucide-react';
import { useEffect, useState } from "react";
import toast, { Toaster } from 'react-hot-toast';
import { Auth } from "./components/Auth";
import type { PricingResult } from "./types";
import { ChatWidget } from './components/ChatWidget';

// --- GLOBAL CONSTANTS ---
const IDLE_TIMEOUT = 5 * 60 * 1000; 
const API_BASE = "https://priceparity-api-live.onrender.com/api";

const SupportModal = ({ isOpen, onClose, onEmailClick }: { isOpen: boolean; onClose: () => void; onEmailClick: (e: React.MouseEvent<HTMLAnchorElement>) => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative border border-slate-100">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 font-bold transition-colors">✕</button>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LifeBuoy size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Customer Support</h2>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">Need help with your subscription or the engine? We are here for you.</p>
        </div>

        <div className="space-y-4">
          <a href="mailto:support@priceparityai.com" onClick={onEmailClick} className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all group w-full text-left">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:scale-110 transition"><Mail size={20}/></div>
            <div>
              <p className="text-sm font-bold text-slate-800">Email Support</p>
              <p className="text-xs text-slate-400">support@priceparityai.com</p>
            </div>
          </a>

          <button onClick={() => { if ((window as any).Tawk_API) { (window as any).Tawk_API.maximize(); onClose(); } else { toast.error("Chat loading..."); } }} 
            className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all group w-full text-left">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg group-hover:scale-110 transition"><MessageSquare size={20}/></div>
            <div>
              <p className="text-sm font-bold text-slate-800">Live Chat</p>
              <p className="text-xs text-slate-400">Talk to us right now</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [country, setCountry] = useState('NG');
  const [result, setResult] = useState<PricingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('parity_token'));
  const [history, setHistory] = useState<any[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [availableCountries, setAvailableCountries] = useState<{code: string, name: string}[]>([]);

  // --- HANDLERS ---
  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return setIsAuthOpen(true);
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/calculate`, {
        productName, price: parseFloat(price), country
      }, { headers: { 'x-auth-token': token } });
      setResult(res.data);
      setUser((prev: any) => ({ ...prev, isPro: res.data.isPro }));
      toast.success("Strategy generated!");
      fetchHistory();
    } catch (err: any) { toast.error("Generation failed"); } 
    finally { setLoading(false); }
  };

  // --- UPDATED: LEMON SQUEEZY UPGRADE ---
// const handleUpgrade = (type: 'monthly' | 'annual' = 'monthly') => {
//     toast.loading(`Redirecting to secure ${type} checkout...`);

//     const monthlyUrl = "https://priceparity-ai.lemonsqueezy.com/checkout/buy/83fc7d29-ff6e-48ad-aff5-818427365c84";
//     const annualUrl = "https://priceparity-ai.lemonsqueezy.com/checkout/buy/1b4152a4-5463-4208-9cd8-50a9f3ec7a89";

//     const baseCheckoutUrl = type === 'annual' ? annualUrl : monthlyUrl;
//     const userId = user?._id || user?.id;

//     // 1. Build the basic URL
//     let finalUrl = `${baseCheckoutUrl}?checkout[custom][user_id]=${userId}&checkout[email]=${user?.email}`;

//     // 2. THE DYNAMIC TIER LOGIC
//     // The backend can return a discountTier value, but the shared PricingResult type
//     // does not currently include it, so we access it via a narrow cast instead of
//     // forcing a type-wide change in a single file fix.
//     const tier = (result as any)?.discountTier as 'LOW' | 'MID' | 'HIGH' | 'NONE' | undefined;

//     if (tier && tier !== 'NONE') {
//         let code = "";

//         if (tier === "LOW") code = "C4MZQWOA";
//         if (tier === "MID") code = "MWNZM5NW";
//         if (tier === "HIGH") code = "M4MTIZOQ";

//         if (code) {
//             finalUrl += `&checkout[discount_code]=${code}`;
//         }
//     }

//     window.location.href = finalUrl;
// };

// const handleUpgrade = (type: 'monthly' | 'annual' = 'monthly') => {
//     toast.loading(`Redirecting to secure ${type} checkout...`);

//     const monthlyUrl = "https://priceparity-ai.lemonsqueezy.com/checkout/buy/83fc7d29-ff6e-48ad-aff5-818427365c84";
//     const annualUrl = "https://priceparity-ai.lemonsqueezy.com/checkout/buy/1b4152a4-5463-4208-9cd8-50a9f3ec7a89";

//     const baseCheckoutUrl = type === 'annual' ? annualUrl : monthlyUrl;
//     const userId = user?._id || user?.id;

//     // Use URLSearchParams for professional URL building (Prevents "?" vs "&" bugs)
//     const url = new URL(baseCheckoutUrl);
//     url.searchParams.set('checkout[custom][user_id]', userId);
//     url.searchParams.set('checkout[email]', user?.email || '');

//     const tier = (result as any)?.discountTier as 'LOW' | 'MID' | 'HIGH' | 'NONE' | undefined; 

//     if (tier && tier !== 'NONE') {
//         let code = "";
        
//         // MATCHING THE CODES FROM YOUR SCREENSHOT EXACTLY
//         if (tier === "LOW")  code = "C4MZQWOA"; // 20% off code
//         if (tier === "MID")  code = "MWNZM5NW"; // 50% off code
//         if (tier === "HIGH") code = "G2MZKXNG"; // 70% off code (Nigeria)

//         if (code) {
//             url.searchParams.set('checkout[discount_code]', code);
//         }
//     }

//     window.location.href = url.toString();
// };

// 1. Define support for any generic string gateway name
// type GenericGateway = 'lemonsqueezy' | 'stripe' | 'paddle' | 'shopify' | 'razorpay' | 'gumroad' | 'paystack' | string;

// interface GatewayConfig {
//   couponParam: string;       // The query parameter key for discounts
//   emailParam: string;        // The query parameter key for customer emails
//   userIdParam: string;       // The query parameter key for metadata tracking
//   customUrlHandler?: (url: URL, code: string, userId: string, email: string) => void; // For weirdly formatted structures
// }

// const GATEWAY_REGISTRY: Record<string, GatewayConfig> = {
//   lemonsqueezy: {
//     couponParam: 'checkout[discount_code]',
//     emailParam: 'checkout[email]',
//     userIdParam: 'checkout[custom][user_id]'
//   },
//   stripe: {
//     couponParam: 'prefilled_promo_code',
//     emailParam: 'prefilled_email',
//     userIdParam: 'client_reference_id'
//   },
//   paddle: {
//     couponParam: 'coupon',
//     emailParam: 'email',
//     userIdParam: 'passthrough'
//   },
//   shopify: {
//     couponParam: 'discount',
//     emailParam: 'email',
//     userIdParam: 'attributes[user_id]'
//   },
//   gumroad: {
//     couponParam: 'wanted',
//     emailParam: 'email',
//     userIdParam: 'id'
//   },
//   paystack: {
//     couponParam: 'code',
//     emailParam: 'email',
//     userIdParam: 'metadata'
//   },
//   default: {
//     couponParam: 'discount_code',
//     emailParam: 'email',
//     userIdParam: 'user_id'
//   }
// };

//  const handleUpgrade = (
//     type: 'monthly' | 'annual' = 'monthly', 
//     currentTier?: 'LOW' | 'MID' | 'HIGH' | 'NONE',
//     gateway: GenericGateway = 'lemonsqueezy',
//     customCheckoutUrl?: string
// ) => {
//     toast.loading(`Redirecting to secure ${type} checkout...`);

//     // 2. YOUR EXACT VERIFIED LEMON SQUEEZY CHECKOUT LINKS
//     const fallbackUrls: Record<string, { monthly: string; annual: string }> = {
//         lemonsqueezy: {
//             monthly: "https://priceparity-ai.lemonsqueezy.com/checkout/buy/83fc7d29-ff6e-48ad-aff5-818427365c84",
//             annual: "https://priceparity-ai.lemonsqueezy.com/checkout/buy/1b4152a4-5463-4208-9cd8-50a9f3ec7a89"
//         }
//     };

//     // Determine target checkout URL baseline
//     let selectedUrl = customCheckoutUrl;
//     if (!selectedUrl && fallbackUrls[gateway]) {
//         selectedUrl = type === 'annual' ? fallbackUrls[gateway].annual : fallbackUrls[gateway].monthly;
//     }

//     if (!selectedUrl) {
//         toast.dismiss();
//         toast.error("Invalid payment configuration link.");
//         return;
//     }

//     const url = new URL(selectedUrl);
//     const config = GATEWAY_REGISTRY[gateway] || GATEWAY_REGISTRY['default'];

//     // 3. BULLETPROOF METADATA SANITIZATION ENGINE
//     // This stops malformed variables from injecting literal strings like "undefined" or code brackets {} into URLs
//     const rawUserId = (window as any).user?._id || (window as any).user?.id || ''; 
//     const rawEmail = (window as any).user?.email || '';

//     const userId = typeof rawUserId === 'string' ? rawUserId.replace(/[{}]/g, '').trim() : '';
//     const email = typeof rawEmail === 'string' ? rawEmail.replace(/[{}]/g, '').trim() : '';

//     // Only set parameters if they pass runtime verification checks
//     if (config.userIdParam && userId && userId !== 'undefined' && userId !== 'null') {
//         url.searchParams.set(config.userIdParam, userId);
//     }
//     if (config.emailParam && email && email.includes('@') && email !== 'undefined') {
//         url.searchParams.set(config.emailParam, email);
//     }

//     // 4. CHOOSE DISCOUNT STRINGS MATCHING YOUR DASHBOARD
//     const tier = currentTier || (window as any).result?.discountTier as 'LOW' | 'MID' | 'HIGH' | 'NONE' | undefined; 

//     if (tier && tier !== 'NONE') {
//         let code = "";
        
//         if (tier === "LOW")  code = "C4MZQWOA";  // GLOBAL20
//         if (tier === "HIGH") code = "Q2MTCYMW";  // GLOBAL70
//         if (tier === "MID")  code = "MYMTQYNQ";  // GLOBAL50

//         if (code && config.couponParam) {
//             url.searchParams.set(config.couponParam, code.toUpperCase().trim());
//         }
        
//         if (code && config.customUrlHandler) {
//             config.customUrlHandler(url, code, userId, email);
//         }
//     }

//     // 5. MODAL SDK-BASED GATEWAY INTEGRATION CAPTURE
//     if ((window as any).Paddle && gateway === 'paddle_sdk') {
//         let sdkCode = undefined;
//         if (tier === "LOW")  sdkCode = "C4MZQWOA";
//         if (tier === "HIGH") sdkCode = "Q2MTCYMW";
//         if (tier === "MID")  sdkCode = "MYMTQYNQ";

//         (window as any).Paddle.Checkout.open({
//             method: 'checkout',
//             product: type === 'annual' ? 12345 : 67890, 
//             coupon: sdkCode,
//             email: email,
//             passthrough: userId
//         });
//         return;
//     }

//     // Execution redirection loop
//     window.location.href = url.toString();
// };

import { toast } from 'react-hot-toast';

type GenericGateway = 'lemonsqueezy' | 'stripe' | 'paddle' | 'shopify' | 'gumroad' | 'paystack' | string;

interface GatewayConfig {
  couponParam: string;
  emailParam: string;
  userIdParam: string;
}

const GATEWAY_REGISTRY: Record<string, GatewayConfig> = {
  lemonsqueezy: {
    couponParam: 'checkout[discount_code]',
    emailParam: 'checkout[email]',
    userIdParam: 'checkout[custom][user_id]'
  },
  stripe: {
    couponParam: 'prefilled_promo_code',
    emailParam: 'prefilled_email',
    userIdParam: 'client_reference_id'
  },
  paddle: {
    couponParam: 'coupon',
    emailParam: 'email',
    userIdParam: 'passthrough'
  },
  default: {
    couponParam: 'discount_code',
    emailParam: 'email',
    userIdParam: 'user_id'
  }
};

// PASS DETECTED VALUES AS DIRECT ARGUMENTS INSTEAD OF TRUSTING WINDOW OBJECTS
 const handleUpgrade = (
    type: 'monthly' | 'annual' = 'monthly', 
    currentTier: 'LOW' | 'MID' | 'HIGH' | 'NONE' = 'NONE',
    userData: { id?: string; _id?: string; email?: string } | null = null,
    gateway: GenericGateway = 'lemonsqueezy'
) => {
    toast.loading(`Redirecting to secure ${type} checkout...`);

    // YOUR LOCKED PRODUCT BUY LINKS
    const baseUrls = {
        monthly: "https://lemonsqueezy.com/checkout/buy/83fc7d29-ff6e-48ad-aff5-818427365c84",
        annual: "https://lemonsqueezy.com/checkout/buy/1b4152a4-5463-4208-9cd8-50a9f3ec7a89"
    };

    // Forces selection of the explicit /buy/ link paths to avoid generic /checkout drops
    const selectedUrl = type === 'annual' ? baseUrls.annual : baseUrls.monthly;
    const url = new URL(selectedUrl);
    const config = GATEWAY_REGISTRY[gateway] || GATEWAY_REGISTRY['default'];

    // Extracting user details cleanly from safe component params
    const rawUserId = userData?._id || userData?.id || ''; 
    const rawEmail = userData?.email || '';

    const userId = typeof rawUserId === 'string' ? rawUserId.replace(/[{}]/g, '').trim() : '';
    const email = typeof rawEmail === 'string' ? rawEmail.replace(/[{}]/g, '').trim() : '';

    if (config.userIdParam && userId && userId !== 'undefined' && userId !== 'null') {
        url.searchParams.set(config.userIdParam, userId);
    }
    if (config.emailParam && email && email.includes('@')) {
        url.searchParams.set(config.emailParam, email);
    }

    // MAP DETECTED PPP TIER STRINGS TO DASHBOARD CONTEXT 
    if (currentTier && currentTier !== 'NONE') {
        let code = "";
        
        if (currentTier === "LOW")  code = "C4MZQWOA";  // GLOBAL20
        if (currentTier === "HIGH") code = "Q2MTCYMW";  // GLOBAL70
        if (currentTier === "MID")  code = "MYMTQYNQ";  // GLOBAL50

        if (code && config.couponParam) {
            url.searchParams.set(config.couponParam, code);
        }
    }

    // Direct browser routing execution
    window.location.href = url.toString();
};


//  const handleUpgrade = (
//     type: 'monthly' | 'annual' = 'monthly', 
//     currentTier?: 'LOW' | 'MID' | 'HIGH' | 'NONE',
//     gateway: GenericGateway = 'lemonsqueezy',
//     customCheckoutUrl?: string
// ) => {
//     toast.loading(`Redirecting to secure ${type} checkout...`);

//      const fallbackUrls: Record<string, { monthly: string; annual: string }> = {
//         lemonsqueezy: {
//             monthly: "https://priceparity-ai.lemonsqueezy.com/checkout/buy/83fc7d29-ff6e-48ad-aff5-818427365c84",
//             annual: "https://priceparity-ai.lemonsqueezy.com/checkout/buy/1b4152a4-5463-4208-9cd8-50a9f3ec7a89"
//         }
//     };

//     let selectedUrl = customCheckoutUrl;
//     if (!selectedUrl && fallbackUrls[gateway]) {
//         selectedUrl = type === 'annual' ? fallbackUrls[gateway].annual : fallbackUrls[gateway].monthly;
//     }

//     if (!selectedUrl) {
//         toast.dismiss();
//         toast.error("Invalid payment configuration link.");
//         return;
//     }

//     const userId = (window as any).user?._id || (window as any).user?.id || ''; 
//     const email = (window as any).user?.email || '';
    
//     const url = new URL(selectedUrl);
//     const config = GATEWAY_REGISTRY[gateway] || GATEWAY_REGISTRY['default'];

//     if (config.userIdParam) url.searchParams.set(config.userIdParam, userId);
//     if (config.emailParam) url.searchParams.set(config.emailParam, email);

//     // Dynamic verification matching widget calculations
//     const tier = currentTier || (window as any).result?.discountTier as 'LOW' | 'MID' | 'HIGH' | 'NONE' | undefined; 

//     if (tier && tier !== 'NONE') {
//         let code = "";
        
//         // RE-VERIFIED AND LOCKED CODES FROM YOUR DASHBOARD
//         if (tier === "LOW")  code = "C4MZQWOA";  // GLOBAL20 (20%)
//         if (tier === "HIGH") code = "Q2MTCYMW";  // GLOBAL70 (70%)
//         if (tier === "MID")  code = "MYMTQYNQ";  // GLOBAL50 (50%) -> Widget standard sync fallback

//         if (code && config.couponParam) {
//             url.searchParams.set(config.couponParam, code);
//         }
        
//         if (code && config.customUrlHandler) {
//             config.customUrlHandler(url, code, userId, email);
//         }
//     }

//     // Modal intercept configuration fallback
//     if ((window as any).Paddle && gateway === 'paddle_sdk') {
//         let sdkCode = undefined;
//         if (tier === "LOW")  sdkCode = "C4MZQWOA";
//         if (tier === "HIGH") sdkCode = "Q2MTCYMW";
//         if (tier === "MID")  sdkCode = "MYMTQYNQ";

//         (window as any).Paddle.Checkout.open({
//             method: 'checkout',
//             product: type === 'annual' ? 12345 : 67890, 
//             coupon: sdkCode,
//             email: email,
//             passthrough: userId
//         });
//         return;
//     }

//     window.location.href = url.toString();
// };


  const handleImplement = () => {
    if (!user?.isPro) {
      toast((t) => (
        <div className="flex flex-col gap-4 p-4 text-left max-w-[280px]">
          <div>
            <b className="text-slate-900 text-lg leading-none">Choose Your Plan</b>
            <p className="text-[11px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Unlock AI & Widget Access</p>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={() => { toast.dismiss(t.id); handleUpgrade('monthly'); }} className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-2xl hover:border-blue-600 transition-all group">
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase">Monthly</span>
                <span className="text-sm font-black text-slate-800">Localized Pricing.</span>
              </div>
              <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600" />
            </button>
            <button onClick={() => { toast.dismiss(t.id); handleUpgrade('annual'); }} className="w-full flex items-center justify-between p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all group">
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black opacity-70 uppercase text-white">Annual (Best Value)</span>
                <span className="text-sm font-black text-white">Localized Pricing.</span>
              </div>
              <Zap size={16} fill="white" className="text-white" />
            </button>
          </div>
          <p className="text-[9px] text-center text-slate-400 italic">Secure payment via Lemonsqueezy</p>
        </div>
      ), { duration: 15000, position: 'top-center' });
    } else {
      document.getElementById('widget-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const syncProfile = async (currentToken: string) => {
    try {
      const res = await axios.get(`${API_BASE}/auth/me`, { headers: { 'x-auth-token': currentToken } });
      if (res.data) setUser(res.data);
    } catch (err: any) { if (err.response?.status === 401) handleLogout(); } 
    finally { setAuthLoading(false); }
  };

  const fetchHistory = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/strategies`, { headers: { 'x-auth-token': token } });
      setHistory(res.data);
    } catch (err) { console.error(err); }
  };

  const handleEmailClick = (e: React.MouseEvent) => {
    e.preventDefault(); 
    navigator.clipboard.writeText("support@priceparityai.com");
    toast.success("Opening mailbox & email copied!", { icon: '', duration: 3000 });
    setTimeout(() => { window.location.href = "mailto:support@priceparityai.com"; }, 100);
  };

  const handleLogout = () => {
    localStorage.removeItem('parity_token');
    setToken(null);
    setUser(null);
    window.location.href = "/";
  };

  const handleLoginSuccess = (newToken: string, userData: any) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('parity_token', newToken);
    setIsAuthOpen(false);
    setAuthLoading(false);
  };

  useEffect(() => {
    const fetchCountries = async () => {
        try {
            const res = await axios.get(`${API_BASE}/countries`);
            setAvailableCountries(res.data);
        } catch (err) { console.error("Error loading countries"); }
    };
    fetchCountries();
  }, []);

  // --- UPDATED: LEMON SQUEEZY SUCCESS REDIRECT ---
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    // When returning from Lemon Squeezy, our redirect URL included ?success=true
    if (query.get('success')) {
      const verifySession = async () => {
        const load = toast.loading("Finalizing your Pro upgrade...");
        try {
          // Force a profile sync to see the new 'isPro' status from the database
          if (token) await syncProfile(token);
          toast.dismiss(load);
          toast.success("Subscription Active! Welcome to Pro.");
        } catch (err) { 
          toast.dismiss(load); 
        }
      };
      verifySession();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [token]);

  useEffect(() => {
    if (token) { syncProfile(token); fetchHistory(); } 
    else { setAuthLoading(false); }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let timer: number;
    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = window.setTimeout(() => handleLogout(), IDLE_TIMEOUT);
    };
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timer) clearTimeout(timer);
    };
  }, [token]);

  // --- WIDGET INJECTION EFFECT ---
  useEffect(() => {
    if (!token) {
      const urlParams = new URLSearchParams(window.location.search);
      const testCountry = urlParams.get('test_country') || '';
      const script = document.createElement("script");
      script.src = `${API_BASE}/widget${testCountry ? '?test_country=' + testCountry : ''}`; 
      script.async = true;
      document.body.appendChild(script);
      return () => { if (document.body.contains(script)) document.body.removeChild(script); };
    }
  }, [token]);

  if (token && authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  // --- VIEW: LANDING PAGE ---
  if (!token) {
    return (
      <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 overflow-x-hidden flex flex-col">
        <Toaster />
        <ChatWidget user={user} />
        <Auth isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLogin={handleLoginSuccess} />
        
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-[-5%] left-[-10%] w-[50%] h-[40%] bg-blue-50/50 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-50/40 rounded-full blur-[100px]"></div>
        </div>

        <nav className="py-4 px-6 max-w-7xl mx-auto w-full flex justify-between items-center sticky top-0 z-40 bg-white/60 backdrop-blur-md">
          <div className="flex items-center gap-2 font-black text-2xl tracking-tighter uppercase italic text-slate-900">
            <img src="/logo.png" alt="PriceParity Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
              PRICE<span className="text-blue-600">PARITY</span>
          </div>
          <button onClick={() => setIsAuthOpen(true)} className="bg-slate-900 text-white px-6 py-2 rounded-full text-sm font-bold shadow-xl active:scale-95 transition-all">Sign In</button>
        </nav>

        {/* --- HERO SECTION --- */}
      <section className="max-w-6xl mx-auto px-6 pt-2 pb-12 text-center relative z-10">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          
          {/* FLEX CONTAINER: Moves both badges to one line */}
          <div className="mb-6 flex justify-center items-center min-h-[44px] w-full overflow-visible">
            
            {/* 1. LOCAL OFFER BADGE (Self-filling Widget) */}
            
              {/* The widget script will inject the offer text here */}
            
            <div data-pp-price="12"></div>

            {/* 2. THE FUTURE BADGE */}
            <div className="inline-flex items-center gap-2 bg-blue-50/50 text-blue-600 px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase border border-blue-100">
              <Sparkles size={12} fill="currentColor" /> The Future of Global Sales
            </div>
          </div>

          {/* HERO TITLE (Everything else is now pushed up because pt-10 is now pt-2) */}
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 mb-6 leading-[0.9] tracking-tight">
            One price does not <br /> <span className="text-blue-600">fit the world.</span>
          </h1>
            <p className="text-slate-500 text-xl md:text-2xl mb-12 max-w-2xl mx-auto leading-relaxed">AI optimization for local economies in 20+ countries.</p>
            <button onClick={() => setIsAuthOpen(true)} className="group bg-blue-600 text-white px-10 py-6 rounded-[2rem] font-black text-xl hover:bg-blue-700 shadow-2xl transition-all active:scale-95 flex items-center gap-3 mx-auto">Get Started Free <ArrowRight /></button>
            <p className="mt-10 text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Trusted by Digital Creators Worldwide</p>
          </motion.div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-12 md:gap-20 border-t border-slate-100">
            <div className="space-y-4 flex flex-col items-center text-center md:items-start md:text-left">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm"><Zap size={24} /></div>
              <h4 className="text-2xl font-black tracking-tight">1. PPP Intelligence</h4>
              <p className="text-slate-500 text-sm font-medium">Calculate fair prices based on local purchasing power automatically.</p>
            </div>
            <div className="space-y-4 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center border border-purple-100 shadow-sm"><Sparkles size={24} /></div>
              <h4 className="text-2xl font-black tracking-tight">2. Cultural AI</h4>
              <p className="text-slate-500 text-sm font-medium">AI rewrites your pitch to match cultural success triggers.</p>
            </div>
            <div className="space-y-4 flex flex-col items-center text-center md:items-end md:text-right">
              <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center border border-green-100 shadow-sm"><ShieldCheck size={24} /></div>
              <h4 className="text-2xl font-black tracking-tight">3. Global Checkout</h4>
              <p className="text-slate-500 text-sm font-medium">Monetize instantly using our secure, 1-line script for any website.</p>
            </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 pt-10 pb-16 text-center">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <div id="price-parity-display" className="mb-6 min-h-[40px] flex justify-center items-center"></div>
            <button onClick={() => setIsAuthOpen(true)} className="group bg-blue-600 text-white px-10 py-6 rounded-[2rem] font-black text-xl hover:bg-blue-700 shadow-2xl transition-all active:scale-95 flex items-center gap-3 mx-auto">Get Started Free <ArrowRight /></button>
          </motion.div>
        </section>

        <footer className="py-12 mt-auto text-center border-t border-slate-100 bg-white">
          <div className="flex justify-center gap-8 mb-6">
            <button onClick={() => setIsHelpOpen(true)} className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-600 transition-all uppercase tracking-widest"><LifeBuoy size={16} /> Help Center</button>
            <a href="mailto:support@priceparityai.com" onClick={handleEmailClick} className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-600 transition-all uppercase tracking-widest"><Mail size={16} /> Contact</a>
          </div>
          <SupportModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} onEmailClick={handleEmailClick} />
          <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.4em]">© 2026 PriceParity AI | Built By Samuel Odeh | <a href="https://www.richtec.com.ng" className="underline">RichTec</a></p>
        </footer>
      </div>
    );
  }

  // --- VIEW: DASHBOARD (IF LOGGED IN) ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 overflow-x-hidden">
      <Toaster />
      <ChatWidget user={user} />
      <Auth isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLogin={handleLoginSuccess} />
      <SupportModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} onEmailClick={handleEmailClick} />

      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100/20 rounded-full blur-[100px]"></div>
      </div>
      
      <nav className="py-4 px-6 max-w-7xl mx-auto flex justify-between items-center sticky top-0 z-40 bg-white/60 backdrop-blur-md">
        <div className="flex items-center gap-2 font-black text-2xl tracking-tighter uppercase italic">
          <img src="/logo.png" alt="PriceParity Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
        </div>
        <div className="flex items-center gap-4">
          {!user?.isPro && (
            <button onClick={() => handleImplement()} className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline transition-all">Upgrade Pro</button>
          )}

          {user?.isPro && user?.proExpiry && (
            <p className="text-[10px] text-green-600 font-bold uppercase mt-2 mr-4">
              Active until: {new Date(user.proExpiry).toLocaleDateString()}
            </p>
          )}
          <div className="flex items-center gap-4 bg-white/80 p-1.5 rounded-full border border-slate-200 shadow-sm">
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Hi, {user?.username ? user.username.split(' ')[0] : 'Member'}
            </span>
            <button onClick={handleLogout} className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[10px] font-bold hover:bg-red-500 transition-all uppercase tracking-widest">Logout</button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-5 gap-12 items-start mb-24">
          <motion.div className="lg:col-span-2 bg-white/70 backdrop-blur-xl border border-white p-8 rounded-[2.5rem] shadow-2xl space-y-8 text-left">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Zap size={20} className="text-blue-600"/> Optimizer</h2>
            <form onSubmit={handleOptimize} className="space-y-6">
              <input required value={productName} onChange={e => setProductName(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Product Title..." />
              <div className="grid grid-cols-2 gap-4">
                <input required type="number" value={price} onChange={e => setPrice(e.target.value)} className="p-4 bg-slate-50 rounded-2xl outline-none" placeholder="USD Price" />
                <select value={country} onChange={e => setCountry(e.target.value)} className="p-4 bg-slate-50 rounded-2xl outline-none">
                  {availableCountries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
              <button disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black shadow-xl active:scale-95 transition-all">{loading ? "Analysing..." : "Generate Strategy"}</button>
            </form>

            {/* UPGRADE TIERS UI */}
            <div className="pt-8 border-t border-slate-100 flex flex-col gap-4">
                <div className="p-5 bg-white border border-slate-100 rounded-2xl flex justify-between items-center group cursor-pointer hover:border-blue-600" onClick={() => handleUpgrade('monthly')}>
                   <div><p className="text-[10px] font-bold text-slate-400 uppercase">Monthly Pro</p><p className="font-black text-slate-800">$12/mo</p></div>
                   <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-600"/>
                </div>
                <div className="p-5 bg-blue-600 text-white rounded-2xl flex justify-between items-center group cursor-pointer active:scale-95 transition-all" onClick={() => handleUpgrade('annual')}>
                   <div><p className="text-[10px] font-bold opacity-80 uppercase">Annual Savings</p><p className="font-black text-lg">$99/yr</p></div>
                   <div className="bg-white/20 p-1.5 rounded-full"><Zap size={14} fill="currentColor"/></div>
                </div>
            </div>
          </motion.div>

          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {!result ? (
                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[3rem] p-12 text-center text-slate-300 min-h-[450px]"><BarChart3 size={48} className="opacity-10 mb-4"/><p className="font-bold">Enter details to see localized strategy.</p></div>
              ) : (
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                  <div className="flex items-center gap-2 text-blue-400 mb-8 font-black text-xs tracking-widest uppercase"><Sparkles size={16} /> Logic Applied</div>
                  <h3 className="text-6xl font-black mb-4 leading-none tracking-tighter text-white">{result.localPriceFormatted || `$${result.suggestedPrice}`}</h3>
                  <p className="text-slate-400 uppercase font-black mb-10 text-sm tracking-widest underline decoration-blue-600 decoration-4 underline-offset-8">Fair Price for {result.countryName || country}</p>
                  <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 relative">
                    <p className="text-blue-400 text-[10px] font-black uppercase mb-3 tracking-widest flex items-center gap-2"><Sparkles size={12}/> AI Marketing Pitch</p>
                    <div className={!user?.isPro ? "blur-2xl select-none opacity-20 pointer-events-none" : ""}><p className="italic text-xl text-slate-100 font-serif leading-relaxed whitespace-pre-line"> "{result.localizedPitch}"</p></div>
                    {!user?.isPro && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 rounded-[2rem] p-6 text-center">
                        <Lock className="text-blue-500 mb-3" size={20}/><button onClick={() => handleUpgrade('monthly')} className="bg-white text-slate-900 px-6 py-2.5 rounded-full text-[10px] font-black uppercase shadow-2xl">Unlock Pro Features</button>
                      </div>
                    )}
                  </div>
                  <button onClick={handleImplement} className="w-full bg-white text-slate-900 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-lg hover:bg-slate-100 active:scale-95 transition-all mt-4">Get Code Widget</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* PRO PLUS WIDGET SECTION */}
        {result && user?.isPro && (
          <div id="widget-section" className="mb-24 p-8 md:p-12 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-2xl animate-in zoom-in">
            <h4 className="text-2xl font-black text-slate-800 mb-2 uppercase italic underline decoration-blue-600 underline-offset-8">Global Revenue Widget</h4>
            <p className="text-slate-500 mb-8 max-w-lg font-medium text-sm">Paste this into your site to automate local pricing based on IP.</p>
            <div className="bg-slate-900 p-6 rounded-3xl font-mono text-[10px] text-blue-300 overflow-x-auto shadow-inner leading-relaxed text-left">
                {`<!-- Add the attribute to price elements -->\n<span data-pp-price="${price}"></span>\n\n<!-- Add script once at the bottom -->\n<script src="${API_BASE}/widget"></script>`}
            </div>
            <button onClick={() => { navigator.clipboard.writeText(`<span data-pp-price="${price}"></span>\n<script src="${API_BASE}/widget"></script>`); toast.success("Code copied!"); }}
                className="mt-6 text-xs font-black text-blue-600 uppercase tracking-widest hover:underline transition-all">Copy Logic Code</button>
          </div>
        )}

        {/* --- SUBSCRIBER INTEGRATION SECTION --- */}
        {token && user?.isPro && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-20 max-w-4xl mx-auto pb-20">
            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-2xl shadow-slate-200/50">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800">Merchant Implementation</h3>
                  <p className="text-slate-400 text-sm">Follow these 3 steps to go live globally.</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Step 1 */}
                <div className="space-y-3">
                  <span className="text-blue-600 font-black text-sm">STEP 01</span>
                  <h5 className="font-bold text-slate-700 leading-tight">Create 3 Codes</h5>
                  <p className="text-xs text-slate-400 leading-relaxed">Go to your Checkout Dashboard and create these 3 discount codes: <code className="text-blue-600 font-bold">GLOBAL20</code> (20% off), <code className="text-blue-600 font-bold">GLOBAL50</code> (50% off), and <code className="text-blue-600 font-bold">GLOBAL70</code> (70% off).</p>
                </div>

                {/* Step 2 */}
                <div className="space-y-3">
                  <span className="text-blue-600 font-black text-sm">STEP 02</span>
                  <h5 className="font-bold text-slate-700 leading-tight">Markup Prices</h5>
                  <p className="text-xs text-slate-400 leading-relaxed">Add the attribute <code className="bg-slate-100 px-1 italic">data-pp-price="VALUE"</code> to any element where you want the fair price to appear.</p>
                  <div className="bg-slate-900 p-3 rounded-lg font-mono text-[9px] text-blue-300">
                    {`<span data-pp-price="100"></span>`}
                  </div>
                </div>

                {/* Step 3 */}
                <div className="space-y-3">
                  <span className="text-blue-600 font-black text-sm">STEP 03</span>
                  <h5 className="font-bold text-slate-700 leading-tight">Install Script</h5>
                  <p className="text-xs text-slate-400 leading-relaxed">Paste this single script tag right before your closing &lt;/body&gt; tag.</p>
                  <div className="bg-slate-900 p-3 rounded-lg font-mono text-[9px] text-blue-300 break-all overflow-hidden">
                    {`<script src="${API_BASE}/widget"></script>`}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`<script src="${API_BASE}/widget"></script>`);
                  toast.success("Script copied to clipboard!");
                }}
                className="mt-10 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-xl"
              >
                Copy Universal Production Script
              </button>
            </div>
          </motion.section>
        )}

        {/* PERSISTENT HISTORY SECTION */}
        {history.length > 0 && (
          <div className="pt-20 border-t border-slate-100">
             <h3 className="text-2xl font-black text-slate-800 mb-10 tracking-tight">Recent Optimizations</h3>
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {history.slice(0, 6).map((h) => (
                <div key={h._id} className="bg-white p-7 rounded-[2rem] border border-white shadow-xl shadow-slate-100 text-left">
                  <div className="flex justify-between mb-4"><h4 className="font-bold text-slate-800 line-clamp-1">{h.productName}</h4><span className="text-blue-600 font-black tracking-tighter text-sm">${h.suggestedPrice}</span></div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-wider">{h.country}</p>
                  <p className="text-xs text-slate-400 italic line-clamp-2 leading-relaxed">"{h.pitch}"</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="py-12 text-center border-t border-slate-200 bg-white">
        <div className="flex justify-center gap-8 mb-6">
           <button onClick={() => setIsHelpOpen(true)} className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-blue-600 transition-all uppercase tracking-widest tracking-widest"><LifeBuoy size={14} /> Help Center</button>
           <a href="mailto:support@priceparityai.com" onClick={handleEmailClick} className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-blue-600 transition-all uppercase tracking-widest"><Mail size={14} /> Contact Author</a>
        </div>
        <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.4em]">© 2026 PriceParity AI | Built By Samuel Odeh | <a href="https://www.richtec.com.ng" className="underline">RichTec</a></p>
      </footer>
    </div>
  );
}

export default App;