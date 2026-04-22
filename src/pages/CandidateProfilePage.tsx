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
  FileText,
  Sparkles,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import EuropassCV from '../components/EuropassCV';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function CandidateProfilePage() {
  const { uid } = useParams<{ uid: string }>();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<'classic' | 'modern' | 'professional' | 'elegant'>('classic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'profile' | 'cv'>('profile');

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

  const handleDownload = async (theme: 'classic' | 'modern' | 'professional' | 'elegant') => {
    if (!profile) return;
    setIsGenerating(true);
    setSelectedTheme(theme);
    
    // We'll use a small timeout to let the hidden EuropassCV render with the right theme
    setTimeout(async () => {
      try {
        const element = document.getElementById('europass-cv-download-template');
        if (!element) throw new Error("Template not found");

        const canvas = await html2canvas(element, {
          scale: 4, // 4K/HD Quality
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight
        });
        
        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Europass_CV_${profile.fullName.replace(/\s+/g, '_')}_${theme}.pdf`);
        
        setShowDownloadMenu(false);
      } catch (error) {
        console.error("PDF Generation Error:", error);
      } finally {
        setIsGenerating(false);
      }
    }, 600);
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
      <div className={cn("mx-auto px-4 sm:px-6 lg:px-8", viewMode === 'cv' ? 'max-w-5xl' : 'max-w-4xl')}>
        
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 print:hidden">
          <div className="flex items-center gap-4">
            <Link 
              to={isOwner ? "/candidate/dashboard" : "/"} 
              className="flex items-center gap-2 text-gray-500 hover:text-brand-blue font-bold transition-all group"
            >
              <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              {isOwner ? "Back to Dashboard" : "Back to Website"}
            </Link>
            <div className="h-6 w-px bg-gray-200"></div>
            <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
              <button 
                onClick={() => setViewMode('profile')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                  viewMode === 'profile' ? "bg-brand-blue text-white shadow-md" : "text-gray-400 hover:text-brand-blue"
                )}
              >
                Profile View
              </button>
              <button 
                onClick={() => setViewMode('cv')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                  viewMode === 'cv' ? "bg-brand-gold text-brand-blue shadow-md" : "text-gray-400 hover:text-brand-gold"
                )}
              >
                CV Designer (HD)
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-none">
              <button 
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="w-full sm:w-auto bg-brand-gold text-brand-blue px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-blue hover:text-white transition-all shadow-lg shadow-brand-gold/20"
              >
                {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                Export {viewMode === 'cv' ? 'HD CV' : 'CV'}
              </button>
              
              <AnimatePresence>
                {showDownloadMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-[60]"
                  >
                    <p className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-2">
                       {viewMode === 'cv' ? 'Preview & Switch Theme' : 'Select Theme Format'}
                    </p>
                    <button onClick={() => { setSelectedTheme('classic'); viewMode === 'profile' && handleDownload('classic'); setShowDownloadMenu(false); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 text-sm font-bold text-brand-blue flex items-center justify-between group">
                      Classic Professional
                      <span className={cn("w-2 h-2 rounded-full transition-opacity", selectedTheme === 'classic' ? 'bg-brand-blue opacity-100' : 'bg-brand-blue opacity-0 group-hover:opacity-100')}></span>
                    </button>
                    <button onClick={() => { setSelectedTheme('modern'); viewMode === 'profile' && handleDownload('modern'); setShowDownloadMenu(false); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 text-sm font-bold text-slate-800 flex items-center justify-between group">
                      Modern Tech (Slate)
                      <span className={cn("w-2 h-2 rounded-full transition-opacity", selectedTheme === 'modern' ? 'bg-slate-800 opacity-100' : 'bg-slate-800 opacity-0 group-hover:opacity-100')}></span>
                    </button>
                    <button onClick={() => { setSelectedTheme('professional'); viewMode === 'profile' && handleDownload('professional'); setShowDownloadMenu(false); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 text-sm font-bold text-brand-blue flex items-center justify-between group">
                      Executive Blue
                      <span className={cn("w-2 h-2 rounded-full transition-opacity", selectedTheme === 'professional' ? 'bg-brand-blue opacity-100' : 'bg-brand-blue opacity-0 group-hover:opacity-100')}></span>
                    </button>
                    <button onClick={() => { setSelectedTheme('elegant'); viewMode === 'profile' && handleDownload('elegant'); setShowDownloadMenu(false); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 text-sm font-bold text-stone-600 flex items-center justify-between group">
                      Premium Elegant
                      <span className={cn("w-2 h-2 rounded-full transition-opacity", selectedTheme === 'elegant' ? 'bg-stone-400 opacity-100' : 'bg-stone-400 opacity-0 group-hover:opacity-100')}></span>
                    </button>
                    {viewMode === 'cv' && (
                      <div className="mt-2 pt-2 border-t border-gray-50 p-2">
                        <button 
                          onClick={() => handleDownload(selectedTheme)}
                          className="w-full bg-brand-blue text-white py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-teal transition-all"
                        >
                          Generate 4K PDF
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <button 
              onClick={handlePrint}
              className="bg-white text-gray-500 border border-gray-100 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm group"
            >
              <Printer size={20} className="group-hover:text-brand-blue transition-colors" />
            </button>
          </div>
        </div>

        {/* Dynamic View Switcher */}
        <AnimatePresence mode="wait">
          {viewMode === 'profile' ? (
            <motion.div 
              key="profile-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 p-8 md:p-12 print:shadow-none print:border-none print:p-0"
            >
          {/* Top Section / Header - Enhanced Europass Style */}
          <div className="flex flex-col lg:flex-row gap-12 items-center lg:items-end border-b-4 border-[#004494] pb-14 mb-16 relative">
            <div className="w-56 h-56 bg-white rounded-3xl overflow-hidden shadow-2xl border-[6px] border-[#004494] shrink-0 relative group -mt-20 lg:-mt-24">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt={profile.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-brand-blue text-white text-7xl font-black">
                  {profile.fullName.charAt(0)}
                </div>
              )}
              {isOwner && (
                <Link 
                  to="/candidate/dashboard" 
                  state={{ activeTab: 'profile' }}
                  className="absolute inset-0 bg-brand-blue/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold gap-2 text-center p-2"
                >
                  <User size={32} />
                  Change Professional Photo
                </Link>
              )}
            </div>
            <div className="flex-grow text-center lg:text-left space-y-4">
              <h1 className="text-6xl font-black text-[#004494] mb-2 tracking-tighter uppercase">{profile.fullName}</h1>
              <p className="inline-block bg-[#f5f7f9] text-[#004494] font-black text-2xl uppercase tracking-[0.2em] px-6 py-2 rounded-2xl border border-[#e1e8ed] shadow-sm">
                {profile.experience || 'Professional Candidate'}
              </p>
              
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 text-slate-500 font-bold pt-4">
                <div className="flex items-center gap-3 hover:text-[#004494] transition-colors">
                  <Mail size={20} className="text-[#004494]" />
                  <span>{profile.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-3 hover:text-[#004494] transition-colors">
                    <Phone size={20} className="text-[#004494]" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile.whatsapp && (
                  <div className="flex items-center gap-3 hover:text-[#004494] transition-colors">
                    <MessageCircle size={20} className="text-emerald-500" />
                    <span>WhatsApp: {profile.whatsapp}</span>
                  </div>
                )}
                {profile.address && (
                  <div className="flex items-center gap-3 hover:text-[#004494] transition-colors">
                    <MapPin size={20} className="text-brand-gold" />
                    <span>{profile.address}</span>
                  </div>
                )}
                {profile.nationality && (
                  <div className="flex items-center gap-3 hover:text-[#004494] transition-colors">
                    <Globe size={20} className="text-[#004494]" />
                    <span>{profile.nationality}</span>
                  </div>
                )}
                {profile.homeCountry && (
                  <div className="flex items-center gap-3 hover:text-[#004494] transition-colors">
                    <Globe size={20} className="text-brand-gold" />
                    <span className="text-[#004494]">Origin: {profile.homeCountry}</span>
                  </div>
                )}
                {profile.currentCountry && (
                  <div className="flex items-center gap-3 hover:text-[#004494] transition-colors">
                    <MapPin size={20} className="text-brand-teal" />
                    <span className="text-[#004494]">Current: {profile.currentCountry}</span>
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

              {/* Documents Section */}
              <section className="bg-brand-blue/5 p-10 rounded-[3rem] border border-brand-blue/10">
                <div className="flex items-center justify-between mb-8 border-b border-brand-blue/10 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white text-brand-blue rounded-2xl flex items-center justify-center shadow-lg shadow-brand-blue/5">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-brand-blue uppercase tracking-widest leading-none mb-1">Document Dossier</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified Mission Attachments</p>
                    </div>
                  </div>
                </div>
                
                {profile.documents && profile.documents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profile.documents.map((doc, i) => (
                      <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 flex items-center justify-between group hover:border-brand-gold transition-all shadow-sm">
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className="w-12 h-12 bg-slate-50 text-brand-gold rounded-xl flex items-center justify-center shrink-0">
                            <FileText size={24} />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-sm font-black text-brand-blue truncate" title={doc.name}>
                              {doc.name}
                            </p>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                              Added {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <a 
                          href={doc.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-10 h-10 bg-brand-blue/5 text-brand-blue rounded-xl flex items-center justify-center hover:bg-brand-blue hover:text-white transition-all shadow-sm"
                        >
                          <Download size={18} />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                     <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200">
                        <FileText className="text-gray-200" size={40} />
                     </div>
                     <p className="text-gray-400 font-bold italic text-sm">No documents attached to this profile.</p>
                  </div>
                )}
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
          ) : (
            <motion.div 
              key="cv-designer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative"
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-brand-gold text-brand-blue px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg z-10">
                Live 4K HD Preview Mode
              </div>
              <div className="bg-white rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden border border-gray-100">
                <div className="transform origin-top scale-[1.0] transition-transform duration-500">
                   <EuropassCV id="europass-cv-live-preview" candidate={profile} theme={selectedTheme} />
                </div>
              </div>
              
              <div className="mt-8 flex flex-col items-center gap-4 text-center">
                <p className="text-gray-400 text-xs font-medium max-w-sm">
                  This is a live high-definition preview of your CV. Every detail is rendered with maximum precision for high-quality printing.
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleDownload(selectedTheme)}
                    className="bg-brand-blue text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-brand-teal transition-all shadow-xl shadow-brand-blue/20 flex items-center gap-3"
                  >
                    {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                    Download HD PDF
                  </button>
                  <button 
                    onClick={() => setViewMode('profile')}
                    className="bg-white text-gray-500 border border-gray-200 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-50 transition-all"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden CV For Download Generation */}

        {/* Hidden CV For Download Generation */}
        <div className="fixed -left-[10000px] top-0 pointer-events-none">
          <EuropassCV id="europass-cv-download-template" candidate={profile} theme={selectedTheme} />
        </div>

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
