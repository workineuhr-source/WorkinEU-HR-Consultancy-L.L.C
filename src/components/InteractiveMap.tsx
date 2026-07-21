import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { Job } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Briefcase, Building, Search, Compass, Info, ArrowRight, ExternalLink, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";

interface MapLocation {
  id: string;
  name: string;
  city: string;
  type: "office" | "job";
  flag: string;
  x: number; // SVG canvas coordinate X (0-1000)
  y: number; // SVG canvas coordinate Y (0-800)
  description: string;
}

// Fixed core coordinates on our customized Europe + Middle East projection (viewBox 0 0 1000 800)
const FIXED_LOCATIONS: MapLocation[] = [
  {
    id: "dubai",
    name: "United Arab Emirates",
    city: "Dubai",
    type: "office",
    flag: "🇦🇪",
    x: 820,
    y: 640,
    description: "WorkinEU HR Consultancy HQ — Royal Zone Business Center",
  },
  {
    id: "poland",
    name: "Poland",
    city: "Warsaw",
    type: "job",
    flag: "🇵🇱",
    x: 550,
    y: 280,
    description: "Active placements in Logistics, Manufacturing & Construction",
  },
  {
    id: "germany",
    name: "Germany",
    city: "Berlin",
    type: "job",
    flag: "🇩🇪",
    x: 440,
    y: 310,
    description: "Premium roles in IT, Hospitality & Engineering",
  },
  {
    id: "croatia",
    name: "Croatia",
    city: "Zagreb",
    type: "job",
    flag: "🇭🇷",
    x: 500,
    y: 430,
    description: "In-demand positions in Tourism, Agriculture & Production",
  },
  {
    id: "romania",
    name: "Romania",
    city: "Bucharest",
    type: "job",
    flag: "🇷🇴",
    x: 620,
    y: 410,
    description: "Urgent recruitment in Construction, Logistics & Services",
  },
  {
    id: "malta",
    name: "Malta",
    city: "Valletta",
    type: "job",
    flag: "🇲🇹",
    x: 460,
    y: 580,
    description: "Opportunities in Hospitality, Healthcare & Customer Support",
  },
  {
    id: "portugal",
    name: "Portugal",
    city: "Lisbon",
    type: "job",
    flag: "🇵🇹",
    x: 140,
    y: 530,
    description: "Placements in Agriculture, Tourism & Tech",
  },
  {
    id: "hungary",
    name: "Hungary",
    city: "Budapest",
    type: "job",
    flag: "🇭🇺",
    x: 540,
    y: 360,
    description: "Excellent manufacturing and factory assembly jobs",
  },
];

export default function InteractiveMap() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "offices" | "jobs">("all");
  const [hoveredLoc, setHoveredLoc] = useState<MapLocation | null>(null);
  const [selectedLoc, setSelectedLoc] = useState<MapLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch real jobs from Firestore to display counts and titles in the tooltips
  useEffect(() => {
    const q = query(collection(db, "jobs"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const jobsData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Job
        ).filter(job => job.status !== "hidden");
        setJobs(jobsData);
      },
      (error) => {
        console.error("Error fetching jobs for map:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Helper to count jobs for a country
  const getJobCountForCountry = (countryName: string) => {
    return jobs.filter(
      (job) => job.country.toLowerCase() === countryName.toLowerCase()
    ).length;
  };

  // Helper to get job listings for a country
  const getJobsForCountry = (countryName: string) => {
    return jobs.filter(
      (job) => job.country.toLowerCase() === countryName.toLowerCase()
    );
  };

  // Filter locations based on active tab and search query
  const filteredLocations = FIXED_LOCATIONS.filter((loc) => {
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "offices" && loc.type === "office") ||
      (activeTab === "jobs" && loc.type === "job");

    const matchesSearch =
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const dubaiLocation = FIXED_LOCATIONS.find((l) => l.id === "dubai")!;

  return (
    <div className="bg-slate-50 dark:bg-zinc-900/40 rounded-[3rem] p-8 md:p-12 border border-slate-100 dark:border-white/5 shadow-2xl transition-all">
      {/* Map Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
        <div>
          <span className="text-brand-gold font-bold uppercase tracking-[0.4em] mb-3 block text-xs">
            Global Infrastructure
          </span>
          <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Our Network <span className="text-brand-teal italic font-serif">Bridge</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base mt-2 max-w-2xl font-light">
            Connecting our central Middle East HQ in Dubai directly with key talent placement hubs across the European Union. Click on any beacon to explore opportunities.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full lg:w-72">
          <input
            type="text"
            placeholder="Search country or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm border border-slate-200 dark:border-white/10 outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal transition-all bg-white dark:bg-white/5 dark:text-white"
          />
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* Control Tabs */}
      <div className="flex flex-wrap gap-3 mb-8">
        {[
          { id: "all", label: "Show All Locations", count: FIXED_LOCATIONS.length },
          {
            id: "offices",
            label: "HQ & Offices",
            count: FIXED_LOCATIONS.filter((l) => l.type === "office").length,
          },
          {
            id: "jobs",
            label: "EU Job Hubs",
            count: FIXED_LOCATIONS.filter((l) => l.type === "job").length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setSelectedLoc(null);
            }}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2",
              activeTab === tab.id
                ? "bg-slate-900 dark:bg-brand-teal text-white shadow-lg"
                : "bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10"
            )}
          >
            {tab.id === "offices" && <Building size={14} />}
            {tab.id === "jobs" && <Briefcase size={14} />}
            {tab.id === "all" && <Globe size={14} />}
            {tab.label}
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-black",
              activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Map Stage */}
        <div className="lg:col-span-8 bg-slate-900/95 dark:bg-black/40 rounded-[2.5rem] relative overflow-hidden border border-slate-800 dark:border-white/5 shadow-inner p-4 min-h-[400px] md:min-h-[550px] aspect-[5/4] flex items-center justify-center">
          {/* Topographical grid lines */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>

          {/* Map Compass */}
          <div className="absolute bottom-6 left-6 text-slate-600 dark:text-slate-500 flex items-center gap-2 text-xs select-none pointer-events-none">
            <Compass size={18} className="animate-spin-slow text-brand-gold" />
            <span className="font-mono tracking-widest uppercase">WorkinEU Navigational Grid</span>
          </div>

          {/* SVG Map Canvas */}
          <svg
            viewBox="0 0 1000 800"
            className="w-full h-full relative z-10 select-none"
            style={{ filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.5))" }}
          >
            {/* Elegant Abstract Landmass Outlines / Stylized Background Elements */}
            <g className="opacity-[0.12] dark:opacity-[0.08] stroke-slate-500 stroke-[1.5] fill-none">
              {/* Simplified Grid Lines representing Latitude & Longitude */}
              <line x1="100" y1="0" x2="100" y2="800" strokeDasharray="5,5" />
              <line x1="300" y1="0" x2="300" y2="800" strokeDasharray="5,5" />
              <line x1="500" y1="0" x2="500" y2="800" strokeDasharray="5,5" />
              <line x1="700" y1="0" x2="700" y2="800" strokeDasharray="5,5" />
              <line x1="900" y1="0" x2="900" y2="800" strokeDasharray="5,5" />

              <line x1="0" y1="200" x2="1000" y2="200" strokeDasharray="5,5" />
              <line x1="0" y1="400" x2="1000" y2="400" strokeDasharray="5,5" />
              <line x1="0" y1="600" x2="1000" y2="600" strokeDasharray="5,5" />

              {/* Decorative Scale circles */}
              <circle cx="820" cy="640" r="100" strokeDasharray="3,6" />
              <circle cx="820" cy="640" r="200" strokeDasharray="3,6" />
            </g>

            {/* Connection Bridges (Bezier curves from Dubai Office to each job country) */}
            <g>
              {FIXED_LOCATIONS.filter((l) => l.type === "job").map((loc) => {
                const isHovered = hoveredLoc?.id === loc.id;
                const isSelected = selectedLoc?.id === loc.id;
                const isActive = isHovered || isSelected;

                // Bezier control point to create an elegant arch
                const midX = (dubaiLocation.x + loc.x) / 2;
                const midY = Math.min(dubaiLocation.y, loc.y) - 100;

                return (
                  <g key={`bridge-${loc.id}`}>
                    {/* Shadow / Glow line under active bridges */}
                    <path
                      d={`M ${dubaiLocation.x} ${dubaiLocation.y} Q ${midX} ${midY} ${loc.x} ${loc.y}`}
                      fill="none"
                      stroke={isActive ? "#d4af37" : "#0d9488"}
                      strokeWidth={isActive ? 5 : 1.5}
                      className={cn(
                        "transition-all duration-500",
                        isActive ? "opacity-60 blur-[3px]" : "opacity-15"
                      )}
                    />
                    {/* Core connection line */}
                    <path
                      d={`M ${dubaiLocation.x} ${dubaiLocation.y} Q ${midX} ${midY} ${loc.x} ${loc.y}`}
                      fill="none"
                      stroke={isActive ? "url(#goldGradient)" : "url(#tealGradient)"}
                      strokeWidth={isActive ? 2.5 : 1}
                      strokeDasharray={isActive ? "none" : "4,4"}
                      className="transition-all duration-500 opacity-80"
                    />

                    {/* Glowing energy flow particle effect */}
                    {isActive && (
                      <circle r="4" fill="#d4af37">
                        <animateMotion
                          dur="2.5s"
                          repeatCount="indefinite"
                          path={`M ${dubaiLocation.x} ${dubaiLocation.y} Q ${midX} ${midY} ${loc.x} ${loc.y}`}
                        />
                      </circle>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Gradients Definitions */}
            <defs>
              <linearGradient id="tealGradient" x1="100%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#0d9488" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="goldGradient" x1="100%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#d4af37" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Beacons and Locations Points */}
            {filteredLocations.map((loc) => {
              const isHQ = loc.type === "office";
              const isHovered = hoveredLoc?.id === loc.id;
              const isSelected = selectedLoc?.id === loc.id;
              const hasJobs = loc.type === "job";
              const jobCount = getJobCountForCountry(loc.name);

              return (
                <g
                  key={loc.id}
                  transform={`translate(${loc.x}, ${loc.y})`}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredLoc(loc)}
                  onMouseLeave={() => setHoveredLoc(null)}
                  onClick={() => setSelectedLoc(loc)}
                >
                  {/* Outer Pulsing Aura */}
                  <circle
                    r={isHQ ? 32 : 24}
                    fill={isHQ ? "#f59e0b" : "#0d9488"}
                    className={cn(
                      "opacity-0 transition-opacity duration-300 group-hover:opacity-20",
                      isSelected && "opacity-25"
                    )}
                  />

                  {/* Pulsing rings */}
                  <circle
                    r={isHQ ? 20 : 14}
                    fill="none"
                    stroke={isHQ ? "#f59e0b" : "#0d9488"}
                    strokeWidth="1"
                    className="opacity-40"
                  >
                    <animate
                      attributeName="r"
                      values={isHQ ? "10;35;10" : "8;26;8"}
                      dur={isHQ ? "3s" : "4s"}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.6;0;0.6"
                      dur={isHQ ? "3s" : "4s"}
                      repeatCount="indefinite"
                    />
                  </circle>

                  {/* Pin Point Center */}
                  <circle
                    r={isHQ ? 8 : 6}
                    fill={isHQ ? "#f59e0b" : "#2dd4bf"}
                    className="transition-transform duration-300 group-hover:scale-125"
                  />

                  {/* Text Label Backdrop */}
                  <rect
                    x={isHQ ? -50 : -45}
                    y={isHQ ? -40 : -35}
                    width={isHQ ? 100 : 90}
                    height="20"
                    rx="6"
                    fill="#0f172a"
                    stroke={isHQ ? "#f59e0b" : "#0d9488"}
                    strokeWidth="1"
                    className={cn(
                      "opacity-85 shadow-lg transition-all duration-300",
                      (isHovered || isSelected) ? "opacity-100 scale-105" : "scale-95"
                    )}
                  />

                  {/* Text Label */}
                  <text
                    x="0"
                    y={isHQ ? -27 : -22}
                    textAnchor="middle"
                    fill="#ffffff"
                    className="text-[10px] font-black tracking-wider uppercase pointer-events-none select-none font-sans"
                  >
                    {loc.flag} {loc.city}
                  </text>

                  {/* Job Count Badge (if applicable) */}
                  {hasJobs && jobCount > 0 && (
                    <g transform="translate(24, -8)">
                      <circle r="9" fill="#e11d48" />
                      <text
                        y="3"
                        textAnchor="middle"
                        fill="#ffffff"
                        className="text-[9px] font-black font-sans"
                      >
                        {jobCount}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Detailed Info / Live Listings Panel */}
        <div className="lg:col-span-4 h-full">
          <AnimatePresence mode="wait">
            {selectedLoc ? (
              <motion.div
                key={`details-${selectedLoc.id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden flex flex-col h-full min-h-[400px]"
              >
                {/* Visual Accent */}
                <div className={cn(
                  "absolute top-0 left-0 right-0 h-2",
                  selectedLoc.type === "office" ? "bg-brand-gold" : "bg-brand-teal"
                )}></div>

                <div className="flex justify-between items-start mb-6 pt-2">
                  <span className="text-[32px]">{selectedLoc.flag}</span>
                  <button
                    onClick={() => setSelectedLoc(null)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase tracking-wider bg-slate-50 dark:bg-white/5 px-3 py-1.5 rounded-lg"
                  >
                    Clear Select
                  </button>
                </div>

                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                  {selectedLoc.city}, {selectedLoc.name}
                </h3>
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-6 w-fit",
                  selectedLoc.type === "office"
                    ? "bg-amber-500/10 text-amber-500"
                    : "bg-teal-500/10 text-teal-500"
                )}>
                  {selectedLoc.type === "office" ? <Building size={12} /> : <Briefcase size={12} />}
                  {selectedLoc.type === "office" ? "Office Headquarters" : "Active Job Placements"}
                </span>

                <p className="text-slate-500 dark:text-slate-300 text-sm leading-relaxed mb-6 font-medium">
                  {selectedLoc.description}
                </p>

                {/* Live Job Listings block */}
                {selectedLoc.type === "job" ? (
                  <div className="flex-grow flex flex-col">
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                      Active Opportunities ({getJobCountForCountry(selectedLoc.name)})
                    </h4>

                    {getJobCountForCountry(selectedLoc.name) > 0 ? (
                      <div className="space-y-3 flex-grow overflow-y-auto max-h-[250px] pr-2 scrollbar-thin">
                        {getJobsForCountry(selectedLoc.name).map((job) => (
                          <Link
                            key={job.id}
                            to={`/jobs?search=${encodeURIComponent(job.title)}`}
                            className="block p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-brand-teal/30 dark:hover:border-brand-teal/30 transition-all group"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-teal transition-colors line-clamp-1">
                                {job.title}
                              </h5>
                              <ExternalLink size={12} className="text-slate-400 shrink-0 mt-0.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </div>
                            <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              <span>{job.category}</span>
                              <span className="text-brand-teal">{job.type}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="flex-grow flex flex-col items-center justify-center py-8 text-center bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-200 dark:border-white/5">
                        <Info size={24} className="text-slate-400 mb-2" />
                        <p className="text-xs text-slate-400 max-w-[200px]">
                          We are currently sourcing new exclusive listings for {selectedLoc.name}. Stay tuned!
                        </p>
                      </div>
                    )}

                    <Link
                      to={`/jobs?country=${encodeURIComponent(selectedLoc.name)}`}
                      className="mt-6 w-full bg-slate-950 text-white dark:bg-brand-teal py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-brand-gold hover:text-slate-900 transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      Browse All {selectedLoc.name} Jobs <ArrowRight size={14} />
                    </Link>
                  </div>
                ) : (
                  <div className="flex-grow flex flex-col justify-between">
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6 text-sm text-slate-600 dark:text-slate-300 font-medium">
                      <p className="mb-4">
                        This is our master central operations center. From this Dubai-licensed entity, we manage partner employer relationships, legal visa processing, and candidate compliance protocols.
                      </p>
                      <p className="text-xs text-brand-gold font-bold uppercase tracking-widest">
                        LICENSE: WorkinEU Human Resources Consultancies LLC
                      </p>
                    </div>

                    <Link
                      to="/office"
                      className="mt-6 w-full bg-slate-950 text-white dark:bg-brand-gold py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      Meet Our Dubai Team <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-8 shadow-xl flex flex-col items-center justify-center text-center h-full min-h-[400px] border-dashed"
              >
                <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-brand-teal mb-6 shadow-sm">
                  <Globe className="animate-pulse" size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                  Interactive Intelligence
                </h3>
                <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs font-light leading-relaxed">
                  Select any country beacon or branch on the map to inspect live opportunities and operational details immediately.
                </p>

                <div className="mt-8 space-y-2 w-full max-w-[240px]">
                  <div className="flex items-center gap-3 text-left p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                    <span className="text-xl">🇦🇪</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Dubai HQ</h4>
                      <p className="text-[10px] text-slate-400">Operations & Licensing</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-left p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                    <span className="text-xl">🇪🇺</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">European Hubs</h4>
                      <p className="text-[10px] text-slate-400">{FIXED_LOCATIONS.length - 1} Countries Active</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
