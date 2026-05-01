import { motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase";
import { SiteContent, TeamMember } from "../types";
import {
  Building2,
  Users2,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Sparkles,
  Heart,
  Target,
  Globe,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function OfficePage() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contentSnap, teamSnap] = await Promise.all([
          getDoc(doc(db, "settings", "siteContent")),
          getDocs(query(collection(db, "team"), orderBy("order", "asc"))),
        ]);

        if (contentSnap.exists()) {
          setContent(contentSnap.data() as SiteContent);
        }
        if (teamSnap.docs.length) {
          setTeam(
            teamSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as TeamMember),
          );
        }
      } catch (error) {
        console.error("Error fetching office data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-white/5">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] pt-32 pb-20">
      {/* Hero Section with Office Photo */}
      <section className="relative h-[70vh] min-h-[600px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={
              content?.officeImageUrl ||
              "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1920"
            }
            alt="Our Office"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/20 to-slate-900"></div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-[1700px] mx-auto px-6 md:px-12 lg:px-20 w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-gold/20 backdrop-blur-md border border-brand-gold/30 text-brand-gold text-xs font-bold uppercase tracking-[0.3em] mb-8">
                <Building2 size={14} /> Visit Our Office
              </span>
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-white mb-8 tracking-tight leading-[0.9]">
                Where Excellence <br />
                <span className="text-brand-gold italic font-serif">
                  Meets Ambition.
                </span>
              </h1>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Company Story Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-gold/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="max-w-[1700px] mx-auto px-6 md:px-12 lg:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-start">
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <span className="text-brand-gold font-bold uppercase tracking-[0.4em] mb-6 block text-xs">
                  Our Legacy
                </span>
                <h2 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-10 tracking-tight">
                  {content?.companyStoryTitle ||
                    "A Story of Global Connection & Trust"}
                </h2>
                <div className="prose prose-xl text-slate-500 font-light leading-relaxed space-y-8 max-w-none">
                  {(
                    content?.companyStoryDescription ||
                    "WorkinEU Human Resources Consultancies LLC was founded with a singular vision: to bridge the gap between world-class talent and the boundless opportunities within the European labor market. From our headquarters in Dubai, we have grown into a trusted partner for both ambitious professionals and leading organizations across the globe."
                  )
                    .split("\n")
                    .map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-5">
              <div className="p-12 bg-slate-900 rounded-[3rem] text-white relative overflow-hidden group shadow-2xl">
                <div className="absolute inset-0 bg-mesh opacity-20"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                    <MapPin className="text-brand-gold" /> Find Us In Dubai
                  </h3>
                  <p className="text-slate-400 mb-10 font-light leading-relaxed">
                    Our main office is located in the prestigious Royal Zone
                    Business Center, strategically positioned to serve our
                    global clientele.
                  </p>
                  <div className="space-y-6 mb-12">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-brand-gold shrink-0">
                        <MapPin size={18} />
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {content?.contactAddress}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-brand-gold shrink-0">
                        <Phone size={18} />
                      </div>
                      <p className="text-sm text-slate-300">
                        {content?.contactPhone}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-brand-gold shrink-0">
                        <Mail size={18} />
                      </div>
                      <p className="text-sm text-slate-300">
                        {content?.contactEmail}
                      </p>
                    </div>
                  </div>
                  <a
                    href={
                      content?.officeMapUrl ||
                      "https://maps.app.goo.gl/UJvEMfwBeHoHM18MA"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-brand-gold text-slate-900 dark:text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-white transition-all shadow-xl group/btn"
                  >
                    Open in Google Maps{" "}
                    <ArrowRight
                      size={20}
                      className="group-hover/btn:translate-x-2 transition-transform"
                    />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-32 bg-slate-50 dark:bg-white/5">
        <div className="max-w-[1700px] mx-auto px-6 md:px-12 lg:px-20">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-brand-gold font-bold uppercase tracking-[0.4em] mb-6 block text-xs">
              The Experts
            </span>
            <h2 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-8 tracking-tight">
              Meet Our Team
            </h2>
            <p className="text-slate-500 text-lg font-light leading-relaxed">
              Our dedicated professionals are here to guide you through every
              step of your international career journey.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {team.map((member, i) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group"
              >
                <div className="relative aspect-[3/4] rounded-[3rem] overflow-hidden mb-8 shadow-xl group-hover:shadow-2xl transition-all duration-500">
                  <img
                    src={
                      member.photoUrl ||
                      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400"
                    }
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute bottom-8 left-8 right-8 translate-y-4 group-hover:translate-y-0 transition-transform duration-500 opacity-0 group-hover:opacity-100">
                    <p className="text-white text-sm font-light leading-relaxed line-clamp-3">
                      {member.bio ||
                        "Dedicated professional committed to excellence in recruitment."}
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {member.name}
                  </h3>
                  <p className="text-brand-gold text-xs font-bold uppercase tracking-widest">
                    {member.position}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values/CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="max-w-[1700px] mx-auto px-6 md:px-12 lg:px-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: <Heart size={32} />,
                title: "Candidate First",
                desc: "We prioritize the dreams and security of every candidate we serve.",
              },
              {
                icon: <Target size={32} />,
                title: "Ethical Practices",
                desc: "Transparency and honesty are the foundations of our recruitment process.",
              },
              {
                icon: <Globe size={32} />,
                title: "Global Excellence",
                desc: "Maintaining international standards in every placement we facilitate.",
              },
            ].map((v, i) => (
              <div
                key={i}
                className="p-12 bg-white dark:bg-[#121212] rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500"
              >
                <div className="w-16 h-16 bg-brand-gold/10 text-brand-gold rounded-2xl flex items-center justify-center mb-8">
                  {v.icon}
                </div>
                <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  {v.title}
                </h4>
                <p className="text-slate-500 font-light leading-relaxed">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
