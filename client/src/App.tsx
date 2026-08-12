import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BarChart3, Globe, Lock, ShieldCheck, Sparkles, Zap, LifeBuoy, Mail, MessageSquare } from 'lucide-react';
import { useEffect, useState } from "react";
import toast, { Toaster } from 'react-hot-toast';
import { Auth } from "./components/Auth";
import type { PricingResult } from "./types";
import { ChatWidget } from './components/ChatWidget';

// --- GLOBAL CONSTANTS ---
const IDLE_TIMEOUT = 3 * 60 * 1000; 
const API_BASE = "https://priceparity-api-live.onrender.com/api";

const SupportModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

   // New function to handle the laptop issue
  const handleEmailClick = (e: React.MouseEvent) => {
  // 1. We keep e.preventDefault() so we can control the flow and satisfy TypeScript
  e.preventDefault(); 
  
  // 2. Copy the email to clipboard (Backup)
  navigator.clipboard.writeText("samuelodeh37@gmail.com");
  
  toast.success("Opening mailbox & email copied!", {
      icon: '',
      duration: 3000
  });

  // 3. Manually trigger the "mailto" after a tiny delay
  // This is the part that will actually open the mailbox app on the laptop
  setTimeout(() => {
    window.location.href = "mailto:samuelodeh37@gmail.com";
  }, 100);
};


  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative border border-slate-100">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 font-bold transition-colors">✕</button>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LifeBuoy size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Customer Support</h2>
          <p className="text-slate-500 mt-2 text-sm">Need help with your subscription? Talk to us.</p>
        </div>

        <div className="space-y-4">
          <a href="mailto:samuelodeh37@gmail.com" onClick={handleEmailClick} className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all group cursor-pointer">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:scale-110 transition"><Mail size={20}/></div>
            <div>
              <p className="text-sm font-bold text-slate-800">Email Support</p>
              <p className="text-xs text-slate-400">samuelodeh37@gmail.com</p>
              <p className="text-[10px] text-blue-500 font-medium mt-1">Click to send or copy</p>
              <p className="text-xs text-slate-400">Response within 24 hours</p>
            </div>
          </a>

          <button 
            onClick={() => {
              if ((window as any).Tawk_API) {
                  (window as any).Tawk_API.maximize();
                  onClose(); 
              } else {
                  toast.error("Connecting to live support...");
              }
            }} 
            className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all group w-full text-left"
          >
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg group-hover:scale-110 transition">
              <MessageSquare size={20}/>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Live Chat</p>
              <p className="text-xs text-slate-400">Instant assistance</p>
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

  const handleUpgrade = async (type: 'monthly' | 'annual') => {
  const loading = toast.loading(`Preparing your ${type} subscription...`);
  try {
    const res = await axios.post(`${API_BASE}/paystack/initialize`, 
      { planType: type }, // Send the choice to backend
      { headers: { 'x-auth-token': token } }
    );
    window.location.href = res.data.authorization_url; 
  } catch (err) {
    toast.dismiss(loading);
    toast.error("Payment system unavailable");
  }
};

const handleImplement = () => {
  if (!user?.isPro) {
    toast((t) => (
      <div className="flex flex-col gap-4 p-4 text-left max-w-xs">
        <div>
          <b className="text-slate-900 text-lg">Select Your Plan</b>
          <p className="text-[11px] text-slate-500 mt-1">Join 5,000+ creators scaling globally.</p>
        </div>

        <div className="space-y-3">
          {/* Monthly Option */}
          <button 
            onClick={() => { toast.dismiss(t.id); handleUpgrade('monthly'); }}
            className="w-full p-4 border border-slate-100 rounded-2xl flex justify-between items-center hover:border-blue-600 transition-all bg-slate-50 group"
          >
            <div className="text-left">
               <p className="text-[10px] font-black uppercase text-slate-400 group-hover:text-blue-600">Monthly</p>
               <p className="font-bold text-slate-800">$12/mo</p>
            </div>
            <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600" />
          </button>

          {/* Annual Option */}
          <button 
            onClick={() => { toast.dismiss(t.id); handleUpgrade('annual'); }}
            className="w-full p-4 border-2 border-blue-600 rounded-2xl flex justify-between items-center bg-blue-50 group shadow-lg shadow-blue-100"
          >
            <div className="text-left">
               <p className="text-[10px] font-black uppercase text-blue-600">Annual (Save 30%)</p>
               <p className="font-bold text-slate-800">$99/yr</p>
            </div>
            <div className="bg-blue-600 text-white p-1 rounded-full"><Zap size={12} fill="currentColor" /></div>
          </button>
        </div>
      </div>
    ), { duration: 10000 });
  } else {
    document.getElementById('widget-section')?.scrollIntoView({ behavior: 'smooth' });
  }
};

  const syncProfile = async (currentToken: string) => {
    try {
      const res = await axios.get(`${API_BASE}/auth/me`, {
        headers: { 'x-auth-token': currentToken }
      });
      if (res.data) setUser(res.data);
    } catch (err: any) {
      if (err.response?.status === 401) handleLogout();
    } finally { setAuthLoading(false); }
  };

  const fetchHistory = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/strategies`, {
        headers: { 'x-auth-token': token }
      });
      setHistory(res.data);
    } catch (err) { console.error(err); }
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

  toast((t) => (
  <span className="flex flex-col gap-2 p-2 text-left">
    <b className="text-slate-800 text-lg">Pro Membership </b>
    <ul className="text-[11px] text-slate-500 space-y-1 mb-2">
      <li className="flex items-center gap-1">✅ <b>Unlimited</b> AI Marketing Pitches</li>
      <li className="flex items-center gap-1">✅ <b>Full</b> Website Widget Access</li>
      <li className="flex items-center gap-1">✅ <b>Priority</b> 24/7 Developer Support</li>
    </ul>
    <button
      onClick={() => { toast.dismiss(t.id); handleUpgrade(); }}
      className="bg-blue-600 text-white py-3 rounded-xl font-bold uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all active:scale-95">
        Get Unlimited Access — $12/mo
    </button>
  </span>
), { duration: 8000 });

  useEffect(() => {
    const fetchCountries = async () => {
        try {
            const res = await axios.get(`${API_BASE}/countries`);
            setAvailableCountries(res.data);
        } catch (err) { console.error("Error loading countries"); }
    };
    fetchCountries();
}, []);

  // --- EFFECTS ---
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const ref = query.get('reference');
    if (query.get('paystack_success') && ref) {
      const verify = async () => {
        const load = toast.loading("Verifying payment...");
        try {
          const res = await axios.get(`${API_BASE}/paystack/verify?reference=${ref}`);
          if (res.data.isPro) {
            toast.dismiss(load);
            toast.success("Subscription Active! Welcome Pro. ");
            if (token) syncProfile(token);
          }
        } catch (err) { toast.dismiss(load); }
      };
      verify();
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

  if (token && authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
// --- LANDING PAGE WIDGET INJECTION ---
  useEffect(() => {
    if (!token) {
      // 1. Grab any test country from your browser URL (e.g. ?test_country=GB)
      const urlParams = new URLSearchParams(window.location.search);
      const testCountry = urlParams.get('test_country') || '';

      const script = document.createElement("script");
      // 2. Pass the price (12) and the test flag to your server
      script.src = `${API_BASE}/widget?price=12&test_country=${testCountry}`; 
      script.async = true;
      document.body.appendChild(script);
      
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [token]);

  // --- LANDING PAGE ---
  if (!token) {
    return (
      <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 overflow-x-hidden">
        <Toaster />
        <ChatWidget user={user} />
        <Auth isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLogin={handleLoginSuccess} />
        <SupportModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
        
        <nav className="py-4 px-6 max-w-7xl mx-auto flex justify-between items-center sticky top-0 z-40 bg-white/60 backdrop-blur-md">
          <div className="flex items-center gap-2 font-black text-2xl tracking-tighter uppercase italic">
            <Globe className="text-blue-600" /> PRICE<span className="text-blue-600">PARITY</span>
          </div>
          <button onClick={() => setIsAuthOpen(true)} className="bg-slate-900 text-white px-6 py-2 rounded-full text-sm font-bold shadow-xl active:scale-95 transition-all">Sign In</button>
        </nav>

        <section className="max-w-6xl mx-auto px-6 pt-10 pb-16 text-center">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase mb-6">
              <Sparkles size={12} fill="currentColor" /> AI-Powered Revenue Optimization
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-slate-900 mb-6 leading-[0.9] tracking-tight">
              One price does not <br /> <span className="text-blue-600">fit the world.</span>
            </h1>
            <p className="text-slate-500 text-xl md:text-2xl mb-10 max-w-2xl mx-auto leading-relaxed">
              We use AI to help digital creators optimize pricing for local economies in 20+ countries.
            </p>
            <button onClick={() => setIsAuthOpen(true)} className="group bg-blue-600 text-white px-10 py-6 rounded-[2rem] font-black text-xl hover:bg-blue-700 shadow-2xl shadow-blue-300 transition-all active:scale-95 flex items-center gap-3 mx-auto uppercase tracking-tighter">
              Get Started Free <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="mt-10 text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Trusted by Digital Creators Worldwide</p>
          </motion.div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-12 md:gap-20 border-t border-slate-100">
            <div className="space-y-4 flex flex-col items-center text-center md:items-start md:text-left">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm border border-blue-100"><Zap size={24} fill="currentColor" /></div>
              <h4 className="text-xl font-black text-slate-800 tracking-tight">1. PPP Intelligence</h4>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">We calculate the relative value of $1 in every economy automatically using real-world data.</p>
            </div>
            
            <div className="space-y-4 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-sm border border-purple-100"><Sparkles size={24} fill="currentColor" /></div>
              <h4 className="text-xl font-black text-slate-800 tracking-tight">2. Cultural AI</h4>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">Our AI rewrites your marketing pitch to match the cultural success triggers of that region.</p>
            </div>
            
            <div className="space-y-4 flex flex-col items-center text-center md:items-end md:text-right">
              <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shadow-sm border border-green-100"><ShieldCheck size={24} fill="currentColor" /></div>
              <h4 className="text-xl font-black text-slate-800 tracking-tight">3. Global Checkout</h4>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">Monetize instantly using our secure script for any website with zero maintenance required.</p>
            </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 pt-10 pb-16 text-center">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <button onClick={() => setIsAuthOpen(true)} className="group bg-blue-600 text-white px-10 py-6 rounded-[2rem] font-black text-xl hover:bg-blue-700 shadow-2xl shadow-blue-300 transition-all active:scale-95 flex items-center gap-3 mx-auto uppercase tracking-tighter">
              Get Started Free <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </section>

        <footer className="py-12 text-center border-t border-slate-100 bg-white">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="flex items-center gap-6">
              <button onClick={() => setIsHelpOpen(true)} className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest"><LifeBuoy size={18} /> Support</button>
              <a href="mailto:samuelodeh37@gmail.com" className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest"><Mail size={18} /> Contact</a>
            </div>
            <SupportModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
          </div>
          <p className="text-slate-300 text-[10px] font-black tracking-[0.4em] uppercase"> © 2026 PriceParity AI | Built By Samuel Odeh | Lead Developer <a href="https://www.richtec.com.ng" className="underline">richtec.com.ng</a></p>
        </footer>
      </div>
    );
  }

  // --- DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      <Toaster />
      <Auth isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLogin={handleLoginSuccess} />
      <SupportModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      {token && <ChatWidget user={user} />}

      <nav className="p-4 px-6 max-w-7xl mx-auto flex justify-between items-center sticky top-0 z-40 bg-white/60 backdrop-blur-md">
        <div className="flex items-center gap-2 font-black text-2xl tracking-tighter uppercase italic">
          <Globe className="text-blue-600" /><span className="text-blue-600"></span>
        </div>
        <div className="flex items-center gap-4">
          {!user?.isPro && (
            <button onClick={() => handleUpgrade('monthly')} className="text-sm font-bold text-blue-600 hover:text-blue-800 transition ">Upgrade to Pro($12/mo)</button>
          )}
          <div className="flex items-center gap-4 bg-white/80 p-1.5 pl-4 rounded-full border border-slate-200 shadow-sm">
            <span className="text-xs font-black uppercase text-slate-500">{user?.username?.split(' ')[0]}</span>
            <button onClick={handleLogout} className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[10px] font-bold hover:bg-red-500 uppercase tracking-widest transition-colors">Logout</button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-5 gap-12 items-start mb-20">
          <motion.div className="lg:col-span-2 bg-white/70 backdrop-blur-xl border border-white p-8 rounded-[2.5rem] shadow-2xl space-y-8">
            <h2 className="text-2xl font-black text-slate-800">Strategy Builder</h2>
            <form onSubmit={handleOptimize} className="space-y-6">
              <input required value={productName} onChange={e => setProductName(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Product Title..." />
              <div className="grid grid-cols-2 gap-4">
                <input required type="number" value={price} onChange={e => setPrice(e.target.value)} className="p-4 bg-slate-50 rounded-2xl outline-none" placeholder="USD Price" />
                <select 
                  value={country} 
                  onChange={e => setCountry(e.target.value)} 
                  className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl outline-none cursor-pointer focus:ring-2 focus:ring-blue-500">
                    {availableCountries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
              <button disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black uppercase shadow-xl transition-all">{loading ? "Generating..." : "Optimize Now"}</button>
            </form>
          </motion.div>

          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {!result ? (
                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[3rem] p-12 text-center text-slate-300 min-h-[400px]"><BarChart3 size={48} className="opacity-10 mb-4"/><p className="font-bold">Generate a strategy.</p></div>
              ) : (
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                  <div className="flex items-center gap-2 text-blue-400 mb-8 font-black text-xs uppercase"><Sparkles size={16} /> AI Logic Ready</div>
                  <h3 className="text-6xl font-black mb-4 leading-none">{result.localPriceFormatted || `$${result.suggestedPrice}`}</h3>
                  <p className="text-slate-400 uppercase font-black mb-10 tracking-widest">Fair Price for {country}</p>
                  <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 relative">
                    <p className="text-blue-400 text-[10px] font-black uppercase mb-3 flex items-center gap-2"><Sparkles size={12}/> Localized Pitch</p>
                    <div className={!user?.isPro ? "blur-2xl select-none opacity-20 pointer-events-none" : ""}><p className="italic text-xl font-serif">"{result.localizedPitch}"</p></div>
                    {!user?.isPro && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 rounded-[2rem]"><Lock className="text-blue-500 mb-3" size={20}/><button onClick={() => handleUpgrade('monthly')} className="bg-white text-slate-900 px-6 py-2.5 rounded-full text-[10px] font-black uppercase shadow-2xl">Subscribe for $12/mo</button></div>
                    )}
                  </div>
                  <button onClick={handleImplement} className="w-full bg-white text-slate-900 py-5 rounded-[1.5rem] font-black text-xs uppercase shadow-lg transition-all active:scale-95 mt-4">Implement Strategy</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase">Monthly</p>
              <h4 className="text-xl font-black">$12<span className="text-xs">/mo</span></h4>
              <button onClick={() => handleUpgrade('monthly')} className="mt-4 w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">Choose Monthly</button>
            </div>

            <div className="bg-blue-600 p-6 rounded-3xl text-white text-center shadow-xl shadow-blue-100">
              <p className="text-xs font-bold opacity-80 uppercase">Annual (Save 30%)</p>
              <h4 className="text-xl font-black">$99<span className="text-xs">/yr</span></h4>
              <button onClick={() => handleUpgrade('annual')} className="mt-4 w-full py-2 bg-white text-blue-600 rounded-xl text-xs font-bold">Choose Annual</button>
            </div>
          </div>
        </div>

        {/* WIDGET SECTION */}
        {result && user?.isPro && (
          <div id="widget-section" className="mb-24 p-10 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-2xl animate-in zoom-in">
             <h4 className="text-2xl font-black text-slate-800 mb-2 uppercase italic underline decoration-blue-600 underline-offset-8">Your Website Widget</h4>
             <p className="text-slate-500 mb-8 max-w-lg">Paste this code into your site to automate local pricing.</p>
             <div className="bg-slate-900 p-6 rounded-3xl font-mono text-[10px] text-blue-300 overflow-x-auto shadow-inner leading-relaxed">
              {/* 
                WE USE THE 'price' VARIABLE FROM THE INPUT BOX 
                This ensures the widget they copy matches their product price! 
              */}
                {`<div id="price-parity-display"></div>\n<script src="${API_BASE}/widget?price=${price}"></script>`}
             </div>
               <button 
                onClick={() => {
                  navigator.clipboard.writeText(`<div id="price-parity-display"></div>\n<script src="${API_BASE}/widget?price=${price}"></script>`);
                  toast.success("Widget code copied!");
                }}
                className="..."
              >
                Copy Code
              </button>
          </div>
        )}

        {/* HISTORY SECTION */}
        {history.length > 0 && (
          <div className="pt-16 border-t border-slate-200">
             <h3 className="text-2xl font-black text-slate-800 mb-10">Previous Audits</h3>
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {history.slice(0, 6).map((h) => (
                <div key={h._id} className="bg-white p-7 rounded-[2rem] border border-white shadow-xl shadow-slate-100 transition-all hover:-translate-y-1">
                  <div className="flex justify-between mb-4"><h4 className="font-bold text-slate-800">{h.productName}</h4><span className="text-blue-600 font-black tracking-tighter">${h.suggestedPrice}</span></div>
                  <p className="text-[10px] uppercase font-black text-slate-400 mb-2">{h.country}</p>
                  <p className="text-xs text-slate-400 italic line-clamp-2 leading-relaxed">"{h.pitch}"</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="py-12 text-center border-t border-slate-100 bg-white">
        <div className="flex justify-center gap-8 mb-6">
           <button onClick={() => setIsHelpOpen(true)} className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-blue-600 transition-all uppercase tracking-widest"><LifeBuoy size={16} /> Help</button>
           <a href="mailto:samuelodeh37@gmail.com" className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-blue-600 transition-all uppercase tracking-widest"><Mail size={16} /> Contact</a>
        </div>
        <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.4em]">© 2026 PriceParity AI | Built By Samuel Odeh | Lead Developer <a href="https://www.richtec.com.ng" className="underline">richtec.com.ng</a></p>
      </footer>
    </div>
  );
}

export default App;