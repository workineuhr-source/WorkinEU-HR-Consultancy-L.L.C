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
  MessageCircle,
  ShieldCheck
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
          scale: 3, // 4K/HD Quality
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 794 // Standard A4 width at 96dpi
        });
        
        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const scale = 3; 

        // Ratio of PDF mm per Canvas pixel
        const ratio = pdfWidth / (canvasWidth / scale); 
        const imgHeightInPdf = (canvasHeight / scale) * ratio;
        
        let heightLeft = imgHeightInPdf;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf, undefined, 'FAST');
        heightLeft -= pdfHeight;

        // Slice into more pages if needed
        while (heightLeft >= 0) {
          position = heightLeft - imgHeightInPdf;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf, undefined, 'FAST');
          heightLeft -= pdfHeight;
        }

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
          {/* Top Section / Header - Unified Europass Style */}
          <div className="flex flex-col lg:flex-row gap-10 items-center lg:items-start border-b-[6px] border-[#004494] pb-12 mb-16 relative">
            <div className="w-48 h-48 lg:w-56 lg:h-56 bg-white rounded-3xl overflow-hidden shadow-2xl border-[6px] border-[#004494] shrink-0 relative group">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt={profile.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-brand-blue text-white text-7xl font-black uppercase">
                  {profile.fullName.charAt(0)}
                </div>
              )}
              {isOwner && (
                <Link 
                  to="/candidate/dashboard" 
                  state={{ activeTab: 'profile' }}
                  className="absolute inset-0 bg-brand-blue/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-black uppercase gap-2 text-center p-4"
                >
                  <User size={24} />
                  Update Digital Asset
                </Link>
              )}
            </div>
            
            <div className="flex-grow text-center lg:text-left pt-4 overflow-hidden w-full">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#004494] mb-3 tracking-tighter uppercase whitespace-nowrap overflow-hidden text-ellipsis">
                {profile.fullName}
              </h1>
              
              <div className="inline-block bg-[#f5f7f9] text-[#004494] font-black text-lg lg:text-2xl uppercase tracking-widest px-6 py-2 rounded-2xl border border-[#e1e8ed] mb-6">
                {profile.experience || 'Professional Candidate'}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-slate-500 font-bold text-sm lg:text-base">
                <div className="flex items-center justify-center lg:justify-start gap-3">
                  <Mail size={18} className="text-[#004494] shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center justify-center lg:justify-start gap-3">
                    <Phone size={18} className="text-[#004494] shrink-0" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile.address && (
                  <div className="flex items-center justify-center lg:justify-start gap-3 sm:col-span-2">
                    <MapPin size={18} className="text-brand-gold shrink-0" />
                    <span className="truncate">{profile.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-12">
            {/* Left Column - Sidebar (Europass Standard) */}
            <div className="col-span-12 lg:col-span-4 space-y-10">
              
              {/* Personal Intel Snapshot */}
              <section className="bg-[#f5f7f9] p-8 rounded-[2.5rem] border border-[#e1e8ed]">
                <h3 className="text-[11px] font-black text-[#004494] uppercase tracking-[0.2em] border-b-2 border-[#e1e8ed] pb-3 mb-6">
                  Personal Identity
                </h3>
                <div className="space-y-5">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                       <MapPin size={10} className="text-brand-gold" /> Nationality
                    </p>
                    <p className="text-sm font-black text-slate-800 uppercase">{profile.nationality || 'Not Specified'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                       <Globe size={10} className="text-brand-blue" /> Current Origin
                    </p>
                    <p className="text-sm font-black text-slate-800 uppercase">{profile.homeCountry || profile.currentCountry || 'Not Specified'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                       <Calendar size={10} className="text-brand-gold" /> Date of Birth
                    </p>
                    <p className="text-sm font-black text-slate-800 uppercase">{profile.dateOfBirth || 'Not Specified'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                       <User size={10} className="text-brand-blue" /> Passport Identity
                    </p>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{profile.passportNumber || 'Pending Verification'}</p>
                      {profile.passportIssueCountry && (
                        <p className="text-[10px] font-bold text-slate-500 italic">Issued by {profile.passportIssueCountry}</p>
                      )}
                      {(profile.passportIssueDate || profile.passportExpiryDate) && (
                        <div className="flex gap-4 mt-2">
                          {profile.passportIssueDate && (
                            <div>
                               <p className="text-[8px] font-black text-slate-400 uppercase">Issued</p>
                               <p className="text-[10px] font-bold text-slate-600">{profile.passportIssueDate}</p>
                            </div>
                          )}
                          {profile.passportExpiryDate && (
                            <div>
                               <p className="text-[8px] font-black text-slate-400 uppercase">Expires</p>
                               <p className="text-[10px] font-bold text-red-500">{profile.passportExpiryDate}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {(profile.fatherName || profile.motherName) && (
                    <div className="pt-4 mt-4 border-t border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                         <ShieldCheck size={10} className="text-emerald-500" /> Family Dossier
                      </p>
                      <div className="space-y-3">
                        {profile.fatherName && (
                          <div>
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em]">Father's Name</p>
                             <p className="text-[11px] font-bold text-slate-700">{profile.fatherName}</p>
                          </div>
                        )}
                        {profile.motherName && (
                          <div>
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em]">Mother's Name</p>
                             <p className="text-[11px] font-bold text-slate-700">{profile.motherName}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Skills (Europass Interaction Style) */}
              <section>
                <h3 className="text-[11px] font-black text-[#004494] uppercase tracking-[0.2em] border-b-2 border-[#e1e8ed] pb-3 mb-6">
                  Expertise Matrix
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills && profile.skills.length > 0 ? (
                    profile.skills.map((skill, i) => (
                      <div key={i} className="bg-white border border-[#e1e8ed] px-3 py-1.5 rounded-xl shadow-sm">
                        <p className="text-slate-700 font-bold text-[11px] uppercase tracking-wider">{skill.name}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 italic text-xs">No skills indexed.</p>
                  )}
                </div>
              </section>

              {/* Languages (With Visual Dots) */}
              <section>
                <h3 className="text-[11px] font-black text-[#004494] uppercase tracking-[0.2em] border-b-2 border-[#e1e8ed] pb-3 mb-6">
                  Linguistic Index
                </h3>
                <div className="space-y-6">
                  {profile.languages && profile.languages.length > 0 ? (
                    profile.languages.map((lang, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-slate-800 font-black text-xs uppercase tracking-tight">{lang.language}</p>
                          <span className="text-[8px] font-black uppercase bg-[#f5f7f9] text-[#004494] px-2 py-1 rounded-lg border border-[#e1e8ed]">
                            {lang.level}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map(dot => (
                              <div 
                                key={dot} 
                                className={cn(
                                  "w-2 h-2 rounded-full transition-all duration-300",
                                  (lang.proficiency || (lang.level.includes('Native') ? 100 : lang.level.includes('Fluent') ? 80 : 50)) >= dot * 20 
                                    ? "bg-[#004494] shadow-sm scale-110" 
                                    : "bg-slate-200"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 italic text-xs">No languages provided.</p>
                  )}
                </div>
              </section>

              {/* Status Intel Badges */}
              <div className="space-y-4 pt-6">
                <div className={cn(
                  "p-5 rounded-[2rem] flex items-center gap-4 border-2 transition-all",
                  profile.workPermitStatus === 'approved' 
                    ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                    : "bg-slate-50 border-slate-100 text-slate-400"
                )}>
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", profile.workPermitStatus === 'approved' ? "bg-emerald-100" : "bg-white")}>
                    <Award size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 leading-none mb-1">Work Permit</p>
                    <p className="font-black text-xs uppercase">{profile.workPermitStatus || 'Review Needed'}</p>
                  </div>
                </div>
                <div className={cn(
                  "p-5 rounded-[2rem] flex items-center gap-4 border-2 transition-all",
                  profile.visaStatus === 'approved' 
                    ? "bg-blue-50 border-blue-100 text-[#004494]" 
                    : "bg-slate-50 border-slate-100 text-slate-400"
                )}>
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", profile.visaStatus === 'approved' ? "bg-blue-100 text-brand-blue" : "bg-white")}>
                    <Globe size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 leading-none mb-1">Visa Strategy</p>
                    <p className="font-black text-xs uppercase">{profile.visaStatus || 'Review Needed'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Main Professional Content */}
            <div className="col-span-12 lg:col-span-8 space-y-12">
              
              {/* About Me Section - Professional Summary */}
              <section className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
                <h3 className="text-[11px] font-black text-[#004494] uppercase tracking-[0.2em] border-b-2 border-slate-100 pb-3 mb-6 flex items-center gap-3">
                  <Sparkles size={14} className="text-brand-gold" /> Professional Profile
                </h3>
                <p className="text-slate-700 text-sm leading-relaxed font-bold italic">
                  {profile.aboutMe || 'Professional talent seeking opportunities with WorkinEU. Detailed expertise profile follows below.'}
                </p>
              </section>

              {/* Work Experience */}
              <section>
                <div className="flex items-center justify-between mb-10 border-b-2 border-[#e1e8ed] pb-3">
                  <h3 className="text-[11px] font-black text-[#004494] uppercase tracking-[0.2em] flex items-center gap-3">
                    <Briefcase size={16} /> Professional Experience
                  </h3>
                </div>
                
                <div className="space-y-12">
                  {profile.workHistory && profile.workHistory.length > 0 ? (
                    profile.workHistory.map((work, i) => (
                      <div key={i} className="relative pl-10 border-l-[3px] border-slate-100 last:border-l-0 pb-2">
                        <div className="absolute top-0 -left-[11px] w-5 h-5 rounded-full bg-white border-[4px] border-[#004494] shadow-sm"></div>
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                          <div>
                            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{work.position}</h4>
                            <p className="text-brand-gold font-bold text-sm flex items-center gap-2 mt-1">
                              <Briefcase size={12} /> {work.company}
                            </p>
                          </div>
                          <span className="inline-flex text-[10px] font-black text-white bg-[#004494] px-4 py-1.5 rounded-full uppercase tracking-widest whitespace-nowrap shadow-md shadow-[#004494]/10">
                            {work.startDate} — {work.endDate || 'PRESENT'}
                          </span>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line text-justify">{work.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center">
                       <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Employment dossier available upon direct request.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Education */}
              <section>
                <div className="flex items-center justify-between mb-8 border-b-2 border-[#e1e8ed] pb-3">
                  <h3 className="text-[11px] font-black text-[#004494] uppercase tracking-[0.2em] flex items-center gap-3">
                    <GraduationCap size={16} /> Academic Background
                  </h3>
                </div>
                
                <div className="space-y-10">
                  {profile.educationHistory && profile.educationHistory.length > 0 ? (
                    profile.educationHistory.map((edu, i) => (
                      <div key={i} className="relative pl-10 border-l-[3px] border-slate-100 last:border-l-0 pb-2">
                        <div className="absolute top-0 -left-[11px] w-5 h-5 rounded-full bg-white border-[4px] border-brand-teal shadow-sm"></div>
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
                          <div>
                            <h4 className="text-lg font-black text-slate-800">{edu.degree}</h4>
                            <p className="text-brand-teal font-bold text-xs italic mt-1">{edu.institution}</p>
                          </div>
                          <span className="inline-flex text-[10px] font-bold text-brand-teal bg-teal-50 border border-teal-100 px-3 py-1 rounded-full uppercase tracking-wider">
                            {edu.startDate} — {edu.endDate}
                          </span>
                        </div>
                        <p className="text-slate-500 text-sm leading-relaxed mt-2">{edu.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
                       <p className="text-slate-400 font-bold italic text-xs">Academic qualifications pending review.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Documents Section */}
              <section className="bg-[#f5f7f9] p-10 rounded-[3rem] border border-[#e1e8ed]">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white text-[#004494] rounded-2xl flex items-center justify-center shadow-lg border border-[#e1e8ed]">
                      <FileText size={22} />
                    </div>
                    <div>
                      <h3 className="text-[11px] font-black text-[#004494] uppercase tracking-[0.2em] leading-none mb-1">Document Dossier</h3>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Verified Digital Attachments</p>
                    </div>
                  </div>
                </div>
                
                {profile.documents && profile.documents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profile.documents.map((doc, i) => (
                      <div key={i} className="bg-white p-5 rounded-2xl border border-[#e1e8ed] flex items-center justify-between group hover:border-[#004494] transition-all">
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className="w-10 h-10 bg-slate-50 text-brand-gold rounded-xl flex items-center justify-center shrink-0">
                            <FileText size={20} />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-black text-[#004494] truncate" title={doc.name}>
                              {doc.name}
                            </p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                              ID: {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <a 
                          href={doc.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-10 h-10 bg-brand-blue/5 text-brand-blue rounded-xl flex items-center justify-center hover:bg-[#004494] hover:text-white transition-all shadow-sm"
                        >
                          <Download size={16} />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                     <p className="text-slate-400 font-bold italic text-xs">Formal document vault empty.</p>
                  </div>
                )}
              </section>
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
