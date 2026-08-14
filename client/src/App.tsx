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
          <a href="mailto:samuelodeh37@gmail.com" onClick={onEmailClick} className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all group w-full text-left">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:scale-110 transition"><Mail size={20}/></div>
            <div>
              <p className="text-sm font-bold text-slate-800">Email Support</p>
              <p className="text-xs text-slate-400">samuelodeh37@gmail.com</p>
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
  const [availableCountries, setAvailableCountries] = useState<{code: string, name: string}[]>([]);

  // --- 2. HANDLERS ---
  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return setIsAuthOpen(true);
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/calculate`, { productName, price: parseFloat(price), country }, { headers: { 'x-auth-token': token } });
      setResult(res.data);
      setUser((prev: any) => ({ ...prev, isPro: res.data.isPro }));
      toast.success("Strategy generated!");
      fetchHistory();
    } catch (err: any) { toast.error("Generation failed"); } finally { setLoading(false); }
  };

 const handleUpgrade = async (type: 'monthly' | 'annual') => {
  const load = toast.loading(`Connecting...`);
  try {
    const res = await axios.post(`${API_BASE}/paystack/initialize`, 
      { planType: type }, // CRUCIAL: Must send the type in the body
      { headers: { 'x-auth-token': token } }
    );
    window.location.href = res.data.authorization_url; 
  } catch (err) {
    toast.dismiss(load);
    toast.error("Payment Error");
  }
};

  const handleImplement = () => {
  if (!user?.isPro) {
    toast((t) => (
      <div className="flex flex-col gap-4 p-4 text-left max-w-[280px]">
        <div>
          <b className="text-slate-900 text-lg leading-none">Choose Your Plan</b>
          <p className="text-[11px] text-slate-400 mt-1 uppercase font-bold tracking-widest">
            Unlock AI & Widget Access
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {/* OPTION 1: MONTHLY */}
          <button 
            onClick={() => { toast.dismiss(t.id); handleUpgrade('monthly'); }}
            className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-2xl hover:border-blue-600 transition-all group"
          >
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black text-slate-400 uppercase">Monthly</span>
              <span className="text-sm font-black text-slate-800">Localized Pricing.</span>
            </div>
            <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600" />
          </button>

          {/* OPTION 2: ANNUAL */}
          <button 
            onClick={() => { toast.dismiss(t.id); handleUpgrade('annual'); }}
            className="w-full flex items-center justify-between p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all group"
          >
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black opacity-70 uppercase text-white">Annual (Best Value)</span>
              <span className="text-sm font-black text-white">Localized Pricing.</span>
            </div>
            <Zap size={16} fill="white" className="text-white" />
          </button>
        </div>

        <p className="text-[9px] text-center text-slate-400 italic">Secure payment via Paystack</p>
      </div>
    ), { 
      duration: 15000, // Keep open for 15 seconds so they can decide
      position: 'top-center' 
    });
  } else {
    // If already Pro, scroll to the widget
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
    navigator.clipboard.writeText("samuelodeh37@gmail.com");
    toast.success("Opening mailbox & email copied!", { icon: '', duration: 3000 });
    setTimeout(() => {
      window.location.href = "mailto:samuelodeh37@gmail.com";
    }, 100);
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

  // --- 3. EFFECTS (MUST ALL BE ABOVE THE RETURNS) ---
  useEffect(() => {
    const fetchCountries = async () => {
        try {
            const res = await axios.get(`${API_BASE}/countries`);
            setAvailableCountries(res.data);
        } catch (err) { console.error("Error loading countries"); }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const ref = query.get('reference');
    if (query.get('paystack_success') && ref) {
      const verify = async () => {
        const load = toast.loading("Verifying your account...");
        try {
          const res = await axios.get(`${API_BASE}/paystack/verify?reference=${ref}`);
          if (res.data.isPro) {
            toast.dismiss(load);
            toast.success("Subscription Active! Welcome Pro.");
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

 useEffect(() => {
    if (!token) {
      const urlParams = new URLSearchParams(window.location.search);
      const testCountry = urlParams.get('test_country') || '';
      
      const script = document.createElement("script");
      // Notice: No ?price=12 needed anymore!
      script.src = `${API_BASE}/widget${testCountry ? '?test_country=' + testCountry : ''}`; 
      script.async = true;
      document.body.appendChild(script);
      
      return () => {
        if (document.body.contains(script)) document.body.removeChild(script);
      };
    }
  }, [token]);

  // --- 4. CONDITIONAL RENDERING ---

  if (token && authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- VIEW: LANDING PAGE ---
  if (!token) {
    return (
      <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 overflow-x-hidden flex flex-col">
        <Toaster />
        <ChatWidget user={user} />
        <Auth isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLogin={handleLoginSuccess} />
        <SupportModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} onEmailClick={handleEmailClick} />
        
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-[-5%] left-[-10%] w-[50%] h-[40%] bg-blue-50/50 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-50/40 rounded-full blur-[100px]"></div>
        </div>

        <nav className="py-4 px-6 max-w-7xl mx-auto w-full flex justify-between items-center sticky top-0 z-40 bg-white/60 backdrop-blur-md">
          <div className="flex items-center gap-2 font-black text-2xl tracking-tighter uppercase italic">
            <Globe className="text-blue-600" /> PRICE<span className="text-blue-600">PARITY</span>
          </div>
          <button onClick={() => setIsAuthOpen(true)} className="bg-slate-900 text-white px-6 py-2 rounded-full text-sm font-bold shadow-xl active:scale-95 transition-all uppercase tracking-tighter">Sign In</button>
        </nav>

        <section className="max-w-6xl mx-auto px-6 pt-10 pb-16 text-center">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <div data-pp-price="12" className="mb-6 min-h-[40px] flex justify-center items-center"></div>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase mb-8">
               <Sparkles size={12} fill="currentColor" /> The Future of Global Sales
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-slate-900 mb-8 leading-[0.9] tracking-tight text-center">One price does not <br /> <span className="text-blue-600">fit the world.</span></h1>
            <p className="text-slate-500 text-xl md:text-2xl mb-12 max-w-2xl mx-auto leading-relaxed">We use AI to help digital creators optimize pricing for local economies in 20+ countries.</p>
            <button onClick={() => setIsAuthOpen(true)} className="group bg-blue-600 text-white px-10 py-6 rounded-[2rem] font-black text-xl hover:bg-blue-700 shadow-2xl shadow-blue-300 transition-all active:scale-95 flex items-center gap-3 mx-auto">Get Started Free <ArrowRight className="group-hover:translate-x-1 transition-transform" /></button>
            <p className="mt-10 text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Trusted by Digital Creators Worldwide</p>
          </motion.div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-12 md:gap-20 border-t border-slate-100">
            <div className="space-y-4 flex flex-col items-center text-center md:items-start md:text-left">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm"><Zap size={24} /></div>
              <h4 className="text-2xl font-black tracking-tight text-slate-800">1. PPP Intelligence</h4>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">Automatically calculate fair prices based on local purchasing power.</p>
            </div>
            <div className="space-y-4 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center border border-purple-100 shadow-sm"><Sparkles size={24} /></div>
              <h4 className="text-2xl font-black tracking-tight text-slate-800">2. Cultural AI</h4>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">AI rewrites your pitch to match cultural success triggers.</p>
            </div>
            <div className="space-y-4 flex flex-col items-center text-center md:items-end md:text-right">
              <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center border border-green-100 shadow-sm"><ShieldCheck size={24} /></div>
              <h4 className="text-2xl font-black tracking-tight text-slate-800">3. Global Checkout</h4>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">Monetize instantly using our secure, 1-line script for any website.</p>
            </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 pt-10 pb-16 text-center">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <div id="price-parity-display" className="mb-6 min-h-[40px] flex justify-center"></div>
              <button onClick={() => setIsAuthOpen(true)} className="group bg-blue-600 text-white px-10 py-6 rounded-[2rem] font-black text-xl hover:bg-blue-700 shadow-2xl shadow-blue-300 transition-all active:scale-95 flex items-center gap-3 mx-auto">Get Started Free <ArrowRight className="group-hover:translate-x-1 transition-transform" /></button>
            </motion.div>
        </section>

        <footer className="py-12 mt-auto text-center border-t border-slate-100 bg-white">
          <div className="flex justify-center gap-8 mb-6">
            <button onClick={() => setIsHelpOpen(true)} className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-600 transition-all uppercase tracking-widest"><LifeBuoy size={16} /> Help</button>
            <a href="mailto:samuelodeh37@gmail.com" onClick={handleEmailClick} className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-600 transition-all uppercase tracking-widest"><Mail size={16} /> Contact</a>
          </div>
          <SupportModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} onEmailClick={handleEmailClick} />
          <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.6em]">© 2026 PriceParity AI | Built By Samuel Odeh | <a href="https://www.richtec.com.ng" className="underline hover:text-blue-600">RichTec</a></p>
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
      <SupportModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} onEmailClick={handleEmailClick}/>

      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100/20 rounded-full blur-[100px]"></div>
      </div>
      
      <nav className="py-4 px-6 max-w-7xl mx-auto flex justify-between items-center sticky top-0 z-40 bg-white/60 backdrop-blur-md">
        <div className="flex items-center gap-2 font-black text-2xl tracking-tighter uppercase italic">
          <Globe className="text-blue-600" /> <span className="text-blue-600"></span>
        </div>
        <div className="flex items-center gap-4">
          {!user?.isPro && (
            <button onClick={() => handleImplement()} className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline transition-all">Upgrade Pro</button>
          )}

          {user?.isPro && user?.proExpiry && (
            <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest mt-2">
              Pro Membership Active until: {new Date(user.proExpiry).toLocaleDateString()}
            </p>
          )}
          <div className="flex items-center gap-4 bg-white/80 p-1.5 pl-4 rounded-full border border-slate-200 shadow-sm">
             <span className="text-[10px] font-black uppercase text-slate-500">{user?.username?.split(' ')[0]}</span>
             <button onClick={handleLogout} className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[10px] font-bold hover:bg-red-500 transition-all uppercase tracking-widest">Logout</button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-5 gap-12 items-start mb-24">
          <motion.div className="lg:col-span-2 bg-white/70 backdrop-blur-xl border border-white p-8 rounded-[2.5rem] shadow-2xl space-y-8">
            <h2 className="text-2xl font-black text-slate-800">Strategy Builder</h2>
            <form onSubmit={handleOptimize} className="space-y-6">
              <input required value={productName} onChange={e => setProductName(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Product Title..." />
              <div className="grid grid-cols-2 gap-4">
                <input required type="number" value={price} onChange={e => setPrice(e.target.value)} className="p-4 bg-slate-50 rounded-2xl outline-none" placeholder="USD Price" />
                <select value={country} onChange={e => setCountry(e.target.value)} className="p-4 bg-slate-50 rounded-2xl outline-none">
                  {availableCountries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
              <button disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl transition-all">Generate Strategy</button>
            </form>
          </motion.div>

          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {!result ? (
                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[3rem] p-12 text-center text-slate-300 min-h-[450px]"><BarChart3 size={48} className="opacity-10 mb-4"/><p className="font-bold">Launch your strategy.</p></div>
              ) : (
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                  <div className="flex items-center gap-2 text-blue-400 mb-8 font-black text-xs uppercase tracking-widest"><Sparkles size={16} /> Result Generated</div>
                  <h3 className="text-6xl font-black mb-4 tracking-tighter leading-none">{result.localPriceFormatted || `$${result.suggestedPrice}`}</h3>
                  <p className="text-slate-400 uppercase font-black mb-10 text-xs tracking-[0.2em] underline decoration-blue-600 decoration-4 underline-offset-8">Fair Price for {result.countryName || country}</p>
                  
                  <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 relative mb-6">
                    <p className="text-blue-400 text-[10px] font-black uppercase mb-3 tracking-widest flex items-center gap-2"><Sparkles size={12}/> AI Strategy Pitch</p>
                    <div className={!user?.isPro ? "blur-2xl select-none opacity-20 pointer-events-none" : ""}><p className="italic text-xl font-serif leading-relaxed text-slate-100 font-medium">"{result.localizedPitch}"</p></div>
                    {!user?.isPro && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 rounded-[2rem] p-6 text-center">
                        <Lock className="text-blue-500 mb-3" size={20}/>
                        <button onClick={() => handleUpgrade('monthly')} className="bg-white text-slate-900 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">Subscribe to Unlock AI & Widget</button>
                      </div>
                    )}
                  </div>
                  <button onClick={handleImplement} className="w-full bg-white text-slate-900 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-lg hover:bg-slate-100 active:scale-95 transition-all">Get Code Widget</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* PRO PLUS WIDGET SECTION */}
        {result && user?.isPro && (
          <div id="widget-section" className="mb-24 p-8 md:p-12 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-2xl animate-in zoom-in">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
              Pro Plus Feature Unlocked
            </div>
            <h4 className="text-2xl font-black text-slate-800 mb-2 uppercase italic underline decoration-blue-600 underline-offset-8">Universal Implementation</h4>
            <p className="text-slate-500 mb-8 max-w-lg font-medium text-sm">Follow these two steps to automate your global pricing.</p>
            
            <div className="bg-slate-900 p-6 rounded-3xl font-mono text-[10px] text-blue-300 overflow-x-auto shadow-inner mb-6 leading-relaxed">
                {/* Step 1: Markup */}
                {`<!-- Step 1: Add this attribute to your price element -->\n`}
                <span className="text-blue-500">{`<span data-pp-price="${price}"></span>`}</span>
                
                {/* Step 2: The Universal Script */}
                {`\n\n<!-- Step 2: Paste this script once at the bottom of your page -->\n`}
                <span className="text-blue-500">{`<script src="https://priceparity-api-live.onrender.com/api/widget"></script>`}</span>
            </div>

            <button 
              onClick={() => { 
                const universalCode = `<span data-pp-price="${price}"></span>\n<script src="https://priceparity-api-live.onrender.com/api/widget"></script>`;
                navigator.clipboard.writeText(universalCode); 
                toast.success("Universal Pro Plus code copied!"); 
              }}
              className="mt-6 text-xs font-black text-blue-600 uppercase tracking-widest hover:underline transition-all"
            >
              Copy Multi-Product Code
            </button>
          </div>
        )}

        {history.length > 0 && (
          <div className="pt-20 border-t border-slate-100">
             <h3 className="text-2xl font-black text-slate-800 mb-10 tracking-tight">Audit Archive</h3>
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {history.slice(0, 6).map((h) => (
                <div key={h._id} className="bg-white p-7 rounded-[2rem] border border-white shadow-xl transition-all hover:-translate-y-1 shadow-slate-100">
                  <div className="flex justify-between mb-4 items-start">
                    <h4 className="font-bold text-slate-800 line-clamp-1">{h.productName}</h4>
                    <span className="text-blue-600 font-black tracking-tighter">${h.suggestedPrice}</span>
                  </div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-2">{h.country}</p>
                  <p className="text-xs text-slate-400 italic line-clamp-2 leading-relaxed">"{h.pitch}"</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="py-12 text-center border-t border-slate-200 bg-white">
        <div className="flex justify-center gap-8 mb-6">
           <button onClick={() => setIsHelpOpen(true)} className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-blue-600 transition-all uppercase tracking-widest"><LifeBuoy size={16} /> Support Center</button>
           <a href="mailto:samuelodeh37@gmail.com" onClick={handleEmailClick} className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-blue-600 transition-all uppercase tracking-widest"><Mail size={16} /> Contact Founder</a>
        </div>
        <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.6em]">© 2026 PriceParity AI | Built By Samuel Odeh | <a href="https://www.richtec.com.ng" className="underline hover:text-blue-600">RichTec</a></p>
      </footer>
    </div>
  );
}

export default App;