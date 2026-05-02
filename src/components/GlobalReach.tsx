import { getDirectImageUrl } from "../lib/utils";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Globe, Plus, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../lib/utils";
import { countryToCode } from "../constants";

interface GlobalReachProps {
  countries: string[];
  jobCounts: Record<string, number>;
  tagline?: string;
  title?: string;
  subtitle?: string;
  dark?: boolean;
}

export default function GlobalReach({
  countries,
  jobCounts,
  tagline = "Global Reach",
  title = "Countries We Serve",
  subtitle = "We have established strategic partnerships across Europe, the Middle East, and beyond. Every destination is a gateway to exclusive professional opportunities.",
  dark = true,
}: GlobalReachProps) {
  const [expanded, setExpanded] = useState(false);
  const INITIAL_COUNT = 8;
  const visibleCountries = expanded
    ? countries
    : countries.slice(0, INITIAL_COUNT);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <section
      className={cn(
        "py-12 md:py-20 relative overflow-hidden transition-colors duration-500",
        dark ? "bg-[#121212] text-white" : "bg-white dark:bg-[#121212]",
      )}
    >
      {/* Background Atmosphere */}
      {dark && (
        <>
          <div className="absolute top-0 left-0 w-full h-full bg-mesh opacity-10 pointer-events-none"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-brand-teal/5 rounded-full blur-[150px] pointer-events-none"></div>
        </>
      )}

      <div className="max-w-[1920px] mx-auto px-4 md:px-8 relative z-10">
        <div className="max-w-4xl mb-12 md:mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-brand-teal font-black uppercase tracking-[0.6em] mb-6 block text-[10px] md:text-xs"
          >
            {tagline}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className={cn(
              "text-4xl md:text-7xl lg:text-9xl font-black tracking-tighter mb-8 md:mb-12 font-sans",
              dark ? "text-white" : "text-slate-900 dark:text-white",
            )}
          >
            {title.split(" ").map((word, i) => (
              <span key={i} className={i === 1 ? "text-brand-teal italic" : ""}>
                {word}{" "}
              </span>
            ))}
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className={cn(
              "text-lg md:text-2xl font-medium leading-relaxed max-w-3xl",
              dark ? "text-slate-400" : "text-slate-500",
            )}
          >
            {subtitle}
          </motion.div>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 md:gap-8 mb-16"
        >
          <AnimatePresence mode="popLayout">
            {visibleCountries.map((country, i) => (
              <motion.div
                key={country}
                variants={item}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, scale: 0.9 }}
                layout
              >
                <Link
                  to={`/jobs?country=${encodeURIComponent(country)}`}
                  className={cn(
                    "group block p-6 md:p-10 rounded-[2.5rem] border transition-all duration-700 text-center relative overflow-hidden h-full",
                    dark
                      ? "bg-white/5 border-white/10 hover:bg-white hover:border-white shadow-2xl"
                      : "bg-slate-50 border-slate-100 hover:bg-white hover:border-brand-teal shadow-sm hover:shadow-2xl",
                  )}
                >
                  <div className="absolute inset-0 bg-premium-gradient-animated opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                  {jobCounts[country] > 0 && (
                    <div className="absolute top-4 right-4 bg-white dark:bg-[#121212] text-[#121212] text-[10px] font-black px-3 py-1 rounded-full z-20 shadow-lg transition-transform group-hover:scale-110">
                      {jobCounts[country]}
                    </div>
                  )}

                  <div className="w-20 h-12 mx-auto mb-8 rounded-xl overflow-hidden shadow-2xl border border-white/10 group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-700 relative z-10">
                    {countryToCode[country] ? (
                      <img
                        src={getDirectImageUrl(`https://flagcdn.com/w160/${countryToCode[country]}.png`)}
                        alt={country}
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-brand-teal/20 flex items-center justify-center">
                        <Globe size={28} className="text-brand-teal" />
                      </div>
                    )}
                  </div>
                  <p
                    className={cn(
                      "font-black text-sm md:text-xl tracking-tight relative z-10 mb-2 transition-colors duration-500",
                      dark
                        ? "text-white group-hover:text-white"
                        : "text-slate-900 dark:text-white group-hover:text-white",
                    )}
                  >
                    {country}
                  </p>
                  <div className="flex items-center justify-center gap-2 relative z-10">
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full animate-pulse",
                        jobCounts[country] > 0
                          ? "bg-brand-teal"
                          : "bg-slate-500",
                        "group-hover:bg-white dark:bg-[#121212]",
                      )}
                    ></div>
                    <p
                      className={cn(
                        "text-[10px] font-black uppercase tracking-widest transition-colors duration-500",
                        dark
                          ? "text-slate-400 group-hover:text-white"
                          : "text-slate-400 group-hover:text-white",
                      )}
                    >
                      {jobCounts[country]
                        ? `${jobCounts[country]} Opportunities`
                        : "New Roles Soon"}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {countries.length > INITIAL_COUNT && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-center mt-12 md:mt-20"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setExpanded(!expanded)}
              className={cn(
                "group flex items-center gap-4 px-14 py-6 rounded-full font-black uppercase tracking-widest text-xs md:text-sm transition-all duration-500 shadow-2xl hover:shadow-brand-teal/20",
                dark
                  ? "bg-white text-[#121212] hover:bg-brand-teal hover:text-white"
                  : "bg-[#121212] text-white hover:bg-brand-teal",
              )}
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                  See More Countries
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
