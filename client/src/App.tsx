import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BarChart3, Globe, Lock, ShieldCheck, Sparkles, Zap, LifeBuoy, Mail, MessageSquare } from 'lucide-react';
import { useEffect, useState } from "react";
import toast, { Toaster } from 'react-hot-toast';
import { Auth } from "./components/Auth";
import type { PricingResult } from "./types";

// --- GLOBAL CONSTANTS ---
const IDLE_TIMEOUT = 3 * 60 * 1000; // 15 Minutes
const API_BASE = "https://priceparity-api-live.onrender.com/api";

const SupportModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 font-bold transition-colors">✕</button>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LifeBuoy size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Customer Support</h2>
          <p className="text-slate-500 mt-2 text-sm">Need help with your subscription or the pricing engine? We are here for you.</p>
        </div>

        <div className="space-y-4">
          <a href="mailto:samuelodeh37@gmail.com" className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all group">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:scale-110 transition"><Mail size={20}/></div>
            <div>
              <p className="text-sm font-bold text-slate-800">Email Support</p>
              <p className="text-xs text-slate-400">Response within 24 hours</p>
            </div>
          </a>

          <div className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl cursor-not-allowed opacity-60 bg-slate-50">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><MessageSquare size={20}/></div>
            <div>
              <p className="text-sm font-bold text-slate-800">Live Chat</p>
              <p className="text-xs text-slate-400">Coming soon for Pro members</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const [isHelpOpen, setIsHelpOpen] = useState(false);

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

  const handleImplement = () => {
    if (!user?.isPro) {
      toast((t) => (
        <span className="flex flex-col gap-2 p-2">
          <b>Pro Features!</b>
          Unlock AI tools and website widgets to scale globally.
          <button
            onClick={() => { toast.dismiss(t.id); handleUpgrade(); }}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold transition hover:bg-blue-700">
              Upgrade Now
          </button>
        </span>
      ), { duration: 6000 });
    } else {
      document.getElementById('widget-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // --- 3. EFFECTS ---
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

  // --- 4. RENDER LANDING PAGE ---
  if (!token) {
    return (
      <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 overflow-x-hidden">
        <Toaster />
        <Auth isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLogin={handleLoginSuccess} />
        
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-[-5%] left-[-10%] w-[50%] h-[40%] bg-blue-50/50 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-50/40 rounded-full blur-[100px]"></div>
        </div>

        <nav className="py-4 px-6 max-w-7xl mx-auto flex justify-between items-center sticky top-0 z-40 bg-white/60 backdrop-blur-md">
          <div className="flex items-center gap-2 font-black text-2xl tracking-tighter uppercase italic text-slate-900">
            <Globe className="text-blue-600" /> PRICE<span className="text-blue-600">PARITY</span>
          </div>
          <button onClick={() => setIsAuthOpen(true)} className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-xl active:scale-95 transition-all uppercase tracking-tighter">
            Sign In
          </button>
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
              <button onClick={() => setIsHelpOpen(true)} className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">
                <LifeBuoy size={18} /> Support
              </button>
              {/* <a href="mailto:samuelodeh37@gmail.com" className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">
                <Mail size={18} /> Contact
              </a> */}
              <a href="mailto:samuelodeh37@gmail.com" className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all group"> Contact</a>
            </div>
            <SupportModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
          </div>
          <p className="text-slate-300 text-[10px] font-black tracking-[0.4em] lowercase"> © 2026 PriceParity AI | Built By Samuel Odeh | All rights reserved. | <a href="https://www.richtec.com.ng" className="underline hover:text-blue-600 transition-colors">richtec.com.ng</a> </p>
        </footer>
      </div>
    );
  }

  // --- RENDER DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      <Toaster />
      <Auth isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLogin={handleLoginSuccess} />
      <SupportModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-200/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/20 rounded-full blur-[100px]"></div>
      </div>

      <nav className="p-4 px-6 max-w-7xl mx-auto flex justify-between items-center sticky top-0 z-40 bg-white/60 backdrop-blur-md">
        <div className="flex items-center gap-2 font-black text-2xl tracking-tighter italic">
          <Globe className="text-blue-600" /><span className="text-blue-600"></span>
        </div>
        <div className="flex items-center gap-4">
          {!user?.isPro && (
            <button onClick={handleUpgrade} className="text-sm font-bold text-blue-600 hover:text-blue-800 transition">Upgrade to Pro ($10/mo)</button>
          )}
          <div className="flex items-center gap-4 bg-white/80 p-1.5 pl-4 rounded-full border border-slate-200 shadow-sm">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">{user?.username?.split(' ')[0] || 'Member'}</span>
            <button onClick={handleLogout} className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[10px] font-bold hover:bg-red-500 transition-colors uppercase tracking-widest">Logout</button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-5 gap-12 items-start mb-20">
          <motion.div className="lg:col-span-2 bg-white/70 backdrop-blur-xl border border-white p-8 rounded-[2.5rem] shadow-2xl space-y-8">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Zap size={20} className="text-blue-600"/> Optimize</h2>
            <form onSubmit={handleOptimize} className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Product Title</label>
                <input required value={productName} onChange={e => setProductName(e.target.value)} className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Masterclass..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input required type="number" value={price} onChange={e => setPrice(e.target.value)} className="p-4 bg-slate-50 rounded-2xl outline-none" placeholder="USD Price" />
                <select value={country} onChange={e => setCountry(e.target.value)} className="p-4 bg-slate-50 rounded-2xl outline-none cursor-pointer">
                  <option value="NG">Nigeria</option>
                  <option value="IN">India</option>
                  <option value="BR">Brazil</option>
                  <option value="GB">United Kingdom</option>
                </select>
              </div>
              <button disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black text-sm uppercase hover:bg-blue-700 shadow-xl transition-all">
                {loading ? "Calculating..." : "Optimize Now"}
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
                  <div className="flex items-center gap-2 text-blue-400 mb-8 font-black text-xs tracking-widest uppercase"><Sparkles size={16} /> Strategy Generated</div>
                  <h3 className="text-6xl font-black tracking-tighter mb-4 text-white leading-none">{result.localPriceFormatted || `$${result.suggestedPrice}`}</h3>
                  <p className="text-slate-400 text-sm uppercase font-black mb-10 tracking-widest underline decoration-blue-600 underline-offset-8">Fair Price for {country}</p>
                  
                  <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 relative">
                    <p className="text-blue-400 text-[10px] font-black uppercase mb-3 tracking-widest flex items-center gap-2">Localized Pitch</p>
                    <div className={!user?.isPro ? "blur-2xl select-none opacity-20 pointer-events-none" : ""}>
                      <p className="italic text-xl text-slate-100 font-serif leading-relaxed">"{result.localizedPitch}"</p>
                    </div>
                    {!user?.isPro && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 rounded-[2rem]">
                        <Lock className="text-blue-500 mb-3" size={20}/>
                        <button onClick={handleUpgrade} className="bg-white text-slate-900 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">Subscribe for $10/mo</button>
                      </div>
                    )}
                  </div>
                  <button onClick={handleImplement} className="w-full bg-white text-slate-900 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-lg hover:bg-slate-100 transition-all active:scale-95 mt-4">Implement Strategy</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* WIDGET SECTION */}
        {result && user?.isPro && (
          <div id="widget-section" className="mb-24 p-10 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-2xl animate-in zoom-in">
             <h4 className="text-2xl font-black text-slate-800 mb-2 uppercase italic underline decoration-blue-600 underline-offset-8">Website Widget</h4>
             <p className="text-slate-500 mb-8 max-w-lg">Paste this code into your site to automate local pricing.</p>
             <div className="bg-slate-900 p-6 rounded-3xl font-mono text-[10px] text-blue-300 overflow-x-auto shadow-inner leading-relaxed">
                {`<div id="price-parity-display"></div>\n<script src="${API_BASE}/widget?price=${price}"></script>`}
             </div>
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
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="flex items-center gap-6">
              <button onClick={() => setIsHelpOpen(true)} className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">
                <LifeBuoy size={18} /> Support
              </button>
              <a href="mailto:samuelodeh37@gmail.com" className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">
                <Mail size={18} /> Contact
              </a>
            </div>
            <SupportModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
          </div>
          <p className="text-slate-300 text-[10px] font-black tracking-[0.4em] lowercase"> © 2026 PriceParity AI | Built By Samuel Odeh | All rights reserved. | <a href="https://www.richtec.com.ng" className="underline hover:text-blue-600 transition-colors">richtec.com.ng</a> </p>
        </footer>
    </div>
  );
}

export default App;