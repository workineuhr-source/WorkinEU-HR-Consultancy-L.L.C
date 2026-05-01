import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  addDoc,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { Job, CandidateProfile } from "../types";
import JobCard from "../components/JobCard";
import ApplicationForm from "../components/ApplicationForm";
import { getJobRecommendations } from "../services/aiService";
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Briefcase,
  Clock,
  Sparkles,
  Bell,
  Mail,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { toast } from "sonner";
import BottomCTA from "../components/BottomCTA";
import SEO from "../components/SEO";

export default function JobsPage() {
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );
  const [showFilters, setShowFilters] = useState(false);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [alertEmail, setAlertEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [selectedJobToApply, setSelectedJobToApply] = useState<Job | null>(
    null,
  );
  const [isQuickApply, setIsQuickApply] = useState(false);

  // Track search history
  const trackSearch = useCallback(async (term: string) => {
    if (!auth.currentUser || !term.trim() || term.length < 3) return;

    try {
      const userRef = doc(db, "candidates", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentHistory =
          (userSnap.data() as CandidateProfile).searchHistory || [];
        const normalizedTerm = term.trim().toLowerCase();

        if (!currentHistory.includes(normalizedTerm)) {
          const newHistory = [normalizedTerm, ...currentHistory].slice(0, 20);
          await updateDoc(userRef, {
            searchHistory: newHistory,
            updatedAt: Date.now(),
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
    country: searchParams.get("country") || "",
    category: searchParams.get("category") || "",
    experience: "",
  });

  useEffect(() => {
    // Update filters if searchParams change (e.g. clicking a link while already on the page)
    const country = searchParams.get("country") || "";
    const category = searchParams.get("category") || "";
    const search = searchParams.get("search") || "";

    setFilters((prev) => ({ ...prev, country, category }));
    setSearchTerm(search);
  }, [searchParams]);

  const handleTrendingClick = (tag: string) => {
    // Determine if it's a known country or category to set proper filters
    const knownCountries = ["Germany", "Croatia", "Malta", "Romania", "Poland", "Portugal"];
    const knownCategories = ["IT", "Hospitality", "Manufacturing", "Construction", "Healthcare"];
    
    if (knownCountries.includes(tag)) {
      setFilters({ country: tag, category: "", experience: "" });
      setSearchTerm("");
    } else if (knownCategories.includes(tag)) {
      setFilters({ country: "", category: tag, experience: "" });
      setSearchTerm("");
    } else {
      setSearchTerm(tag);
      setFilters({ country: "", category: "", experience: "" });
    }
  };

  useEffect(() => {
    const q = query(collection(db, "jobs"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const jobsData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Job,
        );
        setJobs(jobsData);
        setFilteredJobs(jobsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching jobs:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let unsubscribe: () => void;

    const setupProfileListener = async () => {
      if (!auth.currentUser || jobs.length === 0) {
        setRecommendedJobs([]);
        return;
      }

      unsubscribe = onSnapshot(
        doc(db, "candidates", auth.currentUser.uid),
        async (snapshot) => {
          if (snapshot.exists()) {
            const profile = {
              uid: snapshot.id,
              ...snapshot.data(),
            } as CandidateProfile;

            setLoadingRecommendations(true);
            try {
              const recommendedIds = await getJobRecommendations(profile, jobs);
              const recommended = jobs.filter((job) =>
                recommendedIds.includes(job.id),
              );
              setRecommendedJobs(recommended);
            } catch (error) {
              console.error("Error fetching recommendations:", error);
            } finally {
              setLoadingRecommendations(false);
            }
          }
        },
      );
    };

    setupProfileListener();
    return () => unsubscribe?.();
  }, [jobs]); // Re-run if jobs list changes, profile is handled by snapshot

  useEffect(() => {
    let result = jobs;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      
      // If the search term is a short acronym like "IT", we should search more strictly
      const isShortAcronym = term.length <= 2;
      
      result = result.filter(
        (job) => {
          if (isShortAcronym) {
            // For short acronyms, match category exactly or title with word boundary
            const titleMatch = new RegExp(`\\b${term}\\b`, 'i').test(job.title);
            const categoryMatch = job.category.toLowerCase() === term;
            return titleMatch || categoryMatch;
          }
          
          return (
            job.title.toLowerCase().includes(term) ||
            job.country.toLowerCase().includes(term) ||
            job.category.toLowerCase().includes(term) ||
            job.description.toLowerCase().includes(term) ||
            job.requirements.some((req) => req.toLowerCase().includes(term)) ||
            job.responsibilities.some((resp) =>
              resp.toLowerCase().includes(term)
            ) ||
            job.type.toLowerCase().includes(term)
          );
        }
      );
    }

    if (filters.country) {
      result = result.filter((job) => job.country === filters.country);
    }

    if (filters.category) {
      result = result.filter((job) => job.category === filters.category);
    }

    if (filters.experience) {
      result = result.filter((job) =>
        job.experience.includes(filters.experience),
      );
    }

    setFilteredJobs(result);
  }, [searchTerm, filters, jobs]);

  const jobsByCategory = filteredJobs.reduce(
    (acc, job) => {
      const cat = job.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(job);
      return acc;
    },
    {} as Record<string, Job[]>,
  );

  const countries = Array.from(new Set(jobs.map((j) => j.country)));
  const categories = Array.from(new Set(jobs.map((j) => j.category)));
  const experiences = ["Entry Level", "1-3 Years", "3-5 Years", "5+ Years"];

  const clearFilters = () => {
    setFilters({ country: "", category: "", experience: "" });
    setSearchTerm("");
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
        createdAt: Date.now(),
      };

      // Add to general jobAlerts collection
      await addDoc(collection(db, "jobAlerts"), alertData);

      // If user is logged in, also add to their profile
      if (auth.currentUser) {
        const userRef = doc(db, "candidates", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const profile = userSnap.data() as CandidateProfile;
          const updatedAlerts = [
            ...(profile.jobAlerts || []),
            { ...alertData, id: `ALERT-${Date.now()}` },
          ];
          await updateDoc(userRef, {
            jobAlerts: updatedAlerts,
            updatedAt: Date.now(),
          });
        }
      }

      toast.success("You've subscribed to job alerts!");
      setAlertEmail("");
    } catch (error) {
      console.error("Error subscribing to alerts:", error);
      toast.error("Failed to subscribe to job alerts.");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#121212] min-h-screen py-32 relative overflow-hidden transition-colors duration-500">
      <SEO title="Find High Paying EU Jobs | Europe Job Vacancies" />
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-mesh opacity-[0.03] dark:opacity-[0.05] pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-brand-teal/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
      <div
        className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-brand-rose/5 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/2 animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="max-w-[1920px] mx-auto px-4 md:px-12 lg:px-16 relative z-10">
        {/* Header */}
        <div className="mb-32 text-center w-full mx-auto relative pt-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute -top-32 left-1/2 -translate-x-1/2 w-80 h-80 bg-brand-teal/10 rounded-full blur-[100px] pointer-events-none"
          ></motion.div>

          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-brand-teal font-black uppercase tracking-[0.5em] mb-10 block text-[10px] md:text-xs"
          >
            Verified Global Network
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white mb-6 md:mb-8 tracking-tight leading-[0.9]"
          >
            Job{" "}
            <span className="text-brand-teal italic font-serif">Market</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base md:text-xl font-medium leading-relaxed mb-12 max-w-2xl mx-auto text-slate-600 dark:text-slate-300"
          >
            Precision-guided international recruitment. Discover premium
            opportunities curated from across Europe and the Middle East.
          </motion.p>

          {/* Prominent Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-5xl mx-auto w-full mb-16 relative group px-4 md:px-0"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-gold via-brand-gold/50 to-brand-gold rounded-full blur-md opacity-20 group-hover:opacity-40 transition-all duration-500"></div>
            <div className="relative flex items-center bg-white dark:bg-[#0f172a] backdrop-blur-xl rounded-full shadow-xl border border-slate-200/50 dark:border-white/10 overflow-hidden pr-2 h-14 md:h-16">
              <div className="pl-5 md:pl-6 text-slate-400 group-focus-within:text-brand-gold transition-colors">
                <Search size={20} className="md:w-5 md:h-5" />
              </div>
              <input
                type="text"
                placeholder="What career are you seeking?"
                className="w-full px-4 outline-none text-sm md:text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <div className="flex items-center gap-2 pr-1.5 h-full">
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-slate-400 hover:text-slate-900 dark:text-white dark:hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
                <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden md:block mx-1"></div>
                <div className="h-full py-1.5">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "h-full px-6 md:px-8 flex items-center justify-center gap-2 rounded-full font-bold text-[9px] md:text-[10px] uppercase tracking-widest transition-all duration-300",
                      "bg-brand-gold text-slate-900 dark:text-white shadow-sm hover:shadow-md hover:bg-yellow-400",
                    )}
                  >
                    <Search size={14} className="md:w-3.5 md:h-3.5" />
                    <span className="hidden sm:inline">Search</span>
                  </motion.button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4 mt-6">
              <span className="text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest">
                Trending
              </span>
              {[
                "Nurse",
                "Driver",
                "Germany",
                "Warehouse",
                "IT",
                "Hospitality",
              ].map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTrendingClick(tag)}
                  className="text-[10px] font-bold text-slate-500 hover:text-brand-gold transition-colors hover:underline underline-offset-4"
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
            className="flex flex-col items-center gap-2 mt-6 mb-8"
          >
            <div className="flex items-center gap-2 px-6 py-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-white/10 rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse"></span>
              <span className="text-slate-600 dark:text-slate-300 font-bold text-[10px] uppercase tracking-widest">
                Live Verified Opportunities
              </span>
            </div>
          </motion.div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -20 }}
              animate={{ height: "auto", opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -20 }}
              className="overflow-hidden mb-24 relative z-20"
            >
              <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-2xl p-6 md:p-10 rounded-[2rem] border border-white dark:border-white/10 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4">
                      Country
                    </label>
                    <div className="relative group">
                      <MapPin
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-brand-gold transition-colors"
                        size={18}
                      />
                      <select
                        className="w-full pl-12 pr-10 py-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/10 transition-all duration-300 text-slate-900 dark:text-white font-semibold text-sm appearance-none cursor-pointer"
                        value={filters.country}
                        onChange={(e) =>
                          setFilters({ ...filters, country: e.target.value })
                        }
                      >
                        <option value="">All Countries</option>
                        {countries.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4">
                      Category
                    </label>
                    <div className="relative group">
                      <Briefcase
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-brand-gold transition-colors"
                        size={18}
                      />
                      <select
                        className="w-full pl-12 pr-10 py-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/10 transition-all duration-300 text-slate-900 dark:text-white font-semibold text-sm appearance-none cursor-pointer"
                        value={filters.category}
                        onChange={(e) =>
                          setFilters({ ...filters, category: e.target.value })
                        }
                      >
                        <option value="">All Categories</option>
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4">
                      Experience
                    </label>
                    <div className="relative group">
                      <Clock
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-brand-gold transition-colors"
                        size={18}
                      />
                      <select
                        className="w-full pl-12 pr-10 py-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/10 transition-all duration-300 text-slate-900 dark:text-white font-semibold text-sm appearance-none cursor-pointer"
                        value={filters.experience}
                        onChange={(e) =>
                          setFilters({ ...filters, experience: e.target.value })
                        }
                      >
                        <option value="">Any Experience</option>
                        {experiences.map((e) => (
                          <option key={e} value={e}>
                            {e}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center mt-8">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={clearFilters}
                    className="px-6 py-2.5 bg-slate-50 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:text-white dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 border border-slate-200 dark:border-white/10"
                  >
                    <X size={14} /> Clear Auto-Filters
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Recommendations */}
        {auth.currentUser &&
          (recommendedJobs.length > 0 || loadingRecommendations) && (
            <div className="mb-40 relative group">
              <div className="absolute -inset-10 bg-brand-gold/5 rounded-[6rem] blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>

              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 relative">
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 bg-brand-gold/10 text-brand-gold rounded-[2rem] flex items-center justify-center shadow-2xl border border-brand-gold/20 shrink-0">
                    <Sparkles size={40} className="animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-4 py-1 bg-brand-gold text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                        AI Driven
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
                        Personalized Engine
                      </span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
                      Recommended for You
                    </h2>
                    <p className="text-xl text-slate-500 dark:text-slate-300 font-medium max-w-2xl">
                      Our intelligence engine has hand-picked these
                      opportunities based on your unique profile, skills, and
                      recent search patterns.
                    </p>
                  </div>
                </div>

                {loadingRecommendations && (
                  <div className="flex items-center gap-4 px-8 py-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 shadow-inner">
                    <Loader2
                      className="animate-spin text-brand-gold"
                      size={20}
                    />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Refreshing Suggestions...
                    </span>
                  </div>
                )}
              </div>

              {loadingRecommendations ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-slate-800/50 rounded-[3rem] h-[500px] animate-pulse border border-slate-100 dark:border-white/5"
                    ></div>
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
        <div className="pt-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-800/50 rounded-[2rem] h-[400px] animate-pulse border border-slate-100 dark:border-white/5"
                ></div>
              ))}
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className="space-y-16 md:space-y-24">
              {Object.entries(jobsByCategory).map(([category, catJobs]) => (
                <div key={category} className="space-y-8">
                  <div className="flex items-center justify-between px-4 md:px-0">
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                      {category}{" "}
                      <span className="text-brand-gold text-2xl">
                        ({catJobs.length})
                      </span>
                    </h2>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const el = document.getElementById(
                            `scroll-${category}`,
                          );
                          if (el)
                            el.scrollBy({ left: -320, behavior: "smooth" });
                        }}
                        className="p-3 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-white transition-colors"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button
                        onClick={() => {
                          const el = document.getElementById(
                            `scroll-${category}`,
                          );
                          if (el)
                            el.scrollBy({ left: 320, behavior: "smooth" });
                        }}
                        className="p-3 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-white transition-colors"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </div>
                  </div>

                  <div
                    id={`scroll-${category}`}
                    className="flex overflow-x-auto snap-x snap-mandatory gap-6 md:gap-8 pb-12 px-4 md:px-0 hide-scrollbar"
                  >
                    {catJobs.map((job, i) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        viewport={{ once: true }}
                        className="snap-start shrink-0 w-[85vw] sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] lg:w-[calc(20%-25.6px)]"
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
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl border border-slate-100 dark:border-white/10 shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-[0.04]"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-brand-gold/5 rounded-full blur-[100px]"></div>

              <div className="relative z-10 px-6">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-8 text-slate-200 shadow-inner border border-white dark:border-white/10"
                >
                  <Search
                    size={40}
                    className="text-slate-200 dark:text-slate-700"
                  />
                </motion.div>
                <h3 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                  No results found
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-base font-medium mb-10 max-w-md mx-auto leading-relaxed">
                  We couldn't find any positions matching your current search
                  criteria. Try broadening your search or resetting the filters.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={clearFilters}
                  className="bg-brand-blue text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:bg-brand-gold hover:text-slate-900 dark:text-white transition-all duration-300 flex items-center gap-2 mx-auto"
                >
                  <X size={16} /> Reset All Filters
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Job Alerts Section (Redesigned) */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-20 relative group/alerts w-full border-y border-slate-800 dark:border-white/5 bg-slate-900"
      >
        <div className="absolute inset-0 bg-brand-gold/5 dark:bg-brand-teal/5 blur-[120px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>

        <div className="overflow-hidden relative shadow-2xl w-full">
          {/* Animated background highlights */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-gold/10 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
          <div
            className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-teal/10 rounded-full blur-[80px] -translate-x-1/3 translate-y-1/3 animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>

          <div className="flex flex-col lg:flex-row relative z-10 items-center justify-between p-6 md:p-10 lg:p-12 gap-8 max-w-[1920px] mx-auto px-4 md:px-12 lg:px-16">
            {/* Left Side: Content */}
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-[10px] font-black uppercase tracking-[0.4em] mb-4 w-fit">
                <Bell size={12} className="animate-bounce" />
                Smart Notifications
              </div>

              <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-white mb-3 tracking-tighter leading-[1.1]">
                Stay Ahead Of Every{" "}
                <span className="text-brand-gold italic font-serif">Dream</span>
              </h2>

              <p className="text-slate-400 text-sm md:text-base font-light leading-relaxed mb-6 max-w-lg">
                Set up precision alerts for your next career jump. We'll notify
                you the moment a verified position matching your criteria goes
                live.
              </p>

              <div className="flex flex-wrap gap-2">
                {filters.country && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-bold uppercase tracking-widest text-slate-300">
                    <MapPin size={10} className="text-brand-gold" />
                    {filters.country}
                  </div>
                )}
                {filters.category && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-bold uppercase tracking-widest text-slate-300">
                    <Briefcase size={10} className="text-brand-gold" />
                    {filters.category}
                  </div>
                )}
                {!filters.country && !filters.category && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-bold uppercase tracking-widest text-slate-300">
                    <Sparkles size={10} className="text-brand-gold" />
                    All Global Listings
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Form */}
            <div className="shrink-0 w-full lg:w-[400px] bg-white/[0.03] dark:bg-black/20 backdrop-blur-3xl p-6 rounded-2xl border border-white/5">
              <form onSubmit={handleSubscribe} className="space-y-4">
                <div className="relative group/input">
                  <div className="absolute inset-0 bg-brand-gold/20 rounded-xl blur-md opacity-0 group-focus-within/input:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-300 group-focus-within/input:text-brand-gold transition-colors"
                      size={16}
                    />
                    <input
                      type="email"
                      required
                      placeholder="your@email.com"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl outline-none focus:border-brand-gold focus:bg-slate-800 transition-all text-sm font-bold text-white placeholder:text-slate-600 dark:text-slate-300"
                      value={alertEmail}
                      onChange={(e) => setAlertEmail(e.target.value)}
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={subscribing}
                  className="w-full py-3.5 bg-premium-gradient-animated text-white font-bold tracking-widest uppercase rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {subscribing ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      <Bell size={16} />
                      Activate Alerts
                    </>
                  )}
                </motion.button>

                <p className="text-center text-slate-500 text-[9px] font-bold uppercase tracking-widest leading-relaxed mt-4">
                  Zero spam. Strictly job updates.
                </p>
              </form>
            </div>
          </div>
        </div>
      </motion.div>

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
                className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 dark:text-white dark:hover:text-white transition-colors p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10"
              >
                <X size={24} />
              </button>

              <div className="mb-12">
                <span className="text-brand-gold font-bold uppercase tracking-[0.4em] text-[10px] mb-4 block">
                  Quick Application
                </span>
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
