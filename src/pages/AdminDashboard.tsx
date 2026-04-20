import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Settings, 
  Plus, 
  LogOut,
  Menu,
  X,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Search,
  Bell,
  Sparkles,
  Globe,
  RotateCcw,
  BarChart3,
  Home
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, getDocs, query, orderBy, limit, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { SiteContent } from '../types';

// Admin Sub-pages
import AdminOverview from './admin/AdminOverview';
import AdminJobs from './admin/AdminJobs';
import AdminApplications from './admin/AdminApplications';
import AdminContent from './admin/AdminContent';
import AdminTeam from './admin/AdminTeam';
import AdminReviews from './admin/AdminReviews';
import AdminContactMessages from './admin/AdminContactMessages';
import AdminCandidates from './admin/AdminCandidates';
import AdminRefunds from './admin/AdminRefunds';
import AdminAnalytics from './admin/AdminAnalytics';
import AdminDiary from './admin/AdminDiary';
import AdminSuccessStories from './admin/AdminSuccessStories';
import AdminClients from './admin/AdminClients';
import ErrorBoundary from '../components/ErrorBoundary';

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'siteContent'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as SiteContent;
        if (data.logoUrl) {
          setLogoUrl(data.logoUrl);
        }
        
        // Update Favicon dynamically
        if (data.faviconUrl) {
          const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (link) {
            link.href = data.faviconUrl;
          } else {
            const newLink = document.createElement('link');
            newLink.rel = 'icon';
            newLink.href = data.faviconUrl;
            document.head.appendChild(newLink);
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/admin/login');
  };

  const menuItems = [
    { name: 'Overview', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Analytics', path: '/admin/analytics', icon: <BarChart3 size={20} /> },
    { name: 'Manage Jobs', path: '/admin/jobs', icon: <Briefcase size={20} /> },
    { name: 'Applications', path: '/admin/applications', icon: <Users size={20} /> },
    { name: 'Candidates', path: '/admin/candidates', icon: <Users size={20} /> },
    { name: 'Refund Requests', path: '/admin/refunds', icon: <RotateCcw size={20} /> },
    { name: 'Site Content', path: '/admin/content', icon: <Settings size={20} /> },
    { name: 'Our Diary', path: '/admin/diary', icon: <Sparkles size={20} /> },
    { name: 'Success Stories', path: '/admin/success-stories', icon: <CheckCircle2 size={20} /> },
    { name: 'Clients & Partners', path: '/admin/clients', icon: <Globe size={20} /> },
    { name: 'User Reviews', path: '/admin/reviews', icon: <Clock size={20} /> },
    { name: 'Contact Messages', path: '/admin/messages', icon: <MessageCircle size={20} /> },
    { name: 'Manage Team', path: '/admin/team', icon: <Users size={20} /> },
  ];

  return (
    <div className="h-screen bg-gray-50 dark:bg-slate-950 flex overflow-hidden transition-colors duration-500">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && window.innerWidth < 1024 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm z-[45]"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "bg-[#020617] text-white w-72 h-full flex flex-col fixed inset-y-0 left-0 z-50 transition-all duration-300 transform lg:static lg:translate-x-0 border-r border-white/5 shadow-2xl shrink-0 overflow-hidden",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 flex items-center justify-between border-b border-white/5 shrink-0 bg-[#020617]">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-brand-teal/20 overflow-hidden group-hover:scale-110 transition-transform">
              <img src={logoUrl || "/logo.png"} alt="Logo" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
            </div>
            <div>
              <span className="block font-sans text-xl font-black tracking-tight">WorkinEU <span className="text-brand-teal">HR</span></span>
              <span className="block text-[8px] uppercase tracking-[0.4em] text-brand-teal font-black opacity-80">Admin Core</span>
            </div>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-500 hover:text-brand-teal transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto px-4 py-8 scrollbar-hide space-y-12">
          <div className="px-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Navigation</p>
            <Link 
              to="/"
              className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-brand-teal text-[#020617] hover:bg-white transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-teal/20"
            >
              <RotateCcw size={18} />
              Return to Website
            </Link>
          </div>

          <div>
            <p className="px-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Management</p>
            <nav className="space-y-2 px-2">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold text-xs uppercase tracking-wider group relative overflow-hidden",
                    location.pathname === item.path 
                      ? "bg-white/10 text-brand-teal border border-brand-teal/20" 
                      : "hover:bg-white/5 text-slate-400 hover:text-white border border-transparent"
                  )}
                >
                  <span className={cn(
                    "transition-transform duration-300 group-hover:scale-110",
                    location.pathname === item.path ? "text-brand-teal" : "text-slate-500 group-hover:text-brand-teal"
                  )}>
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="p-6 space-y-4 border-t border-white/5 shrink-0 bg-[#020617]">
          <Link 
            to="/" 
            className="flex items-center gap-4 px-6 py-4 w-full rounded-2xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all font-black text-xs uppercase tracking-widest border border-white/5"
          >
            <Globe size={18} className="text-brand-teal" />
            Live Preview
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-6 py-4 w-full rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all font-black text-xs uppercase tracking-widest border border-transparent hover:border-rose-500/20"
          >
            <LogOut size={18} />
            End Session
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-grow flex flex-col h-full min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md h-16 md:h-24 border-b border-gray-100 dark:border-white/5 flex items-center justify-between px-4 md:px-10 z-40 shadow-sm shrink-0">
          <div className="flex items-center gap-4 md:gap-8 flex-grow">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl text-brand-blue dark:text-white transition-all active:scale-95"
            >
              <Menu size={24} />
            </button>
            {/* Mobile Logo */}
            <Link to="/" className="lg:hidden flex items-center gap-2 group">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden border border-gray-100">
                <img src={logoUrl || "/logo.png"} alt="Logo" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
              </div>
            </Link>
            <Link 
              to="/"
              className="flex items-center gap-2 p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl text-brand-blue dark:text-white transition-all active:scale-95 group"
            >
              <Home size={22} className="text-brand-teal group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black uppercase tracking-widest hidden sm:block">Home</span>
            </Link>
            <div className="relative max-w-lg w-full hidden lg:block">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
              <input 
                type="text" 
                placeholder="Search candidates, jobs, or content..."
                className="w-full pl-14 pr-6 py-3.5 bg-gray-50 dark:bg-slate-800 border border-transparent dark:border-white/5 rounded-2xl outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-brand-gold/30 focus:ring-4 focus:ring-brand-gold/5 transition-all text-sm font-medium dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4 md:gap-8">
            <div className="flex items-center gap-2">
              <button className="p-3 text-gray-400 dark:text-gray-500 hover:text-brand-blue dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl relative transition-all group">
                <Bell size={22} />
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-brand-gold rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
                <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <p className="text-xs font-bold text-brand-blue dark:text-brand-gold uppercase tracking-widest mb-2">Notifications</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">No new notifications</p>
                </div>
              </button>
            </div>
            
            <div className="h-10 w-px bg-gray-100 dark:bg-white/5 hidden sm:block"></div>

            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-brand-blue dark:text-white group-hover:text-brand-gold transition-colors">WorkinEU Admin</p>
                <p className="text-[10px] text-brand-gold font-bold uppercase tracking-widest">Super Admin</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-brand-blue to-blue-900 dark:from-brand-gold dark:to-yellow-700 text-white dark:text-brand-blue rounded-2xl flex items-center justify-center font-bold shadow-xl shadow-brand-blue/20 dark:shadow-brand-gold/10 group-hover:scale-105 transition-transform">
                WA
              </div>
            </div>
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-grow overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-[1920px] mx-auto">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<AdminOverview />} />
                <Route path="/analytics" element={<AdminAnalytics />} />
                <Route path="/jobs" element={<AdminJobs />} />
                <Route path="/applications" element={<AdminApplications />} />
                <Route path="/candidates" element={<AdminCandidates />} />
                <Route path="/refunds" element={<AdminRefunds />} />
                <Route path="/content" element={<AdminContent />} />
                <Route path="/team" element={<AdminTeam />} />
                <Route path="/diary" element={<AdminDiary />} />
                <Route path="/success-stories" element={<AdminSuccessStories />} />
                <Route path="/clients" element={<AdminClients />} />
                <Route path="/reviews" element={<AdminReviews />} />
                <Route path="/messages" element={<AdminContactMessages />} />
              </Routes>
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
