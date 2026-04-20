import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { CandidateProfile } from '../../types';
import { Search, User, Mail, Phone, Globe, CreditCard, FileText, Trash2, Eye, X, Download, Save, Sparkles, Loader2, Plus, Briefcase, GraduationCap, Languages, MapPin, Calendar, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { GoogleGenAI } from "@google/genai";
import EuropassCV from '../../components/EuropassCV';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { COUNTRIES, JOB_POSITIONS } from '../../constants';

export default function AdminCandidates() {
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState<Partial<CandidateProfile>>({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [cvCandidate, setCvCandidate] = useState<CandidateProfile | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [countries, setCountries] = useState<string[]>([]);

  const EDUCATION_LEVELS = [
    "High School",
    "Diploma",
    "Bachelor's Degree",
    "Master's Degree",
    "PhD",
    "Vocational Training",
    "Other"
  ];

  const PROFICIENCY_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];

  const COMMON_LANGUAGES = [
    "English", "Nepali", "Hindi", "Arabic", "Polish", "Romanian", "Croatian", 
    "German", "French", "Spanish", "Italian", "Portuguese", "Russian", 
    "Chinese", "Japanese", "Korean", "Urdu", "Bengali", "Turkish"
  ];

  const ALL_COUNTRIES = Array.from(new Set([...COUNTRIES, "Nepal", "India", "Bangladesh", "Pakistan", "Sri Lanka", "Philippines", "Vietnam"]));

  useEffect(() => {
    fetchCandidates();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'settings', 'siteContent');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.countries?.length) {
          setCountries(data.countries);
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  useEffect(() => {
    if (selectedCandidate) {
      setEditingProfile({
        visaStatus: selectedCandidate.visaStatus || 'pending',
        joiningDate: selectedCandidate.joiningDate || '',
        education: selectedCandidate.education || '',
        experience: selectedCandidate.experience || '',
        nationality: selectedCandidate.nationality || '',
        phone: selectedCandidate.phone || '',
        passportNumber: selectedCandidate.passportNumber || '',
        workPermitStatus: selectedCandidate.workPermitStatus || 'pending',
        documentProcessingStatus: selectedCandidate.documentProcessingStatus || 'pending',
        expectedArrivalDate: selectedCandidate.expectedArrivalDate || '',
        interviewLink: selectedCandidate.interviewLink || '',
        interviewDate: selectedCandidate.interviewDate || '',
        interviewTime: selectedCandidate.interviewTime || '',
        interviewPosition: selectedCandidate.interviewPosition || '',
        interviewCountry: selectedCandidate.interviewCountry || '',
        paymentStatus: selectedCandidate.paymentStatus || 'pending',
        totalAmount: selectedCandidate.totalAmount || '',
        paidAmount: selectedCandidate.paidAmount || '',
        paymentHistory: selectedCandidate.paymentHistory || [],
        address: selectedCandidate.address || '',
        dateOfBirth: selectedCandidate.dateOfBirth || '',
        gender: selectedCandidate.gender || '',
        skills: selectedCandidate.skills || [],
        languages: selectedCandidate.languages || [],
        workHistory: selectedCandidate.workHistory || [],
        educationHistory: selectedCandidate.educationHistory || [],
      });
    }
  }, [selectedCandidate]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'candidates'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as CandidateProfile));
      setCandidates(data);
      setFilteredCandidates(data);
    } catch (error) {
      console.error("Error fetching candidates:", error);
      toast.error("Failed to load candidates.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!selectedCandidate) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'candidates', selectedCandidate.uid), {
        ...editingProfile,
        updatedAt: Date.now()
      });
      toast.success("Candidate profile updated successfully!");
      fetchCandidates();
      setSelectedCandidate({ ...selectedCandidate, ...editingProfile });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const downloadEuropassCV = async (candidateOverride?: CandidateProfile) => {
    const targetCandidate = candidateOverride || selectedCandidate;
    if (!targetCandidate) return;
    
    const toastId = toast.loading(`Generating CV for ${targetCandidate.fullName}...`);
    
    // If it's a quick download from the list, we use the quick template
    // If it's from the modal, we use the modal template
    const templateId = candidateOverride ? 'europass-cv-quick-template' : 'europass-cv-template';
    
    if (candidateOverride) {
      setCvCandidate(targetCandidate);
    }

    // Wait for render
    setTimeout(async () => {
      try {
        const element = document.getElementById(templateId);
        if (!element) throw new Error("Template not found");

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Europass_CV_${targetCandidate.fullName.replace(/\s+/g, '_')}.pdf`);
        
        if (candidateOverride) setCvCandidate(null);
        toast.success("CV Downloaded!", { id: toastId });
      } catch (error) {
        console.error("PDF Generation Error:", error);
        toast.error("Failed to generate PDF", { id: toastId });
        if (candidateOverride) setCvCandidate(null);
      }
    }, 500);
  };

  const generateAiSummary = async () => {
    if (!selectedCandidate) return;
    setIsGeneratingSummary(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this candidate profile and provide a professional 2-3 sentence summary for an HR recruiter. 
        Name: ${selectedCandidate.fullName}
        Experience: ${selectedCandidate.experience}
        Education: ${selectedCandidate.education}
        Nationality: ${selectedCandidate.nationality}
        Visa Status: ${selectedCandidate.visaStatus}
        Highlight their key strengths and suitability for international roles.`,
      });
      setAiSummary(response.text);
    } catch (error) {
      console.error("AI Summary Error:", error);
      toast.error("Failed to generate AI summary");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  useEffect(() => {
    setAiSummary(null);
  }, [selectedCandidate]);

  useEffect(() => {
    const result = candidates.filter(c => 
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm))
    );
    setFilteredCandidates(result);
  }, [searchTerm, candidates]);

  const handleDelete = async (uid: string) => {
    try {
      await deleteDoc(doc(db, 'candidates', uid));
      toast.success("Candidate profile deleted.");
      fetchCandidates();
      setSelectedCandidate(null);
    } catch (error) {
      toast.error("Failed to delete candidate.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-blue">Registered Candidates</h1>
          <p className="text-gray-500 text-xs md:text-base">Manage users who have registered through the candidate portal.</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search candidates..."
            className="w-full pl-12 pr-4 py-2 md:py-3 rounded-xl border border-gray-100 focus:border-brand-gold outline-none transition-all text-sm md:text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 animate-pulse h-64"></div>
          ))
        ) : filteredCandidates.map((candidate) => (
          <div key={candidate.uid} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-brand-blue/5 text-brand-blue rounded-2xl flex items-center justify-center text-xl md:text-2xl font-bold shrink-0">
                  {candidate.fullName.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-bold text-brand-blue truncate text-sm md:text-base">{candidate.fullName}</h3>
                  <p className="text-[10px] md:text-xs text-gray-400 truncate">{candidate.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 md:space-y-3 mb-6 md:mb-8">
              <div className="flex items-center gap-3 text-xs md:text-sm text-gray-500">
                <Phone size={14} className="text-brand-gold md:w-4 md:h-4" />
                <span className="truncate">{candidate.phone || 'No phone'}</span>
              </div>
              <div className="flex items-center gap-3 text-xs md:text-sm text-gray-500">
                <Globe size={14} className="text-brand-gold md:w-4 md:h-4" />
                <span className="truncate">{candidate.nationality || 'No nationality'}</span>
              </div>
              <div className="flex items-center gap-3 text-xs md:text-sm text-gray-500">
                <FileText size={14} className="text-brand-gold md:w-4 md:h-4" />
                <span>{candidate.documents?.length || 0} Documents</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Link 
                to={`/candidate/profile/${candidate.uid}`}
                className="flex-grow bg-brand-gold text-brand-blue py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm hover:bg-brand-blue hover:text-white text-center transition-all shadow-lg shadow-brand-gold/20"
              >
                Full CV View
              </Link>
              <button 
                onClick={() => setSelectedCandidate(candidate)}
                className="px-4 bg-brand-blue/5 text-brand-blue py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm hover:bg-brand-blue hover:text-white transition-all"
              >
                Manage
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  downloadEuropassCV(candidate);
                }}
                className="flex items-center justify-center p-2.5 md:p-3 bg-brand-gold/10 text-brand-gold rounded-xl font-bold text-xs hover:bg-brand-gold hover:text-white transition-all"
                title="Download Europass CV"
              >
                <Download size={18} />
              </button>
              <button 
                onClick={() => setDeleteConfirmId(candidate.uid)}
                className="p-2.5 md:p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-100 sm:opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={18} className="md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Candidate Detail Modal */}
      <AnimatePresence>
        {selectedCandidate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-blue/60 backdrop-blur-sm"
              onClick={() => setSelectedCandidate(null)}
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 p-6 md:p-12"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-10">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-brand-blue text-white rounded-2xl flex items-center justify-center text-2xl md:text-3xl font-bold shrink-0">
                    {selectedCandidate.fullName.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <h2 className="text-xl md:text-3xl font-bold text-brand-blue mb-1 truncate">{selectedCandidate.fullName}</h2>
                    <p className="text-gray-500 text-sm md:text-base truncate">{selectedCandidate.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => downloadEuropassCV()}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-xl font-bold text-sm hover:bg-brand-gold transition-all shadow-lg"
                  >
                    <Download size={16} />
                    Europass CV
                  </button>
                  <button 
                    onClick={generateAiSummary}
                    disabled={isGeneratingSummary}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-brand-gold/10 text-brand-gold rounded-xl font-bold text-sm hover:bg-brand-gold hover:text-white transition-all disabled:opacity-50"
                  >
                    {isGeneratingSummary ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    AI Summary
                  </button>
                  <button onClick={() => setSelectedCandidate(null)} className="text-gray-400 hover:text-brand-blue transition-colors shrink-0 p-2">
                    <X size={24} />
                  </button>
                </div>
              </div>

              {aiSummary && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-10 p-6 bg-brand-blue/5 border border-brand-blue/10 rounded-2xl"
                >
                  <div className="flex items-center gap-2 text-brand-blue font-bold mb-2">
                    <Sparkles size={16} /> AI Candidate Insight
                  </div>
                  <p className="text-gray-700 italic leading-relaxed">"{aiSummary}"</p>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-8 md:mb-12">
                <div className="md:col-span-1 space-y-6 md:space-y-8">
                  <div>
                    <h3 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Contact Info</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Phone</label>
                        <div className="flex items-center gap-3">
                          <Phone size={16} className="text-brand-gold shrink-0 md:w-[18px] md:h-[18px]" />
                          <input 
                            className="w-full text-sm md:text-base text-gray-700 font-medium bg-transparent border-b border-transparent focus:border-brand-gold outline-none"
                            value={editingProfile.phone || ''}
                            onChange={(e) => setEditingProfile({ ...editingProfile, phone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nationality</label>
                        <div className="flex items-center gap-3">
                          <Globe size={16} className="text-brand-gold shrink-0 md:w-[18px] md:h-[18px]" />
                          <input 
                            list="nationality-options"
                            className="w-full text-sm md:text-base text-gray-700 font-medium bg-transparent border-b border-transparent focus:border-brand-gold outline-none"
                            value={editingProfile.nationality || ''}
                            onChange={(e) => setEditingProfile({ ...editingProfile, nationality: e.target.value })}
                          />
                          <datalist id="nationality-options">
                            {Array.from(new Set([...countries, ...ALL_COUNTRIES])).map(c => <option key={c} value={c} />)}
                          </datalist>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Passport Number</label>
                        <div className="flex items-center gap-3">
                          <CreditCard size={16} className="text-brand-gold shrink-0 md:w-[18px] md:h-[18px]" />
                          <input 
                            className="w-full text-sm md:text-base text-gray-700 font-medium bg-transparent border-b border-transparent focus:border-brand-gold outline-none"
                            value={editingProfile.passportNumber || ''}
                            onChange={(e) => setEditingProfile({ ...editingProfile, passportNumber: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Address</label>
                        <div className="flex items-center gap-3">
                          <MapPin size={16} className="text-brand-gold shrink-0 md:w-[18px] md:h-[18px]" />
                          <input 
                            className="w-full text-sm md:text-base text-gray-700 font-medium bg-transparent border-b border-transparent focus:border-brand-gold outline-none"
                            value={editingProfile.address || ''}
                            onChange={(e) => setEditingProfile({ ...editingProfile, address: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Date of Birth</label>
                        <div className="flex items-center gap-3">
                          <Calendar size={16} className="text-brand-gold shrink-0 md:w-[18px] md:h-[18px]" />
                          <input 
                            type="text"
                            placeholder="e.g. 1995-05-15"
                            className="w-full text-sm md:text-base text-gray-700 font-medium bg-transparent border-b border-transparent focus:border-brand-gold outline-none"
                            value={editingProfile.dateOfBirth || ''}
                            onChange={(e) => setEditingProfile({ ...editingProfile, dateOfBirth: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Gender</label>
                        <select 
                          className="w-full text-sm md:text-base text-gray-700 font-medium bg-transparent border-b border-transparent focus:border-brand-gold outline-none"
                          value={editingProfile.gender || ''}
                          onChange={(e) => setEditingProfile({ ...editingProfile, gender: e.target.value })}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Professional</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Experience</label>
                        <input 
                          className="w-full text-sm md:text-base font-medium text-brand-blue bg-transparent border-b border-transparent focus:border-brand-gold outline-none"
                          value={editingProfile.experience || ''}
                          onChange={(e) => setEditingProfile({ ...editingProfile, experience: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Education</label>
                        <input 
                          list="education-options"
                          className="w-full text-sm md:text-base font-medium text-brand-blue bg-transparent border-b border-transparent focus:border-brand-gold outline-none"
                          value={editingProfile.education || ''}
                          onChange={(e) => setEditingProfile({ ...editingProfile, education: e.target.value })}
                        />
                        <datalist id="education-options">
                          {EDUCATION_LEVELS.map(level => <option key={level} value={level} />)}
                        </datalist>
                      </div>
                      
                      {/* Skills & Languages */}
                      <div className="pt-4">
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase">Skills</label>
                          <button 
                            type="button"
                            onClick={() => setEditingProfile({ ...editingProfile, skills: [...(editingProfile.skills || []), { name: '', level: 'Beginner' }] })}
                            className="text-brand-gold text-[10px] font-bold flex items-center gap-1"
                          >
                            <Plus size={12} /> Add Skill
                          </button>
                        </div>
                        <div className="space-y-2">
                          {editingProfile.skills?.map((skill, i) => (
                            <div key={i} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <input 
                                className="bg-transparent text-[10px] font-bold text-slate-600 outline-none flex-1"
                                placeholder="Skill"
                                value={skill.name}
                                onChange={(e) => {
                                  const newSkills = [...(editingProfile.skills || [])];
                                  newSkills[i] = { ...skill, name: e.target.value };
                                  setEditingProfile({ ...editingProfile, skills: newSkills });
                                }}
                              />
                              <select 
                                className="bg-transparent text-[10px] font-bold text-brand-gold outline-none"
                                value={skill.level}
                                onChange={(e) => {
                                  const newSkills = [...(editingProfile.skills || [])];
                                  newSkills[i] = { ...skill, level: e.target.value };
                                  setEditingProfile({ ...editingProfile, skills: newSkills });
                                }}
                              >
                                {PROFICIENCY_LEVELS.map(level => (
                                  <option key={level} value={level}>{level}</option>
                                ))}
                              </select>
                              <button 
                                onClick={() => setEditingProfile({ ...editingProfile, skills: editingProfile.skills?.filter((_, idx) => idx !== i) })}
                                className="text-red-400 hover:text-red-600"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4">
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase">Languages</label>
                          <button 
                            type="button"
                            onClick={() => setEditingProfile({ ...editingProfile, languages: [...(editingProfile.languages || []), { language: '', level: 'A1' }] })}
                            className="text-brand-gold text-[10px] font-bold flex items-center gap-1"
                          >
                            <Plus size={12} /> Add Language
                          </button>
                        </div>
                        <div className="space-y-2">
                          {editingProfile.languages?.map((lang, i) => (
                            <div key={i} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <input 
                                placeholder="Language"
                                list={`language-options-${i}`}
                                className="bg-transparent text-[10px] font-bold text-slate-600 outline-none flex-1"
                                value={lang.language}
                                onChange={(e) => {
                                  const newLangs = [...(editingProfile.languages || [])];
                                  newLangs[i] = { ...lang, language: e.target.value };
                                  setEditingProfile({ ...editingProfile, languages: newLangs });
                                }}
                              />
                              <datalist id={`language-options-${i}`}>
                                {COMMON_LANGUAGES.map(l => <option key={l} value={l} />)}
                              </datalist>
                              <select 
                                className="bg-transparent text-[10px] font-bold text-brand-gold outline-none"
                                value={lang.level}
                                onChange={(e) => {
                                  const newLangs = [...(editingProfile.languages || [])];
                                  newLangs[i] = { ...lang, level: e.target.value };
                                  setEditingProfile({ ...editingProfile, languages: newLangs });
                                }}
                              >
                                <option value="A1">A1</option>
                                <option value="A2">A2</option>
                                <option value="B1">B1</option>
                                <option value="B2">B2</option>
                                <option value="C1">C1</option>
                                <option value="C2">C2</option>
                                <option value="Native">Native</option>
                              </select>
                              <button 
                                onClick={() => setEditingProfile({ ...editingProfile, languages: editingProfile.languages?.filter((_, idx) => idx !== i) })}
                                className="text-red-400 hover:text-red-600"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-8 md:space-y-12">
                  {/* Work History Section */}
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest">Work History (Europass)</h3>
                      <button 
                        type="button"
                        onClick={() => setEditingProfile({ ...editingProfile, workHistory: [...(editingProfile.workHistory || []), { company: '', position: '', startDate: '', endDate: '', description: '' }] })}
                        className="bg-brand-gold/10 text-brand-gold px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-brand-gold hover:text-white transition-all"
                      >
                        <Plus size={14} /> Add Experience
                      </button>
                    </div>
                    <div className="space-y-6">
                      {editingProfile.workHistory?.map((work, i) => (
                        <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative group">
                          <button 
                            onClick={() => setEditingProfile({ ...editingProfile, workHistory: editingProfile.workHistory?.filter((_, idx) => idx !== i) })}
                            className="absolute -right-2 -top-2 w-8 h-8 bg-white text-red-400 rounded-full shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-red-50"
                          >
                            <Trash size={14} />
                          </button>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Position</label>
                              <input 
                                className="w-full bg-white px-4 py-2 rounded-lg border border-slate-100 outline-none focus:border-brand-gold text-sm font-bold"
                                value={work.position}
                                onChange={(e) => {
                                  const newHistory = [...(editingProfile.workHistory || [])];
                                  newHistory[i] = { ...work, position: e.target.value };
                                  setEditingProfile({ ...editingProfile, workHistory: newHistory });
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Company</label>
                              <input 
                                className="w-full bg-white px-4 py-2 rounded-lg border border-slate-100 outline-none focus:border-brand-gold text-sm font-bold"
                                value={work.company}
                                onChange={(e) => {
                                  const newHistory = [...(editingProfile.workHistory || [])];
                                  newHistory[i] = { ...work, company: e.target.value };
                                  setEditingProfile({ ...editingProfile, workHistory: newHistory });
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Start Date</label>
                              <input 
                                className="w-full bg-white px-4 py-2 rounded-lg border border-slate-100 outline-none focus:border-brand-gold text-sm font-bold"
                                value={work.startDate}
                                onChange={(e) => {
                                  const newHistory = [...(editingProfile.workHistory || [])];
                                  newHistory[i] = { ...work, startDate: e.target.value };
                                  setEditingProfile({ ...editingProfile, workHistory: newHistory });
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">End Date</label>
                              <input 
                                className="w-full bg-white px-4 py-2 rounded-lg border border-slate-100 outline-none focus:border-brand-gold text-sm font-bold"
                                value={work.endDate}
                                onChange={(e) => {
                                  const newHistory = [...(editingProfile.workHistory || [])];
                                  newHistory[i] = { ...work, endDate: e.target.value };
                                  setEditingProfile({ ...editingProfile, workHistory: newHistory });
                                }}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Description</label>
                            <textarea 
                              rows={3}
                              className="w-full bg-white px-4 py-2 rounded-lg border border-slate-100 outline-none focus:border-brand-gold text-sm"
                              value={work.description}
                              onChange={(e) => {
                                const newHistory = [...(editingProfile.workHistory || [])];
                                newHistory[i] = { ...work, description: e.target.value };
                                setEditingProfile({ ...editingProfile, workHistory: newHistory });
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Education History Section */}
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest">Education History (Europass)</h3>
                      <button 
                        type="button"
                        onClick={() => setEditingProfile({ ...editingProfile, educationHistory: [...(editingProfile.educationHistory || []), { institution: '', degree: '', startDate: '', endDate: '', description: '' }] })}
                        className="bg-brand-blue/10 text-brand-blue px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-brand-blue hover:text-white transition-all"
                      >
                        <Plus size={14} /> Add Education
                      </button>
                    </div>
                    <div className="space-y-6">
                      {editingProfile.educationHistory?.map((edu, i) => (
                        <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative group">
                          <button 
                            onClick={() => setEditingProfile({ ...editingProfile, educationHistory: editingProfile.educationHistory?.filter((_, idx) => idx !== i) })}
                            className="absolute -right-2 -top-2 w-8 h-8 bg-white text-red-400 rounded-full shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-red-50"
                          >
                            <Trash size={14} />
                          </button>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Degree/Qualification</label>
                              <input 
                                className="w-full bg-white px-4 py-2 rounded-lg border border-slate-100 outline-none focus:border-brand-gold text-sm font-bold"
                                value={edu.degree}
                                onChange={(e) => {
                                  const newHistory = [...(editingProfile.educationHistory || [])];
                                  newHistory[i] = { ...edu, degree: e.target.value };
                                  setEditingProfile({ ...editingProfile, educationHistory: newHistory });
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Institution</label>
                              <input 
                                className="w-full bg-white px-4 py-2 rounded-lg border border-slate-100 outline-none focus:border-brand-gold text-sm font-bold"
                                value={edu.institution}
                                onChange={(e) => {
                                  const newHistory = [...(editingProfile.educationHistory || [])];
                                  newHistory[i] = { ...edu, institution: e.target.value };
                                  setEditingProfile({ ...editingProfile, educationHistory: newHistory });
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Start Date</label>
                              <input 
                                className="w-full bg-white px-4 py-2 rounded-lg border border-slate-100 outline-none focus:border-brand-gold text-sm font-bold"
                                value={edu.startDate}
                                onChange={(e) => {
                                  const newHistory = [...(editingProfile.educationHistory || [])];
                                  newHistory[i] = { ...edu, startDate: e.target.value };
                                  setEditingProfile({ ...editingProfile, educationHistory: newHistory });
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">End Date</label>
                              <input 
                                className="w-full bg-white px-4 py-2 rounded-lg border border-slate-100 outline-none focus:border-brand-gold text-sm font-bold"
                                value={edu.endDate}
                                onChange={(e) => {
                                  const newHistory = [...(editingProfile.educationHistory || [])];
                                  newHistory[i] = { ...edu, endDate: e.target.value };
                                  setEditingProfile({ ...editingProfile, educationHistory: newHistory });
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 md:mb-6">Interview Schedule</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 p-4 md:p-6 bg-brand-gold/5 rounded-2xl border border-brand-gold/10 mb-6">
                      <div>
                        <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase mb-2">Interview Date</label>
                        <input 
                          type="text"
                          placeholder="e.g. 10th April 2026"
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold bg-white font-bold text-brand-blue text-sm"
                          value={editingProfile.interviewDate || ''}
                          onChange={(e) => setEditingProfile({ ...editingProfile, interviewDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase mb-2">Interview Time</label>
                        <input 
                          type="text"
                          placeholder="e.g. 2:00 PM (GMT+5)"
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold bg-white font-bold text-brand-blue text-sm"
                          value={editingProfile.interviewTime || ''}
                          onChange={(e) => setEditingProfile({ ...editingProfile, interviewTime: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase mb-2">Interview Position</label>
                        <input 
                          type="text"
                          list="job-positions"
                          placeholder="e.g. Warehouse Worker"
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold bg-white font-bold text-brand-blue text-sm"
                          value={editingProfile.interviewPosition || ''}
                          onChange={(e) => setEditingProfile({ ...editingProfile, interviewPosition: e.target.value })}
                        />
                        <datalist id="job-positions">
                          {JOB_POSITIONS.map(pos => <option key={pos} value={pos} />)}
                        </datalist>
                      </div>
                      <div>
                        <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-2">Interview Country</label>
                        <input 
                          type="text"
                          list="countries-list"
                          placeholder="e.g. Poland"
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold bg-white font-bold text-brand-blue text-sm"
                          value={editingProfile.interviewCountry || ''}
                          onChange={(e) => setEditingProfile({ ...editingProfile, interviewCountry: e.target.value })}
                        />
                        <datalist id="countries-list">
                          {ALL_COUNTRIES.map(c => <option key={c} value={c} />)}
                        </datalist>
                      </div>
                    </div>

                      <div>
                        <h3 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 md:mb-6">Payment Tracking</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 p-4 md:p-6 bg-green-50 rounded-2xl border border-green-100 mb-6">
                          <div className="sm:col-span-2 p-6 bg-white rounded-2xl border border-green-100 shadow-sm mb-2">
                             <label className="block text-[10px] md:text-xs font-black text-brand-blue uppercase mb-3 tracking-widest">Total Package Amount</label>
                             <div className="flex items-center gap-4">
                               <div className="text-3xl font-black text-brand-blue">€</div>
                               <input 
                                 type="text"
                                 placeholder="e.g. 5500"
                                 className="text-4xl font-black text-brand-blue outline-none flex-grow bg-transparent"
                                 value={editingProfile.totalAmount || ''}
                                 onChange={(e) => setEditingProfile({ ...editingProfile, totalAmount: e.target.value })}
                               />
                             </div>
                             <p className="text-[10px] font-bold text-gray-400 uppercase mt-2 italic">This is the total cost shown to the candidate.</p>
                          </div>
                          <div>
                            <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-2">Payment Status</label>
                            <select 
                              className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold bg-white font-bold text-brand-blue text-sm"
                              value={editingProfile.paymentStatus || 'pending'}
                              onChange={(e) => setEditingProfile({ ...editingProfile, paymentStatus: e.target.value as any })}
                            >
                              <option value="pending">Pending</option>
                              <option value="partially-paid">Partially Paid</option>
                              <option value="fully-paid">Fully Paid</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-2">Amount Paid</label>
                            <input 
                              type="text"
                              placeholder="e.g. 500"
                              className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold bg-white font-bold text-brand-blue text-sm"
                              value={editingProfile.paidAmount || ''}
                              onChange={(e) => setEditingProfile({ ...editingProfile, paidAmount: e.target.value })}
                            />
                          </div>
                        </div>

                        {/* Package Details: Includes & Excludes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                          <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Included in Package</h4>
                              <button 
                                onClick={() => setEditingProfile({ ...editingProfile, includedPackageItems: [...(editingProfile.includedPackageItems || []), ''] })}
                                className="text-blue-600 font-bold text-[10px] flex items-center gap-1 hover:underline"
                              >
                                <Plus size={14} /> Add Item
                              </button>
                            </div>
                            <div className="space-y-2">
                              {editingProfile.includedPackageItems?.map((item, i) => (
                                <div key={i} className="flex gap-2 group">
                                  <input 
                                    list="common-package-items"
                                    className="flex-grow px-3 py-1.5 rounded-xl border border-blue-100 text-xs font-bold outline-none focus:border-blue-400"
                                    value={item}
                                    onChange={(e) => {
                                      const items = [...(editingProfile.includedPackageItems || [])];
                                      items[i] = e.target.value;
                                      setEditingProfile({ ...editingProfile, includedPackageItems: items });
                                    }}
                                  />
                                  <button 
                                    onClick={() => setEditingProfile({ ...editingProfile, includedPackageItems: editingProfile.includedPackageItems?.filter((_, idx) => idx !== i) })}
                                    className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}
                              {(!editingProfile.includedPackageItems || editingProfile.includedPackageItems.length === 0) && (
                                <p className="text-[10px] text-blue-400 italic">No items included</p>
                              )}
                            </div>
                          </div>

                          <div className="p-6 bg-red-50/50 rounded-3xl border border-red-100">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest">Candidate Must Pay (Excluded)</h4>
                              <button 
                                onClick={() => setEditingProfile({ ...editingProfile, excludedPackageItems: [...(editingProfile.excludedPackageItems || []), ''] })}
                                className="text-red-600 font-bold text-[10px] flex items-center gap-1 hover:underline"
                              >
                                <Plus size={14} /> Add Item
                              </button>
                            </div>
                            <div className="space-y-2">
                              {editingProfile.excludedPackageItems?.map((item, i) => (
                                <div key={i} className="flex gap-2 group">
                                  <input 
                                    list="common-package-items"
                                    className="flex-grow px-3 py-1.5 rounded-xl border border-red-100 text-xs font-bold outline-none focus:border-red-400"
                                    value={item}
                                    onChange={(e) => {
                                      const items = [...(editingProfile.excludedPackageItems || [])];
                                      items[i] = e.target.value;
                                      setEditingProfile({ ...editingProfile, excludedPackageItems: items });
                                    }}
                                  />
                                  <button 
                                    onClick={() => setEditingProfile({ ...editingProfile, excludedPackageItems: editingProfile.excludedPackageItems?.filter((_, idx) => idx !== i) })}
                                    className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}
                              {(!editingProfile.excludedPackageItems || editingProfile.excludedPackageItems.length === 0) && (
                                <p className="text-[10px] text-red-400 italic">No items excluded</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <datalist id="common-package-items">
                          <option value="Ticket" />
                          <option value="VFS Appointment" />
                          <option value="Visa Fee" />
                          <option value="PCC Legalization" />
                          <option value="Health Insurance" />
                          <option value="Accommodation" />
                          <option value="Local Courier Fees" />
                        </datalist>

                      <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Payment History</h4>
                          <button 
                            type="button"
                            onClick={() => {
                              const newHistory = [...(editingProfile.paymentHistory || []), { date: new Date().toISOString().split('T')[0], amount: '', method: 'Cash', note: '' }];
                              setEditingProfile({ ...editingProfile, paymentHistory: newHistory });
                            }}
                            className="text-brand-gold font-bold text-xs flex items-center gap-1"
                          >
                            <Plus size={14} /> Add Payment
                          </button>
                        </div>
                        <div className="space-y-3">
                          {editingProfile.paymentHistory?.map((payment, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 grid grid-cols-1 sm:grid-cols-4 gap-3 relative group">
                              <input 
                                type="date"
                                className="px-3 py-1.5 rounded border border-gray-100 text-xs outline-none focus:border-brand-gold"
                                value={payment.date}
                                onChange={(e) => {
                                  const newHistory = [...(editingProfile.paymentHistory || [])];
                                  newHistory[i] = { ...payment, date: e.target.value };
                                  setEditingProfile({ ...editingProfile, paymentHistory: newHistory });
                                }}
                              />
                              <input 
                                type="text"
                                placeholder="Amount"
                                className="px-3 py-1.5 rounded border border-gray-100 text-xs outline-none focus:border-brand-gold"
                                value={payment.amount}
                                onChange={(e) => {
                                  const newHistory = [...(editingProfile.paymentHistory || [])];
                                  newHistory[i] = { ...payment, amount: e.target.value };
                                  setEditingProfile({ ...editingProfile, paymentHistory: newHistory });
                                }}
                              />
                              <select 
                                className="px-3 py-1.5 rounded border border-gray-100 text-xs outline-none focus:border-brand-gold"
                                value={payment.method}
                                onChange={(e) => {
                                  const newHistory = [...(editingProfile.paymentHistory || [])];
                                  newHistory[i] = { ...payment, method: e.target.value };
                                  setEditingProfile({ ...editingProfile, paymentHistory: newHistory });
                                }}
                              >
                                <option value="Cash">Cash</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="E-Sewa">E-Sewa</option>
                                <option value="Khalti">Khalti</option>
                                <option value="Other">Other</option>
                              </select>
                              <input 
                                type="text"
                                placeholder="Note"
                                className="px-3 py-1.5 rounded border border-gray-100 text-xs outline-none focus:border-brand-gold"
                                value={payment.note}
                                onChange={(e) => {
                                  const newHistory = [...(editingProfile.paymentHistory || [])];
                                  newHistory[i] = { ...payment, note: e.target.value };
                                  setEditingProfile({ ...editingProfile, paymentHistory: newHistory });
                                }}
                              />
                              <button 
                                type="button"
                                onClick={() => {
                                  const newHistory = editingProfile.paymentHistory?.filter((_, idx) => idx !== i);
                                  setEditingProfile({ ...editingProfile, paymentHistory: newHistory });
                                }}
                                className="absolute -right-2 -top-2 p-1 bg-red-50 text-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <h3 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 md:mb-6">Processing Status</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 p-4 md:p-6 bg-gray-50 rounded-2xl border border-gray-100 mb-6">
                      <div>
                        <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-2">Work Permit Status</label>
                        <select 
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold bg-white font-bold text-brand-blue text-sm"
                          value={editingProfile.workPermitStatus || 'pending'}
                          onChange={(e) => setEditingProfile({ ...editingProfile, workPermitStatus: e.target.value as any })}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-2">Document Processing</label>
                        <select 
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold bg-white font-bold text-brand-blue text-sm"
                          value={editingProfile.documentProcessingStatus || 'pending'}
                          onChange={(e) => setEditingProfile({ ...editingProfile, documentProcessingStatus: e.target.value as any })}
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>

                    <h3 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 md:mb-6">Visa & Joining Status</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 p-4 md:p-6 bg-gray-50 rounded-2xl border border-gray-100">
                      <div>
                        <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-2">Visa Status</label>
                        <select 
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold bg-white font-bold text-brand-blue text-sm"
                          value={editingProfile.visaStatus || 'pending'}
                          onChange={(e) => setEditingProfile({ ...editingProfile, visaStatus: e.target.value as any })}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-2">Joining Date</label>
                        <input 
                          type="text"
                          placeholder="e.g. 15th May 2026"
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold bg-white font-bold text-brand-blue text-sm"
                          value={editingProfile.joiningDate || ''}
                          onChange={(e) => setEditingProfile({ ...editingProfile, joiningDate: e.target.value })}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-2">Expected Arrival Date</label>
                        <input 
                          type="text"
                          placeholder="e.g. End of June 2026"
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold bg-white font-bold text-brand-blue text-sm"
                          value={editingProfile.expectedArrivalDate || ''}
                          onChange={(e) => setEditingProfile({ ...editingProfile, expectedArrivalDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Uploaded Documents</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedCandidate.documents?.length === 0 ? (
                      <p className="text-gray-400 italic">No documents uploaded.</p>
                    ) : (
                      selectedCandidate.documents?.map((doc, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-3">
                            <FileText className="text-brand-gold" size={20} />
                            <div>
                              <p className="text-sm font-bold text-brand-blue">{doc.name}</p>
                              <p className="text-[10px] text-gray-400 uppercase">{doc.type}</p>
                            </div>
                          </div>
                          <a 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 text-brand-blue hover:bg-brand-blue/5 rounded-lg transition-colors"
                          >
                            <Download size={18} />
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Interview Access</h3>
                  <div className="p-6 bg-brand-gold/5 rounded-2xl border border-brand-gold/10">
                    <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-2">Interview Link</label>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <input 
                        type="url"
                        placeholder="https://zoom.us/j/..."
                        className="flex-grow px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold bg-white font-bold text-brand-blue text-sm"
                        value={editingProfile.interviewLink || ''}
                        onChange={(e) => setEditingProfile({ ...editingProfile, interviewLink: e.target.value })}
                      />
                      {editingProfile.interviewLink && (
                        <a 
                          href={editingProfile.interviewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-brand-gold text-slate-900 px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 hover:text-white transition-all shadow-lg whitespace-nowrap"
                        >
                          <Globe size={18} /> Join Interview
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-8 border-t border-gray-50">
                <button 
                  onClick={() => setDeleteConfirmId(selectedCandidate.uid)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 px-6 py-3 rounded-xl font-bold transition-all"
                >
                  <Trash2 size={20} /> Delete Profile
                </button>
                <button 
                  onClick={handleUpdateProfile}
                  disabled={saving}
                  className="w-full sm:w-auto bg-brand-blue text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-gold transition-all shadow-lg disabled:opacity-70"
                >
                  {saving ? "Saving..." : <><Save size={20} /> Save Changes</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden CV Template for Quick Download */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {cvCandidate && (
          <EuropassCV 
            id="europass-cv-quick-template" 
            candidate={cvCandidate} 
          />
        )}
      </div>

      {/* Hidden CV Template for PDF Generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {selectedCandidate && (
          <EuropassCV 
            id="europass-cv-template" 
            candidate={{ ...selectedCandidate, ...editingProfile }} 
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-blue/60 backdrop-blur-sm"
              onClick={() => setDeleteConfirmId(null)}
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 p-8 text-center"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={40} />
              </div>
              <h3 className="text-2xl font-bold text-brand-blue mb-4">Confirm Deletion</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Are you sure you want to delete this candidate profile? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-grow px-6 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    handleDelete(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }}
                  className="flex-grow px-6 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Delete Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
