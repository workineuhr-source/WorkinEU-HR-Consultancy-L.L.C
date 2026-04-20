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
    <section className="py-24 relative overflow-hidden bg-slate-50">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-teal/5 rounded-full blur-[100px] -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-gold/5 rounded-full blur-[100px] -ml-40 -mb-40"></div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 md:px-8 relative z-10">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <span className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-[10px] font-black uppercase tracking-[0.4em] mb-4">
              <Sparkles size={14} /> Global Opportunities
            </span>
            
            <h2 className={`text-4xl md:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight ${getFontClass(content.styles?.bottomCta?.font)} ${getTextColor(content.styles?.bottomCta?.titleColor)}`}>
              {content.ctaTitle || "Ready to Start Your Global Career?"}
            </h2>
            
            <p className={`text-lg md:text-xl leading-relaxed max-w-2xl font-medium ${getFontClass(content.styles?.bottomCta?.font)} ${getTextColor(content.styles?.bottomCta?.descriptionColor, 'text-slate-500')}`}>
              {content.ctaDescription || "Join hundreds of successful candidates who have transformed their lives through WorkinEU's expert recruitment and placement services."}
            </p>

            <div className="pt-6">
              <Link 
                to="/jobs" 
                className={`inline-flex items-center gap-5 px-12 py-6 font-black rounded-2xl transition-all shadow-2xl shadow-slate-200 group text-xs uppercase tracking-widest ${getBgColor(content.styles?.bottomCta?.buttonBgColor)} ${getTextColor(content.styles?.bottomCta?.buttonTextColor, 'text-white')} ${getFontClass(content.styles?.bottomCta?.font)}`}
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
