import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  CheckCircle2, 
  Globe2, 
  ShieldCheck, 
  Users2, 
  MessageCircle,
  Briefcase,
  FileText,
  Plane
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, query, limit, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Job, SiteContent } from '../types';
import JobCard from '../components/JobCard';

export default function HomePage() {
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [content, setContent] = useState<SiteContent>({
    heroTagline: 'Connecting Talent to Europe',
    aboutUs: 'WorkinEU HR Consultancy LLC is a premier recruitment agency based in Dubai, UAE. We specialize in providing comprehensive human resource solutions for individuals seeking career opportunities in Europe.',
    services: [
      { title: 'International Recruitment', description: 'We connect skilled professionals with top-tier European employers across various sectors.' },
      { title: 'Visa Assistance', description: 'Expert guidance through the complex visa application process for different European countries.' },
      { title: 'Documentation Support', description: 'Comprehensive assistance in preparing and authenticating all necessary legal documents.' }
    ],
    countries: ['Germany', 'Poland', 'Czech Republic', 'Lithuania', 'Croatia', 'Hungary', 'Romania', 'Malta']
  });

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'), limit(3));
        const snapshot = await getDocs(q);
        const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
        setFeaturedJobs(jobs);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      }
    };

    const fetchContent = async () => {
      try {
        const docRef = doc(db, 'siteContent', 'main');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setContent(docSnap.data() as SiteContent);
        }
      } catch (error) {
        console.error("Error fetching content:", error);
      }
    };

    fetchJobs();
    fetchContent();
  }, []);

  const services = content.services.map((s, i) => ({
    ...s,
    icon: i === 0 ? <Users2 className="w-8 h-8" /> : i === 1 ? <Plane className="w-8 h-8" /> : <FileText className="w-8 h-8" />
  }));

  const countries = content.countries;

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center bg-brand-blue overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://picsum.photos/seed/europe/1920/1080?blur=2" 
            alt="Europe Background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-blue via-brand-blue/80 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <span className="text-brand-gold font-bold tracking-widest uppercase mb-4 block">
              Your Gateway to Global Careers
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
              {content.heroTagline}
            </h1>
            <p className="text-xl text-gray-300 mb-10 leading-relaxed">
              WorkinEU HR Consultancy specializes in bridging the gap between skilled professionals and the European job market. Start your journey today.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                to="/jobs" 
                className="bg-brand-gold text-brand-blue px-8 py-4 rounded-lg font-bold text-lg hover:bg-white transition-all flex items-center gap-2"
              >
                Apply Now <ArrowRight size={20} />
              </Link>
              <Link 
                to="/#contact" 
                className="bg-white/10 backdrop-blur-sm text-white border border-white/20 px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/20 transition-all"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
        
        {/* Floating Stats */}
        <div className="absolute bottom-10 right-10 hidden lg:block">
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/10 text-white"
          >
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-3xl font-bold text-brand-gold">500+</p>
                <p className="text-sm text-gray-300">Placements</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-brand-gold">15+</p>
                <p className="text-sm text-gray-300">Countries</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-brand-blue mb-4">Our Professional Services</h2>
            <div className="w-24 h-1 bg-brand-gold mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div 
                key={index}
                whileHover={{ y: -10 }}
                className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 text-center"
              >
                <div className="w-16 h-16 bg-brand-blue/5 text-brand-blue rounded-2xl flex items-center justify-center mx-auto mb-6">
                  {service.icon}
                </div>
                <h3 className="text-2xl font-bold text-brand-blue mb-4">{service.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {service.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <img 
                src="https://picsum.photos/seed/consultancy/800/1000" 
                alt="About Us" 
                className="rounded-2xl shadow-2xl"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-8 -right-8 bg-brand-gold p-8 rounded-2xl hidden md:block">
                <p className="text-brand-blue font-bold text-xl leading-tight">
                  10+ Years of <br /> Excellence
                </p>
              </div>
            </div>
            <div>
              <span className="text-brand-gold font-bold uppercase tracking-widest mb-4 block">About WorkinEU</span>
              <h2 className="text-4xl font-bold text-brand-blue mb-6 leading-tight">
                Your Trusted Partner in European Recruitment
              </h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                {content.aboutUs}
              </p>
              <ul className="space-y-4 mb-10">
                {[
                  "Expert knowledge of European labor markets",
                  "Personalized career counseling",
                  "End-to-end visa and documentation support",
                  "Transparent and ethical recruitment practices"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700">
                    <CheckCircle2 className="text-brand-gold" size={20} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link 
                to="/jobs" 
                className="inline-block bg-brand-blue text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-gold transition-all"
              >
                Explore Opportunities
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Countries We Serve */}
      <section className="py-24 bg-brand-blue text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-xl">
              <h2 className="text-4xl font-bold mb-4">Countries We Serve</h2>
              <p className="text-gray-400 text-lg">
                We have established partnerships with leading companies across the European Union, offering diverse opportunities in multiple nations.
              </p>
            </div>
            <Globe2 className="text-brand-gold w-16 h-16 opacity-50" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {countries.map((country, index) => (
              <div 
                key={index}
                className="bg-white/5 border border-white/10 p-6 rounded-xl text-center hover:bg-white/10 transition-all cursor-default"
              >
                <span className="text-xl font-medium">{country}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-bold text-brand-blue mb-4">Featured Opportunities</h2>
              <div className="w-24 h-1 bg-brand-gold"></div>
            </div>
            <Link to="/jobs" className="text-brand-gold font-bold flex items-center gap-2 hover:gap-3 transition-all">
              View All Jobs <ArrowRight size={20} />
            </Link>
          </div>
          
          {featuredJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">New opportunities are coming soon. Stay tuned!</p>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-brand-blue rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row">
            <div className="lg:w-1/2 p-12 md:p-20">
              <h2 className="text-4xl font-bold text-white mb-10 leading-tight">
                Why Professionals Choose <br />
                <span className="text-brand-gold">WorkinEU HR</span>
              </h2>
              <div className="space-y-8">
                {[
                  {
                    title: "Verified Employers",
                    desc: "We only work with licensed and reputable European companies.",
                    icon: <ShieldCheck className="text-brand-gold" />
                  },
                  {
                    title: "Transparent Process",
                    desc: "No hidden costs or false promises. We keep you informed at every step.",
                    icon: <CheckCircle2 className="text-brand-gold" />
                  },
                  {
                    title: "Post-Landing Support",
                    desc: "We assist you even after you land in Europe to ensure a smooth transition.",
                    icon: <Globe2 className="text-brand-gold" />
                  }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="shrink-0 mt-1">{item.icon}</div>
                    <div>
                      <h4 className="text-white font-bold text-xl mb-2">{item.title}</h4>
                      <p className="text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 relative min-h-[400px]">
              <img 
                src="https://picsum.photos/seed/success/1000/1000" 
                alt="Success" 
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-4xl font-bold text-brand-blue mb-6">Get In Touch</h2>
              <p className="text-gray-600 text-lg mb-10">
                Have questions about working in Europe? Our expert consultants are here to help you. Fill out the form or contact us directly.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-brand-gold">
                    <MessageCircle size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase font-bold tracking-wider">WhatsApp</p>
                    <p className="text-lg font-bold text-brand-blue">+971 50 000 0000</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-brand-gold">
                    <Globe2 size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase font-bold tracking-wider">Address</p>
                    <p className="text-lg font-bold text-brand-blue">Al Qusais, Al Nahda 1, Dubai</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-10 rounded-2xl shadow-xl">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                    <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                    <input type="email" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all" placeholder="john@example.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                  <input type="tel" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all" placeholder="+971 ..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
                  <textarea rows={4} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all" placeholder="How can we help you?"></textarea>
                </div>
                <button className="w-full bg-brand-blue text-white py-4 rounded-lg font-bold text-lg hover:bg-brand-gold transition-all shadow-lg">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Floating Button */}
      <a 
        href="https://wa.me/971500000000" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-50 flex items-center justify-center"
      >
        <MessageCircle size={32} />
      </a>
    </div>
  );
}
