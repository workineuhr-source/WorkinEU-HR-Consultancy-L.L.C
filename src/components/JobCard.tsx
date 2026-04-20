import { Link } from 'react-router-dom';
import { Job } from '../types';
import { MapPin, Briefcase, Calendar, ChevronRight, DollarSign, AlertCircle, Sparkles, Share2, Mail, Linkedin, MessageCircle, Copy, X, Plane, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';

interface JobCardProps {
  job: Job;
  onQuickApply?: () => void;
}

export default function JobCard({ job, onQuickApply }: JobCardProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const deadlineDate = new Date(job.deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isApproaching = diffDays >= 0 && diffDays <= 7;

  const jobUrl = `${window.location.origin}/jobs/${job.id}`;

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: `Check out this job opportunity in ${job.country}: ${job.title}`,
        url: jobUrl,
      }).catch(() => {
        setShowShareMenu(true);
      });
    } else {
      setShowShareMenu(true);
    }
  };

  const copyToClipboard = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(jobUrl);
    toast.success("Link copied to clipboard!");
    setShowShareMenu(false);
  };

  const shareViaEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const subject = encodeURIComponent(`Job Opportunity: ${job.title} in ${job.country}`);
    const body = encodeURIComponent(`Check out this job opportunity: ${job.title} in ${job.country}\n\nLink: ${jobUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShowShareMenu(false);
  };

  const shareViaWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const text = encodeURIComponent(`Check out this job opportunity: ${job.title} in ${job.country}\n\nLink: ${jobUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setShowShareMenu(false);
  };

  const shareViaLinkedIn = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = encodeURIComponent(jobUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
    setShowShareMenu(false);
  };

  return (
    <motion.div 
      whileHover={{ y: -12 }}
      className={cn(
        "group relative bg-white dark:bg-[#0f172a]/40 rounded-[2.5rem] md:rounded-[3rem] overflow-hidden border transition-all duration-700 flex flex-col h-full",
        isApproaching 
          ? "border-brand-rose/20 dark:border-brand-rose/30 hover:border-brand-rose/50 shadow-[0_20px_50px_-12px_rgba(251,113,133,0.1)]" 
          : "border-slate-100 dark:border-white/5 hover:border-brand-teal/20 hover:shadow-[0_60px_100px_-20px_rgba(15,23,42,0.12)]"
      )}
    >
      {/* Absolute Overlays (Type Badge & Share) */}
      <div className="absolute top-6 right-6 z-20 flex flex-col gap-3 items-end">
        <span className="bg-white/90 backdrop-blur-md text-[#020617] px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all group-hover:bg-brand-teal group-hover:text-white text-center">
          {job.type}
        </span>
        <button 
          onClick={handleShare}
          className="w-10 h-10 bg-slate-900/10 hover:bg-slate-900 dark:bg-white/10 dark:hover:bg-white backdrop-blur-md text-slate-900 dark:text-white hover:text-white dark:hover:text-slate-900 rounded-full flex items-center justify-center transition-all shadow-xl border border-slate-900/10 dark:border-white/20"
          title="Share Job"
        >
          <Share2 size={16} />
        </button>
      </div>

      <AnimatePresence>
        {showShareMenu && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#020617]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowShareMenu(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="flex flex-col items-center w-full"
            >
              <button 
                onClick={() => setShowShareMenu(false)}
                className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <h4 className="text-white font-black text-xs uppercase tracking-[0.4em] mb-8">Share Opportunity</h4>
              <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                <button onClick={shareViaEmail} className="flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group">
                  <Mail size={24} className="text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] text-white/60 font-black uppercase tracking-widest">Email</span>
                </button>
                <button onClick={shareViaLinkedIn} className="flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group">
                  <Linkedin size={24} className="text-[#0077b5] group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] text-white/60 font-black uppercase tracking-widest">LinkedIn</span>
                </button>
                <button onClick={shareViaWhatsApp} className="flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group">
                  <MessageCircle size={24} className="text-green-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] text-white/60 font-black uppercase tracking-widest">WhatsApp</span>
                </button>
                <button onClick={copyToClipboard} className="flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group">
                  <Copy size={24} className="text-slate-300 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] text-white/60 font-black uppercase tracking-widest">Copy Link</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {job.imageUrl && (
        <div className="h-56 md:h-64 w-full overflow-hidden relative">
          <img 
            src={job.imageUrl} 
            alt={job.title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/90 via-[#020617]/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-700"></div>
          
          <div className="absolute top-6 left-6 flex flex-col gap-3 text-white z-10">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full shadow-2xl">
              <MapPin size={14} className="text-brand-teal" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{job.country}</span>
            </div>
            
            {isApproaching && (
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex items-center gap-2 bg-brand-rose px-4 py-2 rounded-full shadow-xl"
              >
                <AlertCircle size={14} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Priority</span>
              </motion.div>
            )}
          </div>
        </div>
      )}
      
      <div className="p-6 md:p-10 flex flex-col flex-grow relative">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-300 mb-6">
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-500",
              isApproaching 
                ? "bg-brand-rose/10 border-brand-rose/20 text-brand-rose" 
                : "bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 group-hover:bg-brand-teal group-hover:text-white group-hover:border-brand-teal"
            )}>
              <Briefcase size={14} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] truncate">{job.category}</span>
          </div>
          
          <h3 className={cn(
            "text-2xl md:text-3xl font-black transition-all leading-[1.1] tracking-tight font-sans mb-6 line-clamp-2",
            isApproaching ? "text-slate-900 dark:text-white group-hover:text-brand-rose" : "text-slate-900 dark:text-white group-hover:text-brand-teal"
          )}>
            {job.title}
          </h3>
          
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200 text-[11px] font-bold uppercase tracking-[0.2em] bg-slate-50 dark:bg-white/5 px-4 py-2 rounded-xl border border-slate-100 dark:border-white/5">
              <Calendar size={14} className="text-brand-teal shrink-0" />
              <span className="truncate">{job.experience} Experience</span>
            </div>
            
            {/* Package Highlights */}
            {job.includedPackageItems && job.includedPackageItems.some(i => i.toLowerCase().includes('ticket')) && (
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-500/20">
                <Plane size={14} /> Ticket Included
              </div>
            )}
            {job.includedPackageItems && job.includedPackageItems.some(i => i.toLowerCase().includes('visa')) && (
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20">
                <CheckCircle2 size={14} /> Visa Included
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5">

            {isApproaching && (
              <div className="flex items-center gap-3 text-brand-rose text-[11px] font-black uppercase tracking-[0.3em] bg-brand-rose/10 px-5 py-3 rounded-2xl w-fit border border-brand-rose/20">
                <Sparkles size={14} className="animate-pulse" />
                <span>Expiring Soon</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-auto pt-8 md:pt-10 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-4 transition-colors">
          <div className="space-y-1 min-w-0 flex-grow">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300">
              <DollarSign size={12} className="text-brand-teal shrink-0" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] truncate">Salary</p>
            </div>
            <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter truncate">
              <span className="text-brand-teal text-lg md:text-xl mr-1">{job.currency || '€'}</span>
              {job.minSalary} - {job.maxSalary}
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={(e) => {
                e.preventDefault();
                onQuickApply?.();
              }}
              className="flex-1 sm:flex-none px-6 py-4 md:px-8 md:py-6 rounded-2xl md:rounded-[1.5rem] bg-brand-gold text-slate-900 font-black text-[10px] md:text-[11px] uppercase tracking-[0.2em] transition-all duration-500 shadow-xl hover:bg-slate-900 hover:text-white hover:-translate-y-1 flex items-center justify-center gap-3 group/quick"
            >
              <Sparkles size={18} className="group-hover/quick:rotate-12 transition-transform" />
              <span>Quick Apply</span>
            </button>

            <Link 
              to={`/jobs/${job.id}`} 
              className={cn(
                "flex-1 sm:flex-none px-6 py-4 md:px-8 md:py-6 rounded-2xl md:rounded-[1.5rem] font-black text-[10px] md:text-[11px] uppercase tracking-[0.2em] transition-all duration-500 shadow-xl flex items-center justify-center gap-3 group/btn",
                isApproaching 
                  ? "bg-brand-rose text-white hover:shadow-brand-rose/30" 
                  : "bg-slate-900 dark:bg-premium-gradient-animated text-white hover:shadow-brand-teal/30 hover:-translate-y-1"
              )}
            >
              Details
              <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Subtle hover overlay */}
      <div className={cn(
        "absolute inset-0 border-2 border-transparent rounded-[3rem] pointer-events-none transition-all duration-700",
        isApproaching ? "group-hover:border-brand-rose/30" : "group-hover:border-brand-teal/20"
      )}></div>
    </motion.div>
  );
}
