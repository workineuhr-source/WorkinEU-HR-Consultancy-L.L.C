import { getDirectImageUrl } from "../lib/utils";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import SEO from "../components/SEO";
import {
  ArrowRight,
  CheckCircle2,
  Globe2,
  ShieldCheck,
  Users2,
  Briefcase,
  FileText,
  Plane,
  Star,
  Quote,
  Phone,
  User,
  MessageSquare,
  CheckCircle,
  Info,
  Mail,
  Search,
  MapPin,
  Clock,
  Award,
  Zap,
  LayoutGrid,
  Target,
  Check,
  Loader2,
  Calendar,
  Building2,
  ChevronDown,
  Send,
  FileSearch,
  UserPlus,
  ClipboardCheck,
  PlaneTakeoff,
  MessageCircle,
  ArrowUp,
  Home,
  Sparkles,
  TrendingUp,
  Shield,
  Heart,
  Globe,
  X,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import {
  collection,
  query,
  limit,
  getDocs,
  orderBy,
  doc,
  getDoc,
  where,
  addDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  Job,
  SiteContent,
  TeamMember,
  Review,
  DiaryPost,
  VisaSuccessStory,
  ClientPartner,
} from "../types";
import JobCard from "../components/JobCard";
import ReviewForm from "../components/ReviewForm";
import DiaryCard from "../components/DiaryCard";
import GlobalReach from "../components/GlobalReach";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { COUNTRIES, countryToCode } from "../constants";

import { useTheme } from "../context/ThemeContext";

import BottomCTA from "../components/BottomCTA";
import ApplicationForm from "../components/ApplicationForm";

const Section = ({
  children,
  id,
  className,
  title,
  subtitle,
  tagline,
  image,
  dark = false,
  forceDark = false,
}: any) => {
  const { theme } = useTheme();
  const isDark = forceDark || (theme === "dark" ? true : dark);

  return (
    <section
      id={id}
      className={cn(
        "py-12 md:py-16 relative overflow-hidden transition-colors duration-500",
        isDark ? "bg-[#121212] text-white" : "bg-white dark:bg-[#121212]",
        className,
      )}
    >
      <div className="max-w-[1920px] mx-auto px-4 md:px-8">
        {(tagline || title || subtitle || image) && (
          <div
            className={cn(
              "mb-8 md:mb-12",
              image
                ? "grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
                : "max-w-4xl",
            )}
          >
            <div>
              {tagline && (
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-brand-teal font-black uppercase tracking-[0.4em] mb-4 block text-[10px] md:text-xs"
                >
                  {tagline}
                </motion.span>
              )}
              {title && (
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className={cn(
                    "text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 md:mb-8",
                    isDark ? "text-white" : "text-slate-900 dark:text-white",
                  )}
                >
                  {title}
                </motion.h2>
              )}
              {subtitle && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className={cn(
                    "text-lg md:text-xl font-medium leading-relaxed max-w-2xl",
                    isDark
                      ? "text-slate-200"
                      : "text-slate-900 dark:text-white",
                  )}
                >
                  {subtitle}
                </motion.div>
              )}
            </div>

            {image && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="relative rounded-[3rem] overflow-hidden shadow-2xl aspect-video lg:aspect-square"
              >
                <img
                  src={getDirectImageUrl(image)}
                  alt={title || "Section visual"}
                  className="w-full h-full object-contain transition-transform duration-1000 hover:scale-105"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-brand-teal/20 to-transparent pointer-events-none"></div>
              </motion.div>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
};

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [diaryPosts, setDiaryPosts] = useState<DiaryPost[]>([]);
  const [successStories, setSuccessStories] = useState<VisaSuccessStory[]>([]);
  const [clients, setClients] = useState<ClientPartner[]>([]);
  const [loadingDiary, setLoadingDiary] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const fallbackDiary: DiaryPost[] = [
    {
      id: "1",
      title: "Successful Placement of 50+ Candidates in Poland",
      content:
        "We are thrilled to announce the successful placement of over 50 skilled workers in the construction and logistics sectors across Poland this month.",
      imageUrl:
        "https://images.unsplash.com/photo-1541746972996-4e0b0f43e01a?auto=format&fit=crop&q=80&w=800",
      author: "Admin",
      category: "Success Stories",
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: "2",
      title: "New Visa Regulations for Germany: What You Know",
      content:
        "Germany has recently updated its skilled migration laws, making it easier for qualified professionals from non-EU countries to secure work permits.",
      imageUrl:
        "https://images.unsplash.com/photo-1589252392322-45cbbdad6f73?auto=format&fit=crop&q=80&w=800",
      author: "Legal Team",
      category: "Visa Updates",
      createdAt: Date.now() - 86400000 * 5,
    },
    {
      id: "3",
      title: "Expanding Our Reach: New Branch Office in Nepal",
      content:
        "To better serve our candidates in South Asia, WorkinEU has officially opened its new branch office in Kathmandu, Nepal.",
      imageUrl:
        "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800",
      author: "Management",
      category: "Company News",
      createdAt: Date.now() - 86400000 * 10,
    },
  ];
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [selectedJobToApply, setSelectedJobToApply] = useState<Job | null>(
    null,
  );
  const [isQuickApply, setIsQuickApply] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [content, setContent] = useState<SiteContent>({
    heroTagline: "Connecting Talent Globally",
    heroTitle: "Human Resources Consultancies LLC",
    heroDescription:
      "Your trusted partner for international recruitment and visa services.",
    aboutUs:
      "WorkinEU Human Resources Consultancies LLC is a Dubai-based international recruitment agency specializing in sourcing and placing skilled and unskilled workers from Asia, Africa, and the Gulf into industries across Europe and the Middle East.",
    mission:
      "To empower organizations by aligning their HR strategy with business objectives, enhancing efficiency and productivity through expert workforce solutions.",
    servicesImageUrl:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=80&w=1200",
    vision:
      "To be the leading HR partner for growth-minded businesses in Europe and the Gulf, driving success through strategic talent acquisition.",
    values: [
      {
        title: "Integrity and Transparency",
        description: "We conduct all our activities with honesty and openness.",
      },
      {
        title: "Long-Term Partnerships",
        description: "We focus on creating sustainable collaborations.",
      },
      {
        title: "Respect and Fairness",
        description: "We value every client and candidate equally.",
      },
    ],
    coreStrengths: [
      "Deep expertise in European and Gulf labor markets",
      "Strong network of certified recruitment partners",
      "End-to-end support from sourcing to deployment",
    ],
    services: [
      {
        title: "International Recruitment",
        description:
          "Connecting skilled professionals with top-tier European employers.",
      },
      {
        title: "Visa Assistance",
        description:
          "Expert guidance through complex visa application processes.",
      },
      {
        title: "Documentation Support",
        description:
          "Assistance in preparing and authenticating legal documents.",
      },
      {
        title: "Post-arrival Support",
        description:
          "Assisting candidates with housing and local registration.",
      },
    ],
    whyChooseUs: {
      title: "Why WorkinEU?",
      description:
        "We offer unmatched expertise in European and Gulf recruitment, ensuring your career journey is safe, fast, and successful.",
      points: [
        {
          title: "Access to 500+ Candidates",
          description: "Vast pool of pre-screened talent ready for deployment.",
        },
        {
          title: "Global Presence",
          description: "Strong presence across multiple continents.",
        },
        {
          title: "Legal & Logistical Support",
          description: "Full support for visa processing and relocation.",
        },
      ],
    },
    stats: [
      { label: "Happy Clients", value: "600+" },
      { label: "Global Offices", value: "3" },
      { label: "Success Rate", value: "98%" },
      { label: "Countries", value: "24+" },
    ],
    countries: COUNTRIES,
    contactEmail: "workineuhr@gmail.com",
    contactPhone: "+971 50 1942811 / +971 50 2402655",
    contactAddress:
      "Mai Tower, 4th Floor Royal Zone Business Center - Office No. 10, Al Qusais, Al Nahda 1, Dubai, UAE",
    whatsappNumber: "+971501942811",
    branchOffices: [
      {
        location: "Dubai, UAE",
        address: "Mai Tower, 4th Floor, Dubai, UAE",
        phone: "+971 50 1942811",
        email: "workineuhr@gmail.com",
      },
      {
        location: "Sri Lanka",
        address: " Kadawatha, Sri Lanka",
        phone: "+94 77 841 1444",
        email: "workineuhr@gmail.com",
      },
      {
        location: "Nepal",
        address: "Kathmandu, Nepal",
        phone: "+977-01-4560541",
        email: "workineuhr@gmail.com",
      },
    ],
    livingSection: {
      title: "Life & Accommodation",
      description:
        "We ensure our candidates are well-settled with comfortable living conditions and comprehensive support services.",
      features: [
        {
          title: "Safe Accommodation",
          description: "Clean, safe, and fully furnished living spaces.",
        },
        {
          title: "Local Registration",
          description: "Assistance with city registration and bank accounts.",
        },
        {
          title: "24/7 Support",
          description: "Dedicated coordinators to help you with any issues.",
        },
      ],
    },
    faqs: [
      {
        question: "How long does the visa process take?",
        answer:
          "Typically 3 to 6 months depending on the country and job category.",
      },
      {
        question: "Do I need to pay upfront fees?",
        answer:
          "We follow ethical practices. Any service charges are transparently discussed.",
      },
    ],
    partners: [
      {
        name: "EU Logistics",
        logoUrl:
          "https://images.unsplash.com/photo-1586528116311-ad86d7c71798?auto=format&fit=crop&q=80&w=200",
      },
      {
        name: "Global Health",
        logoUrl:
          "https://images.unsplash.com/photo-1505751172107-573228a64227?auto=format&fit=crop&q=80&w=200",
      },
      {
        name: "Euro Build",
        logoUrl:
          "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80&w=200",
      },
      {
        name: "Tech Solutions",
        logoUrl:
          "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=200",
      },
    ],
    professionalHrSolutionsTitle: "Professional HR Solutions",
    professionalHrSolutionsDescription:
      "At WorkinEU Human Resources Consultancies LLC, we provide end-to-end professional HR solutions tailored to the unique needs of the global labor market. Our expertise spans across recruitment, documentation, and visa processing, ensuring a seamless transition for both employers and candidates. We specialize in sourcing highly skilled and unskilled talent from Asia, Africa, and the Gulf, placing them into key industries across Europe and the Middle East.\n\nOur commitment to excellence is reflected in our precision-guided support at every stage of the professional journey. By aligning organizational HR strategies with business objectives, we drive efficiency and long-term productivity for our partners. We don't just fill positions; we build the foundations for sustainable international career success.",
    professionalHrSolutionsImageUrl:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200",
  });

  const [contactForm, setContactForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobCounts, setJobCounts] = useState<Record<string, number>>({});

  const totalOpeningsDirect = useMemo(
    () => Object.values(jobCounts).reduce((a, b) => a + b, 0),
    [jobCounts],
  );
  const totalCountriesDirect = useMemo(
    () => Object.keys(jobCounts).length,
    [jobCounts],
  );

  const displayStats = useMemo(() => {
    if (!content.stats) return [];
    return content.stats.map((stat, i) => {
      // Automate stats if real data available
      if (
        (stat.label.toLowerCase().includes("happy") ||
          stat.label.toLowerCase().includes("opening")) &&
        totalOpeningsDirect > 0
      ) {
        return { label: "Live Openings", value: `${totalOpeningsDirect}+` };
      }
      if (
        stat.label.toLowerCase().includes("countr") &&
        totalCountriesDirect > 0
      ) {
        return {
          label: "Global Reach",
          value: `${totalCountriesDirect} Countries`,
        };
      }
      return stat;
    });
  }, [content.stats, totalOpeningsDirect, totalCountriesDirect]);

  useEffect(() => {
    const fetchJobCounts = async () => {
      try {
        const q = query(collection(db, "jobs"));
        const snapshot = await getDocs(q);
        const counts: Record<string, number> = {};
        snapshot.docs.forEach((doc) => {
          const country = doc.data().country;
          if (country) {
            counts[country] = (counts[country] || 0) + 1;
          }
        });
        setJobCounts(counts);
      } catch (error) {
        console.error("Error fetching job counts:", error);
      }
    };
    fetchJobCounts();
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll);

    let unsubContent: () => void;
    let unsubJobs: () => void;

    const fetchData = async () => {
      try {
        const [teamSnap, reviewsSnap, diarySnap, storiesSnap, clientsSnap] =
          await Promise.all([
            getDocs(query(collection(db, "team"), orderBy("order", "asc"))),
            getDocs(
              query(
                collection(db, "reviews"),
                where("status", "==", "approved"),
                orderBy("createdAt", "desc"),
                limit(6),
              ),
            ),
            getDocs(
              query(
                collection(db, "diary"),
                orderBy("createdAt", "desc"),
                limit(3),
              ),
            ),
            getDocs(
              query(
                collection(db, "successStories"),
                orderBy("order", "asc"),
                limit(6),
              ),
            ),
            getDocs(
              query(
                collection(db, "clients"),
                orderBy("order", "asc"),
                limit(8),
              ),
            ),
          ]);

        unsubJobs = onSnapshot(
          query(collection(db, "jobs"), orderBy("createdAt", "desc"), limit(3)),
          (snap) => {
            setFeaturedJobs(
              snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Job),
            );
          },
        );

        // Site Content Real-time Listener
        unsubContent = onSnapshot(
          doc(db, "settings", "siteContent"),
          (snap) => {
            if (snap.exists()) {
              const data = snap.data() as SiteContent;
              setContent((prev) => ({
                ...prev,
                ...data,
                countries: data.countries?.length ? data.countries : COUNTRIES,
              }));
              setIsPageLoading(false);
            } else {
              setIsPageLoading(false);
            }
          },
          (err) => {
            console.error("Error listening to site content:", err);
            setIsPageLoading(false);
          },
        );

        if (teamSnap.docs.length)
          setTeam(
            teamSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as TeamMember),
          );
        if (reviewsSnap.docs.length)
          setReviews(
            reviewsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Review),
          );
        if (diarySnap.docs.length) {
          setDiaryPosts(
            diarySnap.docs.map((d) => ({ id: d.id, ...d.data() }) as DiaryPost),
          );
        }
        if (storiesSnap.docs.length) {
          setSuccessStories(
            storiesSnap.docs.map(
              (d) => ({ id: d.id, ...d.data() }) as VisaSuccessStory,
            ),
          );
        }
        if (clientsSnap.docs.length) {
          setClients(
            clientsSnap.docs.map(
              (d) => ({ id: d.id, ...d.data() }) as ClientPartner,
            ),
          );
        }
        setLoadingDiary(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoadingDiary(false);
      }
    };

    fetchData();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (unsubContent) unsubContent();
      if (unsubJobs) unsubJobs();
    };
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !contactForm.fullName ||
      !contactForm.email ||
      !contactForm.phone ||
      !contactForm.message
    ) {
      toast.error("Please fill in all fields");
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "contactMessages"), {
        ...contactForm,
        createdAt: Date.now(),
      });
      setContactForm({ fullName: "", email: "", phone: "", message: "" });
      toast.success("Message sent successfully!");
    } catch (error) {
      toast.error("Failed to send message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const countries = useMemo(() => {
    const list = (content.countries || []).filter((c) => c && c.trim() !== "");
    const baseList = list.length > 0 ? list : COUNTRIES;

    // Create a copy and sort it
    return [...baseList].sort((a, b) => {
      const countA = jobCounts[a] || 0;
      const countB = jobCounts[b] || 0;

      // If both have jobs, sort by count descending
      if (countA > 0 && countB > 0) return countB - countA;

      // If one has jobs, it goes first
      if (countA > 0) return -1;
      if (countB > 0) return 1;

      // If none have jobs, maintain original relative order
      return baseList.indexOf(a) - baseList.indexOf(b);
    });
  }, [content.countries, jobCounts]);

  const heroImages = useMemo(() => {
    const urls = content.heroImageUrls || [];
    return urls.filter((url) => url && url.trim() !== "").length > 0
      ? urls.filter((url) => url && url.trim() !== "")
      : [
          content.heroImageUrl ||
            "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1200",
        ];
  }, [content.heroImageUrls, content.heroImageUrl]);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 6000); // 6 seconds per slide
    return () => clearInterval(interval);
  }, [heroImages.length]);

  const getFontClass = (font?: string) => {
    switch (font) {
      case "serif":
        return "font-serif";
      case "space":
        return "font-space";
      case "outfit":
        return "font-outfit";
      case "mono":
        return "font-mono";
      default:
        return "font-sans";
    }
  };

  const getTextColor = (
    color?: string,
    fallback: string = "text-slate-900 dark:text-white",
  ) => {
    if (!color) return fallback;
    if (color === "teal") return "text-brand-teal";
    if (color === "rose") return "text-brand-rose";
    if (color === "gold") return "text-brand-gold";
    if (color === "blue") return "text-brand-blue dark:text-white";
    if (color === "white") return "text-white";
    if (color === "slate") return "text-slate-900 dark:text-white";
    return color.startsWith("text-")
      ? color
      : `text-[${color}] dark:text-white`;
  };

  const getBgColor = (color?: string, fallback: string = "bg-brand-teal") => {
    if (!color) return fallback;
    if (color === "teal") return "bg-brand-teal";
    if (color === "rose") return "bg-brand-rose";
    if (color === "gold") return "bg-brand-gold";
    if (color === "blue") return "bg-brand-blue";
    if (color === "slate") return "bg-slate-900";
    return color.startsWith("bg-") ? color : `bg-[${color}]`;
  };

  if (isPageLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-white dark:bg-[#121212]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <div className="w-20 h-20 border-4 border-brand-teal border-t-transparent rounded-full animate-spin mb-6 shadow-2xl"></div>
          <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs animate-pulse">
            Initializing Excellence
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white dark:bg-[#121212]">
      <SEO title="Jobs in Europe for Nepalese | HR Recruitment Agency" />
      {/* Hero Section */}
      <section className="relative min-h-[60vh] lg:min-h-[70vh] flex items-center pt-24 pb-12 overflow-hidden bg-white dark:bg-[#121212]">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-teal/5 rounded-full blur-[120px] -mr-96 -mt-96"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-rose/5 rounded-full blur-[120px] -ml-72 -mb-72"></div>
          {/* Subtle World Map */}
          <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.1] pointer-events-none">
            <svg viewBox="0 0 1000 500" className="w-full h-full object-cover">
              <path
                fill="currentColor"
                d="M150,150 Q200,50 300,100 T500,150 T700,100 T900,150"
                className="text-brand-teal"
              />
              <path
                fill="currentColor"
                d="M100,300 Q200,200 350,250 T550,200 T750,300 T850,250"
                className="text-brand-rose"
              />
            </svg>
          </div>
        </div>

        <div className="max-w-[1920px] mx-auto px-4 md:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="order-2 lg:order-1">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-10"
              >
                <span
                  className={cn(
                    "inline-flex items-center gap-3 px-6 py-2 rounded-full border shadow-sm",
                    getFontClass(content.styles?.heroTagline?.font),
                    content.styles?.heroTagline?.color === "teal"
                      ? "bg-brand-teal/10 border-brand-teal/20 text-brand-teal"
                      : content.styles?.heroTagline?.color === "rose"
                        ? "bg-brand-rose/10 border-brand-rose/20 text-brand-rose"
                        : content.styles?.heroTagline?.color === "gold"
                          ? "bg-brand-gold/10 border-brand-gold/20 text-brand-gold"
                          : "bg-brand-teal/10 border-brand-teal/20 text-brand-teal",
                    "text-[11px] font-black uppercase tracking-[0.3em]",
                  )}
                >
                  <Globe2 size={16} />{" "}
                  {content.heroTagline || "Connecting Talent Globally"}
                </span>
                <h1
                  className={cn(
                    "text-5xl sm:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight",
                    getFontClass(content.styles?.heroTitle?.font),
                    getTextColor(content.styles?.heroTitle?.color),
                  )}
                >
                  {content.autoHeroJobs && featuredJobs.length > 0 ? (
                    <>
                      Latest Opening:{" "}
                      <span className="text-brand-teal">
                        {featuredJobs[0].title}
                      </span>{" "}
                      in{" "}
                      <span className="text-brand-rose">
                        {featuredJobs[0].country}
                      </span>
                    </>
                  ) : content.heroTitle ? (
                    content.heroTitle
                  ) : (
                    <>
                      Connecting <span className="text-brand-teal">Talent</span>{" "}
                      with Global{" "}
                      <span className="text-brand-rose">Opportunities</span>
                    </>
                  )}
                </h1>
                <p
                  className={cn(
                    "text-lg md:text-xl font-medium leading-relaxed max-w-xl",
                    getFontClass(content.styles?.heroDescription?.font),
                    getTextColor(
                      content.styles?.heroDescription?.color,
                      "text-slate-600 dark:text-slate-300",
                    ),
                  )}
                >
                  {content.heroDescription ||
                    "WorkinEU HR is your trusted partner for premium international recruitment and visa services, bridging the gap between world-class talent and global excellence."}
                </p>
                <div className="flex flex-col sm:flex-row gap-6 pt-6">
                  <Link
                    to="/jobs"
                    className={cn(
                      "px-10 py-5 font-black rounded-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs",
                      getBgColor(
                        content.styles?.heroPrimaryCta?.bgColor,
                        "bg-brand-teal",
                      ),
                      getTextColor(
                        content.styles?.heroPrimaryCta?.textColor,
                        "text-white",
                      ),
                      getFontClass(content.styles?.heroPrimaryCta?.font),
                      "hover:shadow-[0_20px_40px_-10px_rgba(42,185,176,0.3)]",
                    )}
                  >
                    {content.heroCtaText || "Apply Now"}{" "}
                    <ArrowRight size={18} />
                  </Link>
                  <Link
                    to="/about"
                    className={cn(
                      "px-10 py-5 font-black rounded-2xl transition-all border flex items-center justify-center gap-3 uppercase tracking-widest text-xs",
                      getBgColor(
                        content.styles?.heroSecondaryCta?.bgColor,
                        "bg-slate-100 dark:bg-white/5",
                      ),
                      getTextColor(
                        content.styles?.heroSecondaryCta?.textColor,
                        "text-slate-900 dark:text-white",
                      ),
                      getFontClass(content.styles?.heroSecondaryCta?.font),
                      "hover:bg-slate-900 hover:text-white border-slate-200 dark:border-white/10",
                    )}
                  >
                    {content.heroSecondaryCtaText || "Hire Talent"}
                  </Link>
                </div>
              </motion.div>
            </div>

            <div className="order-1 lg:order-2 relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="relative z-10"
              >
                <div className="relative aspect-square lg:aspect-[4/5] max-w-[500px] lg:max-w-[650px] mx-auto rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white dark:border-[#121212] bg-slate-100 dark:bg-white/5">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentHeroIndex}
                      src={getDirectImageUrl(heroImages[currentHeroIndex])}
                      alt="Professional recruitment"
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="absolute inset-0 w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  </AnimatePresence>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121212]/40 to-transparent pointer-events-none"></div>

                  {/* Slider Indicators */}
                  {heroImages.length > 1 && (
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-30">
                      {heroImages.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentHeroIndex(i)}
                          className={cn(
                            "h-1.5 transition-all duration-500 rounded-full",
                            currentHeroIndex === i
                              ? "w-8 bg-brand-teal"
                              : "w-1.5 bg-white/40 hover:bg-white/70",
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Floating Real-time Stats */}
                <div className="absolute -bottom-4 -right-4 md:-bottom-6 md:-right-6 p-4 md:p-6 glass-card dark:glass-dark rounded-2xl md:rounded-[1.5rem] shadow-xl animate-float z-20 max-w-[140px] md:max-w-none">
                  <p className="text-2xl md:text-3xl font-black text-brand-teal tracking-tighter leading-none mb-1">
                    {totalOpeningsDirect > 0
                      ? `${totalOpeningsDirect}+`
                      : content.stats?.[0]?.value || "500+"}
                  </p>
                  <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Live Openings
                  </p>
                </div>
                <div
                  className="absolute -top-4 -left-4 md:-top-6 md:-left-6 p-4 md:p-6 glass-card dark:glass-dark rounded-2xl md:rounded-[1.5rem] shadow-xl animate-float z-20 max-w-[140px] md:max-w-none"
                  style={{ animationDelay: "1s" }}
                >
                  <p className="text-2xl md:text-3xl font-black text-brand-rose tracking-tighter leading-none mb-1">
                    {totalCountriesDirect > 0
                      ? `${totalCountriesDirect} Countries`
                      : content.stats?.[1]?.value || "24+"}
                  </p>
                  <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Global Reach
                  </p>
                </div>
              </motion.div>

              {/* Background Shapes */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-brand-teal/5 rounded-full blur-[100px] pointer-events-none"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Jobs - Immediate Value for Candidates */}
      <Section
        id="jobs"
        tagline={content.jobsTagline || "Opportunities"}
        title={content.jobsTitle || "Featured Job Openings"}
        subtitle={
          content.jobsSubtitle ||
          "Explore exceptional career opportunities from verified international employers."
        }
        className="bg-slate-50/50 dark:bg-transparent relative"
      >
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-teal/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 relative z-10 mt-12">
          {featuredJobs.length > 0 ? (
            featuredJobs.map((job, i) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
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
            ))
          ) : (
            <div className="col-span-full py-12 md:py-16 text-center">
              <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-brand-teal shadow-inner">
                <Loader2 className="animate-spin" size={48} />
              </div>
              <p className="text-slate-400 text-xl font-bold tracking-tight">
                Curating your global future...
              </p>
            </div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <Link
            to="/jobs"
            className="inline-flex items-center gap-6 px-14 py-6 bg-[#121212] dark:bg-brand-teal text-white dark:text-[#121212] font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:scale-105 active:scale-95 transition-all duration-500 group shadow-2xl shadow-brand-teal/20"
          >
            Explore 500+ Openings{" "}
            <ArrowRight
              size={20}
              className="group-hover:translate-x-2 transition-transform"
            />
          </Link>
        </motion.div>
      </Section>

      {/* Global Reach - Scale and Authority */}
      {content.showCountries !== false && (
        <GlobalReach
          countries={countries}
          jobCounts={jobCounts}
          tagline={content.countriesTagline}
          title={content.countriesTitle}
          subtitle={content.countriesDescription}
          dark={false}
        />
      )}

      {/* Professional HR Solutions - What we do */}
      {content.showServices !== false && (
        <Section
          id="services"
          tagline={content.servicesTagline || "Expertise & Advantage"}
          title={content.servicesTitle || "Professional HR Solutions"}
          subtitle={
            content.servicesSubtitle ||
            "At WorkinEU, we specialize in bridging the gap between exceptional global talent and prestigious European employers."
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mt-12">
            {content.services?.map((service, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="p-12 bg-white dark:bg-white/5 rounded-[3rem] border border-slate-100 dark:border-white/10 group overflow-hidden transition-all duration-500 hover:shadow-2xl shadow-premium"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-brand-teal/5 rounded-bl-[6rem] -mr-16 -mt-16 group-hover:bg-brand-teal/10 transition-all"></div>
                <div className="w-20 h-20 bg-[#121212] dark:bg-brand-teal text-white dark:text-[#121212] rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 transition-all duration-500 shadow-xl shadow-brand-teal/10">
                  {i === 0 ? (
                    <Globe2 size={36} />
                  ) : i === 1 ? (
                    <ShieldCheck size={36} />
                  ) : i === 2 ? (
                    <FileText size={36} />
                  ) : (
                    <Users2 size={36} />
                  )}
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight leading-tight">
                  {service.title}
                </h3>
                <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed font-semibold">
                  {service.description}
                </p>
                <div className="mt-12 flex items-center gap-4 text-brand-teal font-black text-[10px] uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
                  Explore Details <ArrowRight size={16} />
                </div>
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {/* Our Process - The Recruitment Roadmap */}
      {content.showProcess !== false && (
        <Section
          id="process"
          tagline={content.ourProcess?.title || "Our Method"}
          title={content.ourProcessTitle || "The Recruitment Process"}
          subtitle={
            content.ourProcess?.description ||
            "A transparent, step-by-step process designed for your global professional success."
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mt-12">
            {(
              content.ourProcess?.steps || [
                {
                  title: "Job Search",
                  description:
                    "Precision-guided support at every critical stage of your international career transition.",
                },
                {
                  title: "Application",
                  description:
                    "Precision-guided support at every critical stage of your international career transition.",
                },
                {
                  title: "Documentation",
                  description:
                    "Precision-guided support at every critical stage of your international career transition.",
                },
                {
                  title: "Deployment",
                  description:
                    "Precision-guided support at every critical stage of your international career transition.",
                },
              ]
            ).map((step: any, i: number) => {
              const icons = [
                <FileSearch size={32} />,
                <UserPlus size={32} />,
                <ClipboardCheck size={32} />,
                <PlaneTakeoff size={32} />,
              ];
              const imgs = [
                "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=800",
                "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=800",
                "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=800",
                "https://images.unsplash.com/photo-1436491865332-7a61a109c0f3?auto=format&fit=crop&q=80&w=800",
              ];
              return (
                <motion.div
                  key={i}
                  whileHover={{ y: -10 }}
                  className="bg-white dark:bg-white/5 rounded-[3rem] border border-slate-100 dark:border-white/10 overflow-hidden group hover:shadow-premium transition-all duration-700 relative"
                >
                  <div className="h-72 overflow-hidden relative">
                    <img
                      src={getDirectImageUrl(imgs[i % imgs.length])}
                      alt={step.title}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-1000 pointer-events-none"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-brand-teal/20 transition-colors duration-700"></div>
                    <div className="absolute top-8 right-8 text-8xl font-black text-white/10 group-hover:text-white/30 transition-colors duration-700 font-sans tracking-tighter">
                      0{i + 1}
                    </div>
                    <div className="absolute bottom-10 left-10 w-20 h-20 bg-brand-teal text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl transition-all duration-700 group-hover:scale-110">
                      {icons[i % icons.length]}
                    </div>
                  </div>
                  <div className="p-10">
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-6 group-hover:text-brand-teal transition-colors uppercase tracking-tight">
                      {step.title}
                    </h4>
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-semibold">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Visa Success Stories - Real Proof */}
      {content.showSuccessStories !== false && successStories.length > 0 && (
        <Section
          tagline={content.successStoriesTagline || "Success Stories"}
          title={content.successStoriesTitle || "Visa Success Gallery"}
          subtitle={
            content.successStoriesSubtitle ||
            "Real candidates, real visas. See the results of our dedicated recruitment process."
          }
          className="bg-slate-50/30"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {successStories.map((story, i) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-slate-100 dark:border-white/10 overflow-hidden group hover:shadow-2xl dark:hover:shadow-none transition-all duration-500"
              >
                <div className="relative h-64 overflow-hidden">
                  {story.visaImageUrl && (
                    <img
                      src={getDirectImageUrl(story.visaImageUrl)}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-1000"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl border-2 border-white overflow-hidden shadow-xl">
                      {story.candidatePhotoUrl && (
                        <img
                          src={getDirectImageUrl(story.candidatePhotoUrl)}
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-xl leading-tight">
                        {story.candidateName}
                      </h4>
                      <p className="text-brand-gold text-[10px] font-bold uppercase tracking-widest">
                        {story.position}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex items-center gap-2 text-brand-gold mb-4">
                    <Globe size={14} />
                    <span className="text-xs font-bold uppercase tracking-widest">
                      {story.country}
                    </span>
                  </div>
                  {story.story && (
                    <p className="text-slate-600 dark:text-slate-300 text-sm italic leading-relaxed">
                      "{story.story}"
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {/* About Section - Premium Dubai Identity */}
      <Section
        id="our-identity"
        tagline={content.companyStoryTagline || "Our Identity"}
        title={content.companyStoryTitle || "Dubai Heart, European Reach"}
        subtitle={content.aboutUs}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-16">
          <div className="lg:col-span-8 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div
                whileHover={{ y: -10 }}
                className="p-12 bg-white dark:bg-white/5 rounded-[3rem] border border-slate-100 dark:border-white/10 shadow-xl shadow-slate-200/50 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/5 rounded-bl-[4rem] -mr-12 -mt-12 group-hover:bg-brand-teal/10 transition-all"></div>
                <div className="w-16 h-16 bg-slate-900 dark:bg-brand-teal text-white dark:text-[#121212] rounded-2xl flex items-center justify-center mb-8 shadow-lg transition-all duration-500">
                  <Target size={32} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-6">
                  Our Mission
                </h3>
                <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed font-medium">
                  {content.mission}
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -10 }}
                className="p-12 bg-white dark:bg-white/5 rounded-[3rem] border border-slate-100 dark:border-white/10 shadow-xl shadow-slate-200/50 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/5 rounded-bl-[4rem] -mr-12 -mt-12 group-hover:bg-brand-teal/10 transition-all"></div>
                <div className="w-16 h-16 bg-brand-teal text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg transition-all duration-500">
                  <Globe2 size={32} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-6">
                  Our Vision
                </h3>
                <p className="text-slate-900 dark:text-slate-200 text-lg leading-relaxed font-medium">
                  {content.vision}
                </p>
              </motion.div>
            </div>

            {content.showStats !== false && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {content.stats?.map((stat, i) => (
                  <div
                    key={i}
                    className="p-8 bg-white dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/10 text-center shadow-sm"
                  >
                    <p className="text-3xl md:text-4xl font-black text-brand-teal mb-2">
                      {stat.value}
                    </p>
                    <p className="text-[10px] font-black text-brand-teal uppercase tracking-widest">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="p-12 bg-slate-50 dark:bg-white/5 rounded-[3rem] border border-slate-100 dark:border-white/10">
              <h4 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                <Shield size={24} className="text-brand-teal" /> Core Values
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {content.values?.map((v, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex items-center gap-2 text-brand-teal font-black text-sm uppercase tracking-widest">
                      <CheckCircle2 size={16} /> {v.title}
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed font-medium">
                      {v.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="p-12 bg-[#121212] text-white rounded-[3rem] shadow-2xl relative overflow-hidden group h-full border border-white/5">
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-brand-teal/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-[10px] font-black uppercase tracking-[0.3em] mb-12 shadow-inner">
                  <MapPin size={16} /> Global Headquarters
                </div>
                <h3 className="text-5xl font-black mb-8 tracking-tight text-white">
                  Dubai, UAE
                </h3>
                <p className="text-slate-200 text-base leading-relaxed mb-12 font-medium">
                  Strategically located in the heart of global commerce, we
                  bridge the gap between world-class talent and European
                  excellence.
                </p>
                <div className="space-y-6 mb-16 px-4 py-8 bg-white/5 rounded-[2rem] border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-brand-teal">
                      <Phone size={20} />
                    </div>
                    <p className="text-base font-bold text-white">
                      {content.contactPhone || "+971 50 1942811"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-brand-teal">
                      <Mail size={20} />
                    </div>
                    <p className="text-base font-bold text-white">
                      {content.contactEmail || "workineuhr@gmail.com"}
                    </p>
                  </div>
                </div>
                <Link
                  to="/about"
                  className="w-full bg-premium-gradient-animated text-white py-6 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl group/btn"
                >
                  Visit Our Office{" "}
                  <ArrowRight
                    size={20}
                    className="group-hover/btn:translate-x-2 transition-transform"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Core Strengths */}
      {content.showWhyChooseUs !== false && (
        <Section
          tagline={content.whyChooseUs?.title || "Competitive Edge"}
          title={content.coreStrengthsTitle || "Our Core Strengths"}
          subtitle={
            content.whyChooseUs?.description ||
            "We combine local expertise with global reach to deliver unparalleled recruitment solutions."
          }
          image={content.whyChooseUsImageUrl}
          className="bg-slate-50/50 dark:bg-transparent"
        >
          {/* Professional HR Solutions Highlight - New Section Requested */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-12 pb-12 border-b border-slate-100 dark:border-white/5">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-[10px] font-black uppercase tracking-[0.3em] mb-8">
                <ShieldCheck size={16} />{" "}
                {content.professionalHrSolutionsBadge || "Elite HR Consultancy"}
              </div>
              <h3 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter leading-tight">
                {content.professionalHrSolutionsTitle ||
                  "Professional HR Solutions"}
              </h3>
              <div className="text-slate-800 dark:text-slate-300 text-lg leading-relaxed font-medium space-y-6">
                {content.professionalHrSolutionsDescription ? (
                  <div className="whitespace-pre-wrap">
                    {content.professionalHrSolutionsDescription}
                  </div>
                ) : (
                  <p>
                    At WorkinEU Human Resources Consultancies LLC, we provide
                    end-to-end professional HR solutions tailored to the unique
                    needs of the global labor market. Our expertise spans across
                    recruitment, documentation, and visa processing, ensuring a
                    seamless transition for both employers and candidates.
                    <br />
                    <br />
                    We specialize in sourcing highly skilled and unskilled
                    talent from Asia, Africa, and the Gulf, placing them into
                    key industries across Europe and the Middle East. Our
                    commitment to excellence is reflected in our
                    precision-guided support at every stage of the professional
                    journey.
                  </p>
                )}
              </div>
              <div className="mt-12 flex flex-wrap gap-4">
                <div className="px-6 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl flex items-center gap-3 shadow-sm">
                  <div className="w-8 h-8 bg-brand-teal rounded-lg flex items-center justify-center text-white">
                    <Check size={16} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                    Full Cycle Support
                  </span>
                </div>
                <div className="px-6 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl flex items-center gap-3 shadow-sm">
                  <div className="w-8 h-8 bg-brand-teal rounded-lg flex items-center justify-center text-white">
                    <Check size={16} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                    Expert Advisory
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="relative rounded-[4rem] overflow-hidden shadow-premium aspect-[4/3] group"
            >
              <img
                src={getDirectImageUrl(
                  content.professionalHrSolutionsImageUrl ||
                  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200"
                )}
                alt="Professional HR Solutions"
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-1000"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-teal/20 to-transparent"></div>
              <div className="absolute top-8 right-8 w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 flex items-center justify-center">
                <Target size={40} className="text-white" />
              </div>
            </motion.div>
          </div>

          {/* Professional Edge & Core Strengths - Reorganized for Better Alignment */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-start mb-12">
            {/* Left Content Area: Headline + Strengths */}
            <div className="lg:col-span-8 space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-4xl"
              >
                <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-[10px] font-black uppercase tracking-[0.3em] mb-3">
                  <Zap size={16} />{" "}
                  {content.professionalEdgeTitle || "Professional Edge"}
                </div>
                <h3 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter leading-tight">
                  {content.professionalEdgeSubtitle ||
                    "Mastering Global Talent Acquisition"}
                </h3>
                <div className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed font-medium">
                  {content.professionalEdgeDescription ? (
                    <div className="whitespace-pre-wrap">
                      {content.professionalEdgeDescription}
                    </div>
                  ) : (
                    <p>
                      Our approach to global recruitment is built on deep market
                      intelligence and a relentless pursuit of excellence. We
                      don't just fill positions; we identify and secure
                      industry-leading talent that drives sustainable growth for
                      your organization.
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Strengths Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                {(content.whyChooseUs?.points || content.coreStrengths)?.map(
                  (strength: any, i: number) => {
                    const title =
                      typeof strength === "string" ? strength : strength.title;
                    const desc =
                      typeof strength === "string"
                        ? "Strategic workforce planning and execution tailored for your specific industry needs."
                        : strength.description;

                    return (
                      <motion.div
                        key={i}
                        whileHover={{ x: 10 }}
                        className="relative p-8 md:p-10 bg-white dark:bg-white/5 rounded-[3rem] border border-slate-100 dark:border-white/10 group overflow-hidden transition-all duration-500 hover:shadow-xl flex gap-6"
                      >
                        {/* Side Decorative Line - Requested by user */}
                        <div className="w-1.5 h-auto bg-slate-900/10 rounded-full group-hover:bg-slate-900 dark:group-hover:bg-brand-teal transition-all duration-500 shrink-0"></div>

                        <div className="flex-1">
                          <div className="w-12 h-12 md:w-16 md:h-16 bg-brand-teal/10 text-brand-teal rounded-2xl flex items-center justify-center mb-6 md:mb-8 group-hover:bg-brand-teal group-hover:text-white transition-all duration-500">
                            {i === 0 ? (
                              <Target size={24} />
                            ) : i === 1 ? (
                              <ShieldCheck size={24} />
                            ) : (
                              <Zap size={24} />
                            )}
                          </div>
                          <h4 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mb-2 md:mb-4 uppercase tracking-tight">
                            {title}
                          </h4>
                          <p className="text-slate-800 dark:text-slate-200 text-xs md:text-sm leading-relaxed font-medium">
                            {desc}
                          </p>
                        </div>

                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-teal/5 rounded-bl-[4rem] -mr-8 -mt-8 group-hover:bg-brand-teal/10 transition-all"></div>
                      </motion.div>
                    );
                  },
                )}
              </div>
            </div>

            {/* Right Content Area: Side Photo (Now Aligned with Header) */}
            <div className="lg:col-span-4 lg:sticky lg:top-24">
              <div className="rounded-[4rem] overflow-hidden relative aspect-[3/4] shadow-2xl border-8 border-white dark:border-white/10 group">
                <img
                  src={getDirectImageUrl(
                    content.coreStrengthsImageUrl ||
                    "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800"
                  )}
                  alt="Expertise"
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-1000"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                <div className="absolute bottom-10 left-10 right-10">
                  <p className="text-[10px] font-black text-brand-teal uppercase tracking-[0.4em] mb-3">
                    {content.professionalEdgeTitle || "Professional Edge"}
                  </p>
                  <h4 className="text-2xl font-black text-white leading-tight">
                    {content.professionalEdgeSubtitle ||
                      "Mastering Global Talent Acquisition"}
                  </h4>
                </div>
              </div>
            </div>
          </div>

          {/* High-Impact Global Standards Banner */}
          {content.showPartners !== false && (
            <section className="py-12 md:py-16 relative group overflow-hidden bg-slate-50 dark:bg-white/5 mb-12">
              {/* Decorative background glow */}
              <div className="absolute -inset-10 bg-brand-teal/5 rounded-[6rem] blur-[120px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>

              <div className="max-w-[1920px] mx-auto px-4 md:px-8">
                <div className="bg-white dark:bg-[#1A1A1A] border border-slate-200/60 dark:border-white/10 rounded-[4rem] md:rounded-[6rem] overflow-hidden relative shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] dark:shadow-none">
                  {/* Animated highlights */}
                  <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-teal/10 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
                  <div
                    className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-gold/10 rounded-full blur-[80px] -translate-x-1/3 translate-y-1/3 animate-pulse"
                    style={{ animationDelay: "2s" }}
                  ></div>

                  <div className="grid grid-cols-1 xl:grid-cols-12 relative z-10">
                    {/* Text Content */}
                    <div className="xl:col-span-6 p-12 md:p-20 lg:p-24">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-8"
                      >
                        <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-[0.4em] shadow-sm">
                          <Award
                            size={14}
                            className="animate-bounce text-brand-gold"
                          />
                          {content.globalStandardsTagline || "Global Standards"}
                        </div>

                        <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-[1.1] group-hover:translate-x-2 transition-transform duration-700">
                          {content.globalStandardsTitle ||
                            "Your Success, Our Commitment"}
                        </h3>

                        <div className="text-slate-600 dark:text-slate-300 text-base md:text-lg font-medium leading-relaxed max-w-2xl">
                          {content.globalStandardsDescription ? (
                            <p className="whitespace-pre-wrap">
                              {content.globalStandardsDescription}
                            </p>
                          ) : (
                            <p>
                              Our vision is to bridge the global talent gap by
                              connecting extraordinary individuals with
                              world-class organizations. We believe that
                              professional success is a journey of continuous
                              growth, and we are committed to being your most
                              trusted partner at every step—from documentation
                              to deployment.
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-6 pt-6">
                          <div className="flex -space-x-4">
                            {[1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className="w-12 h-12 rounded-full border-4 border-white dark:border-[#1A1A1A] bg-slate-100 dark:bg-white/5 overflow-hidden ring-2 ring-brand-teal/20"
                              >
                                <img
                                  referrerPolicy="no-referrer"
                                  src={getDirectImageUrl(`https://i.pravatar.cc/100?u=partners-${i}`)}
                                  alt="Partner"
                                  className="w-full h-full object-contain grayscale hover:grayscale-0 transition-all duration-500"
                                />
                              </div>
                            ))}
                          </div>
                          <div className="h-10 w-px bg-slate-200 dark:bg-white/10 mx-2"></div>
                          <div>
                            <p className="text-slate-900 dark:text-white font-black text-lg tracking-tight">
                              Trust of Excellence
                            </p>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-none">
                              Global Partner Network
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Side Image & Logo Cloud Section */}
                    <div className="xl:col-span-6 grid grid-cols-1 md:grid-cols-2">
                      {/* Side Photo */}
                      <div className="relative h-[400px] md:h-full overflow-hidden border-x border-slate-100 dark:border-white/10 bg-slate-100 dark:bg-white/10">
                        <img
                          src={getDirectImageUrl(
                            content.globalStandardsImageUrl ||
                            "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800"
                          )}
                          alt="WorkinEU Standards"
                          className="w-full h-full object-contain grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-1000"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent"></div>
                        <div className="absolute bottom-10 left-10">
                          <div className="text-white font-black text-2xl tracking-tighter uppercase mb-2 drop-shadow-md">
                            Excellence
                          </div>
                          <div className="h-1 w-12 bg-brand-gold rounded-full shadow-lg"></div>
                        </div>
                      </div>

                      {/* Logo Cloud Section */}
                      <div className="bg-slate-50/50 dark:bg-black/20 p-12 md:p-16 border-l border-slate-100 dark:border-white/10 flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-bl-[4rem] pointer-events-none"></div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-12 relative z-10">
                          {clients.length > 0
                            ? clients.slice(0, 6).map((p, i) =>
                                p.logoUrl ? (
                                  <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    whileHover={{
                                      scale: 1.1,
                                      filter: "brightness(1.2)",
                                    }}
                                    className="flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-500 group/logo opacity-70 hover:opacity-100"
                                  >
                                    <img
                                      src={getDirectImageUrl(p.logoUrl)}
                                      alt={p.companyName}
                                      className="h-8 lg:h-10 w-auto object-contain drop-shadow-sm"
                                      referrerPolicy="no-referrer"
                                    />
                                  </motion.div>
                                ) : null,
                              )
                            : content.partners?.slice(0, 6).map((p, i) =>
                                p.logoUrl ? (
                                  <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    whileHover={{
                                      scale: 1.1,
                                      filter: "brightness(1.2)",
                                    }}
                                    className="flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-500 opacity-70 hover:opacity-100"
                                  >
                                    <img
                                      src={getDirectImageUrl(p.logoUrl)}
                                      alt={p.name}
                                      className="h-8 lg:h-10 w-auto object-contain drop-shadow-sm"
                                      referrerPolicy="no-referrer"
                                    />
                                  </motion.div>
                                ) : null,
                              )}
                        </div>

                        <div className="mt-12 pt-10 border-t border-slate-200 dark:border-white/10 text-center relative z-10">
                          <p className="text-slate-400 text-[8px] font-black uppercase tracking-[0.4em]">
                            Certified Recruiting Partner
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Client Partners & Reviews */}
        </Section>
      )}

      {/* Living & Culture */}
      {content.showLivingSection !== false && (
        <Section
          tagline={content.livingSection?.title || "Beyond the Workplace"}
          title={content.livingSectionTitle || "Seamless European Integration"}
          subtitle={
            content.livingSection?.description ||
            "We go beyond recruitment to ensure your transition to European life is comfortable, secure, and professionally managed."
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-8">
              {(
                content.livingSection?.features || [
                  {
                    title: "Premium Housing Solutions",
                    description:
                      "Access to safe, modern, and fully-furnished apartments shared with fellow professionals, strategically located near your workplace.",
                  },
                  {
                    title: "Administrative & Legal Onboarding",
                    description:
                      "Comprehensive assistance with city registration, bank account setup, health insurance, and local legal compliance from day one.",
                  },
                  {
                    title: "Continuous Relocation Assistance",
                    description:
                      "Dedicated on-ground coordinators providing 24/7 support for any personal or professional challenges you may face in your new home.",
                  },
                ]
              ).map((f: any, i: number) => {
                const icons = [
                  <Home size={32} />,
                  <ClipboardCheck size={32} />,
                  <Heart size={32} />,
                ];
                return (
                  <motion.div
                    key={i}
                    whileHover={{ x: 20 }}
                    className="flex gap-10 p-10 bg-white dark:bg-[#121212] rounded-[3rem] border border-slate-100 hover:border-brand-gold transition-all duration-500 group relative overflow-hidden hover:shadow-[0_30px_60px_-15px_rgba(15,23,42,0.1)]"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-bl-[4rem] -mr-12 -mt-12 group-hover:bg-brand-gold/10 transition-all"></div>
                    <div className="w-20 h-20 bg-slate-900/5 text-slate-900 dark:text-white rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                      {icons[i % icons.length]}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-2xl mb-3 group-hover:text-brand-gold transition-colors">
                        {f.title}
                      </h4>
                      <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed max-w-xl font-light">
                        {f.description || f.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="lg:col-span-5 relative">
              <motion.div
                whileHover={{ rotateY: -5, rotateX: 5 }}
                className="relative rounded-[5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(15,23,42,0.3)] border-[16px] border-slate-50 aspect-[4/5] group perspective-1000"
              >
                <img
                  src={getDirectImageUrl("https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&q=80&w=1200")}
                  alt="Living in Europe"
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-1000"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent"></div>

                <div className="absolute bottom-12 left-12 right-12">
                  <div className="inline-flex items-center gap-2 bg-brand-gold text-slate-900 dark:text-white px-6 py-3 rounded-full font-bold text-[10px] uppercase tracking-[0.3em] mb-6 shadow-2xl">
                    <Sparkles size={14} /> Community Life
                  </div>
                  <h3 className="text-white font-bold text-4xl tracking-tight leading-none mb-6">
                    Your New Life <br /> Starts Here
                  </h3>
                  <p className="text-slate-800 dark:text-slate-200 text-sm font-light leading-relaxed">
                    Join a thriving community of international professionals
                    building their future in the heart of Europe.
                  </p>
                </div>
              </motion.div>

              {/* Floating Badge */}
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -bottom-12 -left-12 bg-white dark:bg-[#121212] p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 z-20 hidden xl:flex items-center gap-6"
              >
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
                  <CheckCircle size={32} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">
                    Integration
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    100% Guaranteed
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </Section>
      )}

      {content.showPartners !== false && clients.length > 0 && (
        <Section
          tagline="Our Partners"
          title="Global Client Network"
          subtitle="We work with leading companies across Europe to provide the best opportunities for our candidates."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {clients.map((client, i) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/10 flex flex-col items-center text-center group hover:shadow-xl dark:hover:shadow-none transition-all duration-500"
              >
                <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center p-4 mb-6 group-hover:scale-110 transition-transform">
                  {client.logoUrl ? (
                    <img
                      src={getDirectImageUrl(client.logoUrl)}
                      alt={client.companyName}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Building2 size={40} className="text-slate-200" />
                  )}
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-2">
                  {client.companyName}
                </h4>
                <div className="flex items-center gap-1.5 text-brand-gold mb-4">
                  <Globe size={12} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    {client.country}
                  </span>
                </div>
                {client.review && (
                  <div className="relative pt-6 border-t border-slate-50 w-full">
                    <Quote className="absolute top-2 left-0 text-brand-gold/10 w-8 h-8" />
                    <p className="text-slate-600 dark:text-slate-300 text-xs italic line-clamp-3">
                      "{client.review}"
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {/* Diary Section */}
      {content.showDiary !== false && (
        <Section
          tagline="Our Diary"
          title="Latest Stories"
          subtitle="Stay updated with the latest recruitment news and success stories."
          className="bg-slate-50/50"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {loadingDiary
              ? [1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-96 bg-white dark:bg-[#121212] rounded-[3rem] animate-pulse border border-slate-100"
                  ></div>
                ))
              : (diaryPosts.length > 0 ? diaryPosts : fallbackDiary).map(
                  (post) => <DiaryCard key={post.id} post={post} />,
                )}
          </div>
          <div className="mt-16 text-center">
            <Link
              to="/diary"
              className="inline-flex items-center gap-3 text-slate-900 dark:text-white font-bold hover:text-brand-gold transition-colors group"
            >
              View All Stories{" "}
              <ArrowRight
                size={20}
                className="group-hover:translate-x-2 transition-transform"
              />
            </Link>
          </div>
        </Section>
      )}

      {/* Reviews & FAQ */}
      <Section
        tagline="Trust & Support"
        title="Candidate Success & Support"
        subtitle="Hear from our successful candidates and find answers to common questions."
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div>
            <div className="flex items-center justify-between mb-12">
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Candidate Stories
              </h3>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-900 dark:text-white hover:bg-slate-900 hover:text-white transition-all cursor-pointer">
                  <ArrowRight size={18} className="rotate-180" />
                </div>
                <div className="w-10 h-10 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-900 dark:text-white hover:bg-slate-900 hover:text-white transition-all cursor-pointer">
                  <ArrowRight size={18} />
                </div>
              </div>
            </div>
            <div className="space-y-8">
              {(reviews.length > 0 ? reviews : [1, 2]).map((review: any, i) => (
                <motion.div
                  key={i}
                  whileHover={{ x: 10 }}
                  className="p-10 bg-white dark:bg-[#121212] rounded-[2.5rem] border border-slate-100 relative group transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(15,23,42,0.1)]"
                >
                  <Quote className="absolute top-8 right-8 text-brand-gold/10 w-16 h-16 group-hover:text-brand-gold/20 transition-colors" />
                  <div className="flex gap-1.5 text-brand-gold mb-6">
                    {[...Array(review.rating || 5)].map((_, i) => (
                      <Star key={i} size={16} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed mb-8 italic font-light">
                    "
                    {review.comment ||
                      "WorkinEU made my dream of working in Poland a reality. The support was exceptional."}
                    "
                  </p>
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg">
                      {(review.userName || "A").charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">
                        {review.userName || "Arjun Sharma"}
                      </h4>
                      <p className="text-brand-gold text-[10px] font-bold uppercase tracking-[0.3em]">
                        {review.userRole || "Candidate"}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-12">
              Common Questions
            </h3>
            {content.showFaqs !== false && (
              <div className="space-y-6">
                {content.faqs?.map((faq, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/10 overflow-hidden group hover:border-brand-gold transition-all duration-500"
                  >
                    <button
                      onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                      className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <span className="font-bold text-slate-900 dark:text-white text-base md:text-lg">
                        {faq.question}
                      </span>
                      <div
                        className={cn(
                          "w-10 h-10 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-brand-gold transition-all",
                          activeFaq === i &&
                            "bg-brand-gold text-slate-900 dark:text-white rotate-180",
                        )}
                      >
                        <ChevronDown size={20} />
                      </div>
                    </button>
                    <AnimatePresence>
                      {activeFaq === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-8 pb-8 text-slate-700 dark:text-slate-300 text-sm leading-relaxed border-t border-slate-50 pt-6 font-light"
                        >
                          {faq.answer}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Dynamic Bottom CTA */}
      <BottomCTA />

      {/* Contact & Newsletter */}
      <Section
        id="contact"
        className="py-12 md:py-16 relative bg-white dark:bg-[#121212] overflow-visible scroll-mt-24 lg:scroll-mt-32"
      >
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-slate-50 dark:bg-white/5 opacity-50"></div>
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-teal/5 rounded-full blur-[120px] -mr-96 -mt-96"></div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-[2rem] sm:text-4xl md:text-5xl lg:text-[60px] xl:text-[4rem] font-black mb-8 tracking-tight leading-[1] text-slate-900 dark:text-white xl:whitespace-nowrap">
              Ready to <span className="text-brand-teal italic">Partner</span>{" "}
              With Us?
            </h2>
            <p className="text-slate-800 dark:text-slate-300 text-lg mb-12 font-medium leading-relaxed max-w-xl">
              Join 600+ successful candidates and leading European enterprises.
              Our strategic HR solutions are designed for your growth.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-6 md:gap-8 items-start sm:items-center w-full">
              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 shrink-0 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-brand-teal group-hover:bg-slate-900 dark:group-hover:bg-brand-gold group-hover:text-white dark:group-hover:text-brand-blue transition-all duration-500 shadow-sm border border-slate-100 dark:border-white/5">
                  <Mail size={24} />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-[0.2em] mb-1">
                    Email Us
                  </p>
                  <p className="text-slate-900 dark:text-white font-black text-sm md:text-base whitespace-nowrap">
                    {content.contactEmail}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-brand-teal group-hover:bg-slate-900 dark:group-hover:bg-brand-gold group-hover:text-white dark:group-hover:text-brand-blue transition-all duration-500 shadow-sm border border-slate-100 dark:border-white/5">
                  <Phone size={24} />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-[0.2em] mb-1">
                    Call Us
                  </p>
                  <p className="text-slate-900 dark:text-white font-black text-sm md:text-base whitespace-nowrap">
                    WhatsApp: {content.contactPhone}
                  </p>
                </div>
              </div>
              {content.officeMapUrl && (
                <div className="flex items-center gap-4 group mt-2 sm:mt-0">
                  <Link
                    to="/office"
                    className="flex items-center gap-4 group w-full"
                  >
                    <div className="w-12 h-12 shrink-0 bg-brand-gold rounded-xl flex items-center justify-center text-slate-900 dark:text-white group-hover:bg-white group-hover:text-brand-gold transition-all duration-500 shadow-xl border border-brand-gold/20">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1">
                        Visit Our Office
                      </p>
                      <p className="text-slate-900 dark:text-white font-black text-sm md:text-base group-hover:text-brand-gold transition-colors underline decoration-brand-gold/30 underline-offset-4 whitespace-nowrap">
                        Our Journey & Team
                      </p>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-b from-white to-slate-50 dark:from-[#1A1A1A] dark:to-[#121212] p-10 md:p-16 rounded-[4rem] border-x border-t border-slate-200 dark:border-white/10 border-b-[8px] border-b-slate-200 dark:border-b-black shadow-xl shadow-slate-200/50 dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
          >
            <form onSubmit={handleContactSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[11px] text-brand-gold uppercase font-black tracking-[0.3em] ml-4">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full bg-slate-100 dark:bg-white/5 border-2 border-transparent dark:border-white/5 rounded-2xl px-8 py-5 text-slate-900 dark:text-white outline-none focus:border-brand-gold focus:bg-white dark:focus:bg-white/10 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-inner"
                    value={contactForm.fullName}
                    onChange={(e) =>
                      setContactForm({
                        ...contactForm,
                        fullName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] text-brand-gold uppercase font-black tracking-[0.3em] ml-4">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className="w-full bg-slate-100 dark:bg-white/5 border-2 border-transparent dark:border-white/5 rounded-2xl px-8 py-5 text-slate-900 dark:text-white outline-none focus:border-brand-gold focus:bg-white dark:focus:bg-white/10 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-inner"
                    value={contactForm.email}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[11px] text-brand-gold uppercase font-black tracking-[0.3em] ml-4">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+971 50 1942811"
                  className="w-full bg-slate-100 dark:bg-white/5 border-2 border-transparent dark:border-white/5 rounded-2xl px-8 py-5 text-slate-900 dark:text-white outline-none focus:border-brand-gold focus:bg-white dark:focus:bg-white/10 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-inner"
                  value={contactForm.phone}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] text-brand-gold uppercase font-black tracking-[0.3em] ml-4">
                  Your Message
                </label>
                <textarea
                  placeholder="Tell us about your requirements..."
                  rows={4}
                  className="w-full bg-slate-100 dark:bg-white/5 border-2 border-transparent dark:border-white/5 rounded-2xl px-8 py-5 text-slate-900 dark:text-white outline-none focus:border-brand-gold focus:bg-white dark:focus:bg-white/10 transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-inner"
                  value={contactForm.message}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, message: e.target.value })
                  }
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-gold text-slate-900 dark:text-white py-6 rounded-2xl font-bold hover:bg-white transition-all flex items-center justify-center gap-4 disabled:opacity-50 shadow-2xl group/btn"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Send
                      size={22}
                      className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform"
                    />{" "}
                    Send Inquiry
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </Section>

      {/* Back to Top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-32 md:bottom-12 right-6 md:right-12 z-50 w-14 md:h-16 h-14 md:w-16 bg-brand-gold text-slate-900 dark:text-white rounded-2xl shadow-2xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all group"
          >
            <ArrowUp
              size={28}
              className="group-hover:-translate-y-1 transition-transform"
            />
          </motion.button>
        )}
      </AnimatePresence>

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

              <div className="mb-12 text-left">
                <span className="text-brand-gold font-bold uppercase tracking-[0.4em] text-[10px] mb-4 block">
                  Quick Application
                </span>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
                  Applying for {selectedJobToApply.title}
                </h2>
                <div className="flex items-center gap-3 text-slate-500 font-medium text-lg">
                  <MapPin size={20} className="text-brand-teal" />
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
    </div>
  );
}
