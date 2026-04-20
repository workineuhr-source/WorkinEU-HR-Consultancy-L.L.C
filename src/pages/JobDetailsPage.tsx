import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Job } from '../types';
import { 
  MapPin, 
  Briefcase, 
  Calendar, 
  Clock, 
  ChevronLeft, 
  CheckCircle2, 
  FileText,
  Share2,
  MessageCircle,
  X,
  ArrowRight,
  Sparkles,
  ArrowUp,
  Mail,
  Copy,
  Linkedin,
  Home,
  CreditCard,
  ShieldAlert,
  PlaneTakeoff,
  Loader2,
  Globe2,
  ShieldCheck,
  FileSearch,
  UserPlus,
  ClipboardCheck,
  Users2,
  Globe,
  Award,
  Target,
  Shield,
  Phone,
  Zap,
  CheckCircle,
  Heart
} from 'lucide-react';
import ApplicationForm from '../components/ApplicationForm';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function JobDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [isQuickApply, setIsQuickApply] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<'Nepal' | 'Gulf' | 'Europe'>('Nepal');

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'jobs', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setJob({ id: docSnap.id, ...docSnap.data() } as Job);
        }
      } catch (error) {
        console.error("Error fetching job:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job?.title,
        text: `Check out this job opportunity in ${job?.country}: ${job?.title}`,
        url: window.location.href,
      }).catch(() => {
        setShowShareMenu(true);
      });
    } else {
      setShowShareMenu(true);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
    setShowShareMenu(false);
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Job Opportunity: ${job?.title} in ${job?.country}`);
    const body = encodeURIComponent(`Check out this job opportunity: ${job?.title} in ${job?.country}\n\nLink: ${window.location.href}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShowShareMenu(false);
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`Check out this job opportunity: ${job?.title} in ${job?.country}\n\nLink: ${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setShowShareMenu(false);
  };

  const shareViaLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
    setShowShareMenu(false);
  };

  const shareViaX = () => {
    const text = encodeURIComponent(`Check out this job opportunity: ${job?.title} in ${job?.country}`);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://x.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    setShowShareMenu(false);
  };

  const [activeTab, setActiveTab] = useState<'description' | 'responsibilities' | 'requirements'>('description');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-gold"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
        <h2 className="text-4xl font-bold text-slate-900 mb-6">Job Not Found</h2>
        <Link to="/jobs" className="text-brand-gold font-bold flex items-center gap-3 text-lg hover:text-slate-900 transition-colors">
          <ChevronLeft size={24} /> Back to Job Portal
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen py-24 md:py-32 relative overflow-hidden transition-colors duration-500">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-mesh opacity-10 dark:opacity-20 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-gold/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
      
      <div className="max-w-[1920px] mx-auto px-4 md:px-8 lg:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-6 mb-12">
            <Link to="/jobs" className="inline-flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all font-bold uppercase tracking-[0.3em] text-[10px] group">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center group-hover:bg-slate-900 dark:group-hover:bg-brand-gold group-hover:text-white dark:group-hover:text-brand-blue transition-all border border-slate-100 dark:border-white/5">
                <ChevronLeft size={20} />
              </div>
              Back to Listings
            </Link>
            <div className="h-4 w-px bg-slate-200 dark:bg-white/10"></div>
            <Link to="/" className="inline-flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:text-brand-teal transition-all font-bold uppercase tracking-[0.3em] text-[10px] group">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center group-hover:bg-brand-teal group-hover:text-white transition-all border border-slate-100 dark:border-white/5">
                <Home size={18} />
              </div>
              Site Home
            </Link>
          </div>
        </motion.div>


        {/* Redesigned Side-by-Side Header Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20 items-stretch">
          {/* Side Photo Container */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-12 xl:col-span-7 relative group"
          >
            <div className="absolute -inset-6 bg-brand-gold/10 rounded-[4rem] md:rounded-[6rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <div className="h-[450px] md:h-[650px] w-full rounded-[4rem] md:rounded-[5.5rem] overflow-hidden relative shadow-[0_60px_100px_-20px_rgba(15,23,42,0.25)] border-4 border-white/50 dark:border-white/10 group-hover:shadow-[0_80px_120px_-20px_rgba(15,23,42,0.35)] transition-all duration-700">
              {job.imageUrl ? (
                <img 
                  src={job.imageUrl} 
                  alt={job.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms] ease-out"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Briefcase size={80} className="text-slate-300 dark:text-slate-700" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
              
              {/* Floating Labels on Image */}
              <div className="absolute top-10 left-10 flex flex-col gap-4">
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="px-6 py-2 bg-brand-gold/90 backdrop-blur-md rounded-full text-brand-blue text-[10px] font-black uppercase tracking-[0.3em] shadow-xl"
                >
                  Featured Position
                </motion.div>
              </div>

              <div className="absolute bottom-12 left-12 right-12">
                <div className="flex flex-wrap items-end justify-between gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-white">
                        <MapPin size={24} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-brand-gold uppercase tracking-widest">Job Location</span>
                        <span className="text-2xl font-black text-white tracking-tight">{job.country}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl">
                      <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1">Experience</p>
                      <p className="text-white font-black text-lg">{job.experience}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Side Data Container */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-12 xl:col-span-5 flex flex-col justify-center"
          >
            <div className="bg-white dark:bg-slate-800/80 backdrop-blur-xl p-10 md:p-14 rounded-[4rem] border border-slate-100 dark:border-white/10 shadow-[0_50px_100px_-20px_rgba(15,23,42,0.1)] relative overflow-hidden h-full flex flex-col">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
              
              <div className="relative z-10 space-y-10 flex-grow">
                <div>
                  <div className="flex items-center gap-3 mb-8">
                    <span className="px-5 py-2 bg-brand-teal/10 text-brand-teal rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-teal/20">
                      {job.category}
                    </span>
                    <span className="px-5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/10">
                      {job.type}
                    </span>
                  </div>
                  
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-10 tracking-tighter leading-[0.95] group-hover:translate-x-2 transition-transform duration-700">
                    {job.title}
                  </h1>

                  <div className="grid grid-cols-2 gap-6 mb-12">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Salary</p>
                      <p className="text-3xl font-black text-brand-blue dark:text-brand-gold tracking-tighter">
                        {job.currency || '€'} {job.maxSalary}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Application Deadline</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                        {job.deadline}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-4 px-6 py-4 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 flex-grow">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-brand-gold">
                        <Sparkles size={24} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recruitment Type</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">Direct & Fast-Track</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={shareViaEmail}
                      className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all shadow-sm border border-blue-100/50"
                      title="Share via Email"
                    >
                      <Mail size={22} />
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={shareViaLinkedIn}
                      className="w-14 h-14 bg-[#0077b5]/10 text-[#0077b5] rounded-2xl flex items-center justify-center hover:bg-[#0077b5]/20 transition-all shadow-sm border border-[#0077b5]/20"
                      title="Share on LinkedIn"
                    >
                      <Linkedin size={22} />
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={shareViaWhatsApp}
                      className="w-14 h-14 bg-green-50 dark:bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center hover:bg-green-100 dark:hover:bg-green-500/20 transition-all shadow-sm border border-green-100/50"
                      title="Share via WhatsApp"
                    >
                      <MessageCircle size={22} />
                    </motion.button>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowApplyForm(true);
                      setIsQuickApply(true);
                    }}
                    className="w-full bg-slate-900 dark:bg-brand-gold text-white dark:text-brand-blue py-6 rounded-3xl font-black text-xl shadow-xl flex items-center justify-center gap-3 hover:bg-brand-gold dark:hover:bg-white hover:text-brand-blue dark:hover:text-brand-blue transition-all duration-300 group"
                  >
                    <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
                    Quick Apply
                  </motion.button>
                  
                  <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowApplyForm(true);
                      setIsQuickApply(false);
                    }}
                    className="w-full bg-brand-blue text-white py-6 rounded-3xl font-black text-xl shadow-xl flex items-center justify-center gap-3 hover:bg-slate-900 transition-all duration-300 group"
                  >
                    Apply Now
                    <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </div>

                <div className="mt-auto pt-10 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center">
                        <CheckCircle2 size={18} className="text-brand-gold" />
                      </div>
                      <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Ministry Verified Opportunity</p>
                   </div>
                   <div className="flex -space-x-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 overflow-hidden ring-1 ring-slate-200 dark:ring-white/10">
                           <img src={`https://i.pravatar.cc/100?u=candidates-${i}`} alt="Candidate" className="w-full h-full object-cover" />
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-10">

            {/* Content Tabs */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-[3rem] border border-slate-100 dark:border-white/10 shadow-[0_40px_80px_-20px_rgba(15,23,42,0.08)] overflow-hidden"
            >
              <div className="flex border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50">
                {(['description', 'responsibilities', 'requirements'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex-1 py-6 px-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative",
                      activeTab === tab ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    )}
                  >
                    {tab}
                    {activeTab === tab && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-1 bg-brand-gold"
                      />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-8 md:p-12 min-h-[400px]">
                <AnimatePresence mode="wait">
                  {activeTab === 'description' && (
                    <motion.div
                      key="description"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="prose prose-slate dark:prose-invert max-w-none"
                    >
                      <div className="text-lg text-slate-800 dark:text-slate-200 leading-relaxed font-light">
                        <Markdown>{job.description}</Markdown>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'responsibilities' && (
                    <motion.div
                      key="responsibilities"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {job.responsibilities.map((item, i) => (
                          <li key={i} className="flex items-start gap-4 p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 group hover:border-brand-gold transition-colors">
                            <div className="w-8 h-8 bg-brand-gold/10 text-brand-gold rounded-lg flex items-center justify-center shrink-0">
                              <CheckCircle2 size={16} />
                            </div>
                            <span className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                              <Markdown>{item}</Markdown>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {activeTab === 'requirements' && (
                    <motion.div
                      key="requirements"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {job.requirements.map((item, i) => (
                          <li key={i} className="flex items-start gap-4 p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 group hover:border-brand-gold transition-colors">
                            <div className="w-8 h-8 bg-brand-gold/10 text-brand-gold rounded-lg flex items-center justify-center shrink-0">
                              <CheckCircle2 size={16} />
                            </div>
                            <span className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                              <Markdown>{item}</Markdown>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Documents Section */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-brand-blue p-8 md:p-12 rounded-[3rem] relative overflow-hidden group shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
              <h3 className="text-2xl font-bold text-white mb-10 flex items-center gap-4 tracking-tight relative z-10">
                <div className="w-12 h-12 bg-brand-gold/20 text-brand-gold rounded-xl flex items-center justify-center">
                  <FileText size={24} />
                </div>
                Required Documents
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                {job.requiredDocuments.map((doc, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-all group/doc">
                    <FileText size={20} className="text-brand-gold group-hover/doc:scale-110 transition-transform" />
                    <span className="text-sm font-bold text-slate-300 tracking-tight">{doc}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-32">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-slate-800/80 backdrop-blur-md p-8 md:p-10 rounded-[3rem] border border-slate-100 dark:border-white/10 shadow-[0_40px_80px_-20px_rgba(15,23,42,0.15)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-gold/5 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2"></div>
              
              {/* Sidebar Content moved to top or removed for better flow */}
              <div className="space-y-6 mb-10 relative z-10">
                <div className="flex items-center gap-6 p-5 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/10">
                  <div className="w-14 h-14 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-brand-gold shadow-sm">
                    <Calendar size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Final Deadline</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">{job.deadline}</p>
                  </div>
                </div>
              </div>
              <p className="text-center text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] font-bold">
                Verified Opportunity
              </p>
            </motion.div>

            {/* Package Details Card */}
            {(() => {
              const pricing = job[`pricing${selectedRegion}` as 'pricingNepal' | 'pricingGulf' | 'pricingEurope'] || {
                totalAmount: job.totalAmount,
                initialPay: job.initialPay,
                payAfterWP: job.payAfterWP,
                payAfterVisa: job.payAfterVisa,
                visaFeeMin: job.visaFeeMin,
                visaFeeMax: job.visaFeeMax,
                currency: job.currency
              };

              const hasPricing = pricing.totalAmount || pricing.initialPay || pricing.payAfterWP || pricing.payAfterVisa || pricing.visaFeeMin || pricing.visaFeeMax;
              const hasItems = job.includedPackageItems?.length || job.excludedPackageItems?.length;

              if (!hasPricing && !hasItems) return null;

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-brand-gold/5 dark:bg-brand-gold/10 p-8 rounded-[3rem] border border-brand-gold/10"
                >
                  <div className="flex flex-col gap-6 mb-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard size={18} className="text-brand-gold" />
                        <h4 className="text-[10px] font-bold text-brand-gold uppercase tracking-[0.4em]">Fees & Package</h4>
                      </div>
                    </div>

                    <div className="flex bg-white/40 dark:bg-white/5 p-1 rounded-2xl border border-brand-gold/10">
                      {(['Nepal', 'Gulf', 'Europe'] as const).map((region) => (
                        <button
                          key={region}
                          onClick={() => setSelectedRegion(region)}
                          className={cn(
                            "flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                            selectedRegion === region 
                              ? "bg-brand-gold text-brand-blue shadow-lg" 
                              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                          )}
                        >
                          {region}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6 mb-8">
                    {pricing.totalAmount ? (
                      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-brand-gold/20 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/5 rounded-full -mr-8 -mt-8"></div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 relative z-10">Total Amount</span>
                        <span className="text-3xl font-black text-brand-blue dark:text-brand-gold tracking-tighter relative z-10">{pricing.currency || job.currency || '€'} {pricing.totalAmount}</span>
                      </div>
                    ) : (
                      <div className="text-center py-8 px-4 bg-slate-50/50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Fees not specified for {selectedRegion}</p>
                      </div>
                    )}

                    {pricing.totalAmount && (
                      <div className="grid grid-cols-1 gap-4">
                        {pricing.initialPay && (
                          <div className="flex justify-between items-center p-3 px-4 bg-white/40 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-white/5">
                            <span className="text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest">Initial Pay</span>
                            <span className="font-bold text-slate-900 dark:text-white text-sm">{pricing.currency || job.currency || '€'} {pricing.initialPay}</span>
                          </div>
                        )}
                        {pricing.payAfterWP && (
                          <div className="flex justify-between items-center p-3 px-4 bg-white/40 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-white/5">
                            <span className="text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest">After Work Permit</span>
                            <span className="font-bold text-slate-900 dark:text-white text-sm">{pricing.currency || job.currency || '€'} {pricing.payAfterWP}</span>
                          </div>
                        )}
                        {pricing.payAfterVisa && (
                          <div className="flex justify-between items-center p-3 px-4 bg-white/40 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-white/5">
                            <span className="text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest">After Visa</span>
                            <span className="font-bold text-slate-900 dark:text-white text-sm">{pricing.currency || job.currency || '€'} {pricing.payAfterVisa}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {(pricing.visaFeeMin || pricing.visaFeeMax) && (
                      <div className="p-5 bg-yellow-500/5 dark:bg-yellow-500/10 rounded-2xl border border-yellow-500/10 mt-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles size={14} className="text-yellow-600" />
                          <span className="text-[9px] font-black text-yellow-600 uppercase tracking-widest">Visa / VFS / Embassy Fee</span>
                        </div>
                        <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                          {pricing.currency || job.currency || '€'} {pricing.visaFeeMin} - {pricing.visaFeeMax}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium italic leading-relaxed">
                          Estimated external costs for {selectedRegion} processing.
                        </p>
                      </div>
                    )}

                    {/* Visa Refusal Note requested by User */}
                    <div className="p-5 bg-rose-500/5 dark:bg-rose-500/10 rounded-2xl border border-rose-500/10 mt-6 group">
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldAlert size={14} className="text-rose-600 group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Visa Refusal Terms</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic">
                        Note: In case of visa refusal, the risk amount is <span className="font-bold text-rose-600">{pricing.currency || job.currency || '€'} {pricing.riskAmount || '500'}</span>. 
                        However, we offer full support to reapply again. <strong>Reapplication for the visa is possible.</strong>
                      </p>
                    </div>
                  </div>

                {/* Inclusions / Exclusions */}
                <div className="space-y-8">
                  {job.includedPackageItems && job.includedPackageItems.filter(i => i.trim()).length > 0 && (
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle2 size={12} /> Included in Package
                      </p>
                      <ul className="space-y-2">
                        {job.includedPackageItems.filter(i => i.trim()).map((item, i) => (
                          <li key={i} className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-3">
                            <div className="w-1 h-1 rounded-full bg-blue-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {job.excludedPackageItems && job.excludedPackageItems.filter(i => i.trim()).length > 0 && (
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                        <ArrowUp size={12} className="rotate-45" /> Candidate Pays (Excluded)
                      </p>
                      <ul className="space-y-2">
                        {job.excludedPackageItems.filter(i => i.trim()).map((item, i) => (
                          <li key={i} className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-3">
                            <div className="w-1 h-1 rounded-full bg-rose-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {pricing.riskAmount && (
                  <div className="mt-10 pt-8 border-t border-brand-gold/10 relative px-2">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-orange-500/10 rounded-lg text-orange-600">
                        <X size={14} strokeWidth={3} />
                      </div>
                      <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.25em]">Visa Refusal Policy</span>
                    </div>
                    <div className="bg-orange-500/5 p-5 rounded-2xl border border-orange-500/10">
                      <p className="text-[11px] text-slate-700 dark:text-slate-200 font-bold leading-relaxed mb-1">
                        Note: In case of visa refusal, the risk amount is {pricing.currency || job.currency || '€'} {pricing.riskAmount}.
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium italic">
                        However, we do reapply again. Reapplication for the visa is possible.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })()}
        </div>
      </div>
    </div>

      {/* Application Modal */}
      {showApplyForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            onClick={() => setShowApplyForm(false)}
          ></motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[4rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative z-10 p-10 md:p-16 border border-slate-100"
          >
            <button 
              onClick={() => {
                setShowApplyForm(false);
                setIsQuickApply(false);
              }}
              className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors p-2 bg-slate-50 rounded-xl border border-slate-100"
            >
              <X size={24} />
            </button>
            <ApplicationForm 
              job={job} 
              onSuccess={() => {
                setShowApplyForm(false);
                setIsQuickApply(false);
              }} 
              autoFillIntent={isQuickApply}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}
