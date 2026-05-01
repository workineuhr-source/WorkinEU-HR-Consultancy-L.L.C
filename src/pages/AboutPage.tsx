import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { SiteContent } from "../types";
import {
  Target,
  Eye,
  Award,
  CheckCircle2,
  Users2,
  Globe2,
  ShieldCheck,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";

import BottomCTA from "../components/BottomCTA";
import SEO from "../components/SEO";

export default function AboutPage() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "siteContent"),
      (snap) => {
        if (snap.exists()) {
          setContent(snap.data() as SiteContent);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error listening to about content:", err);
        setLoading(false);
      },
    );

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-white/5">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] pt-40 pb-32 relative overflow-hidden transition-colors duration-500">
      <SEO
        title="About Us | Ethical EU Recruitment"
        description="Learn about WorkinEU HR, the premier ethical recruitment agency connecting talented professionals with top European employers."
      />
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-mesh opacity-[0.03] dark:opacity-[0.05] pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-brand-teal/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2 animate-pulse"></div>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden z-10">
        <div className="max-w-[1920px] mx-auto px-4 md:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 lg:gap-32 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-brand-teal font-black uppercase tracking-[0.5em] mb-10 block text-[10px] md:text-xs">
                The WorkinEU Identity
              </span>
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-slate-900 dark:text-white mb-12 tracking-tight leading-[0.85]">
                Dubai Heart, <br />{" "}
                <span className="text-brand-teal italic font-serif">
                  Global
                </span>{" "}
                Reach
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-xl md:text-2xl font-medium leading-relaxed mb-16 max-w-2xl">
                {content?.aboutUs ||
                  "WorkinEU Human Resources Consultancies LLC is a premier recruitment agency dedicated to connecting skilled professionals with life-changing opportunities across Europe and the Middle East."}
              </p>
              <div className="flex flex-wrap gap-6">
                <Link
                  to="/jobs"
                  className="bg-slate-900 text-white px-12 py-6 rounded-2xl font-bold hover:bg-brand-gold hover:text-slate-900 dark:text-white transition-all shadow-2xl flex items-center gap-3 text-lg group"
                >
                  Explore Jobs{" "}
                  <ArrowRight
                    size={24}
                    className="group-hover:translate-x-2 transition-transform"
                  />
                </Link>
                <Link
                  to="/diary"
                  className="bg-white text-slate-900 dark:text-white px-12 py-6 rounded-2xl font-bold hover:bg-slate-50 transition-all border border-slate-100 shadow-xl text-lg"
                >
                  Success Stories
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="aspect-square lg:aspect-[4/5] rounded-[4rem] overflow-hidden shadow-[0_80px_160px_-30px_rgba(15,23,42,0.4)] border-[12px] border-white dark:border-[#0f172a] relative z-10 group bg-slate-100 dark:bg-white/5">
                <img
                  src={
                    content?.aboutImageUrl ||
                    "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=80&w=1200"
                  }
                  alt="About Us"
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121212]/60 via-transparent to-transparent"></div>
              </div>
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -bottom-16 -left-16 bg-brand-teal p-12 md:p-16 rounded-[3rem] shadow-2xl z-20 hidden md:block border-8 border-white dark:border-[#121212]"
              >
                <div className="text-white">
                  <span className="text-7xl font-black block mb-2 tracking-tighter">
                    12+
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">
                    Years of Excellence
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-40 relative z-10">
        <div className="max-w-[1920px] mx-auto px-4 md:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <motion.div
              whileHover={{ y: -15 }}
              className="bg-white dark:bg-white/5 p-16 rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(15,23,42,0.1)] border border-slate-100 dark:border-white/5 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-gold/5 rounded-bl-[4rem] -mr-12 -mt-12 group-hover:bg-brand-gold/10 transition-all"></div>
              <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white rounded-2xl flex items-center justify-center mb-10 shadow-inner group-hover:bg-white group-hover:text-slate-900 dark:group-hover:bg-brand-teal dark:group-hover:text-white transition-all duration-500">
                <Target size={36} />
              </div>
              <h3 className="text-4xl font-bold text-slate-900 dark:text-white mb-8 tracking-tight">
                Our Mission
              </h3>
              <p className="text-slate-500 dark:text-slate-300 leading-relaxed font-light text-xl">
                {content?.mission ||
                  "To provide ethical, transparent, and efficient recruitment solutions that bridge the gap between global talent and European opportunities, ensuring sustainable growth for all stakeholders."}
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -15 }}
              className="bg-white dark:bg-white/5 p-16 rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(15,23,42,0.1)] border border-slate-100 dark:border-white/5 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-gold/5 rounded-bl-[4rem] -mr-12 -mt-12 group-hover:bg-brand-gold/10 transition-all"></div>
              <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white rounded-2xl flex items-center justify-center mb-10 shadow-inner group-hover:bg-white group-hover:text-slate-900 dark:group-hover:bg-brand-teal dark:group-hover:text-white transition-all duration-500">
                <Eye size={36} />
              </div>
              <h3 className="text-4xl font-bold text-slate-900 dark:text-white mb-8 tracking-tight">
                Our Vision
              </h3>
              <p className="text-slate-500 dark:text-slate-300 leading-relaxed font-light text-xl">
                {content?.vision ||
                  "To be the most trusted global partner in human resource solutions, recognized for our commitment to ethical practices and the professional success of the candidates we serve."}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-40 bg-white dark:bg-[#121212] relative z-10 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-brand-teal/5 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="max-w-[1920px] mx-auto px-4 md:px-8 lg:px-12 relative">
          <div className="text-center max-w-4xl mx-auto mb-32">
            <span className="text-brand-teal font-black uppercase tracking-[0.5em] mb-10 block text-[10px] md:text-xs">
              Our Foundation
            </span>
            <h2 className="text-6xl md:text-9xl font-black text-slate-900 dark:text-white tracking-tight">
              Core Values
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {(
              content?.values || [
                {
                  title: "Integrity",
                  description:
                    "We uphold the highest standards of honesty and ethical behavior in all our interactions.",
                },
                {
                  title: "Transparency",
                  description:
                    "Clear communication and no hidden agendas in our recruitment processes.",
                },
                {
                  title: "Excellence",
                  description:
                    "Striving for the best outcomes for our candidates and partner employers.",
                },
                {
                  title: "Empathy",
                  description:
                    "Understanding the dreams and challenges of those seeking international careers.",
                },
              ]
            ).map((value, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="p-12 bg-slate-50 dark:bg-white/5 rounded-[4rem] border border-slate-100 dark:border-white/10 hover:bg-white dark:hover:bg-slate-900 hover:shadow-premium transition-all duration-700 group overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/5 rounded-bl-[4rem] -mr-10 -mt-10 group-hover:bg-brand-teal/10 transition-all"></div>
                <div className="w-20 h-20 bg-[#121212] dark:bg-brand-teal text-white dark:text-[#121212] rounded-[1.5rem] flex items-center justify-center mb-12 shadow-xl group-hover:scale-110 transition-transform duration-500">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">
                  {value.title}
                </h4>
                <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed font-semibold">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-40 bg-slate-50 dark:bg-white/5 overflow-hidden relative z-10">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-gold/5 skew-x-12 translate-x-1/4"></div>
        <div className="max-w-[1920px] mx-auto px-4 md:px-8 lg:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
            <div>
              <span className="text-brand-gold font-bold uppercase tracking-[0.5em] mb-8 block text-xs">
                The Advantage
              </span>
              <h2 className="text-5xl md:text-8xl font-bold text-slate-900 dark:text-white mb-12 tracking-tighter leading-none">
                Why Partner <br />{" "}
                <span className="text-brand-gold italic">With Us?</span>
              </h2>
              <div className="space-y-12">
                {[
                  {
                    icon: <Award size={32} />,
                    title: "Licensed & Certified",
                    desc: "Fully compliant with international recruitment laws and regulations.",
                  },
                  {
                    icon: <Globe2 size={32} />,
                    title: "Global Network",
                    desc: "Direct partnerships with top-tier employers across the EU and Gulf.",
                  },
                  {
                    icon: <ShieldCheck size={32} />,
                    title: "Candidate Protection",
                    desc: "We prioritize your safety and legal rights throughout the journey.",
                  },
                  {
                    icon: <Users2 size={32} />,
                    title: "Expert Team",
                    desc: "Decades of combined experience in international HR and visa processing.",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-8 group">
                    <div className="w-16 h-16 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center text-brand-gold shrink-0 border border-slate-100 dark:border-white/10 group-hover:bg-brand-gold group-hover:text-slate-900 dark:group-hover:text-slate-900 transition-all duration-500 shadow-xl">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
                        {item.title}
                      </h4>
                      <p className="text-slate-600 dark:text-slate-400 font-medium text-lg leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <motion.div
                whileHover={{ rotateY: -5, rotateX: 5 }}
                className="aspect-[4/5] rounded-[5rem] overflow-hidden shadow-[0_60px_120px_-20px_rgba(0,0,0,0.5)] border-[16px] border-white/5 group perspective-1000"
              >
                <img
                  src={
                    content?.whyChooseUsImageUrl ||
                    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1200"
                  }
                  alt="Our Advantage"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121212]/60 via-transparent to-transparent"></div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
      <BottomCTA />
    </div>
  );
}
