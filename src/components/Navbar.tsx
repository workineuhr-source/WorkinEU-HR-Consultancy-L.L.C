import { Link, useNavigate } from 'react-router-dom';
import { User, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { Menu, X, Briefcase, User as UserIcon, LogOut, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { SiteContent } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [navLabels, setNavLabels] = useState({
    home: 'Home',
    jobs: 'Jobs',
    about: 'About Us',
    contact: 'Contact Us',
    diary: 'Diary'
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [companyProfileUrl, setCompanyProfileUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'siteContent'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as SiteContent;
        if (data.logoUrl) {
          setLogoUrl(data.logoUrl);
        }
        if (data.companyProfileUrl) {
          setCompanyProfileUrl(data.companyProfileUrl);
        }
        setNavLabels({
          home: data.navHome || 'Home',
          jobs: data.navJobs || 'Jobs',
          about: data.navAbout || 'About Us',
          contact: data.navContact || 'Contact Us',
          diary: data.navDiary || 'Diary'
        });
      }
    }, (err) => console.error("Navbar site content listener error:", err));

    return () => unsub();
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      // Check default admin email
      if (user.email === 'workineuhr@gmail.com') {
        setIsAdmin(true);
        return;
      }

      // Check role in Firestore
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      }
    };

    checkAdmin();

    const fetchCandidatePhoto = async () => {
      if (user && !isAdmin) {
        try {
          const profileDoc = await getDoc(doc(db, 'candidates', user.uid));
          if (profileDoc.exists()) {
            setPhotoUrl(profileDoc.data().photoUrl || null);
          }
        } catch (error) {
          console.error("Error fetching candidate photo:", error);
        }
      } else {
        setPhotoUrl(null);
      }
    };
    fetchCandidatePhoto();
  }, [user, isAdmin]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const navLinks = [
    { name: navLabels.home, path: '/' },
    { name: navLabels.jobs, path: '/jobs' },
    { name: navLabels.diary, path: '/diary' },
    { name: navLabels.about, path: '/about' },
    { name: 'Company Profile', path: companyProfileUrl || '#', external: true },
    { name: navLabels.contact, path: '/#contact' },
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
      scrolled 
        ? "bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl border-b border-slate-200/50 dark:border-white/10 py-3 shadow-xl" 
        : "bg-transparent py-5"
    )}>
      <div className="max-w-[1920px] mx-auto px-4 md:px-8 lg:px-12">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/" onClick={scrollToTop} className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-2xl group-hover:rotate-6 transition-transform overflow-hidden">
                <img src={logoUrl || "/logo.png"} alt="WorkinEU HR" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
              </div>
              <div className="flex flex-col">
                <span className={cn(
                  "font-bold text-xl font-sans tracking-tight transition-colors duration-300", 
                  theme === 'dark' ? "text-white" : "text-slate-900"
                )}>
                  WorkinEU <span className="text-brand-teal">HR</span>
                </span>
                <span className="text-[8px] uppercase tracking-[0.3em] text-brand-teal font-black">Consultancy LLC</span>
              </div>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-12">
            {navLinks.map((link, i) => (
              link.external ? (
                <a 
                  key={`${link.path}-${i}`} 
                  href={link.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "transition-all duration-300 font-bold text-[11px] uppercase tracking-widest relative group",
                    theme === 'dark' ? "text-white/80 hover:text-brand-teal" : "text-slate-900 hover:text-brand-teal"
                  )}
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-teal transition-all group-hover:w-full rounded-full"></span>
                </a>
              ) : (
                <Link 
                  key={`${link.path}-${i}`} 
                  to={link.path} 
                  className={cn(
                    "transition-all duration-300 font-bold text-[11px] uppercase tracking-widest relative group",
                    theme === 'dark' ? "text-white/80 hover:text-brand-teal" : "text-slate-900 hover:text-brand-teal"
                  )}
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-teal transition-all group-hover:w-full rounded-full"></span>
                </Link>
              )
            ))}
            
            <div className="flex items-center gap-6 pl-6 border-l border-gray-200 dark:border-white/10">
              <button 
                onClick={toggleTheme}
                className={cn(
                  "p-2.5 rounded-xl transition-all duration-500 hover:scale-110",
                  theme === 'dark' ? "bg-white/5 text-brand-teal shadow-[0_0_15px_rgba(42,185,176,0.3)]" : (scrolled ? "bg-slate-100 text-slate-900 shadow-sm" : "bg-white text-slate-900 shadow-lg")
                )}
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {user ? (
                <div className="flex items-center gap-4">
                  <Link 
                    to={isAdmin ? "/admin" : "/candidate/dashboard"} 
                    className="flex items-center gap-3 bg-premium-gradient-animated text-white px-6 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                  >
                    {!isAdmin && photoUrl && (
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-900/20">
                        <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    {isAdmin ? "Admin Panel" : "Dashboard"}
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className={cn(
                      "p-2.5 rounded-xl transition-all duration-300",
                      theme === 'dark' ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : (scrolled ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-white/5 text-white/50 hover:bg-red-500/10 hover:text-red-400")
                    )}
                    title="Logout"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className={cn(
                    "px-8 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-[0.2em] transition-all duration-300 shadow-lg",
                    theme === 'dark' ? "bg-premium-gradient-animated text-white" : "bg-slate-900 text-white"
                  )}
                >
                  Login
                </Link>
              )}
            </div>
          </div>

          {/* Compact Mobile Navbar Actions */}
          <div className="md:hidden flex items-center gap-4">
            {user ? (
              <Link 
                to={isAdmin ? "/admin" : "/candidate/dashboard"} 
                className="w-10 h-10 rounded-xl bg-premium-gradient-animated flex items-center justify-center text-white shadow-xl"
              >
                {photoUrl ? (
                  <img src={photoUrl} alt="Me" className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon size={20} />
                )}
              </Link>
            ) : (
              <Link 
                to="/login" 
                className="bg-premium-gradient-animated text-white px-5 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
