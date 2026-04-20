import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { CandidateProfile } from '../types';
import { 
  User, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Calendar, 
  Download, 
  History, 
  Award, 
  Languages,
  Printer,
  ChevronLeft,
  Loader2,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function CandidateProfilePage() {
  const { uid } = useParams<{ uid: string }>();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!uid) return;
      try {
        const docRef = doc(db, 'candidates', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as CandidateProfile;
          setProfile(data);
          setIsOwner(auth.currentUser?.uid === uid);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [uid]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-brand-blue" size={48} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
        <div className="text-center bg-white p-12 rounded-3xl shadow-xl max-w-md border border-gray-100">
          <User className="mx-auto text-gray-300 mb-6" size={64} />
          <h2 className="text-2xl font-bold text-brand-blue mb-4">Profile Not Found</h2>
          <Link to="/" className="text-brand-gold font-bold hover:underline">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white pb-20 pt-28 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-8 print:hidden">
          <Link 
            to={isOwner ? "/candidate/dashboard" : "/"} 
            className="flex items-center gap-2 text-gray-500 hover:text-brand-blue font-bold transition-all group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            {isOwner ? "Back to Dashboard" : "Back to Website"}
          </Link>
          <button 
            onClick={handlePrint}
            className="bg-white text-brand-blue border border-gray-100 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-blue hover:text-white transition-all shadow-sm"
          >
            <Printer size={20} /> Print CV
          </button>
        </div>

        {/* CV Container */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 p-8 md:p-12 print:shadow-none print:border-none print:p-0"
        >
          {/* Top Section / Header */}
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start border-b border-gray-100 pb-12 mb-12">
            <div className="w-40 h-40 bg-gray-100 rounded-3xl overflow-hidden shadow-lg border-4 border-white shrink-0 relative group">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt={profile.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-brand-blue text-white text-5xl font-bold">
                  {profile.fullName.charAt(0)}
                </div>
              )}
              {isOwner && (
                <Link 
                  to="/candidate/dashboard" 
                  state={{ activeTab: 'profile' }}
                  className="absolute inset-0 bg-brand-blue/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold gap-2 text-center p-2"
                >
                  <User size={24} />
                  Change Photo
                </Link>
              )}
            </div>
            <div className="flex-grow text-center md:text-left">
              <h1 className="text-4xl font-black text-brand-blue mb-4 tracking-tight">{profile.fullName}</h1>
              <p className="text-brand-gold font-bold text-lg uppercase tracking-widest mb-6">{profile.experience || 'Professional Candidate'}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-500 font-medium">
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <Mail size={18} className="text-brand-blue" />
                  <span>{profile.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <Phone size={18} className="text-brand-blue" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile.nationality && (
                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <Globe size={18} className="text-brand-blue" />
                    <span>{profile.nationality}</span>
                  </div>
                )}
                {profile.address && (
                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <MapPin size={18} className="text-brand-blue" />
                    <span>{profile.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-12">
              
              {/* Work History */}
              <section>
                <div className="flex items-center justify-between mb-8 border-b border-brand-teal/20 pb-2">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-blue/5 text-brand-blue rounded-xl flex items-center justify-center">
                      <Briefcase size={20} />
                    </div>
                    <h3 className="text-xl font-black text-brand-blue uppercase tracking-widest">Experience</h3>
                  </div>
                  {isOwner && (
                    <Link to="/candidate/dashboard" state={{ activeTab: 'profile' }} className="text-brand-gold font-bold text-xs uppercase hover:underline">
                      Edit
                    </Link>
                  )}
                </div>
                
                <div className="space-y-10">
                  {profile.workHistory && profile.workHistory.length > 0 ? (
                    profile.workHistory.map((work, i) => (
                      <div key={i} className="relative pl-8 border-l-2 border-gray-100 last:border-l-0 pb-2">
                        <div className="absolute top-0 -left-[9px] w-4 h-4 rounded-full bg-brand-gold border-4 border-white shadow-sm"></div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <h4 className="text-lg font-bold text-brand-blue">{work.position}</h4>
                          <span className="text-xs font-bold text-brand-gold bg-brand-gold/10 px-3 py-1 rounded-full uppercase tracking-wider">
                            {work.startDate} — {work.endDate || 'Present'}
                          </span>
                        </div>
                        <p className="text-brand-blue/70 font-bold mb-3">{work.company}</p>
                        <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-line">{work.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                       <History className="mx-auto text-gray-300 mb-2" size={32} />
                       <p className="text-gray-400 font-bold italic">No work history added.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Education */}
              <section>
                <div className="flex items-center justify-between mb-8 border-b border-brand-teal/20 pb-2">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-blue/5 text-brand-blue rounded-xl flex items-center justify-center">
                      <GraduationCap size={20} />
                    </div>
                    <h3 className="text-xl font-black text-brand-blue uppercase tracking-widest">Education</h3>
                  </div>
                  {isOwner && (
                    <Link to="/candidate/dashboard" state={{ activeTab: 'profile' }} className="text-brand-gold font-bold text-xs uppercase hover:underline">
                      Edit
                    </Link>
                  )}
                </div>
                
                <div className="space-y-10">
                  {profile.educationHistory && profile.educationHistory.length > 0 ? (
                    profile.educationHistory.map((edu, i) => (
                      <div key={i} className="relative pl-8 border-l-2 border-gray-100 last:border-l-0 pb-2">
                        <div className="absolute top-0 -left-[9px] w-4 h-4 rounded-full bg-brand-blue border-4 border-white shadow-sm"></div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <h4 className="text-lg font-bold text-brand-blue">{edu.degree}</h4>
                          <span className="text-xs font-bold text-brand-blue bg-brand-blue/10 px-3 py-1 rounded-full uppercase tracking-wider">
                            {edu.startDate} — {edu.endDate}
                          </span>
                        </div>
                        <p className="text-brand-blue/70 font-bold mb-3">{edu.institution}</p>
                        <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-line">{edu.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                       <GraduationCap className="mx-auto text-gray-300 mb-2" size={32} />
                       <p className="text-gray-400 font-bold italic">No education history added.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Right Column - Sidebars */}
            <div className="space-y-12">
              
              {/* Skills */}
              <section>
                <div className="flex items-center justify-between mb-8 border-b border-brand-teal/20 pb-2">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-blue/5 text-brand-blue rounded-xl flex items-center justify-center">
                      <Award size={20} />
                    </div>
                    <h3 className="text-xl font-black text-brand-blue uppercase tracking-widest">Skills</h3>
                  </div>
                  {isOwner && (
                    <Link to="/candidate/dashboard" state={{ activeTab: 'profile' }} className="text-brand-gold font-bold text-xs uppercase hover:underline">
                      Edit
                    </Link>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.skills && profile.skills.length > 0 ? (
                    profile.skills.map((skill, i) => (
                      <div key={i} className="bg-white border border-gray-100 px-4 py-2 rounded-xl shadow-sm">
                        <p className="text-slate-900 font-bold text-sm">{skill.name}</p>
                        {skill.level && <p className="text-[10px] text-brand-gold font-black uppercase tracking-wider">{skill.level}</p>}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 italic text-sm">No skills added.</p>
                  )}
                </div>
              </section>

              {/* Languages */}
              <section>
                <div className="flex items-center justify-between mb-8 border-b border-brand-teal/20 pb-2">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-blue/5 text-brand-blue rounded-xl flex items-center justify-center">
                      <Languages size={20} />
                    </div>
                    <h3 className="text-xl font-black text-brand-blue uppercase tracking-widest">Languages</h3>
                  </div>
                  {isOwner && (
                    <Link to="/candidate/dashboard" state={{ activeTab: 'profile' }} className="text-brand-gold font-bold text-xs uppercase hover:underline">
                      Edit
                    </Link>
                  )}
                </div>
                <div className="space-y-4">
                  {profile.languages && profile.languages.length > 0 ? (
                    profile.languages.map((lang, i) => (
                      <div key={i} className="flex justify-between items-center group">
                        <p className="text-slate-900 font-bold">{lang.language}</p>
                        <span className="text-[10px] font-black uppercase bg-brand-blue/10 text-brand-blue px-3 py-1 rounded-full">{lang.level}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 italic text-sm">No languages added.</p>
                  )}
                </div>
              </section>

              {/* Personal Details Snapshot */}
              <section className="bg-brand-blue/5 p-8 rounded-3xl border border-brand-blue/10">
                <div className="flex justify-between items-center mb-6 border-b border-brand-blue/10 pb-2">
                  <h3 className="text-lg font-black text-brand-blue uppercase tracking-widest">Profile Intel</h3>
                  {isOwner && (
                    <Link to="/candidate/dashboard" state={{ activeTab: 'profile' }} className="text-brand-gold font-bold text-[10px] uppercase hover:underline">
                      Update
                    </Link>
                  )}
                </div>
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Passport ID</p>
                    <p className="text-brand-blue font-bold">{profile.passportNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Education Level</p>
                    <p className="text-brand-blue font-bold">{profile.education || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">DOB</p>
                    <p className="text-brand-blue font-bold">{profile.dateOfBirth || 'N/A'}</p>
                  </div>
                </div>
              </section>

              {/* Verification Badges */}
              <div className="space-y-4">
                <div className={cn(
                  "p-4 rounded-2xl flex items-center gap-4 border",
                  profile.workPermitStatus === 'approved' ? "bg-green-50 border-green-100 text-green-700" : "bg-gray-50 border-gray-100 text-gray-400"
                )}>
                  <Award size={24} />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest">Work Permit Status</p>
                    <p className="font-bold capitalize">{profile.workPermitStatus || 'Review Pending'}</p>
                  </div>
                </div>
                <div className={cn(
                  "p-4 rounded-2xl flex items-center gap-4 border",
                  profile.visaStatus === 'approved' ? "bg-green-50 border-green-100 text-green-700" : "bg-gray-50 border-gray-100 text-gray-400"
                )}>
                  <Globe size={24} />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest">Global Visa Status</p>
                    <p className="font-bold capitalize">{profile.visaStatus || 'Review Pending'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Logo on Printed CV */}
          <div className="hidden print:flex flex-col items-center mt-20 pt-12 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-brand-blue font-black text-2xl tracking-tighter">WorkinEU HR</span>
            </div>
            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Generated by WorkinEU HR Management System</p>
          </div>
        </motion.div>

        {/* Floating Call to Action */}
        {isOwner && (
           <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[#0a192f] text-white px-8 py-4 rounded-full shadow-2xl z-50 print:hidden hover:scale-105 transition-transform duration-300">
             <div className="flex items-center gap-3 pr-4 border-r border-white/20">
               <div className="w-10 h-10 bg-brand-gold rounded-full flex items-center justify-center text-brand-blue">
                 <User size={20} />
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Control Panel</p>
                 <p className="text-xs font-bold">This is your live profile</p>
               </div>
             </div>
             <Link 
               to="/candidate/dashboard" 
               className="flex items-center gap-2 text-brand-gold font-bold text-xs uppercase tracking-widest hover:text-white transition-colors"
             >
               Edit Your Data <ChevronLeft size={16} className="rotate-180" />
             </Link>
           </div>
        )}
      </div>
    </div>
  );
}
