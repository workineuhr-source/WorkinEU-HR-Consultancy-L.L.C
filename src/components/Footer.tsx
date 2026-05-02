import { getDirectImageUrl } from "../lib/utils";
import { Link } from "react-router-dom";
import {
  Facebook,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Instagram,
  Youtube,
  Music2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { SiteContent } from "../types";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [navLabels, setNavLabels] = useState({
    home: "Home",
    jobs: "Jobs",
    about: "About Us",
    contact: "Contact Us",
    diary: "Diary",
  });
  const [logoUrl, setLogoUrl] = useState("");
  const [footerLogoUrl, setFooterLogoUrl] = useState("");
  const [contactInfo, setContactInfo] = useState({
    email: "workineuhr@gmail.com",
    phone: "+971 50 1942811 / +971 50 2402655",
    address:
      "Mai Tower 4th Floor, Office No. 10, Al Qusais, Al Nahda 1, Dubai, UAE",
    whatsapp: "971501942811",
    branchOffices: [] as SiteContent["branchOffices"],
  });
  const [socialLinks, setSocialLinks] = useState<SiteContent["socialLinks"]>({
    facebook: "https://www.facebook.com/workineuhr/",
    instagram: "https://www.instagram.com/workineuhr/",
    linkedin: "https://www.linkedin.com/in/workineuhrconsultancy/",
    whatsapp: "971501942811",
    tiktok: "https://www.tiktok.com/@workineuhr",
    youtube: "",
  });

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "siteContent"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as SiteContent;
          setNavLabels({
            home: data.navHome || "Home",
            jobs: data.navJobs || "Jobs",
            about: data.navAbout || "About Us",
            contact: data.navContact || "Contact Us",
            diary: data.navDiary || "Diary",
          });
          setLogoUrl(data.logoUrl || "");
          setFooterLogoUrl(data.footerLogoUrl || "");
          setContactInfo({
            email: data.contactEmail || "workineuhr@gmail.com",
            phone: data.contactPhone || "+971 50 1942811 / +971 50 2402655",
            address:
              data.contactAddress ||
              "Mai Tower 4th Floor, Office No. 10, Al Qusais, Al Nahda 1, Dubai, UAE",
            whatsapp: data.whatsappNumber?.replace(/\D/g, "") || "971501942811",
            branchOffices: data.branchOffices || [],
          });
          if (data.socialLinks) {
            setSocialLinks(data.socialLinks);
          }
        }
      },
      (err) => console.error("Footer site content listener error:", err),
    );

    return () => unsub();
  }, []);

  return (
    <footer className="bg-[#121212] text-white pt-24 pb-12 relative overflow-hidden transition-colors duration-500">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-px bg-premium-gradient-animated opacity-20"></div>
      <div className="absolute inset-0 bg-mesh opacity-5 pointer-events-none"></div>

      <div className="max-w-[1920px] mx-auto px-4 md:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 mb-20">
          {/* Company Info - 4 columns */}
          <div className="lg:col-span-4 space-y-10">
            <Link to="/" className="inline-block group">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-white dark:bg-[#121212] rounded-2xl flex items-center justify-center shadow-2xl group-hover:rotate-6 transition-transform overflow-hidden">
                  <img
                    src={getDirectImageUrl(footerLogoUrl || logoUrl || "/logo.png")}
                    alt="WorkinEU HR"
                    className="w-full h-full object-contain p-1"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex flex-col">
                  <h3 className="font-sans text-2xl font-black text-white group-hover:text-brand-teal transition-colors leading-none tracking-tight">
                    WorkinEU <span className="text-brand-teal">HR</span>
                  </h3>
                  <span className="text-[10px] uppercase tracking-[0.4em] text-brand-teal font-black mt-2">
                    Consultancy LLC
                  </span>
                </div>
              </div>
            </Link>
            <p className="text-slate-300 text-lg leading-relaxed font-medium max-w-md">
              The world's premier bridge between exceptional global talent and
              prestigious international opportunities. Trust, excellence, and
              global reach.
            </p>
            <div className="flex flex-wrap gap-4">
              {[
                {
                  icon: Facebook,
                  href: socialLinks?.facebook,
                  color: "hover:bg-[#1877F2]",
                  show: !!socialLinks?.facebook,
                },
                {
                  icon: Instagram,
                  href: socialLinks?.instagram,
                  color:
                    "hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7]",
                  show: !!socialLinks?.instagram,
                },
                {
                  icon: Linkedin,
                  href: socialLinks?.linkedin,
                  color: "hover:bg-[#0A66C2]",
                  show: !!socialLinks?.linkedin,
                },
                {
                  icon: Music2,
                  href: socialLinks?.tiktok,
                  color: "hover:bg-black",
                  show: !!socialLinks?.tiktok,
                },
                {
                  icon: Youtube,
                  href: socialLinks?.youtube,
                  color: "hover:bg-[#FF0000]",
                  show: !!socialLinks?.youtube,
                },
                {
                  icon: MessageCircle,
                  href: socialLinks?.whatsapp
                    ? `https://wa.me/${socialLinks.whatsapp.replace(/\D/g, "")}`
                    : `https://wa.me/${contactInfo.whatsapp}`,
                  color: "hover:bg-[#25D366]",
                  show: true,
                },
              ]
                .filter((s) => s.show)
                .map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center transition-all hover:scale-110 hover:border-transparent group/social ${social.color}`}
                  >
                    <social.icon
                      size={22}
                      className="group-hover/social:scale-110 transition-transform"
                    />
                  </a>
                ))}
            </div>
          </div>

          {/* Quick Links - 2 columns */}
          <div className="lg:col-span-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-teal mb-10">
              Navigation
            </h4>
            <ul className="space-y-5">
              {[
                { name: navLabels.home, path: "/" },
                { name: navLabels.jobs, path: "/jobs" },
                { name: navLabels.diary || "Diary", path: "/diary" },
                { name: navLabels.about, path: "/about" },
                { name: navLabels.contact, path: "/#contact" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    onClick={() => {
                      if (link.path === "/#contact") {
                        if (window.location.pathname === "/") {
                          const contactEl = document.getElementById("contact");
                          if (contactEl) {
                            contactEl.scrollIntoView({ behavior: "smooth" });
                          }
                        }
                      }
                    }}
                    className="text-slate-300 hover:text-white transition-all flex items-center gap-4 group text-xs font-black uppercase tracking-widest"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-teal scale-0 group-hover:scale-100 transition-transform"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal - 2 columns */}
          <div className="lg:col-span-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-teal mb-10">
              Compliance
            </h4>
            <ul className="space-y-5">
              {[
                { name: "Privacy Policy", path: "/privacy-policy" },
                { name: "Terms", path: "/terms-conditions" },
                { name: "Refunds", path: "/refund-policy" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-slate-300 hover:text-white transition-all flex items-center gap-4 group text-xs font-black uppercase tracking-widest"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-rose scale-0 group-hover:scale-100 transition-transform"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Global Presence - 4 columns */}
          <div className="lg:col-span-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-teal mb-10">
              Global Presence
            </h4>
            <div className="grid grid-cols-1 gap-6">
              {(contactInfo.branchOffices &&
              contactInfo.branchOffices.length > 0
                ? contactInfo.branchOffices
                : [
                    {
                      location: "Main Office",
                      address: contactInfo.address,
                      phone: contactInfo.phone,
                      email: contactInfo.email,
                    },
                  ]
              ).map((branch, i) => (
                <div
                  key={i}
                  className="bg-white/5 border border-white/5 p-8 rounded-3xl hover:bg-white/10 transition-all group border-l-4 border-l-brand-teal"
                >
                  <h5 className="text-brand-teal font-black text-[10px] uppercase tracking-[0.3em] mb-6">
                    {branch.location}
                  </h5>
                  <div className="grid grid-cols-1 gap-4 text-slate-200 text-sm font-medium">
                    <div className="flex items-start gap-4">
                      <MapPin
                        className="text-brand-teal shrink-0 mt-0.5"
                        size={16}
                      />
                      <span className="leading-relaxed opacity-70">
                        {branch.address}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Phone className="text-brand-teal shrink-0" size={16} />
                      <span className="opacity-70">{branch.phone}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Mail className="text-brand-teal shrink-0" size={16} />
                      <span className="opacity-70">{branch.email}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-12 flex flex-col md:flex-row justify-between items-center gap-10 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
          <p>
            © {currentYear} WorkinEU HR Consultancy LLC. All rights reserved.
          </p>
          <div className="flex items-center gap-10">
            <p className="flex items-center gap-3">
              <span className="w-2 h-2 bg-brand-teal rounded-full animate-pulse shadow-[0_0_10px_rgba(42,185,176,0.6)]"></span>
              Global Operations: Live
            </p>
            <p className="hover:text-white transition-colors cursor-default">
              Designed by Udaya Raj Khanal
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
