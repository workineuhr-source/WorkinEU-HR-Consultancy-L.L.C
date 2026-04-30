import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { doc, setDoc, serverTimestamp, getDoc, onSnapshot } from 'firebase/firestore';
import { SiteContent } from '../types';
import { toast } from 'sonner';
import { User, Lock, Mail, Eye, EyeOff, UserPlus, LogIn, ArrowLeft, Briefcase, Home } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'siteContent'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as SiteContent;
        if (data.logoUrl) {
          setLogoUrl(data.logoUrl);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Get redirect path from location state or default to dashboard
  const from = (location.state as any)?.from?.pathname;

  useEffect(() => {
    if (auth.currentUser) {
      // Check if admin
      const checkAdmin = async () => {
        const adminDoc = await getDoc(doc(db, 'users', auth.currentUser!.uid));
        const isAdmin = (adminDoc.exists() && adminDoc.data().role === 'admin') || (auth.currentUser!.email === 'workineuhr@gmail.com');
        
        if (isAdmin) {
          navigate('/admin', { replace: true });
        } else {
          navigate('/candidate/dashboard', { replace: true });
        }
      };
      checkAdmin();
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          toast.error("Please enter your full name.");
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create candidate profile in Firestore
        await setDoc(doc(db, 'candidates', user.uid), {
          uid: user.uid,
          fullName: fullName,
          email: user.email,
          documents: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        await sendEmailVerification(user);
        toast.success("Account created! Please check your email for verification.");
        navigate('/candidate/dashboard');
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Check if admin
        const adminDoc = await getDoc(doc(db, 'users', user.uid));
        const isAdmin = (adminDoc.exists() && adminDoc.data().role === 'admin') || (user.email?.toLowerCase() === 'workineuhr@gmail.com');

        if (isAdmin) {
          // Force set role in database if it's the primary admin email
          if (user.email?.toLowerCase() === 'workineuhr@gmail.com' && (!adminDoc.exists() || adminDoc.data().role !== 'admin')) {
            await setDoc(doc(db, 'users', user.uid), {
              email: user.email,
              role: 'admin',
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
          toast.success("Admin login successful!");
          navigate('/admin');
        } else {
          toast.success("Login successful!");
          navigate(from || '/candidate/dashboard');
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      const errorCode = error.code;
      
      if (errorCode === 'auth/email-already-in-use') {
        toast.error("This email is already registered. Please sign in instead.");
        setIsSignUp(false);
      } else if (errorCode === 'auth/too-many-requests') {
        toast.error("Too many failed attempts. Access to this account has been temporarily disabled. Please try again later.");
      } else if (errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-credential') {
        toast.error("Invalid email or password. Please try again.");
      } else if (errorCode === 'auth/network-request-failed') {
        toast.error("Network error. Please check your internet connection.");
      } else if (errorCode === 'auth/weak-password') {
        toast.error("Password is too weak. Please use at least 6 characters.");
      } else {
        toast.error("Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 py-32 relative overflow-hidden">
      {/* Home Button */}
      <div className="absolute top-10 left-10 z-50">
        <Link 
          to="/" 
          className="flex items-center gap-3 px-6 py-3 bg-white hover:bg-slate-900 hover:text-white dark:hover:bg-brand-gold dark:hover:text-brand-blue rounded-2xl shadow-xl transition-all font-black text-[10px] uppercase tracking-widest group border border-slate-100"
        >
          <Home size={18} className="text-brand-teal group-hover:scale-110 transition-transform" />
          Back to Home
        </Link>
      </div>
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-mesh opacity-20 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-gold/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-gold/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>

      <div className="max-w-xl w-full relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-[0_30px_60px_-15px_rgba(15,23,42,0.2)] overflow-hidden p-4 border border-slate-100"
          >
            <img referrerPolicy="no-referrer" src={logoUrl || "/logo.png"} alt="WorkinEU HR" className="w-full h-full object-contain" />
          </motion.div>
          <h1 className="text-5xl font-bold text-slate-900 mb-4 tracking-tighter">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-slate-500 text-xl font-light">
            {isSignUp ? "Join WorkinEU HR to start your career journey" : "Sign in to access your dashboard"}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(15,23,42,0.15)] border border-slate-100 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
          
          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            {isSignUp && (
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700 ml-2 uppercase tracking-widest">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-gold transition-colors" size={24} />
                  <input 
                    type="text" 
                    required
                    className="w-full pl-16 pr-6 py-5 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-brand-gold focus:bg-white focus:ring-8 focus:ring-brand-gold/5 transition-all duration-500 text-slate-900 font-medium shadow-inner"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700 ml-2 uppercase tracking-widest">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-gold transition-colors" size={24} />
                <input 
                  type="email" 
                  required
                  className="w-full pl-16 pr-6 py-5 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-brand-gold focus:bg-white focus:ring-8 focus:ring-brand-gold/5 transition-all duration-500 text-slate-900 font-medium shadow-inner"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700 ml-2 uppercase tracking-widest">Password</label>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-gold transition-colors" size={24} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  className="w-full pl-16 pr-16 py-5 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-brand-gold focus:bg-white focus:ring-8 focus:ring-brand-gold/5 transition-all duration-500 text-slate-900 font-medium shadow-inner"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-gold transition-colors"
                >
                  {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                </button>
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-6 rounded-2xl font-bold text-xl hover:bg-brand-gold hover:text-slate-900 transition-all shadow-2xl flex items-center justify-center gap-3 disabled:opacity-70 mt-4"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                  {isSignUp ? "Creating Account..." : "Authenticating..."}
                </>
              ) : (
                <>
                  {isSignUp ? <UserPlus size={24} /> : <LogIn size={24} />}
                  {isSignUp ? "Create Account" : "Sign In"}
                </>
              )}
            </motion.button>
          </form>
          
          <div className="mt-12 pt-10 border-t border-slate-50 text-center">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-lg font-bold text-slate-900 hover:text-brand-gold transition-colors"
            >
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Register Now"}
            </button>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <Link to="/" className="text-brand-gold font-bold hover:text-slate-900 transition-all flex items-center justify-center gap-3 text-lg group">
            <ArrowLeft size={24} className="group-hover:-translate-x-2 transition-transform" /> Back to Website
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
