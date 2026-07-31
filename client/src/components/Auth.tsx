import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import toast from 'react-hot-toast';
import { X, Globe } from 'lucide-react';

interface AuthProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (token: string, user: any) => void;
}

export const Auth = ({ isOpen, onClose, onLogin }: AuthProps) => {
    if (!isOpen) return null;

    const API_URL = "https://priceparity-api-live.onrender.com/api/auth";
    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            const loading = toast.loading("Verifying Google account...");
            try {
                
                const res = await axios.post(`${API_URL}/google`, {
                    token: tokenResponse.access_token,
                });
                onLogin(res.data.token, res.data.user);
                toast.dismiss(loading);
                toast.success("Welcome to the global market!");
            } catch (err) {
                toast.dismiss(loading);
                toast.error("Google Authentication failed");
            }
        },
        onError: () => toast.error("Google Login Failed"),
       
    });

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative border border-slate-100">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full transition">
                    <X size={20}/>
                </button>
                
                <div className="text-center mb-10">
                    <Globe className="text-blue-600 mx-auto mb-4" size={40} />
                    <h2 className="text-3xl font-black text-slate-900">Join PriceParity</h2>
                    <p className="text-slate-400 mt-2 font-medium text-sm px-6">
                        Create an account to start optimizing your global revenue.
                    </p>
                </div>

                <button 
                    onClick={() => googleLogin()}
                    className="w-full flex items-center justify-center gap-3 py-4 border-2 border-slate-100 rounded-2xl bg-white hover:bg-slate-50 transition-all active:scale-95 group"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google Logo" />
                    <span className="text-slate-700 font-bold text-sm">Continue with Google</span>
                </button>

                <p className="text-[10px] text-slate-400 text-center mt-8 uppercase tracking-widest font-bold">Secure Global Access</p>
            </div>
        </div>
    );
};