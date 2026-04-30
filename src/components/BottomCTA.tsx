import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { SiteContent } from '../types';

export default function BottomCTA() {
  const [content, setContent] = useState<SiteContent | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'siteContent'), (snap) => {
      if (snap.exists()) {
        setContent(snap.data() as SiteContent);
      }
    });
    return () => unsub();
  }, []);

  const getFontClass = (font?: string) => {
    switch (font) {
      case 'serif': return 'font-serif';
      case 'space': return 'font-space';
      case 'outfit': return 'font-outfit';
      case 'mono': return 'font-mono';
      default: return 'font-sans';
    }
  };

  const getTextColor = (color?: string, fallback: string = 'text-slate-900') => {
    if (!color) return fallback;
    if (color === 'teal') return 'text-brand-teal';
    if (color === 'rose') return 'text-brand-rose';
    if (color === 'gold') return 'text-brand-gold';
    if (color === 'blue') return 'text-brand-blue';
    if (color === 'white') return 'text-white';
    return color.startsWith('text-') ? color : `text-[${color}]`;
  };

  const getBgColor = (color?: string, fallback: string = 'bg-slate-900') => {
    if (!color) return fallback;
    if (color === 'teal') return 'bg-brand-teal';
    if (color === 'rose') return 'bg-brand-rose';
    if (color === 'gold') return 'bg-brand-gold';
    if (color === 'blue') return 'bg-brand-blue';
    return color.startsWith('bg-') ? color : `bg-[${color}]`;
  };

  if (!content?.ctaTitle && !content?.ctaDescription) return null;

  return (
    <section className="py-12 relative overflow-hidden bg-white mt-12 border-t border-slate-100">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-teal/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-brand-gold/5 rounded-full blur-[80px] -ml-24 -mb-24"></div>
      </div>

      <div className="relative z-10 w-full px-0">
        <div className="w-full bg-slate-50 dark:bg-slate-800/50 p-6 md:p-10 border border-slate-100 dark:border-white/5 shadow-sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12"
          >
            <div className="flex-1 space-y-4 text-center md:text-left">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-[10px] font-black uppercase tracking-[0.4em]">
                <Sparkles size={12} /> Global Opportunities
              </span>
              
              <h2 className={`text-2xl md:text-3xl lg:text-4xl font-black leading-[1.1] tracking-tight ${getFontClass(content.styles?.bottomCta?.font)} ${getTextColor(content.styles?.bottomCta?.titleColor)}`}>
                {content.ctaTitle || "Ready to Start Your Global Career?"}
              </h2>
              
              <p className={`text-sm md:text-base leading-relaxed max-w-xl mx-auto md:mx-0 font-medium ${getFontClass(content.styles?.bottomCta?.font)} ${getTextColor(content.styles?.bottomCta?.descriptionColor, 'text-slate-500')}`}>
                {content.ctaDescription || "Join hundreds of successful candidates who have transformed their lives through WorkinEU's expert recruitment."}
              </p>
            </div>

            <div className="shrink-0 flex items-center justify-center">
              <Link 
                to="/jobs" 
                className={`inline-flex items-center gap-4 px-8 py-5 font-black rounded-xl transition-all shadow-xl shadow-slate-200 dark:shadow-none group text-[10px] md:text-xs uppercase tracking-widest whitespace-nowrap ${getBgColor(content.styles?.bottomCta?.buttonBgColor)} ${getTextColor(content.styles?.bottomCta?.buttonTextColor, 'text-white')} ${getFontClass(content.styles?.bottomCta?.font)}`}
              >
                {content.ctaButtonText || "Explore All Jobs"} <ArrowRight className="group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-1/2 right-12 -translate-y-1/2 w-32 h-32 border-4 border-brand-teal/10 rounded-3xl rotate-12 hidden lg:block"></div>
      <div className="absolute top-1/3 right-48 -translate-y-1/2 w-16 h-16 border-4 border-brand-gold/10 rounded-2xl -rotate-12 hidden lg:block"></div>
    </section>
  );
}
