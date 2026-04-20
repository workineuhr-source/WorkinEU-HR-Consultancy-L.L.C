import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, getDocs, query, orderBy, doc, updateDoc, arrayUnion, getDoc, addDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Job, CandidateProfile } from '../types';
import JobCard from '../components/JobCard';
import ApplicationForm from '../components/ApplicationForm';
import { getJobRecommendations } from '../services/aiService';
import { Search, Filter, SlidersHorizontal, X, ChevronLeft, ChevronRight, MapPin, Briefcase, Clock, Sparkles, Bell, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import BottomCTA from '../components/BottomCTA';

const JOBS_PER_PAGE = 24;

export default function JobsPage() {
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [alertEmail, setAlertEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [selectedJobToApply, setSelectedJobToApply] = useState<Job | null>(null);
  const [isQuickApply, setIsQuickApply] = useState(false);

  // Track search history
  const trackSearch = useCallback(async (term: string) => {
    if (!auth.currentUser || !term.trim() || term.length < 3) return;
    
    try {
      const userRef = doc(db, 'candidates', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentHistory = (userSnap.data() as CandidateProfile).searchHistory || [];
        const normalizedTerm = term.trim().toLowerCase();
        
        if (!currentHistory.includes(normalizedTerm)) {
          const newHistory = [normalizedTerm, ...currentHistory].slice(0, 20);
          await updateDoc(userRef, {
            searchHistory: newHistory,
            updatedAt: Date.now()
          });
        }
      }
    } catch (error) {
      console.error("Error tracking search:", error);
    }
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const timer = setTimeout(() => {
        trackSearch(searchTerm);
      }, 2000); // Debounce search tracking
      return () => clearTimeout(timer);
    }
  }, [searchTerm, trackSearch]);

  // Filters
  const [filters, setFilters] = useState({
    country: searchParams.get('country') || '',
    category: searchParams.get('category') || '',
    experience: '',
  });

  useEffect(() => {
    // Update filters if searchParams change (e.g. clicking a link while already on the page)
    const country = searchParams.get('country') || '';
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    
    setFilters(prev => ({ ...prev, country, category }));
    setSearchTerm(search);
  }, [searchParams]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
        setJobs(jobsData);
        setFilteredJobs(jobsData);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    let unsubscribe: () => void;

    const setupProfileListener = async () => {
      if (!auth.currentUser || jobs.length === 0) {
        setRecommendedJobs([]);
        return;
      }

      unsubscribe = onSnapshot(doc(db, 'candidates', auth.currentUser.uid), async (snapshot) => {
        if (snapshot.exists()) {
          const profile = { uid: snapshot.id, ...snapshot.data() } as CandidateProfile;
          
          setLoadingRecommendations(true);
          try {
            const recommendedIds = await getJobRecommendations(profile, jobs);
            const recommended = jobs.filter(job => recommendedIds.includes(job.id));
            setRecommendedJobs(recommended);
          } catch (error) {
            console.error("Error fetching recommendations:", error);
          } finally {
            setLoadingRecommendations(false);
          }
        }
      });
    };

    setupProfileListener();
    return () => unsubscribe?.();
  }, [jobs]); // Re-run if jobs list changes, profile is handled by snapshot

  useEffect(() => {
    let result = jobs;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(job => 
        job.title.toLowerCase().includes(term) ||
        job.country.toLowerCase().includes(term) ||
        job.category.toLowerCase().includes(term) ||
        job.description.toLowerCase().includes(term) ||
        job.requirements.some(req => req.toLowerCase().includes(term)) ||
        job.responsibilities.some(resp => resp.toLowerCase().includes(term)) ||
        job.type.toLowerCase().includes(term)
      );
    }

    if (filters.country) {
      result = result.filter(job => job.country === filters.country);
    }

    if (filters.category) {
      result = result.filter(job => job.category === filters.category);
    }

    if (filters.experience) {
      result = result.filter(job => job.experience.includes(filters.experience));
    }

    setFilteredJobs(result);
    setCurrentPage(1); // Reset to first page on filter change
  }, [searchTerm, filters, jobs]);

  const totalPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE);
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * JOBS_PER_PAGE,
    currentPage * JOBS_PER_PAGE
  );

  const countries = Array.from(new Set(jobs.map(j => j.country)));
  const categories = Array.from(new Set(jobs.map(j => j.category)));
  const experiences = ["Entry Level", "1-3 Years", "3-5 Years", "5+ Years"];

  const clearFilters = () => {
    setFilters({ country: '', category: '', experience: '' });
    setSearchTerm('');
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertEmail) return;
    
    setSubscribing(true);
    try {
      const alertData = {
        email: alertEmail,
        country: filters.country || undefined,
        category: filters.category || undefined,
        keywords: searchTerm || undefined,
        active: true,
        createdAt: Date.now()
      };

      // Add to general jobAlerts collection
      await addDoc(collection(db, 'jobAlerts'), alertData);

      // If user is logged in, also add to their profile
      if (auth.currentUser) {
        const userRef = doc(db, 'candidates', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const profile = userSnap.data() as CandidateProfile;
          const updatedAlerts = [...(profile.jobAlerts || []), { ...alertData, id: `ALERT-${Date.now()}` }];
          await updateDoc(userRef, {
            jobAlerts: updatedAlerts,
            updatedAt: Date.now()
          });
        }
      }

      toast.success("You've subscribed to job alerts!");
      setAlertEmail('');
    } catch (error) {
      console.error("Error subscribing to alerts:", error);
      toast.error("Failed to subscribe to job alerts.");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen py-32 relative overflow-hidden transition-colors duration-500">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-mesh opacity-10 dark:opacity-20 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-gold/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
      
      <div className="max-w-[1920px] mx-auto px-4 md:px-8 lg:px-10 relative z-10">
        {/* Header */}
        <div className="mb-32 text-center max-w-5xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none"
          ></motion.div>
          
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-brand-gold font-bold uppercase tracking-[0.6em] mb-10 block text-sm"
          >
            Premium Career Network
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-9xl lg:text-[10rem] font-bold text-slate-900 dark:text-white mb-8 md:mb-12 tracking-tighter leading-none"
          >
            Job <span className="text-brand-gold italic font-serif">Portal</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-3xl font-light leading-relaxed mb-12 md:mb-16 max-w-4xl mx-auto text-slate-500 dark:text-slate-300"
          >
            Your gateway to the European labor market. Discover verified opportunities across 24+ countries.
          </motion.p>

          {/* Prominent Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-5xl mx-auto mb-16 relative group px-4 md:px-0"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-gold via-brand-gold/50 to-brand-gold rounded-3xl md:rounded-[3rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl md:rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(15,23,42,0.1)] border border-slate-100 dark:border-white/10 overflow-hidden p-2 md:p-3">
              <div className="pl-4 md:pl-8 text-slate-300 group-focus-within:text-brand-gold transition-colors">
                <Search size={24} className="md:w-9 md:h-9" />
              </div>
              <input 
                type="text" 
                placeholder="Search jobs..."
                className="w-full px-4 md:px-6 py-4 md:py-10 outline-none text-lg md:text-3xl font-medium text-slate-900 dark:text-white placeholder:text-slate-300 bg-transparent transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              <div className="flex items-center gap-4 pr-4">
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                )}
                <div className="h-12 w-px bg-slate-100 dark:bg-white/10 block"></div>
                <div>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      "px-6 md:px-12 py-4 md:py-7 rounded-2xl font-black text-sm md:text-xl transition-all flex items-center gap-2 md:gap-4 shadow-xl",
                      showFilters ? "bg-brand-gold text-slate-900" : "bg-slate-900 dark:bg-brand-gold/10 text-white dark:text-brand-gold hover:bg-slate-800 dark:hover:bg-brand-gold/20"
                    )}
                  >
                    <SlidersHorizontal size={18} className="md:w-7 md:h-7" />
                    <span className="hidden sm:inline">Filters</span>
                  </motion.button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-8 mt-12">
              <span className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">Trending Searches:</span>
              {['Nurse', 'Driver', 'Germany', 'Warehouse', 'IT', 'Hospitality'].map(tag => (
                <button 
                  key={tag}
                  onClick={() => setSearchTerm(tag)}
                  className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-brand-gold transition-colors border-b-2 border-transparent hover:border-brand-gold pb-1"
                >
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-4 px-10 py-5 bg-white dark:bg-slate-800/80 backdrop-blur-md border border-slate-100 dark:border-white/10 rounded-full shadow-2xl"
          >
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-4 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="h-8 w-px bg-slate-100 dark:bg-white/10 mx-2"></div>
            <div className="flex items-center gap-3">
              <span className="text-brand-gold font-black text-xl">{filteredJobs.length}</span>
              <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[10px]">Active Positions</span>
            </div>
          </motion.div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0, y: -20 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -20 }}
              className="overflow-hidden mb-24 relative z-20"
            >
              <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-2xl p-10 md:p-16 rounded-[4rem] border border-white dark:border-white/10 shadow-[0_50px_100px_-20px_rgba(15,23,42,0.1)]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
                  <div className="space-y-6">
                    <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em] ml-10">Select Country</label>
                    <div className="relative group">
                      <MapPin className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-brand-gold transition-colors" size={24} />
                      <select 
                        className="w-full pl-20 pr-12 py-8 rounded-[2.5rem] border border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-brand-gold focus:ring-[12px] focus:ring-brand-gold/5 transition-all duration-500 text-slate-900 dark:text-white font-bold shadow-inner appearance-none cursor-pointer text-xl"
                        value={filters.country}
                        onChange={(e) => setFilters({...filters, country: e.target.value})}
                      >
                        <option value="">All Countries</option>
                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em] ml-10">Job Category</label>
                    <div className="relative group">
                      <Briefcase className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-brand-gold transition-colors" size={24} />
                      <select 
                        className="w-full pl-20 pr-12 py-8 rounded-[2.5rem] border border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-brand-gold focus:ring-[12px] focus:ring-brand-gold/5 transition-all duration-500 text-slate-900 dark:text-white font-bold shadow-inner appearance-none cursor-pointer text-xl"
                        value={filters.category}
                        onChange={(e) => setFilters({...filters, category: e.target.value})}
                      >
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em] ml-10">Experience Level</label>
                    <div className="relative group">
                      <Clock className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-brand-gold transition-colors" size={24} />
                      <select 
                        className="w-full pl-20 pr-12 py-8 rounded-[2.5rem] border border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-brand-gold focus:ring-[12px] focus:ring-brand-gold/5 transition-all duration-500 text-slate-900 dark:text-white font-bold shadow-inner appearance-none cursor-pointer text-xl"
                        value={filters.experience}
                        onChange={(e) => setFilters({...filters, experience: e.target.value})}
                      >
                        <option value="">Any Experience</option>
                        {experiences.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center mt-12">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={clearFilters}
                    className="px-12 py-5 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl font-bold text-xs uppercase tracking-[0.4em] transition-all flex items-center gap-4 border border-slate-100 dark:border-white/5"
                  >
                    <X size={20} /> Reset All Filters
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Recommendations */}
        {auth.currentUser && (recommendedJobs.length > 0 || loadingRecommendations) && (
          <div className="mb-40 relative group">
            <div className="absolute -inset-10 bg-brand-gold/5 rounded-[6rem] blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 relative">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-brand-gold/10 text-brand-gold rounded-[2rem] flex items-center justify-center shadow-2xl border border-brand-gold/20 shrink-0">
                  <Sparkles size={40} className="animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-4 py-1 bg-brand-gold text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-full">AI Driven</span>
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Personalized Engine</span>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">Recommended for You</h2>
                  <p className="text-xl text-slate-500 dark:text-slate-300 font-medium max-w-2xl">
                    Our intelligence engine has hand-picked these opportunities based on your unique profile, skills, and recent search patterns.
                  </p>
                </div>
              </div>
              
              {loadingRecommendations && (
                <div className="flex items-center gap-4 px-8 py-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 shadow-inner">
                  <Loader2 className="animate-spin text-brand-gold" size={20} />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Refreshing Suggestions...</span>
                </div>
              )}
            </div>

            {loadingRecommendations ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white dark:bg-slate-800/50 rounded-[3rem] h-[500px] animate-pulse border border-slate-100 dark:border-white/5"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                {recommendedJobs.map((job, i) => (
                  <motion.div
                    key={`rec-${job.id}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <JobCard 
                      job={job} 
                      onQuickApply={() => {
                        setSelectedJobToApply(job);
                        setIsQuickApply(true);
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-12">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800/50 rounded-[3rem] h-[500px] animate-pulse border border-slate-100 dark:border-white/5"></div>
            ))}
          </div>
        ) : filteredJobs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-12">
              {paginatedJobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: (i % 8) * 0.05 }}
                  viewport={{ once: true }}
                >
                  <JobCard 
                    job={job} 
                    onQuickApply={() => {
                      setSelectedJobToApply(job);
                      setIsQuickApply(true);
                    }}
                  />
                </motion.div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-32 flex justify-center items-center gap-4 md:gap-6">
                <motion.button
                  whileHover={{ scale: 1.1, x: -5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/10 flex items-center justify-center text-slate-900 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed shadow-xl hover:border-brand-gold transition-all group"
                >
                  <ChevronLeft size={24} className="md:w-8 md:h-8 group-hover:-translate-x-1 transition-transform" />
                </motion.button>
                
                <div className="flex items-center gap-2 md:gap-4">
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (
                      page === 1 || 
                      page === totalPages || 
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <motion.button
                          key={page}
                          whileHover={{ scale: 1.1, y: -5 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            "w-12 h-12 md:w-20 md:h-20 rounded-2xl md:rounded-3xl font-bold text-base md:text-xl transition-all",
                            currentPage === page 
                              ? "bg-brand-blue text-white shadow-2xl shadow-brand-blue/20" 
                              : "bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-white/10 hover:border-brand-gold hover:text-slate-900 dark:hover:text-white"
                          )}
                        >
                          {page}
                        </motion.button>
                      );
                    } else if (
                      page === currentPage - 2 || 
                      page === currentPage + 2
                    ) {
                      return <span key={page} className="text-slate-300 dark:text-slate-600 font-bold px-2 md:px-4 text-xl md:text-2xl">...</span>;
                    }
                    return null;
                  })}
                </div>

                <motion.button
                  whileHover={{ scale: 1.1, x: 5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/10 flex items-center justify-center text-slate-900 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed shadow-xl hover:border-brand-gold transition-all group"
                >
                  <ChevronRight size={24} className="md:w-8 md:h-8 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            )}
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-64 bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-[5rem] md:rounded-[8rem] border border-slate-100 dark:border-white/10 shadow-[0_120px_250px_-60px_rgba(15,23,42,0.15)] relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-[0.04]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-gold/5 rounded-full blur-[150px]"></div>
            
            <div className="relative z-10 px-10">
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-56 h-56 bg-slate-50 dark:bg-white/5 rounded-[5rem] flex items-center justify-center mx-auto mb-20 text-slate-200 shadow-inner border border-white dark:border-white/10"
              >
                <Search size={100} className="text-slate-200 dark:text-slate-700" />
              </motion.div>
              <h3 className="text-7xl md:text-9xl font-bold text-slate-900 dark:text-white mb-10 tracking-tighter">No results found</h3>
              <p className="text-slate-500 dark:text-slate-400 text-3xl font-light mb-24 max-w-3xl mx-auto leading-relaxed">We couldn't find any positions matching your current search criteria. Try broadening your search or resetting the filters.</p>
              <motion.button 
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearFilters}
                className="bg-brand-blue text-white px-24 py-10 rounded-[3rem] font-bold text-2xl shadow-2xl hover:bg-brand-gold hover:text-slate-900 transition-all duration-500 flex items-center gap-6 mx-auto"
              >
                <X size={32} /> Reset All Filters
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Job Alerts Section (Redesigned) */}
        <motion.div 
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-40 relative group/alerts"
        >
          <div className="absolute -inset-10 bg-brand-gold/5 dark:bg-brand-teal/5 rounded-[6rem] blur-[120px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
          
          <div className="bg-slate-900 border border-slate-800 dark:border-white/5 rounded-[4rem] md:rounded-[6rem] overflow-hidden relative shadow-2xl">
            {/* Animated background highlights */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-gold/10 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-teal/10 rounded-full blur-[80px] -translate-x-1/3 translate-y-1/3 animate-pulse" style={{ animationDelay: '2s' }}></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 relative z-10">
              {/* Left Side: Content */}
              <div className="lg:col-span-7 p-12 md:p-20 lg:p-24 flex flex-col justify-center">
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-[10px] font-black uppercase tracking-[0.4em] mb-10 w-fit">
                  <Bell size={14} className="animate-bounce" />
                  Smart Notifications
                </div>
                
                <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-10 tracking-tighter leading-[0.9] group-hover:translate-x-2 transition-transform duration-700">
                  Stay Ahead <br /> Of Every <span className="text-brand-gold italic font-serif">Dream</span>
                </h2>
                
                <p className="text-slate-400 text-lg md:text-xl font-light leading-relaxed mb-12 max-w-lg">
                  Set up precision alerts for your next career jump. We'll notify you the moment a verified position matching your criteria goes live.
                </p>

                <div className="flex flex-wrap gap-3">
                  {filters.country && (
                    <div className="flex items-center gap-2 px-5 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300">
                      <MapPin size={12} className="text-brand-gold" />
                      {filters.country}
                    </div>
                  )}
                  {filters.category && (
                    <div className="flex items-center gap-2 px-5 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300">
                      <Briefcase size={12} className="text-brand-gold" />
                      {filters.category}
                    </div>
                  )}
                  {(!filters.country && !filters.category) && (
                    <div className="flex items-center gap-2 px-5 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300">
                      <Sparkles size={12} className="text-brand-gold" />
                      All Global Listings
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Form */}
              <div className="lg:col-span-5 bg-white/[0.03] dark:bg-black/20 backdrop-blur-3xl p-12 md:p-20 lg:p-24 border-l border-white/5 flex flex-col justify-center">
                <form onSubmit={handleSubscribe} className="space-y-6">
                  <div className="relative group/input">
                    <div className="absolute inset-0 bg-brand-gold/20 rounded-2xl blur-lg opacity-0 group-focus-within/input:opacity-100 transition-opacity"></div>
                    <div className="relative">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-brand-gold transition-colors" size={24} />
                      <input 
                        type="email" 
                        required
                        placeholder="your@email.com"
                        className="w-full pl-16 pr-6 py-8 bg-slate-800/50 border border-slate-700 rounded-2xl outline-none focus:border-brand-gold focus:bg-slate-800 transition-all text-xl font-bold text-white placeholder:text-slate-600"
                        value={alertEmail}
                        onChange={(e) => setAlertEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <motion.button 
                    whileHover={{ scale: 1.02, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={subscribing}
                    className="w-full py-8 bg-premium-gradient-animated text-white font-black rounded-2xl text-xl shadow-[0_20px_40px_-10px_rgba(45,212,191,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(45,212,191,0.5)] transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                  >
                    {subscribing ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (
                      <>
                        <Bell size={24} />
                        Activate Alerts
                      </>
                    )}
                  </motion.button>
                  
                  <p className="text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                    Unsubscribe instantly. Zero spam. <br /> Strictly job updates only.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Quick Apply Modal */}
      <AnimatePresence>
        {selectedJobToApply && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl"
              onClick={() => {
                setSelectedJobToApply(null);
                setIsQuickApply(false);
              }}
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white dark:bg-slate-900 rounded-[3rem] md:rounded-[4rem] shadow-[0_100px_200px_-50px_rgba(0,0,0,0.5)] w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 p-8 md:p-16 border border-slate-200 dark:border-white/5"
            >
              <button 
                onClick={() => {
                  setSelectedJobToApply(null);
                  setIsQuickApply(false);
                }}
                className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10"
              >
                <X size={24} />
              </button>
              
              <div className="mb-12">
                <span className="text-brand-gold font-bold uppercase tracking-[0.4em] text-[10px] mb-4 block">Quick Application</span>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
                  Applying for {selectedJobToApply.title}
                </h2>
                <div className="flex items-center gap-3 text-slate-500 font-medium">
                  <MapPin size={16} className="text-brand-teal" />
                  {selectedJobToApply.country}
                </div>
              </div>

              <ApplicationForm 
                job={selectedJobToApply} 
                onSuccess={() => {
                  setSelectedJobToApply(null);
                  setIsQuickApply(false);
                }}
                autoFillIntent={isQuickApply}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomCTA />
    </div>
  );
}
