import { useEffect, useState } from "react";
import axios from 'axios';
import { Globe, DollarSign, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import type { PricingResult } from "./types";
import { Auth } from "./components/Auth";

function App() {
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [country, setCountry] = useState('NG');
  const [result, setResult] = useState<PricingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null> (localStorage.getItem('parity_token'));
  const [history, setHistory] = useState<any[]>([]);

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();

    // Safety check: if there is no token, don't even try
    if (!token) {
      toast.error("Please sign in first");
      return;
    }

    setLoading(true);
    try {
      // Connect to your Backend on Port 5001
      const res = await axios.post('https://priceparity-api-live.onrender.com/api/calculate', {
        productName,
        price: parseFloat(price),
        country
      },
      {
        // THIS IS THE KEYCARD:
        headers: { 'x-auth-token': token } 
    });

      setResult(res.data);
      toast.success("Global strategy generated!");
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
      toast.error("Session expired. Please login again.");
      setToken(null);
      localStorage.removeItem('parity_token');
    } else {
      toast.error("Failed to connect to engine");
    }
    } finally {
      setLoading(false);
    }
  };

const handleUpgrade = async () => {
  const loading = toast.loading("Preparing secure checkout...");
  try {
    const res = await axios.post('https://priceparity-api-live.onrender.com/api/paystack/initialize', {}, {
      headers: { 'x-auth-token': token }
    });
    // Paystack returns 'authorization_url'
    window.location.href = res.data.authorization_url; 
  } catch (err) {
    toast.dismiss(loading);
    toast.error("Payment system unavailable");
  }
};

  useEffect(() => {
  const query = new URLSearchParams(window.location.search);
  const reference = query.get('reference');

  if (query.get('paystack_success') && reference) {
    const verify = async () => {
      const loading = toast.loading("Confirming your payment...");
      try {
        const res = await axios.get(`https://priceparity-api-live.onrender.com/api/paystack/verify?reference=${reference}`);
        if (res.data.isPro) {
          toast.dismiss(loading);
          toast.success("Upgrade Successful! Welcome to Pro. 🚀");
          setUser((prev: any) => ({ ...prev, isPro: true }));
        }
      } catch (err) {
        toast.dismiss(loading);
        toast.error("Verification failed.");
      }
    };
    verify();
    window.history.replaceState({}, '', window.location.pathname);
  }
}, []);

  useEffect(() => {
    if (token) {
      console.log("Welcome back, Session active");
    }
  }, [token]);

   const handleLoginSuccess = (newToken: string, userData: any) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('parity_token', newToken);
  };

  const handleImplement = () => {
    if (!user?.isPro) {
      toast((t) => (
        <span className="flex flex-col gap-2">
          <b>Pro Features!</b>
          Unlock the AI Pitch and website widget to start selling.
          <button
            onClick={() => { toast.dismiss(t.id); handleUpgrade(); }}
            className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs">
              Upgrade Now
          </button>
        </span>
      ), { duration:6000 });
    } else {
      // If they are pro, scroll them down to the widget code
      document.getElementById('widget-section')?.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };

  const fetchHistory = async () => {
  try {
    const res = await axios.get('https://priceparity-api-live.onrender.com/api/strategies', {
      headers: { 'x-auth-token': token }
    });
    setHistory(res.data);
  } catch (err) {
    console.error("Could not fetch history");
  }
};

const syncProfile = async (currentToken: string) => {
  try {
    const res = await axios.get('https://priceparity-api-live.onrender.com/api/auth/me', {
      headers: { 'x-auth-token': currentToken }
    });
    // This updates the UI with the latest isPro status from MongoDB
    setUser(res.data); 
  } catch (err) {
    console.error("Failed to sync profile");
    // If token is invalid, log them out
    handleLogout();
  }
};

// App.tsx logic section

const handleLogout = () => {
  setToken(null);
  setUser(null);
  localStorage.removeItem('parity_token');
  // Refresh the page to take them back to the landing page
  window.location.reload(); 
};

// Update your useEffect to fetch history whenever the user is logged in
useEffect(() => {
  if (token) {
    localStorage.setItem('parity_token', token);
    syncProfile(token)
    fetchHistory();
  }
}, [token, result]); // Re-fetch when a new result is generated

   if (!token) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center p-6">
        <Toaster />
        <Auth
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onLogin={handleLoginSuccess}
          />
        
        <div className="max-w-3xl">
          <div className="flex justify-center items-center gap-2 font-black text-2xl tracking-tighter mb-8">
            <Globe className="text-blue-600" size={32}/>
            PRICE<span className="text-blue-600">PARITY</span>
          </div>

          <h1 className="text-6xl font-black text-slate-900 mb-6 leading-tight">
            The world is bigger than <span className="text-blue-600">just your country</span>
          </h1>
          <p className="text-slate-500 text-xl mb-10 px-10">
            Stop losing 80% of your global sales. Use AI to price your products fairly for every economy on Earth.
          </p>

          <button 
            onClick={() => setIsAuthOpen(true)}
            className="bg-blue-600 text-white px-10 py-5 rounded-3xl font-bold text-xl hover:bg-blue-700
            shadow-blue-200 transition-all active:scale-95 flex items-center gap-3 mx-auto">
            Start Scaling Globally <ArrowRight/>
          </button>

          <p className="mt-8 text-slate-400 text-sm font-medium uppercase tracking-widest">
            Trusted by 5,000+ Digital Creators
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-scale-slate-900 font-sans">
      <Toaster />
      {/* HEADER */}
      <nav className="p-6 max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2 font-blank text-xl tracking-tighter">
          <Globe className="text-blue-600" />
          PRICE<span className="text-blue-600">PARITY</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleUpgrade}
            className="text-sm font-bold text-blue-600 hover:text-blue-800 transition"
          >
            Upgrade to Pro ($10)
          </button>
        </div>
        {
          token ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-600">Hi, {user?.username || 'Member'}</span>
                <button onClick={handleLogout} className="text-xs text-red-500 font-bold border-l pl-3 ml-1 border-slate-100">
                  Logout
              </button>
            </div>
          ) : (
          <button 
            onClick={() => setIsAuthOpen(true)}
            className="bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-bold active:scale-95 transition">
            Sign In
          </button>
        )}    
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black mb-4 tracking-tight">Scale your sales <span className="text-blue-600">globally.</span></h1>
          <p className="text-slate-500 text-lg">AI-powered purchasing power parity for digital creators.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* INPUT FORM */}
          <form onSubmit={handleOptimize} className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50
          border border-slate-100 space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Product Name</label>
              <input required value={productName} onChange={e => setProductName(e.target.value)} className="w-full mt-2 p-4 bg-slate-50 rounded-2xl
              outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="e.g.
              Masterclass E-book" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">USA Price</label>
                <input required type="number" value={price} onChange={e => 
                setPrice(e.target.value)} className="w-full mt-2 p-4 bg-slate-50 rounded-2xl
                outline-none" placeholder="100"/>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Target Market</label>
                <select value={country} onChange={e => 
                  setCountry(e.target.value)} className="w-full mt-2 p-4 bg-slate-50 rounded-2xl outline-none">
                    <option value="NG">Nigeria (NG)</option>
                    <option value="IN">India (IN)</option>
                    <option value="BR">Brazil (BR)</option>
                    <option value="GB">United Kingdom (GB)</option>
                </select>
              </div>
            </div>

            <button disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold
            text-lg hover:bg-blue-700 transition active:scale-95 flex items-center justify-center gap-2">
              {loading ? "Analyzing..." : "Optimize Global Price"} <ArrowRight size={20}/>
            </button>
          </form>

          {/* RESULTS BOX */}
          <div className="space-y-6">
            {!result ? (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed
              border-slate-200 rounded-[2rem] p-12 text-center text-slate-400">
                <DollarSign size={48} className="mb-4 opacity-20"/>
                <p>Enter details to see your <br/> global pricing strategy.</p>
              </div>
            ) : (
              <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center gap-2 text-blue-400 mb-6 font-bold text-sm tracking-widest uppercase">
                  <Sparkles size={16}/> AI Optimization Ready
                </div>

                <div className="mb-8">
                  <p className="text-slate-400 text-sm mb-1">Recommended Local Price</p>
                  <h3 className="text-4xl font-black">${result.suggestedPrice}</h3>
                  <span className="inline-block mt-2 bg-green-500/20 text-green-400 text-xs px-3 py-1 rounded-full font-bold">
                    {result.discountPercentage}% PPP Discount Applied
                  </span>
                </div>

                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-6 relative overflow-hidden">
                  <p className="text-blue-400 text-xs font-bold uppercase mb-3 flex items-center gap-2">
                    <Sparkles size={12} /> AI Localized Pitch
                  </p>

                  {/* BLUR LOGIC */}
                  <div className={!user?.isPro ? "blur-md select-none pointer-events-none" : ""}>
                    <p className="italic text-lg leading-relaxed text-slate-200">
                      "{result.localizedPitch}"
                    </p>
                  </div>

                  {!user?.isPro && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40">
                      <button
                        onClick={handleUpgrade}
                        className="bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                          Unlock with Pro
                      </button>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleImplement}
                  className="w-full bg-white text-slate-900 py-4 rounded-xl font-bold 
                  hover:bg-slate-100 transition flex items-center justify-center gap-2 active:scale-95">
                  <CheckCircle2 size={18}/> Implement this strategy
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      {result && user?.isPro && (
        <div id="widget-section" className="mt-12 p-8 bg-white rounded-[2.5rem] border-2 border-dashed
        border-slate-200 animate-in fade-in zoom-in">
          <h4 className="text-xl font-black text-slate-900 mb-2">Your Website Widget</h4>
          <p className="text-slate-500 mb-6">Paste this code into your website's HTML to show local price to your visitors.</p>
          <div className="bg-slate-900 p-6 rounded-2xl font-mono text-xs text-blue-300 overflow-x-auto">
            {`<div id="price-parity-display"></div>\n<script src="https://priceparity-api-live.onrender.com/api/widget?price=${price}</script>`}
          </div>
        </div>
      )}

      {history.length > 0 && (
  <div className="mt-20">
    <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-2">
       <Sparkles className="text-blue-600" size={24} /> Strategy History
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {history.map((item) => (
        <div key={item._id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="font-bold text-slate-800">{item.productName}</h4>
              <p className="text-xs text-slate-400 uppercase font-bold">{item.country}</p>
            </div>
            <span className="bg-blue-50 text-blue-600 text-xs font-black px-3 py-1 rounded-full">
              ${item.suggestedPrice}
            </span>
          </div>
          <p className="text-sm text-slate-500 italic line-clamp-3">"{item.pitch}"</p>
          <p className="text-[10px] text-slate-300 mt-4 font-medium">Generated on {new Date(item.createdAt).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  </div>
  )}
  </div>
  );
}

export default App;