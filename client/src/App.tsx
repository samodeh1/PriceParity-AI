import { useEffect, useState } from "react";
import axios from 'axios';
import { Globe, Sparkles, ArrowRight, Zap, BarChart3, CheckCircle2, Trash2, LogOut } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import type { PricingResult } from "./types";
import { Auth } from "./components/Auth";

// --- CONSTANTS ---
const IDLE_TIMEOUT = 3 * 60 * 1000; 
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
        productName,
        price: parseFloat(price),
        country
      }, {
        headers: { 'x-auth-token': token }
      });

      setResult(res.data);
      // Sync the Pro status from the calculation result immediately
      setUser((prev: any) => ({ ...prev, isPro: res.data.isPro }));
      toast.success("Strategy generated!");
      fetchHistory();
    } catch (err: any) {
      toast.error("Failed to generate strategy");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!token) return setIsAuthOpen(true);
    const loadingToast = toast.loading("Preparing secure checkout...");
    try {
      const res = await axios.post(`${API_BASE}/paystack/initialize`, {}, {
        headers: { 'x-auth-token': token }
      });
      window.location.href = res.data.authorization_url;
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Payment system unavailable");
    }
  };

  const fetchHistory = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/strategies`, {
        headers: { 'x-auth-token': token }
      });
      setHistory(res.data);
    } catch (err) {
      console.error("Could not fetch history");
    }
  };

  const syncProfile = async (currentToken: string) => {
    try {
      const res = await axios.get(`${API_BASE}/auth/me`, {
        headers: { 'x-auth-token': currentToken }
      });
      if (res.data) {
        setUser(res.data);
        console.log("Status Synced: isPro =", res.data.isPro);
      }
    } catch (err: any) {
      console.error("Sync failed:", err.response?.status);
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setAuthLoading(false);
    }
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
          <b className="text-slate-800">Pro Feature!</b>
          <p className="text-xs text-slate-500">Unlock the AI Pitch and website widget to start selling globally.</p>
          <button
            onClick={() => { toast.dismiss(t.id); handleUpgrade(); }}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg shadow-blue-100 transition hover:bg-blue-700">
              Upgrade to Pro ($19)
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
        const load = toast.loading("Confirming payment...");
        try {
          const res = await axios.get(`${API_BASE}/paystack/verify?reference=${reference}`);
          if (res.data.isPro) {
            toast.dismiss(load);
            toast.success("Welcome to Pro! 🚀");
            if (token) syncProfile(token);
          }
        } catch (err) {
          toast.dismiss(load);
          toast.error("Verification failed.");
        }
      };
      verify();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      syncProfile(token);
      fetchHistory();
    } else {
      setAuthLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let timer: number;
    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = window.setTimeout(() => {
        toast("Session expired.", { icon: '⏰' });
        handleLogout();
      }, IDLE_TIMEOUT);
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // --- 4. RENDER LOGIC ---

  if (!token) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center p-6">
        <Toaster />
        <Auth isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLogin={handleLoginSuccess} />
        
        <div className="max-w-3xl">
          <div className="flex justify-center items-center gap-2 font-black text-2xl tracking-tighter mb-8 text-slate-900">
            <Globe className="text-blue-600" size={32}/>
            PRICE<span className="text-blue-600">PARITY</span>
          </div>

          <h1 className="text-6xl font-black text-slate-900 mb-6 leading-tight tracking-tight">
            The world is bigger than <span className="text-blue-600">just your country.</span>
          </h1>
          <p className="text-slate-500 text-xl mb-12 px-10 leading-relaxed">
            Stop losing 80% of your global sales. Use AI to price your products fairly for every economy on Earth.
          </p>

          <button 
            onClick={() => setIsAuthOpen(true)}
            className="bg-blue-600 text-white px-10 py-5 rounded-3xl font-bold text-xl hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all active:scale-95 flex items-center gap-3 mx-auto">
            Get Started for Free <ArrowRight/>
          </button>

          <p className="mt-12 text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Trusted by Digital Creators Worldwide</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans">
      <Toaster />
      <Auth isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLogin={handleLoginSuccess} />

      {/* DASHBOARD NAVBAR */}
      <nav className="p-6 max-w-6xl mx-auto flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2 font-black text-xl tracking-tighter">
          <Globe className="text-blue-600" />
          PRICE<span className="text-blue-600">PARITY</span>
        </div>
        <div className="flex items-center gap-6">
          {!user?.isPro && (
            <button onClick={handleUpgrade} className="text-sm font-bold text-blue-600 hover:text-blue-800 transition">Upgrade to Pro ($19)</button>
          )}
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
            <span className="text-sm font-bold text-slate-600 uppercase tracking-tighter">Hi, {user?.username?.split(' ')[0] || 'Member'}</span>
            <button onClick={handleLogout} className="text-xs text-red-500 font-bold border-l pl-3 ml-1 border-slate-100 hover:text-red-700">Logout</button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-12 items-start mb-24">
          
          {/* CALCULATOR FORM */}
          <form onSubmit={handleOptimize} className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
            <h2 className="text-2xl font-black text-slate-800">New Strategy</h2>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Product Name</label>
              <input required value={productName} onChange={e => setProductName(e.target.value)} className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="e.g. Masterclass Course" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">USA Price ($)</label>
                <input required type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="100"/>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Market</label>
                <select value={country} onChange={e => setCountry(e.target.value)} className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl outline-none cursor-pointer focus:ring-2 focus:ring-blue-500">
                    <option value="NG">Nigeria (NG)</option>
                    <option value="IN">India (IN)</option>
                    <option value="BR">Brazil (BR)</option>
                    <option value="GB">United Kingdom (GB)</option>
                </select>
              </div>
            </div>

            <button disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-bold text-lg hover:bg-blue-700 transition active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-blue-100 disabled:bg-slate-300">
              {loading ? "Analyzing..." : "Optimize Global Price"} <ArrowRight size={20}/>
            </button>
          </form>

          {/* DYNAMIC RESULT AREA */}
          <div className="space-y-6">
            {!result ? (
              <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 text-center text-slate-300">
                <BarChart3 size={48} className="mb-4 opacity-10"/>
                <p className="font-bold text-slate-400">Generate a strategy to <br/> view localized results.</p>
              </div>
            ) : (
              <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl animate-in fade-in slide-in-from-right-4 relative overflow-hidden">
                <div className="flex items-center gap-2 text-blue-400 mb-6 font-bold text-sm tracking-widest uppercase">
                  <Zap size={16} fill="currentColor"/> Strategy Complete
                </div>

                <div className="mb-10">
                  <p className="text-slate-400 text-xs uppercase font-black tracking-widest mb-1">Local Price for {country}</p>
                  <h3 className="text-5xl font-black tracking-tighter">{result.localPriceFormatted || `$${result.suggestedPrice}`}</h3>
                  <span className="inline-block mt-3 bg-green-500/20 text-green-400 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest leading-none">
                    {result.discountPercentage}% fair-market discount
                  </span>
                </div>

                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 mb-8 relative">
                  <p className="text-blue-400 text-[10px] font-black uppercase mb-3 tracking-widest flex items-center gap-2"><Sparkles size={12}/> AI Marketing Pitch</p>
                  
                  {/* DYNAMIC BLUR LOGIC */}
                  <div className={!user?.isPro ? "blur-lg select-none pointer-events-none opacity-50" : ""}>
                    <p className="italic text-lg leading-relaxed text-slate-100 font-medium">
                      "{result.localizedPitch}"
                    </p>
                  </div>

                  {!user?.isPro && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 rounded-3xl">
                      <button
                        onClick={handleUpgrade}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                          Unlock with Pro
                      </button>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleImplement}
                  className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-white/5">
                  <CheckCircle2 size={18}/> Implement strategy
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PRO FEATURE: WIDGET SECTION */}
        {result && user?.isPro && (
          <div id="widget-section" className="mb-24 p-8 md:p-12 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 animate-in slide-in-from-bottom-8 duration-700 shadow-2xl shadow-slate-100/50">
            <h4 className="text-2xl font-black text-slate-800 mb-2">Automated Revenue Widget</h4>
            <p className="text-slate-500 mb-8 max-w-lg">Copy and paste this script into your landing page. We will automatically detect visitor locations and display your optimized fair-market price.</p>
            <div className="bg-slate-900 p-6 rounded-3xl font-mono text-[10px] md:text-xs text-blue-300 overflow-x-auto shadow-inner leading-relaxed">
              {`<div id="price-parity-display"></div>\n<script src="${API_BASE}/widget?price=${price}"></script>`}
            </div>
          </div>
        )}

        {/* PERSISTENT HISTORY SECTION */}
        {history.length > 0 && (
          <div className="pt-24 border-t border-slate-100">
            <div className="flex items-center justify-between mb-12">
               <h3 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3"><Globe className="text-blue-600" /> Recent Optimizations</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {history.slice(0, 6).map((item) => (
                <div key={item._id} className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <h4 className="font-bold text-slate-800 line-clamp-1">{item.productName}</h4>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">{item.country}</p>
                    </div>
                    <span className="bg-blue-50 text-blue-600 text-xs font-black px-3 py-1 rounded-full">${item.suggestedPrice}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed italic line-clamp-2">"{item.pitch}"</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-50 py-16 text-center">
         <p className="text-slate-300 text-xs font-bold tracking-[0.3em] uppercase">FinanceFlow Global Revenue Optimization</p>
      </footer>
    </div>
  );
}

export default App;