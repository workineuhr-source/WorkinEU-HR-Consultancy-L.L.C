import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { CandidateProfile } from '../../types';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Sparkles, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  CreditCard, 
  MapPin, 
  Calendar, 
  Plus, 
  X, 
  Trash2, 
  Trash,
  FileText,
  Briefcase,
  GraduationCap,
  Languages,
  ShieldCheck,
  Zap,
  Download,
  Camera,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { COUNTRIES, JOB_POSITIONS, CURRENCY_SYMBOLS } from '../../constants';
import { cn } from '../../lib/utils';
import EuropassCV from '../../components/EuropassCV';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function AdminCandidateDetail() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState<Partial<CandidateProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [selectedCvTheme, setSelectedCvTheme] = useState<'classic' | 'modern' | 'professional' | 'elegant'>('classic');
  const [cvCandidate, setCvCandidate] = useState<CandidateProfile | null>(null);

  const EDUCATION_LEVELS = [
    "High School", "Diploma", "Bachelor's Degree", "Master's Degree", "PhD", "Vocational Training", "Other"
  ];

  const PROFICIENCY_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];

  const COMMON_LANGUAGES = [
    "English", "Nepali", "Hindi", "Arabic", "Polish", "Romanian", "Croatian", 
    "German", "French", "Spanish", "Italian", "Portuguese", "Russian", 
    "Chinese", "Japanese", "Korean", "Urdu", "Bengali", "Turkish"
  ];

  const ALL_COUNTRIES = Array.from(new Set([...COUNTRIES, "Nepal", "India", "Bangladesh", "Pakistan", "Sri Lanka", "Philippines", "Vietnam"]));

  useEffect(() => {
    if (uid) {
      fetchCandidate();
    }
  }, [uid]);

  const fetchCandidate = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'candidates', uid!);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = { uid: docSnap.id, ...docSnap.data() } as CandidateProfile;
        setCandidate(data);
        setEditingProfile({ ...data });
      } else {
        toast.error("Candidate not found");
        navigate('/admin/candidates');
      }
    } catch (error) {
      console.error("Error fetching candidate:", error);
      toast.error("Failed to load candidate details");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setEditingProfile(prev => ({ ...prev, photoUrl: base64 }));
      toast.success("Photo uploaded/updated successfully");
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const toastId = toast.loading("Processing and attaching document...");
    
    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Document size must be less than 5MB", { id: toastId });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const newDoc = {
        name: file.name,
        url: base64,
        type: file.type,
        uploadedAt: Date.now()
      };
      
      setEditingProfile(prev => ({
        ...prev,
        documents: [...(prev.documents || []), newDoc]
      }));
      
      toast.success(`${file.name} uploaded successfully`, { id: toastId });
    };
    reader.onerror = () => toast.error("Failed to read file", { id: toastId });
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!uid) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'candidates', uid), {
        ...editingProfile,
        updatedAt: Date.now()
      });
      toast.success("Candidate Profile Updated Successfully!");
      // Optionally refresh
      fetchCandidate();
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const autoFillWithAi = async () => {
    setIsGeneratingAi(true);
    const toastId = toast.loading("AI is analyzing and optimizing profile...");
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Analyze this candidate's information and provide a "smart-filled" version of their profile. 
      Focus on:
      1. Generating a professional "experience" (The Job Title/Role that goes under the name, e.g. "Senior Logistics Coordinator").
      2. Generating a professional 'aboutMe' (2-3 compelling sentences).
      3. Identifying 'skills' based on their experience.
      4. Suggesting 'profileIntel'.
      5. Inferring or standardizing Work History (positions and dates) if any data is present in the bio or notes.
      
      Current Profile Data:
      Name: ${editingProfile.fullName}
      Description/Experience: ${editingProfile.experience}
      Education: ${editingProfile.education}
      Address: ${editingProfile.address}
      Current AboutMe: ${editingProfile.aboutMe}
      Work History Count: ${editingProfile.workHistory?.length || 0}
      
      Return the result as a raw JSON object with these keys only: 
      "jobTitle" (string for the experience field),
      "aboutMe" (string), 
      "profileIntel" (string), 
      "homeCountry" (string),
      "currentCountry" (string),
      "whatsapp" (string),
      "suggestedSkills" (string array),
      "suggestedLanguages" (string array),
      "suggestedWorkHistory" (array of objects: {company: string, position: string, startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD", description: string})
      
      Ensure all dates are strictly in YYYY-MM-DD format.
      Do not include any Markdown formatting, only the JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const responseText = response.text.trim();
      const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const aiResult = JSON.parse(cleanedJson);

      setEditingProfile(prev => ({
        ...prev,
        experience: aiResult.jobTitle || prev.experience,
        aboutMe: aiResult.aboutMe || prev.aboutMe,
        profileIntel: aiResult.profileIntel || prev.profileIntel,
        homeCountry: aiResult.homeCountry || prev.homeCountry,
        currentCountry: aiResult.currentCountry || prev.currentCountry,
        whatsapp: aiResult.whatsapp || prev.whatsapp,
        skills: [
          ...(prev.skills || []),
          ...(aiResult.suggestedSkills || []).map((s: string) => ({ name: s, level: 'Intermediate' }))
        ].filter((v, i, a) => a.findIndex(t => t.name === v.name) === i),
        languages: [
          ...(prev.languages || []),
          ...(aiResult.suggestedLanguages || []).map((l: string) => ({ language: l, level: 'Intermediate' }))
        ].filter((v, i, a) => a.findIndex(t => t.language === v.language) === i),
        workHistory: aiResult.suggestedWorkHistory && aiResult.suggestedWorkHistory.length > 0 
          ? aiResult.suggestedWorkHistory 
          : prev.workHistory,
      }));

      toast.success("AI Auto-Fill successful! Please review and save.", { id: toastId });
    } catch (error) {
      console.error("AI Auto-Fill Error:", error);
      toast.error("AI failed to auto-fill. Please try again.", { id: toastId });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const downloadEuropassCV = async () => {
    if (!candidate) return;
    const toastId = toast.loading(`Generating CV for ${candidate.fullName}...`);
    try {
      setCvCandidate({ ...candidate, ...editingProfile } as CandidateProfile);
      
      // Allow state to set and template to render
      setTimeout(async () => {
        const element = document.getElementById('europass-cv-full-template');
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
        pdf.save(`Europass_CV_${candidate.fullName.replace(/\s+/g, '_')}.pdf`);
        
        setCvCandidate(null);
        toast.success("CV Downloaded!", { id: toastId });
      }, 500);
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error("Failed to generate PDF", { id: toastId });
      setCvCandidate(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-brand-blue" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-24">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/admin/candidates')}
            className="p-3 bg-white shadow-sm border border-gray-100 rounded-2xl text-gray-400 hover:text-brand-blue transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-brand-blue tracking-tight mb-1">Manage Candidate</h1>
            <div className="flex items-center gap-2">
              <div className="flex h-1.5 w-32 bg-gray-100 rounded-full overflow-hidden">
                <div className="bg-brand-gold h-full rounded-full w-[85%] animate-pulse"></div>
              </div>
              <p className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em]">Operation Readiness: 85%</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto relative z-10">
          <button 
            onClick={autoFillWithAi}
            disabled={isGeneratingAi}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white border border-brand-gold/20 text-brand-gold rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-brand-gold hover:text-white transition-all disabled:opacity-50 shadow-lg shadow-brand-gold/5 group"
          >
            {isGeneratingAi ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} className="group-hover:scale-125 transition-transform" />}
            AI Smart Fill
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-[#0a192f] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-brand-blue transition-all shadow-2xl shadow-brand-blue/30 group"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} className="group-hover:scale-125 transition-transform" />}
            Commit Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar Info */}
        <div className="lg:col-span-4 space-y-8">
          {/* Main User Card */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="relative group w-24 h-24 mb-6">
                <div className="w-24 h-24 bg-brand-blue text-white rounded-3xl flex items-center justify-center text-4xl font-black shadow-2xl overflow-hidden">
                  {editingProfile.photoUrl ? (
                    <img src={editingProfile.photoUrl} alt="Candidate" className="w-full h-full object-cover" />
                  ) : (
                    candidate?.fullName.charAt(0)
                  )}
                </div>
                <label className="absolute inset-0 bg-black/60 text-white rounded-3xl flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                  <Camera size={20} />
                  <span className="text-[8px] font-black uppercase">Change Photo</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </label>
              </div>
              <h2 className="text-2xl font-black text-brand-blue mb-2">{editingProfile.fullName}</h2>
              <p className="text-gray-400 font-bold text-sm mb-6 uppercase tracking-widest">{editingProfile.email}</p>
              
              <div className="w-full grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-xs font-black text-brand-blue uppercase">{editingProfile.documentProcessingStatus || 'Pending'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Visa</p>
                  <p className="text-xs font-black text-brand-gold uppercase">{editingProfile.visaStatus || 'Pending'}</p>
                </div>

                <div className="space-y-4">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Home Country (Origin)</label>
                  <div className="relative">
                    <Globe size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-gold" />
                    <input 
                      list="all-countries"
                      className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                      value={editingProfile.homeCountry || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, homeCountry: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Current Working Country</label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-teal" />
                    <input 
                      list="all-countries"
                      className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                      value={editingProfile.currentCountry || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, currentCountry: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick CV Download Section */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-brand-blue relative z-10">
              <FileText className="text-brand-teal" size={20} /> CV Theme Core
            </h3>
            <div className="space-y-4 relative z-10">
               <div>
                 <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-[0.2em]">Select Layout Style</label>
                 <select 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 outline-none focus:border-brand-teal text-sm font-bold appearance-none cursor-pointer"
                    value={selectedCvTheme}
                    onChange={(e) => setSelectedCvTheme(e.target.value as any)}
                  >
                    <option value="classic">Classic Professional</option>
                    <option value="modern">Modern Tech</option>
                    <option value="professional">Executive Blue</option>
                    <option value="elegant">Premium Elegant</option>
                  </select>
               </div>
               <button 
                onClick={downloadEuropassCV}
                className="w-full py-4 bg-brand-gold rounded-2xl text-brand-blue font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-brand-gold/20 flex items-center justify-center gap-3 hover:translate-y-[-2px] transition-all"
               >
                 <Download size={18} />
                 Execute Download
               </button>
            </div>
          </div>

          {/* Verification Status */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
             <h3 className="text-sm font-black text-brand-blue uppercase tracking-widest mb-6 flex items-center gap-2">
               <ShieldCheck className="text-green-500" size={20} /> Eligibility Core
             </h3>
             <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Profile Intel (Metadata)</label>
                  <input 
                    className="w-full bg-blue-50/50 border border-blue-100/50 rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-brand-gold text-xs font-black text-brand-blue"
                    value={editingProfile.profileIntel || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, profileIntel: e.target.value })}
                    placeholder="e.g. High Performance"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Work Permit Monitoring</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-brand-gold text-xs font-black"
                    value={editingProfile.workPermitStatus || 'Review Pending'}
                    onChange={(e) => setEditingProfile({ ...editingProfile, workPermitStatus: e.target.value as any })}
                  >
                    <option value="Review Pending">Review Pending</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
             </div>
          </div>
        </div>

        {/* Main Form Area */}
        <div className="lg:col-span-8 space-y-8">
          {/* Identity & Background */}
          <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-sm border border-gray-100">
             <div className="flex items-center gap-4 mb-10 border-b border-gray-50 pb-6">
                <div className="p-4 bg-brand-gold/10 rounded-2xl text-brand-gold">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-brand-blue">Identity Core</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Primary Contact & Bio Data</p>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Full Name (As per Passport)</label>
                  <input 
                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-white shadow-inner-soft outline-none focus:border-brand-gold transition-all text-sm font-bold placeholder:text-gray-300"
                    value={editingProfile.fullName || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, fullName: e.target.value })}
                    placeholder="Full Name"
                  />
                </div>
                
                <div className="space-y-4">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Home Country (Origin)</label>
                  <div className="relative">
                    <Globe size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-gold" />
                    <input 
                      list="all-countries"
                      className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                      value={editingProfile.homeCountry || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, homeCountry: e.target.value })}
                      placeholder="Origin"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Current Working Country</label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-teal" />
                    <input 
                      list="all-countries"
                      className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                      value={editingProfile.currentCountry || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, currentCountry: e.target.value })}
                      placeholder="Current location"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Phone / Mobile</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-gold/50" />
                    <input 
                      className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 bg-white shadow-inner-soft outline-none focus:border-brand-gold transition-all text-sm font-bold placeholder:text-gray-300"
                      value={editingProfile.phone || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, phone: e.target.value })}
                      placeholder="+977..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">WhatsApp Number</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500" />
                    <input 
                      className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 bg-white shadow-inner-soft outline-none focus:border-brand-gold transition-all text-sm font-bold placeholder:text-gray-300"
                      value={editingProfile.whatsapp || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, whatsapp: e.target.value })}
                      placeholder="WhatsApp with country code..."
                    />
                  </div>
                </div>
               <div className="space-y-4">
                 <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Passport Number</label>
                 <div className="relative">
                   <CreditCard size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-gold" />
                   <input 
                     className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                     value={editingProfile.passportNumber || ''}
                     onChange={(e) => setEditingProfile({ ...editingProfile, passportNumber: e.target.value })}
                   />
                 </div>
               </div>
               <div className="space-y-4">
                 <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Nationality</label>
                 <div className="relative">
                   <Globe size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-gold" />
                   <input 
                     list="all-countries"
                     className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                     value={editingProfile.nationality || ''}
                     onChange={(e) => setEditingProfile({ ...editingProfile, nationality: e.target.value })}
                   />
                   <datalist id="all-countries">
                     {ALL_COUNTRIES.map(c => <option key={c} value={c} />)}
                   </datalist>
                 </div>
               </div>
               <div className="space-y-4">
                 <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Date of Birth</label>
                 <div className="relative">
                   <Calendar size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-gold" />
                   <input 
                     type="text"
                     placeholder="YYYY-MM-DD"
                     className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                     value={editingProfile.dateOfBirth || ''}
                     onChange={(e) => setEditingProfile({ ...editingProfile, dateOfBirth: e.target.value })}
                   />
                 </div>
               </div>
               <div className="space-y-4">
                 <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Gender</label>
                 <select 
                   className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold appearance-none"
                   value={editingProfile.gender || ''}
                   onChange={(e) => setEditingProfile({ ...editingProfile, gender: e.target.value })}
                 >
                   <option value="">Select Gender</option>
                   <option value="Male">Male</option>
                   <option value="Female">Female</option>
                   <option value="Other">Other</option>
                 </select>
               </div>
               <div className="md:col-span-2 space-y-4">
                 <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Full Residential Address</label>
                 <div className="relative">
                   <MapPin size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-gold" />
                   <input 
                     className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                     value={editingProfile.address || ''}
                     onChange={(e) => setEditingProfile({ ...editingProfile, address: e.target.value })}
                   />
                 </div>
               </div>
             </div>
          </div>

          {/* Professional Portfolio */}
          <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-sm border border-gray-100">
             <div className="flex items-center gap-4 mb-10 border-b border-gray-50 pb-6">
                <div className="p-4 bg-brand-blue/10 rounded-2xl text-brand-blue">
                  <Briefcase size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-brand-blue">Portfolio & Expertise</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Career History & Core Competencies</p>
                </div>
             </div>

             <div className="space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                   <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Professional Summary (About Me)</label>
                   <textarea 
                     rows={4}
                     className="w-full px-6 py-4 rounded-[2rem] border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm leading-relaxed"
                     value={editingProfile.aboutMe || ''}
                     onChange={(e) => setEditingProfile({ ...editingProfile, aboutMe: e.target.value })}
                     placeholder="A brief intro about the candidate professional life..."
                   />
                 </div>
                 <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Professional Job Title / Role</label>
                      <input 
                        className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                        value={editingProfile.experience || ''}
                        onChange={(e) => setEditingProfile({ ...editingProfile, experience: e.target.value })}
                        placeholder="e.g. Senior Logistics Coordinator"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Highest Education</label>
                      <select 
                        className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                        value={editingProfile.education || ''}
                        onChange={(e) => setEditingProfile({ ...editingProfile, education: e.target.value })}
                      >
                        <option value="">Select Level</option>
                        {EDUCATION_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                      </select>
                    </div>
                 </div>
               </div>

               {/* Work History */}
               <div>
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Professional Experience Timeline</h4>
                    <button 
                      onClick={() => setEditingProfile({ ...editingProfile, workHistory: [...(editingProfile.workHistory || []), { company: '', position: '', startDate: '', endDate: '', description: '' }] })}
                      className="text-brand-gold font-black text-[10px] uppercase flex items-center gap-2 hover:underline"
                    >
                      <Plus size={16} /> Add Experience
                    </button>
                  </div>
                  <div className="space-y-6">
                    {editingProfile.workHistory?.map((work, i) => (
                      <div key={i} className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 relative group">
                        <button 
                          onClick={() => setEditingProfile({ ...editingProfile, workHistory: editingProfile.workHistory?.filter((_, idx) => idx !== i) })}
                          className="absolute -top-3 -right-3 w-10 h-10 bg-white text-red-500 rounded-2xl shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-red-50 hover:bg-red-50"
                        >
                          <Trash size={18} />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Company Name</label>
                            <input 
                              className="w-full bg-white px-5 py-3 rounded-xl border border-slate-100 outline-none focus:border-brand-gold text-sm font-bold"
                              value={work.company}
                              onChange={(e) => {
                                const newHistory = [...(editingProfile.workHistory || [])];
                                newHistory[i] = { ...work, company: e.target.value };
                                setEditingProfile({ ...editingProfile, workHistory: newHistory });
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Job Title / Role</label>
                            <input 
                              className="w-full bg-white px-5 py-3 rounded-xl border border-slate-100 outline-none focus:border-brand-gold text-sm font-bold"
                              value={work.position}
                              onChange={(e) => {
                                const newHistory = [...(editingProfile.workHistory || [])];
                                newHistory[i] = { ...work, position: e.target.value };
                                setEditingProfile({ ...editingProfile, workHistory: newHistory });
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Start Date</label>
                            <input 
                              className="w-full bg-white px-5 py-3 rounded-xl border border-slate-100 outline-none focus:border-brand-gold text-sm font-bold"
                              value={work.startDate}
                              onChange={(e) => {
                                const newHistory = [...(editingProfile.workHistory || [])];
                                newHistory[i] = { ...work, startDate: e.target.value };
                                setEditingProfile({ ...editingProfile, workHistory: newHistory });
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">End Date (or 'Present')</label>
                            <input 
                              className="w-full bg-white px-5 py-3 rounded-xl border border-slate-100 outline-none focus:border-brand-gold text-sm font-bold"
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
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Brief Role Description</label>
                          <textarea 
                            rows={3}
                            className="w-full bg-white px-5 py-3 rounded-xl border border-slate-100 outline-none focus:border-brand-gold text-sm"
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
             </div>
          </div>

          {/* Payment & Financial Intelligence */}
          <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-sm border border-gray-100">
             <div className="flex items-center gap-4 mb-10 border-b border-gray-50 pb-6">
                <div className="p-4 bg-green-100 rounded-2xl text-green-600">
                  <CreditCard size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-brand-blue">Financial Intelligence</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Milestones & Package Details</p>
                </div>
             </div>

             <div className="space-y-8">
                <div className="bg-green-50/50 p-10 rounded-[3rem] border border-green-100 shadow-inner-soft">
                  <label className="block text-[11px] font-black text-brand-blue uppercase mb-6 tracking-[0.2em] text-center">Total Package Architecture</label>
                  <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                     <div className="bg-white px-8 py-4 rounded-3xl shadow-sm border border-green-100 flex items-center gap-4">
                        <select 
                          className="text-4xl font-black text-brand-blue outline-none bg-transparent cursor-pointer"
                          value={editingProfile.paymentCurrency || 'EUR'}
                          onChange={(e) => setEditingProfile({ ...editingProfile, paymentCurrency: e.target.value as any })}
                        >
                          <option value="EUR">€</option>
                          <option value="NPR">Rs</option>
                          <option value="INR">₹</option>
                          <option value="AED">د.إ</option>
                          <option value="USD">$</option>
                        </select>
                        <input 
                          className="text-5xl font-black text-brand-blue outline-none w-48 bg-transparent"
                          value={editingProfile.totalAmount || ''}
                          onChange={(e) => setEditingProfile({ ...editingProfile, totalAmount: e.target.value })}
                          placeholder="0000"
                        />
                     </div>

                     <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">Current Collection Status</label>
                        <select 
                          className="px-6 py-3 rounded-2xl bg-white border border-green-100 outline-none text-xs font-black text-brand-blue uppercase tracking-widest"
                          value={editingProfile.paymentStatus || 'pending'}
                          onChange={(e) => setEditingProfile({ ...editingProfile, paymentStatus: e.target.value as any })}
                        >
                          <option value="pending">⚠️ Pending Initial</option>
                          <option value="partially-paid">⏳ Partially Collected</option>
                          <option value="fully-paid">✅ Fully Paid</option>
                        </select>
                     </div>
                  </div>
                </div>

                {/* Growth Milestones */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Milestone 1: Initial</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-brand-gold">{CURRENCY_SYMBOLS[editingProfile.paymentCurrency || 'EUR']}</span>
                        <input 
                          className="w-full text-xl font-black text-brand-blue outline-none"
                          value={editingProfile.initialPay || ''}
                          onChange={(e) => setEditingProfile({ ...editingProfile, initialPay: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                   </div>
                   <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Milestone 2: After WP</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-brand-gold">{CURRENCY_SYMBOLS[editingProfile.paymentCurrency || 'EUR']}</span>
                        <input 
                          className="w-full text-xl font-black text-brand-blue outline-none"
                          value={editingProfile.payAfterWP || ''}
                          onChange={(e) => setEditingProfile({ ...editingProfile, payAfterWP: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                   </div>
                   <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Milestone 3: After Visa</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-brand-gold">{CURRENCY_SYMBOLS[editingProfile.paymentCurrency || 'EUR']}</span>
                        <input 
                          className="w-full text-xl font-black text-brand-blue outline-none"
                          value={editingProfile.payAfterVisa || ''}
                          onChange={(e) => setEditingProfile({ ...editingProfile, payAfterVisa: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                   </div>
                </div>

                <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
                   <div className="flex justify-between items-center mb-6">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Actual Collections History</h4>
                      <button 
                        onClick={() => setEditingProfile({ ...editingProfile, paymentHistory: [...(editingProfile.paymentHistory || []), { date: new Date().toISOString().split('T')[0], amount: '', method: 'Cash', note: '' }] })}
                        className="text-brand-blue font-black text-[10px] uppercase flex items-center gap-2"
                      >
                        <Plus size={16} /> Log Collection
                      </button>
                   </div>
                   <div className="space-y-4">
                      {editingProfile.paymentHistory?.map((p, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 relative group">
                           <button 
                              onClick={() => {
                                const newH = [...(editingProfile.paymentHistory || [])];
                                newH.splice(i, 1);
                                setEditingProfile({ ...editingProfile, paymentHistory: newH });
                              }}
                              className="absolute -top-2 -right-2 w-7 h-7 bg-red-50 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                           >
                             <X size={12} />
                           </button>
                           <div>
                              <label className="block text-[8px] font-black text-gray-400 mb-1 uppercase">Date</label>
                              <input type="date" className="w-full text-xs font-bold outline-none" value={p.date} onChange={e => {
                                const newH = [...(editingProfile.paymentHistory || [])];
                                newH[i] = { ...p, date: e.target.value };
                                setEditingProfile({ ...editingProfile, paymentHistory: newH });
                              }} />
                           </div>
                           <div>
                              <label className="block text-[8px] font-black text-gray-400 mb-1 uppercase">Amount ({editingProfile.paymentCurrency})</label>
                              <input className="w-full text-xs font-bold outline-none text-brand-blue" value={p.amount} onChange={e => {
                                const newH = [...(editingProfile.paymentHistory || [])];
                                newH[i] = { ...p, amount: e.target.value };
                                setEditingProfile({ ...editingProfile, paymentHistory: newH });
                              }} />
                           </div>
                           <div>
                              <label className="block text-[8px] font-black text-gray-400 mb-1 uppercase">Method</label>
                              <select className="w-full text-xs font-bold outline-none" value={p.method} onChange={e => {
                                const newH = [...(editingProfile.paymentHistory || [])];
                                newH[i] = { ...p, method: e.target.value };
                                setEditingProfile({ ...editingProfile, paymentHistory: newH });
                              }}>
                                <option>Cash</option>
                                <option>Bank Transfer</option>
                                <option>E-Sewa</option>
                                <option>Khalti</option>
                                <option>Other</option>
                              </select>
                           </div>
                           <div>
                              <label className="block text-[8px] font-black text-gray-400 mb-1 uppercase">Notes</label>
                              <input className="w-full text-xs font-bold outline-none italic" value={p.note} onChange={e => {
                                const newH = [...(editingProfile.paymentHistory || [])];
                                newH[i] = { ...p, note: e.target.value };
                                setEditingProfile({ ...editingProfile, paymentHistory: newH });
                              }} placeholder="Optional memo..." />
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>

          {/* Mission Deployment Core */}
          <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-sm border border-gray-100 relative overflow-hidden mb-8">
             <div className="flex items-center justify-between mb-10 border-b border-gray-50 pb-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-brand-gold/10 rounded-2xl text-brand-gold">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-brand-blue">Documents & Supporting Files</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Passport, Certificates, and CV Dossier</p>
                  </div>
                </div>
                <label className="bg-brand-blue text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 cursor-pointer hover:bg-brand-teal transition-all shadow-lg shadow-brand-blue/20">
                  <Upload size={14} /> Upload File
                  <input type="file" className="hidden" onChange={handleDocumentUpload} />
                </label>
             </div>

             {editingProfile.documents && editingProfile.documents.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {editingProfile.documents.map((doc, i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-gold shadow-sm">
                         <FileText size={18} />
                       </div>
                       <div>
                         <p className="text-[10px] font-black text-brand-blue truncate max-w-[150px]">{doc.name}</p>
                         <p className="text-[8px] font-black text-gray-400 uppercase">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-2">
                       <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white text-brand-blue rounded-lg opacity-0 group-hover:opacity-100 hover:text-brand-teal transition-all shadow-sm">
                         <Download size={14} />
                       </a>
                       <button 
                         onClick={() => setEditingProfile(prev => ({ ...prev, documents: prev.documents?.filter((_, idx) => idx !== i) }))}
                         className="p-2 bg-white text-red-500 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all shadow-sm"
                       >
                         <Trash size={14} />
                       </button>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-center py-12 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                 <FileText className="mx-auto text-slate-200 mb-2" size={48} />
                 <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No documents attached to this mission.</p>
               </div>
             )}
          </div>

          {/* Visa & Deployment Master */}
          <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-sm border border-gray-100 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-blue/5 to-transparent pointer-events-none"></div>
             <div className="flex items-center gap-4 mb-10 border-b border-gray-50 pb-6">
                <div className="p-4 bg-brand-teal/10 rounded-2xl text-brand-teal">
                  <Zap size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-brand-blue">Mission Deployment Core</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visa Authorization & Arrival Intelligence</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                   <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Global Visa Authorization</label>
                      <select 
                        className="w-full bg-transparent outline-none font-bold text-sm text-brand-blue"
                        value={editingProfile.visaStatus || 'pending'}
                        onChange={(e) => setEditingProfile({ ...editingProfile, visaStatus: e.target.value as any })}
                      >
                         <option value="pending">PENDING APPROVAL</option>
                         <option value="approved">MISSION APPROVED (VISA OK)</option>
                         <option value="rejected">MISSION REJECTED</option>
                      </select>
                   </div>
                   <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Deployment (Joining) Date</label>
                      <input 
                        type="text"
                        className="w-full bg-transparent outline-none font-bold text-sm text-brand-blue"
                        value={editingProfile.joiningDate || ''}
                        onChange={(e) => setEditingProfile({ ...editingProfile, joiningDate: e.target.value })}
                        placeholder="e.g. 25th May 2026"
                      />
                   </div>
                </div>

                <div className="bg-brand-teal/5 p-8 rounded-[3rem] border border-brand-teal/10">
                   <h4 className="text-[10px] font-black text-brand-teal uppercase tracking-widest mb-6">Strategic Arrival Intel</h4>
                   <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-brand-teal/10 pb-3">
                         <span className="text-xs font-bold text-slate-400">Target Arrival</span>
                         <input className="bg-transparent text-right text-xs font-black outline-none w-24 text-brand-blue" value={editingProfile.expectedArrivalDate || ''} onChange={e => setEditingProfile({ ...editingProfile, expectedArrivalDate: e.target.value })} placeholder="Date..." />
                      </div>
                      <div className="flex items-center justify-between border-b border-brand-teal/10 pb-3">
                         <span className="text-xs font-bold text-slate-400">Destination Position</span>
                         <input className="bg-transparent text-right text-xs font-black outline-none w-32 text-brand-blue" value={editingProfile.interviewPosition || ''} onChange={e => setEditingProfile({ ...editingProfile, interviewPosition: e.target.value })} placeholder="Position..." />
                      </div>
                      <div className="flex items-center justify-between font-bold">
                         <span className="text-xs font-bold text-slate-400">Operation Country</span>
                         <input className="bg-transparent text-right text-xs font-black outline-none w-24 text-brand-blue" value={editingProfile.interviewCountry || ''} onChange={e => setEditingProfile({ ...editingProfile, interviewCountry: e.target.value })} placeholder="Country..." />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* CV Preview & Render hidden used for PDF generation */}
      {cvCandidate && (
        <div className="fixed -left-[10000px] top-0">
          <EuropassCV 
            id="europass-cv-full-template" 
            candidate={cvCandidate} 
            theme={selectedCvTheme} 
          />
        </div>
      )}
    </div>
  );
}
