import { useEffect, useState } from "react";
import axios from 'axios';
import { Globe, Sparkles, ArrowRight, Zap, BarChart3, ShieldCheck, Lock } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import type { PricingResult } from "./types";
import { Auth } from "./components/Auth";

// --- GLOBAL CONSTANTS ---
const IDLE_TIMEOUT = 3 * 60 * 1000; 
const API_BASE = "https://priceparity-api-live.onrender.com/api";

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

  // --- LOGIC HANDLERS ---
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
    } catch (err: any) {
      toast.error("Generation failed");
    } finally { setLoading(false); }
  };

  const handleUpgrade = async () => {
    const loadingToast = toast.loading("Connecting to Paystack...");
    try {
      const res = await axios.post(`${API_BASE}/paystack/initialize`, {}, {
        headers: { 'x-auth-token': token }
      });
      window.location.href = res.data.authorization_url;
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Payment system offline");
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

  // --- PERSISTENCE & PAYMENT EFFECTS ---
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const reference = query.get('reference');
    if (query.get('paystack_success') && reference) {
      const verify = async () => {
        const load = toast.loading("Verifying transaction...");
        try {
          const res = await axios.get(`${API_BASE}/paystack/verify?reference=${reference}`);
          if (res.data.isPro) {
            toast.dismiss(load);
            toast.success("Upgrade Successful! Welcome to Pro. 🚀");
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

  // --- RENDER LANDING PAGE IF NOT LOGGED IN ---
  if (!token) {
    return (
      <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 overflow-x-hidden">
        <Toaster />
        <Auth isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLogin={handleLoginSuccess} />
        
        {/* BACKGROUND DECORATION */}
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-[-5%] left-[-10%] w-[50%] h-[40%] bg-blue-50/50 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-50/40 rounded-full blur-[100px]"></div>
        </div>

        {/* 1. NAVIGATION (Tighter) */}
        <nav className="py-4 px-6 max-w-7xl mx-auto flex justify-between items-center sticky top-0 z-40 bg-white/60 backdrop-blur-md">
          <div className="flex items-center gap-2 font-black text-2xl tracking-tighter uppercase italic">
            <Globe className="text-blue-600" /> PRICE<span className="text-blue-600">PARITY</span>
          </div>
          <button onClick={() => setIsAuthOpen(true)} className="bg-slate-900 text-white px-6 py-2 rounded-full text-sm font-bold shadow-xl active:scale-95 transition-all">
            Sign In
          </button>
        </nav>

        {/* 2. HERO SECTION (Space Removed) */}
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

        {/* 3. FEATURES SECTION (Aligned & Tighter) */}
        <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-12 md:gap-20 border-t border-slate-100">
            {/* Column 1 - Moves Left on Desktop */}
            <div className="space-y-4 flex flex-col items-center text-center md:items-start md:text-left">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm border border-blue-100"><Zap size={24} fill="currentColor" /></div>
              <h4 className="text-xl font-bold font-sans">1. PPP Intelligence</h4>
              <p className="text-slate-500 text-sm leading-relaxed">We use global economic data to calculate the relative value of $1 in every economy automatically.</p>
            </div>
            
            {/* Column 2 - Stays Centered */}
            <div className="space-y-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shadow-sm border border-purple-100"><Sparkles size={24} fill="currentColor" /></div>
              <h4 className="text-xl font-bold font-sans">2. Cultural AI</h4>
              <p className="text-slate-500 text-sm leading-relaxed">Our AI rewrites your marketing pitch to match the cultural success triggers of that region.</p>
            </div>
            
            {/* Column 3 - Moves Right on Desktop */}
            <div className="space-y-4 flex flex-col items-center text-center md:items-end md:text-right">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shadow-sm border border-green-100"><ShieldCheck size={24} fill="currentColor" /></div>
              <h4 className="text-xl font-bold font-sans">3. Global Checkout</h4>
              <p className="text-slate-500 text-sm leading-relaxed">Monetize instantly using our secure, 1-line script for any website with zero maintenance.</p>
            </div>
        </section>

        <div className="space-y-4 flex flex-col items-center text-center -mt-2 (-8px)">
           <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <button onClick={() => setIsAuthOpen(true)} className="group bg-blue-600 text-white px-10 py-6 rounded-[2rem] font-black text-xl hover:bg-blue-700 shadow-2xl shadow-blue-300 transition-all active:scale-95 flex items-center gap-3 mx-auto uppercase tracking-tighter">
              Get Started Free <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
        </motion.div>
        </div>
      
        <footer className="py-12 text-center border-t border-slate-100 bg-white">
           <p className="text-slate-300 text-[10px] font-black tracking-[0.4em] uppercase">© 2026 PriceParity AI Design By Samuel Odeh | All rights reserved. </p>
        </footer>
      </div>
    );
  }

  // --- RENDER DASHBOARD VIEW IF LOGGED IN ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      <Toaster />
      <Auth isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLogin={handleLoginSuccess} />

      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-200/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/20 rounded-full blur-[100px]"></div>
      </div>

      <nav className="p-4 px-6 max-w-7xl mx-auto flex justify-between items-center sticky top-0 z-40 bg-white/60 backdrop-blur-md">
        <div className="flex items-center gap-2 font-black text-2xl tracking-tighter">
          <Globe className="text-blue-600" /> <span className="text-blue-600"></span>
        </div>
        <div className="flex items-center gap-4">
          {!user?.isPro && (
            <button onClick={handleUpgrade} className="text-sm font-bold text-blue-600 hover:text-blue-800 transition">Go Pro ($10)</button>
          )}
          <div className="flex items-center gap-4 bg-white/80 p-1.5 pl-4 rounded-full border border-slate-200 shadow-sm">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">{user?.username?.split(' ')[0]}</span>
            <button onClick={handleLogout} className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[10px] font-bold hover:bg-red-500 transition-colors uppercase tracking-widest">Logout</button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-5 gap-12 items-start mb-20">
          
          <motion.div className="lg:col-span-2 bg-white/70 backdrop-blur-xl border border-white p-8 rounded-[2.5rem] shadow-2xl space-y-8">
            <h2 className="text-2xl font-black text-slate-800">Strategy Builder</h2>
            <form onSubmit={handleOptimize} className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Product Title</label>
                <input required value={productName} onChange={e => setProductName(e.target.value)} className="w-full mt-2 p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Masterclass..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input required type="number" value={price} onChange={e => setPrice(e.target.value)} className="p-4 bg-slate-50 rounded-2xl outline-none" placeholder="USD Price" />
                <select value={country} onChange={e => setCountry(e.target.value)} className="p-4 bg-slate-50 rounded-2xl outline-none">
                  <option value="NG">Nigeria</option>
                  <option value="IN">India</option>
                  <option value="BR">Brazil</option>
                </select>
              </div>
              <button disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black text-sm uppercase hover:bg-blue-700 shadow-xl transition-all active:scale-95">
                {loading ? "Generating..." : "Optimize Now"}
              </button>
            </form>
          </motion.div>

          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {!result ? (
                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[3rem] p-12 text-center text-slate-300 min-h-[450px]">
                  <BarChart3 size={48} className="mb-4 opacity-10" />
                  <p className="font-bold text-slate-400 text-xl tracking-tight">Run your first AI optimization <br /> to see results here.</p>
                </div>
              ) : (
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                  <div className="flex items-center gap-2 text-blue-400 mb-8 font-black text-xs tracking-widest uppercase"><Sparkles size={16} /> Result Generated</div>
                  <h3 className="text-6xl font-black tracking-tighter mb-4 text-white">{result.localPriceFormatted || `$${result.suggestedPrice}`}</h3>
                  <p className="text-slate-400 text-sm uppercase font-black mb-10 tracking-widest leading-none underline decoration-blue-600 underline-offset-8">Fair Price for {country}</p>
                  
                  <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 relative">
                    <p className="text-blue-400 text-[10px] font-black uppercase mb-3 tracking-widest">Localized Pitch</p>
                    <div className={!user?.isPro ? "blur-2xl select-none opacity-20 pointer-events-none" : ""}>
                      <p className="italic text-xl text-slate-100 font-serif leading-relaxed">"{result.localizedPitch}"</p>
                    </div>
                    {!user?.isPro && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 rounded-[2rem]">
                        <Lock className="text-blue-500 mb-3" size={20}/>
                        <button onClick={handleUpgrade} className="bg-white text-slate-900 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">Unlock Pro Features</button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {history.length > 0 && (
          <div className="pt-20 border-t border-slate-200 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {history.slice(0, 6).map((h) => (
              <div key={h._id} className="bg-white p-7 rounded-[2rem] border border-white shadow-xl shadow-slate-100">
                <div className="flex justify-between mb-4"><h4 className="font-bold text-slate-800">{h.productName}</h4><span className="text-blue-600 font-black">${h.suggestedPrice}</span></div>
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">{h.country}</p>
                <p className="text-xs text-slate-400 italic line-clamp-2">"{h.pitch}"</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="py-16 text-center border-t border-slate-100 bg-white">
         <Globe className="text-slate-100 mx-auto mb-4 opacity-50" size={32} />
         <p className="text-slate-300 text-[10px] font-black tracking-[0.6em] uppercase">© 2026 PriceParity AI Design By Samuel Odeh. | All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;