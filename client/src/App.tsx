import { useEffect, useState } from "react";
import axios from 'axios';
import { Globe, Sparkles, ArrowRight, Zap, ShieldCheck, BarChart3 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import type { PricingResult } from "./types";
import { Auth } from "./components/Auth";

// --- CONSTANTS ---
const IDLE_TIMEOUT = 3 * 60 * 1000; // 3 Minutes
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

      // 1. Update the result
      setResult(res.data);

      // 2. FORCE update the user state with the truth from the server
      // This removes the blur instantly if the server says the user is Pro
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
    setUser(res.data);
  } catch (err) {
    handleLogout();
  } finally {
    setAuthLoading(false); // Stop loading regardless of result
  }
};

  const handleLogout = () => {
    localStorage.removeItem('parity_token');
    setToken(null);
    setUser(null);
    setHistory([]);
    setResult(null); // Clear the previous result on logout
    window.location.href = "/";
  };

  const handleLoginSuccess = (newToken: string, userData: any) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('parity_token', newToken);
    setIsAuthOpen(false);
  };

  // --- 3. EFFECTS ---

  // Payment Verification Effect
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
            toast.success("Upgrade Successful! Welcome to Pro. 🚀");
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

  // Auth & Data Sync Effect
  useEffect(() => {
    if (token) {
      syncProfile(token);
      fetchHistory();
    }
  }, [token]);

  // Idle Timer Effect
  useEffect(() => {
    if (!token) return;
    let timer: number;
    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = window.setTimeout(() => {
        toast("Session expired due to inactivity.", { icon: '⏰' });
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
  return <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
  </div>;
}

  // --- 4. RENDER LOGIC ---

  // LANDING PAGE VIEW
  if (!token) {
    return (
      <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100">
        <Toaster />
        <Auth isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLogin={handleLoginSuccess} />
        
        <nav className="p-6 max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 font-black text-2xl tracking-tighter">
            <Globe className="text-blue-600" size={28} />
            PRICE<span className="text-blue-600">PARITY</span>
          </div>
          <button onClick={() => setIsAuthOpen(true)} className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg active:scale-95 transition">
            Sign In
          </button>
        </nav>

        <section className="max-w-6xl mx-auto px-6 pt-20 pb-32 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-xs font-black tracking-widest uppercase mb-6 animate-pulse">
            <Sparkles size={14} /> AI-Powered Revenue Optimization
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-[1.1] tracking-tight">
            The world is bigger than <br /> <span className="text-blue-600">just your country.</span>
          </h1>
          <p className="text-slate-500 text-xl md:text-2xl mb-12 max-w-2xl mx-auto leading-relaxed">
            Stop losing 80% of your global sales. Use AI to price your products fairly for every economy on Earth.
          </p>
          <button onClick={() => setIsAuthOpen(true)} className="bg-blue-600 text-white px-10 py-5 rounded-3xl font-bold text-xl hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all active:scale-95 flex items-center gap-3 mx-auto">
            Get Started for Free <ArrowRight />
          </button>
          <p className="mt-12 text-slate-400 text-sm font-medium uppercase tracking-widest">Trusted by 5,000+ Digital Creators</p>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-12 border-t border-slate-100">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><Zap /></div>
            <h4 className="text-xl font-bold font-sans">1. PPP Intelligence</h4>
            <p className="text-slate-500 text-sm">We use global economic data to calculate the relative value of $1 in every economy.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center"><Sparkles /></div>
            <h4 className="text-xl font-bold font-sans">2. Cultural AI</h4>
            <p className="text-slate-500 text-sm">Our AI rewrites your marketing pitch to match the cultural success triggers of that region.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center"><ShieldCheck /></div>
            <h4 className="text-xl font-bold font-sans">3. 1-Line Widget</h4>
            <p className="text-slate-500 text-sm">Embed our simple script into your site to automate global pricing with zero maintenance.</p>
          </div>
        </section>
        <button onClick={() => setIsAuthOpen(true)} className="bg-blue-600 text-white px-10 py-5 rounded-3xl font-bold text-xl hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all active:scale-95 flex items-center gap-3 mx-auto">
            Get Started for Free <ArrowRight />
          </button>
      </div>
    );
  }

  // DASHBOARD VIEW
  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans">
      <Toaster />
      <Auth isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLogin={handleLoginSuccess} />

      <nav className="p-6 max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2 font-black text-xl tracking-tighter">
          <Globe className="text-blue-600" />
          PRICE<span className="text-blue-600">PARITY</span>
        </div>
        <div className="flex items-center gap-4">
          {!user?.isPro && (
            <button onClick={handleUpgrade} className="text-sm font-bold text-blue-600 hover:text-blue-800 transition">Upgrade to Pro ($19)</button>
          )}
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
            <span className="text-sm font-bold text-slate-600">Hi, {user?.username?.split(' ')[0] || 'Member'}</span>
            <button onClick={handleLogout} className="text-xs text-red-500 font-bold border-l pl-3 ml-1 border-slate-100">Logout</button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-12 items-start mb-20">
          <form onSubmit={handleOptimize} className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
            <h2 className="text-xl font-black mb-4">New Strategy</h2>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Product Name</label>
              <input required value={productName} onChange={e => setProductName(e.target.value)} className="w-full mt-1 p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="e.g. Masterclass E-book" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">USA Price</label>
                <input required type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full mt-1 p-4 bg-slate-50 rounded-2xl outline-none" placeholder="100" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Target Market</label>
                <select value={country} onChange={e => setCountry(e.target.value)} className="w-full mt-1 p-4 bg-slate-50 rounded-2xl outline-none cursor-pointer">
                  <option value="NG">Nigeria (NG)</option>
                  <option value="IN">India (IN)</option>
                  <option value="BR">Brazil (BR)</option>
                  <option value="GB">United Kingdom (GB)</option>
                </select>
              </div>
            </div>
            <button disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-blue-700 transition active:scale-95 flex items-center justify-center gap-2">
              {loading ? "Analyzing..." : "Generate Strategy"} <ArrowRight size={20} />
            </button>
          </form>

          <div className="space-y-6">
            {!result ? (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center text-slate-400 min-h-[400px]">
                <BarChart3 size={48} className="mb-4 opacity-20" />
                <p>Generate a strategy to <br /> see localized results.</p>
              </div>
            ) : (
              <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl animate-in fade-in slide-in-from-right-4 relative overflow-hidden">
                <div className="flex items-center gap-2 text-blue-400 mb-6 font-bold text-sm tracking-widest uppercase"><Sparkles size={16} /> AI Strategy Ready</div>
                <div className="mb-8">
                  <p className="text-slate-400 text-sm mb-1 uppercase font-bold tracking-tighter">Recommended Local Price</p>
                  <h3 className="text-4xl font-black">${result.suggestedPrice}</h3>
                  <span className="inline-block mt-2 bg-green-500/20 text-green-400 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest">{result.discountPercentage}% PPP Discount</span>
                </div>
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-6 relative">
                  <p className="text-blue-400 text-[10px] font-black uppercase mb-3 tracking-widest">AI Localized Pitch</p>
                  <div className={!user?.isPro ? "blur-md select-none pointer-events-none" : ""}>
                    <p className="italic text-lg leading-relaxed text-slate-200">"{result.localizedPitch}"</p>
                  </div>
                  {!user?.isPro && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 rounded-2xl">
                       <button onClick={handleUpgrade} className="bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">Unlock with Pro</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* WIDGET SECTION */}
        {result && user?.isPro && (
          <div id="widget-section" className="mt-12 p-8 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 animate-in fade-in zoom-in">
             <h4 className="text-xl font-black text-slate-900 mb-2">Website Widget</h4>
             <p className="text-slate-500 mb-6 text-sm">Paste this into your site to show the local price automatically.</p>
             <div className="bg-slate-900 p-6 rounded-2xl font-mono text-[10px] text-blue-300 overflow-x-auto">
                {`<div id="price-parity-display"></div>\n<script src="${API_BASE}/widget?price=${price}"></script>`}
             </div>
          </div>
        )}

        {/* HISTORY SECTION */}
        {history.length > 0 && (
          <div className="mt-32">
            <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-2">History</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {history.map((item) => (
                <div key={item._id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-slate-800">{item.productName}</h4>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{item.country}</p>
                    </div>
                    <span className="bg-blue-50 text-blue-600 text-xs font-black px-3 py-1 rounded-full">${item.suggestedPrice}</span>
                  </div>
                  <p className="text-sm text-slate-500 italic line-clamp-2">"{item.pitch}"</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;