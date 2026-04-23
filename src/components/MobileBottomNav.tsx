import { Link, useLocation } from 'react-router-dom';
import { Home, Briefcase, LayoutDashboard, MessageCircle, Sun, Moon, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { SiteContent } from '../types';

interface MobileBottomNavProps {
  isAdmin: boolean;
  onChatClick: () => void;
}

export default function MobileBottomNav({ isAdmin, onChatClick }: MobileBottomNavProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [companyProfileUrl, setCompanyProfileUrl] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'siteContent'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as SiteContent;
        if (data.companyProfileUrl) {
          setCompanyProfileUrl(data.companyProfileUrl);
        }
      }
    });
    return () => unsub();
  }, []);

  const navItems = [
    { name: 'Home', path: '/', icon: <Home size={22} /> },
    { name: 'Jobs', path: '/jobs', icon: <Briefcase size={22} /> },
    { name: 'Profile', path: companyProfileUrl || '#', icon: <FileText size={22} />, external: true },
    { name: 'Chat', path: '#', icon: <MessageCircle size={22} />, onClick: onChatClick },
    { name: 'Dashboard', path: isAdmin ? '/admin' : '/candidate/dashboard', icon: <LayoutDashboard size={22} /> },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[98%] max-w-md z-[60] px-2">
      <div className="bg-brand-blue dark:bg-slate-900 border border-brand-gold/30 rounded-[2.5rem] p-2 flex justify-around items-center shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] group">
        {navItems.map((item) => {
          const isActive = item.path !== '#' && location.pathname === item.path;
          
          const content = (
            <>
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-brand-gold/20 rounded-2xl -z-0"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {isActive && (
                <motion.div 
                  layoutId="activeGlow"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-gold rounded-full shadow-[0_0_20px_rgba(197,160,89,1)] z-20"
                />
              )}
              <div className={cn(
                "relative z-10 transition-all duration-300", 
                isActive ? "scale-110 text-brand-gold" : "text-white/60 group-hover:text-white/80"
              )}>
                {item.icon}
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-[0.2em] relative z-10 transition-colors mt-1 items-center justify-center text-center", 
                isActive ? "text-brand-gold" : "text-white/40 group-hover:text-white/60"
              )}>
                {item.name}
              </span>
            </>
          );

          if (item.onClick) {
            return (
              <button
                key={item.name}
                onClick={item.onClick}
                className="flex flex-col items-center justify-center p-3 rounded-2xl transition-all relative flex-1 min-w-0"
              >
                {content}
              </button>
            );
          }

          if (item.external) {
            return (
              <a
                key={item.name}
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-2xl transition-all relative flex-1 min-w-0"
              >
                {content}
              </a>
            )
          }

          return (
            <Link
              key={item.name}
              to={item.path}
              className="flex flex-col items-center justify-center p-3 rounded-2xl transition-all relative flex-1 min-w-0"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
