import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Briefcase, Lock, Mail, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login successful!");
      navigate('/admin');
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-brand-blue rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Briefcase className="text-brand-gold w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-brand-blue mb-2">Admin Portal</h1>
          <p className="text-gray-500">Secure access for WorkinEU HR management</p>
        </div>

        <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="email" 
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all"
                  placeholder="admin@workineuhr.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-blue transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-brand-blue text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-gold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
          
          <div className="mt-8 pt-8 border-t border-gray-50 text-center">
            <p className="text-sm text-gray-400">
              Forgot password? Contact system administrator.
            </p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <Link to="/" className="text-brand-gold font-bold hover:text-brand-blue transition-colors">
            ← Back to Website
          </Link>
        </div>
      </div>
    </div>
  );
}

function Link({ to, children, className }: { to: string, children: React.ReactNode, className?: string }) {
  const navigate = useNavigate();
  return (
    <a 
      href={to} 
      className={className}
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}
