import { useEffect, useState } from "react";
import axios from 'axios';
import { Globe, Sparkles, ArrowRight, Zap, BarChart3, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import type { PricingResult } from "./types";
import { Auth } from "./components/Auth";

// --- CONSTANTS ---
const IDLE_TIMEOUT = 15 * 60 * 1000; 
const API_BASE = "https://priceparity-api-live.onrender.com/api";

function App() {
  // --- 1. STATES ---
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

  // --- 2. LOGIC HANDLERS ---
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
      toast.success("Global strategy ready!");
      fetchHistory();
    } catch (err: any) {
      toast.error("Generation failed");
    } finally { setLoading(false); }
  };

  const handleUpgrade = async () => {
    const loadingToast = toast.loading("Connecting to secure gateway...");
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

  // --- 3. EFFECTS ---
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const reference = query.get('reference');
    if (query.get('paystack_success') && reference) {
      const verify = async () => {
        const load = toast.loading("Verifying payment...");
        try {
          const res = await axios.get(`${API_BASE}/paystack/verify?reference=${reference}`);
          if (res.data.isPro) {
            toast.dismiss(load);
            toast.success("Account Upgraded! 🚀");
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden selection:bg-blue-100">
      <Toaster />
      <Auth isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLogin={handleLoginSuccess} />

      {/* --- PREMIUM BACKGROUND MESH --- */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-200/40 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/30 rounded-full blur-[100px]"></div>
      </div>

      {/* --- NAVIGATION --- */}
      <nav className="p-6 max-w-7xl mx-auto flex justify-between items-center sticky top-0 z-40 bg-white/60 backdrop-blur-md border-b border-white/20">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-2 font-black text-2xl tracking-tighter">
          <Globe className="text-blue-600" /> PRICE<span className="text-blue-600">PARITY</span>
        </motion.div>
        
        <div className="flex items-center gap-6">
          {token ? (
            <div className="flex items-center gap-4 bg-white/80 p-1.5 pl-4 rounded-full border border-slate-200 shadow-sm">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">{user?.username?.split(' ')[0]}</span>
              <button onClick={handleLogout} className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[10px] font-bold hover:bg-red-500 transition-colors uppercase">Logout</button>
            </div>
          ) : (
            <button onClick={() => setIsAuthOpen(true)} className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-xl active:scale-95 transition-all">Sign In</button>
          )}
        </div>
      </nav>

      {/* --- CONTENT GATEKEEPER --- */}
      {!token ? (
        <section className="max-w-6xl mx-auto px-6 py-32 text-center">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase mb-8">
              <Sparkles size={12} fill="currentColor" /> The Future of Global Sales
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-slate-900 mb-8 leading-[0.9] tracking-tight">
              One price does not <br /> <span className="text-blue-600 text-glow">fit the world.</span>
            </h1>
            <p className="text-slate-500 text-xl md:text-2xl mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
              We use AI to help digital creators optimize pricing for local economies in 20+ countries.
            </p>
            <button onClick={() => setIsAuthOpen(true)} className="group bg-blue-600 text-white px-10 py-6 rounded-[2rem] font-black text-xl hover:bg-blue-700 shadow-2xl shadow-blue-300 transition-all active:scale-95 flex items-center gap-3 mx-auto">
              Get Free Access <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </section>
      ) : (
        <main className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-5 gap-12 items-start">
            
            {/* CALCULATOR FORM */}
            <motion.div layout className="lg:col-span-2 bg-white/70 backdrop-blur-xl border border-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 space-y-8">
              <div>
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Zap size={20} className="text-blue-600"/> Optimize</h2>
                <p className="text-slate-400 text-xs mt-1 font-medium italic">Adjust price for global buying power.</p>
              </div>

              <form onSubmit={handleOptimize} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Product Title</label>
                  <input required value={productName} onChange={e => setProductName(e.target.value)} className="w-full mt-2 p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Masterclass..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">USA Price ($)</label>
                    <input required type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full mt-2 p-4 bg-slate-50 border-none rounded-2xl outline-none" placeholder="100" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Market</label>
                    <select value={country} onChange={e => setCountry(e.target.value)} className="w-full mt-2 p-4 bg-slate-50 border-none rounded-2xl outline-none cursor-pointer">
                      <option value="NG">Nigeria (NG)</option>
                      <option value="IN">India (IN)</option>
                      <option value="BR">Brazil (BR)</option>
                    </select>
                  </div>
                </div>
                <button disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-[1.8rem] font-black text-sm uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 disabled:bg-slate-300">
                  {loading ? "Calculating..." : "Generate AI Strategy"}
                </button>
              </form>
            </motion.div>

            {/* DYNAMIC RESULT */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                {!result ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[3rem] p-12 text-center text-slate-300 min-h-[450px]">
                    <BarChart3 size={48} className="mb-4 opacity-10" />
                    <p className="font-bold text-slate-400">Launch a new strategy to <br /> view localized analytics.</p>
                  </motion.div>
                ) : (
                  <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden ring-1 ring-white/10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full"></div>
                    <div className="flex items-center gap-2 text-blue-400 mb-8 font-black text-xs tracking-[0.2em] uppercase"><Sparkles size={16} /> Strategy Generated</div>
                    <div className="mb-10">
                      <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-1">Local Price for {country}</p>
                      <h3 className="text-6xl font-black tracking-tighter text-white">{result.localPriceFormatted || `$${result.suggestedPrice}`}</h3>
                      <div className="mt-4 inline-flex items-center gap-2 bg-green-500/20 text-green-400 text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest">{result.discountPercentage}% fair-market discount</div>
                    </div>

                    <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 mb-8 relative group">
                      <p className="text-blue-400 text-[10px] font-black uppercase mb-3 tracking-widest flex items-center gap-2">Cultural AI Pitch</p>
                      <div className={!user?.isPro ? "blur-xl select-none pointer-events-none opacity-20 transition-all duration-1000" : ""}>
                        <p className="italic text-xl text-slate-100 font-serif leading-relaxed">"{result.localizedPitch}"</p>
                      </div>
                      {!user?.isPro && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 rounded-[2rem]">
                          <Lock className="text-blue-500 mb-3" size={20}/>
                          <button onClick={handleUpgrade} className="bg-white text-slate-900 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">Unlock AI & Widget with Pro</button>
                        </div>
                      )}
                    </div>
                    <button className="w-full bg-white text-slate-900 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-lg hover:bg-slate-100 active:scale-95 transition-all">Copy Result</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* PERSISTENT HISTORY */}
          {history.length > 0 && (
            <div className="mt-32">
              <h3 className="text-2xl font-black text-slate-800 mb-10 flex items-center gap-3">History</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
                {history.slice(0, 6).map((item) => (
                  <motion.div whileHover={{ y: -10 }} key={item._id} className="bg-white p-7 rounded-[2.2rem] border border-white shadow-xl shadow-slate-200/50 group cursor-default transition-all duration-500">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{item.productName}</h4>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">{item.country}</p>
                      </div>
                      <span className="bg-blue-50 text-blue-600 text-xs font-black px-4 py-1.5 rounded-full tracking-tighter">${item.suggestedPrice}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed italic line-clamp-2">"{item.pitch}"</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </main>
      )}

      {/* FOOTER */}
      <footer className="py-20 text-center border-t border-slate-200 bg-white mt-20">
         <Globe className="text-slate-200 mx-auto mb-4" size={40} />
         <p className="text-slate-400 text-xs font-bold tracking-[0.4em] uppercase ml-1">© 2026 PriceParity AI by Samuel Odeh. | Revenue Engineering | All rights reserved </p>
      </footer>
    </div>
  );
}

export default App;