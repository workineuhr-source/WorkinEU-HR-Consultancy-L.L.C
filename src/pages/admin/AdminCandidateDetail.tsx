import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase";
import { CandidateProfile, Application } from "../../types";
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
  Upload,
  Heart,
  Baby,
  Users,
  Plane,
  FolderOpen,
  LayoutTemplate,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import { COUNTRIES, JOB_POSITIONS, CURRENCY_SYMBOLS } from "../../constants";
import { cn } from "../../lib/utils";
import EuropassCV from "../../components/EuropassCV";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";

export default function AdminCandidateDetail() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState<
    Partial<CandidateProfile>
  >({});
  const [activeTab, setActiveTab] = useState("profile");

  const TABS = [
    { id: "profile", label: "Profile Summary", icon: User },
    { id: "identity-core", label: "Identity Core", icon: User },
    { id: "identity-family", label: "Identity & Family Intel", icon: Heart },
    { id: "portfolio", label: "Portfolio & Expertise", icon: Briefcase },
    { id: "target-placement", label: "Target Placement", icon: Globe },
    { id: "deployment", label: "Mission Deployment Core", icon: Plane },
    { id: "financial", label: "Financial Intelligence", icon: CreditCard },
    { id: "cv-theme", label: "CV Theme Core", icon: LayoutTemplate },
    {
      id: "documents",
      label: "Documents & Supporting Files",
      icon: FolderOpen,
    },
    { id: "applications", label: "Mission Applications", icon: Briefcase },
    { id: "eligibility", label: "Eligibility Core", icon: ShieldCheck },
  ];
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [selectedCvTheme, setSelectedCvTheme] = useState<
    "classic" | "modern" | "professional" | "elegant"
  >("classic");
  const [cvCandidate, setCvCandidate] = useState<CandidateProfile | null>(null);

  const EDUCATION_LEVELS = [
    "High School",
    "Diploma",
    "Bachelor's Degree",
    "Master's Degree",
    "PhD",
    "Vocational Training",
    "Other",
  ];

  const PROFICIENCY_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];

  const COMMON_LANGUAGES = [
    "English",
    "Nepali",
    "Hindi",
    "Arabic",
    "Polish",
    "Romanian",
    "Croatian",
    "German",
    "French",
    "Spanish",
    "Italian",
    "Portuguese",
    "Russian",
    "Chinese",
    "Japanese",
    "Korean",
    "Urdu",
    "Bengali",
    "Turkish",
  ];

  const ALL_COUNTRIES = Array.from(
    new Set([
      ...COUNTRIES,
      "Nepal",
      "India",
      "Bangladesh",
      "Pakistan",
      "Sri Lanka",
      "Philippines",
      "Vietnam",
    ]),
  );

  useEffect(() => {
    if (uid) {
      fetchCandidate();
      fetchApplications();
    }
  }, [uid]);

  const fetchApplications = async () => {
    try {
      const q = query(
        collection(db, "applications"),
        where("candidateUid", "==", uid),
      );
      const querySnapshot = await getDocs(q);
      const apps = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Application,
      );
      setApplications(apps);
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  };

  const fetchCandidate = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, "candidates", uid!);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = { uid: docSnap.id, ...docSnap.data() } as CandidateProfile;
        setCandidate(data);
        setEditingProfile({ ...data });
      } else {
        toast.error("Candidate not found");
        navigate("/admin/candidates");
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
      setEditingProfile((prev) => ({ ...prev, photoUrl: base64 }));
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
        uploadedAt: Date.now(),
      };

      setEditingProfile((prev) => ({
        ...prev,
        documents: [...(prev.documents || []), newDoc],
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
      await updateDoc(doc(db, "candidates", uid), {
        ...editingProfile,
        updatedAt: Date.now(),
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
      
      IMPORTANT RULES:
      - Ensure all dates are strictly in YYYY-MM-DD format.
      - Do NOT use any Markdown headings (no '#' symbols).
      - Use bold text (**like this**) for important key points.
      - Make the tone natural and human-written.
      - Do not include any Markdown formatting like \`\`\`json, only the raw JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const responseText = response.text.trim();
      const cleanedJson = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const aiResult = JSON.parse(cleanedJson);

      setEditingProfile((prev) => ({
        ...prev,
        experience: aiResult.jobTitle || prev.experience,
        aboutMe: aiResult.aboutMe || prev.aboutMe,
        profileIntel: aiResult.profileIntel || prev.profileIntel,
        homeCountry: aiResult.homeCountry || prev.homeCountry,
        currentCountry: aiResult.currentCountry || prev.currentCountry,
        whatsapp: aiResult.whatsapp || prev.whatsapp,
        skills: [
          ...(prev.skills || []),
          ...(aiResult.suggestedSkills || []).map((s: string) => ({
            name: s,
            level: "Intermediate",
          })),
        ].filter((v, i, a) => a.findIndex((t) => t.name === v.name) === i),
        languages: [
          ...(prev.languages || []),
          ...(aiResult.suggestedLanguages || []).map((l: string) => ({
            language: l,
            level: "Intermediate",
          })),
        ].filter(
          (v, i, a) => a.findIndex((t) => t.language === v.language) === i,
        ),
        workHistory:
          aiResult.suggestedWorkHistory &&
          aiResult.suggestedWorkHistory.length > 0
            ? aiResult.suggestedWorkHistory
            : prev.workHistory,
      }));

      toast.success("AI Auto-Fill successful! Please review and save.", {
        id: toastId,
      });
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
        const element = document.getElementById("europass-cv-full-template");
        if (!element) throw new Error("Template not found");

        // --- PAGINATION AUTO-ADJUST LOGIC ---
        const elemWidth = element.offsetWidth;
        const mmToPx = elemWidth / 210; // A4 width is 210mm

        const topMarginMm = 10;
        const bottomMarginMm = 15;

        const firstPageContentPx = (297 - bottomMarginMm) * mmToPx;
        const otherPageContentPx =
          (297 - topMarginMm - bottomMarginMm) * mmToPx;

        const getPageForOffset = (y: number) => {
          if (y < firstPageContentPx) return 0;
          return 1 + Math.floor((y - firstPageContentPx) / otherPageContentPx);
        };

        const getPageStartPx = (page: number) => {
          if (page === 0) return 0;
          return firstPageContentPx + (page - 1) * otherPageContentPx;
        };

        const avoidBreakElements = element.querySelectorAll(
          ".page-break-inside-avoid",
        );

        // Reset any previous modifications
        avoidBreakElements.forEach((el) => {
          (el as HTMLElement).style.marginTop = "0px";
        });

        // Iteratively shift elements that straddle a page boundary
        avoidBreakElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          const rect = htmlEl.getBoundingClientRect();
          const docRect = element.getBoundingClientRect();

          const topInDoc = rect.top - docRect.top;
          const bottomInDoc = topInDoc + rect.height;

          const startPage = getPageForOffset(topInDoc + 5);
          const endPage = getPageForOffset(bottomInDoc - 5);

          if (endPage > startPage && startPage >= 0) {
            const targetTop = getPageStartPx(startPage + 1);
            const shiftAmount = targetTop - topInDoc;
            const currentMargin =
              parseFloat(window.getComputedStyle(htmlEl).marginTop) || 0;

            htmlEl.style.marginTop = `${currentMargin + shiftAmount + 20 * mmToPx}px`;
          }
        });

        await new Promise((resolve) => setTimeout(resolve, 50));
        // ------------------------------------

        const imgData = await toPng(element, {
          quality: 1.0,
          pixelRatio: 3, // For HD quality
          backgroundColor: "#ffffff",
          style: {
            transform: "scale(1)",
            transformOrigin: "top left",
          },
        });

        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const finalHeight = element.offsetHeight;
        const ratio = pdfWidth / elemWidth;
        const imgHeightInPdf = finalHeight * ratio;

        pdf.addImage(
          imgData,
          "PNG",
          0,
          0,
          pdfWidth,
          imgHeightInPdf,
          undefined,
          "FAST",
        );

        const drawFooter = () => {
          pdf.setFillColor(255, 255, 255);
          pdf.rect(
            0,
            pageHeight - bottomMarginMm,
            pdfWidth,
            bottomMarginMm,
            "F",
          );
          pdf.setFontSize(8);
          pdf.setTextColor(150, 150, 150);
          const footerText = `GENERATED VIA WORKINEU HR EUROPASS PROTOCOL ${selectedCvTheme.toUpperCase()} DESIGN`;
          pdf.text(footerText, pdfWidth / 2, pageHeight - 6, {
            align: "center",
          });
        };

        drawFooter();

        let heightRenderedInMm = pageHeight - bottomMarginMm;
        let heightLeftMm = imgHeightInPdf - heightRenderedInMm;

        while (heightLeftMm > 5) {
          pdf.addPage();

          const yPos = topMarginMm - heightRenderedInMm;
          pdf.addImage(
            imgData,
            "PNG",
            0,
            yPos,
            pdfWidth,
            imgHeightInPdf,
            undefined,
            "FAST",
          );

          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, 0, pdfWidth, topMarginMm, "F");

          drawFooter();

          heightRenderedInMm += pageHeight - topMarginMm - bottomMarginMm;
          heightLeftMm = imgHeightInPdf - heightRenderedInMm;
        }

        pdf.save(
          `Europass_CV_${candidate.fullName.replace(/\s+/g, "_")}_${selectedCvTheme}.pdf`,
        );

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

  const calcTotalAmount = parseFloat(editingProfile.totalAmount || "0") || 0;
  const calcRiskAmount = editingProfile.riskAmount || 0;
  const calcRawPaidAmount = (editingProfile.paymentHistory || []).reduce(
    (acc, curr) => acc + (parseFloat(curr.amount) || 0),
    0,
  );
  const calcActualPaidAmount = calcRawPaidAmount - calcRiskAmount;
  const calcRemainingAmount = Math.max(
    0,
    calcTotalAmount - calcActualPaidAmount,
  );

  return (
    <div className="max-w-6xl mx-auto pb-24">
      {/* Global Datalists for Autocomplete */}
      <datalist id="all-countries">
        {ALL_COUNTRIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <datalist id="job-position-options">
        {JOB_POSITIONS.map((jp) => (
          <option key={jp} value={jp} />
        ))}
      </datalist>

      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/admin/candidates")}
            className="p-3 bg-white dark:bg-[#121212] shadow-sm border border-gray-100 rounded-2xl text-gray-400 hover:text-brand-blue transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-brand-blue tracking-tight mb-1">
              Manage Candidate
            </h1>
            <div className="flex items-center gap-2">
              <div className="flex h-1.5 w-32 bg-gray-100 rounded-full overflow-hidden">
                <div className="bg-brand-gold h-full rounded-full w-[85%] animate-pulse"></div>
              </div>
              <p className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em]">
                Operation Readiness: 85%
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto relative z-10">
          <button
            onClick={autoFillWithAi}
            disabled={isGeneratingAi}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white dark:bg-[#121212] border border-brand-gold/20 text-brand-gold rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-brand-gold hover:text-white transition-all disabled:opacity-50 shadow-lg shadow-brand-gold/5 group"
          >
            {isGeneratingAi ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Zap
                size={18}
                className="group-hover:scale-125 transition-transform"
              />
            )}
            AI Smart Fill
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-[#0a192f] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-brand-blue transition-all shadow-2xl shadow-brand-blue/30 group"
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save
                size={18}
                className="group-hover:scale-125 transition-transform"
              />
            )}
            Commit Changes
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Navigation Sidebar */}
        <div className="w-full lg:w-[280px] shrink-0 space-y-2 sticky top-28 bg-white dark:bg-[#121212] p-4 rounded-3xl border border-gray-100 shadow-sm z-40">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-4">
            Core Modules
          </h3>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold text-left",
                activeTab === tab.id
                  ? "bg-brand-blue text-white shadow-md"
                  : "text-slate-500 hover:bg-slate-50 hover:text-brand-blue",
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Main Content Area */}
        <div className="flex-1 w-full space-y-8">
          {/* Main User Card */}
          <div
            className={cn(
              "bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden relative",
              activeTab !== "profile" && "hidden",
            )}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="relative group w-24 h-24 mb-6">
                <div className="w-24 h-24 bg-brand-blue text-white rounded-3xl flex items-center justify-center text-4xl font-black shadow-2xl overflow-hidden">
                  {editingProfile.photoUrl ? (
                    <img
                      referrerPolicy="no-referrer"
                      src={editingProfile.photoUrl}
                      alt="Candidate"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (editingProfile.fullName || "C").charAt(0)
                  )}
                </div>
                <label className="absolute inset-0 bg-black/60 text-white rounded-3xl flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                  <Camera size={20} />
                  <span className="text-[8px] font-black uppercase">
                    Change Photo
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                </label>
              </div>
              <h2 className="text-2xl font-black text-brand-blue mb-2">
                {editingProfile.fullName || "Candidate Name"}
              </h2>
              <p className="text-gray-400 font-bold text-sm mb-6 uppercase tracking-widest">
                {editingProfile.email}
              </p>

              <div className="w-full grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Status
                  </p>
                  <p className="text-xs font-black text-brand-blue uppercase">
                    {editingProfile.documentProcessingStatus || "Pending"}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Visa
                  </p>
                  <p className="text-xs font-black text-brand-gold uppercase">
                    {editingProfile.visaStatus || "Pending"}
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">
                    Home Country (Origin)
                  </label>
                  <div className="relative">
                    <Globe
                      size={18}
                      className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-gold"
                    />
                    <input
                      list="all-countries"
                      className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                      value={editingProfile.homeCountry || ""}
                      onChange={(e) =>
                        setEditingProfile({
                          ...editingProfile,
                          homeCountry: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">
                    Current Working Country
                  </label>
                  <div className="relative">
                    <MapPin
                      size={18}
                      className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-teal"
                    />
                    <input
                      list="all-countries"
                      className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                      value={editingProfile.currentCountry || ""}
                      onChange={(e) =>
                        setEditingProfile({
                          ...editingProfile,
                          currentCountry: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Identity & Background */}
          <div
            className={cn(
              "bg-white p-8 md:p-12 rounded-[3.5rem] shadow-sm border border-gray-100",
              activeTab !== "identity-core" && "hidden",
            )}
          >
            <div className="flex items-center gap-4 mb-10 border-b border-gray-50 pb-6">
              <div className="p-4 bg-brand-gold/10 rounded-2xl text-brand-gold">
                <User size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-brand-blue">
                  Identity Core
                </h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Primary Contact & Bio Data
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  Full Name (As per Passport)
                </label>
                <input
                  className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-white dark:bg-[#121212] shadow-inner-soft outline-none focus:border-brand-gold transition-all text-sm font-bold placeholder:text-gray-300"
                  value={editingProfile.fullName || ""}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      fullName: e.target.value,
                    })
                  }
                  placeholder="Full Name"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  Nationality
                </label>
                <div className="relative">
                  <Globe
                    size={18}
                    className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-gold"
                  />
                  <input
                    list="all-countries"
                    className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                    value={editingProfile.nationality || ""}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        nationality: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  Home Country (Origin)
                </label>
                <div className="relative">
                  <Globe
                    size={18}
                    className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-gold"
                  />
                  <input
                    list="all-countries"
                    className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                    value={editingProfile.homeCountry || ""}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        homeCountry: e.target.value,
                      })
                    }
                    placeholder="Origin"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  Current Working Country
                </label>
                <div className="relative">
                  <MapPin
                    size={18}
                    className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-teal"
                  />
                  <input
                    list="all-countries"
                    className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                    value={editingProfile.currentCountry || ""}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        currentCountry: e.target.value,
                      })
                    }
                    placeholder="Current location"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  Phone / Mobile
                </label>
                <div className="relative">
                  <Phone
                    size={18}
                    className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-gold/50"
                  />
                  <input
                    className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 bg-white dark:bg-[#121212] shadow-inner-soft outline-none focus:border-brand-gold transition-all text-sm font-bold placeholder:text-gray-300"
                    value={editingProfile.phone || ""}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        phone: e.target.value,
                      })
                    }
                    placeholder="+977..."
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  WhatsApp Number
                </label>
                <div className="relative">
                  <Phone
                    size={18}
                    className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500"
                  />
                  <input
                    className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 bg-white dark:bg-[#121212] shadow-inner-soft outline-none focus:border-brand-gold transition-all text-sm font-bold placeholder:text-gray-300"
                    value={editingProfile.whatsapp || ""}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        whatsapp: e.target.value,
                      })
                    }
                    placeholder="WhatsApp with country code..."
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar
                    size={18}
                    className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-gold"
                  />
                  <input
                    type="text"
                    placeholder="YYYY-MM-DD"
                    className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                    value={editingProfile.dateOfBirth || ""}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        dateOfBirth: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  Gender
                </label>
                <select
                  className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold appearance-none"
                  value={editingProfile.gender || ""}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      gender: e.target.value,
                    })
                  }
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="md:col-span-2 space-y-4">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  Full Residential Address
                </label>
                <div className="relative">
                  <MapPin
                    size={18}
                    className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-gold"
                  />
                  <input
                    className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                    value={editingProfile.address || ""}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        address: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Identity & Family Details Admin Section */}
          <div
            className={cn(
              "bg-white p-8 md:p-12 rounded-[3.5rem] shadow-sm border border-gray-100 mb-8",
              activeTab !== "identity-family" && "hidden",
            )}
          >
            <div className="flex items-center gap-4 mb-10 border-b border-gray-50 pb-6">
              <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-brand-blue">
                  Identity & Family Intel
                </h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Passport Verification & Family Dossier
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-4">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  Passport Number
                </label>
                <div className="relative">
                  <CreditCard
                    size={18}
                    className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-gold"
                  />
                  <input
                    className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                    value={editingProfile.passportNumber || ""}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        passportNumber: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  Passport Issue Date
                </label>
                <input
                  type="date"
                  className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                  value={editingProfile.passportIssueDate || ""}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      passportIssueDate: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-4">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  Passport Expiry Date
                </label>
                <input
                  type="date"
                  className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                  value={editingProfile.passportExpiryDate || ""}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      passportExpiryDate: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-4">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  Issuing Country
                </label>
                <input
                  list="all-countries"
                  className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                  value={
                    editingProfile.passportIssueCountry ||
                    editingProfile.currentCountry ||
                    ""
                  }
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      passportIssueCountry: e.target.value,
                    })
                  }
                  placeholder="e.g. Nepal"
                />
              </div>
              <div className="space-y-4">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  Father's Full Name
                </label>
                <input
                  type="text"
                  className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                  value={editingProfile.fatherName || ""}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      fatherName: e.target.value,
                    })
                  }
                  placeholder="Father's Name"
                />
              </div>
              <div className="space-y-4">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  Mother's Full Name
                </label>
                <input
                  type="text"
                  className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                  value={editingProfile.motherName || ""}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      motherName: e.target.value,
                    })
                  }
                  placeholder="Mother's Name"
                />
              </div>
              <div className="space-y-4">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  Wife's Full Name
                </label>
                <div className="relative">
                  <Heart
                    size={18}
                    className="absolute left-6 top-1/2 -translate-y-1/2 text-rose-500"
                  />
                  <input
                    type="text"
                    className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                    value={editingProfile.wifeName || ""}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        wifeName: e.target.value,
                      })
                    }
                    placeholder="Wife's Name"
                  />
                </div>
              </div>

              <div className="md:col-span-2 lg:col-span-3 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">
                    Children's Names
                  </label>
                  <button
                    onClick={() =>
                      setEditingProfile({
                        ...editingProfile,
                        childrenNames: [
                          ...(editingProfile.childrenNames || []),
                          "",
                        ],
                      })
                    }
                    className="text-brand-gold font-black text-[10px] uppercase flex items-center gap-2 hover:underline"
                  >
                    <Plus size={14} /> Add Child
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(editingProfile.childrenNames || []).map((child, idx) => (
                    <div key={idx} className="relative group/child">
                      <Baby
                        size={18}
                        className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-teal"
                      />
                      <input
                        type="text"
                        className="w-full pl-14 pr-12 py-4 rounded-2xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                        value={child}
                        onChange={(e) => {
                          const newChildren = [
                            ...(editingProfile.childrenNames || []),
                          ];
                          newChildren[idx] = e.target.value;
                          setEditingProfile({
                            ...editingProfile,
                            childrenNames: newChildren,
                          });
                        }}
                        placeholder={`Child #${idx + 1}`}
                      />
                      <button
                        onClick={() => {
                          const newChildren = (
                            editingProfile.childrenNames || []
                          ).filter((_, i) => i !== idx);
                          setEditingProfile({
                            ...editingProfile,
                            childrenNames: newChildren,
                          });
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Professional Portfolio */}
          <div
            className={cn(
              "bg-white p-8 md:p-12 rounded-[3.5rem] shadow-sm border border-gray-100",
              activeTab !== "portfolio" && "hidden",
            )}
          >
            <div className="flex items-center gap-4 mb-10 border-b border-gray-50 pb-6">
              <div className="p-4 bg-brand-blue/10 rounded-2xl text-brand-blue">
                <Briefcase size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-brand-blue">
                  Portfolio & Expertise
                </h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Career History & Core Competencies
                </p>
              </div>
            </div>

            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">
                    Professional Summary (About Me)
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-6 py-4 rounded-[2rem] border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm leading-relaxed"
                    value={editingProfile.aboutMe || ""}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        aboutMe: e.target.value,
                      })
                    }
                    placeholder="A brief intro about the candidate professional life..."
                  />
                </div>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">
                      Professional Job Title / Role
                    </label>
                    <input
                      className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                      list="job-position-options"
                      value={editingProfile.experience || ""}
                      onChange={(e) =>
                        setEditingProfile({
                          ...editingProfile,
                          experience: e.target.value,
                        })
                      }
                      placeholder="e.g. Senior Logistics Coordinator"
                    />
                    <datalist id="job-position-options">
                      {JOB_POSITIONS.map((pos) => (
                        <option key={pos} value={pos} />
                      ))}
                    </datalist>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">
                      Highest Education
                    </label>
                    <select
                      className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                      value={editingProfile.education || ""}
                      onChange={(e) =>
                        setEditingProfile({
                          ...editingProfile,
                          education: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Level</option>
                      {EDUCATION_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Work History */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    Professional Experience Timeline
                  </h4>
                  <button
                    onClick={() =>
                      setEditingProfile({
                        ...editingProfile,
                        workHistory: [
                          ...(editingProfile.workHistory || []),
                          {
                            company: "",
                            position: "",
                            startDate: "",
                            endDate: "",
                            description: "",
                          },
                        ],
                      })
                    }
                    className="text-brand-gold font-black text-[10px] uppercase flex items-center gap-2 hover:underline"
                  >
                    <Plus size={16} /> Add Experience
                  </button>
                </div>
                <div className="space-y-6">
                  {editingProfile.workHistory?.map((work, i) => (
                    <div
                      key={i}
                      className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 relative group"
                    >
                      <button
                        onClick={() =>
                          setEditingProfile({
                            ...editingProfile,
                            workHistory: editingProfile.workHistory?.filter(
                              (_, idx) => idx !== i,
                            ),
                          })
                        }
                        className="absolute -top-3 -right-3 w-10 h-10 bg-white dark:bg-[#121212] text-red-500 rounded-2xl shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-red-50 hover:bg-red-50"
                      >
                        <Trash size={18} />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">
                            Company Name
                          </label>
                          <input
                            className="w-full bg-white dark:bg-[#121212] px-5 py-3 rounded-xl border border-slate-100 outline-none focus:border-brand-gold text-sm font-bold"
                            value={work.company}
                            onChange={(e) => {
                              const newHistory = [
                                ...(editingProfile.workHistory || []),
                              ];
                              newHistory[i] = {
                                ...work,
                                company: e.target.value,
                              };
                              setEditingProfile({
                                ...editingProfile,
                                workHistory: newHistory,
                              });
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">
                            Job Title / Role
                          </label>
                          <input
                            list="job-position-options"
                            className="w-full bg-white dark:bg-[#121212] px-5 py-3 rounded-xl border border-slate-100 outline-none focus:border-brand-gold text-sm font-bold"
                            value={work.position}
                            onChange={(e) => {
                              const newHistory = [
                                ...(editingProfile.workHistory || []),
                              ];
                              newHistory[i] = {
                                ...work,
                                position: e.target.value,
                              };
                              setEditingProfile({
                                ...editingProfile,
                                workHistory: newHistory,
                              });
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">
                            Start Date
                          </label>
                          <input
                            className="w-full bg-white dark:bg-[#121212] px-5 py-3 rounded-xl border border-slate-100 outline-none focus:border-brand-gold text-sm font-bold"
                            value={work.startDate}
                            onChange={(e) => {
                              const newHistory = [
                                ...(editingProfile.workHistory || []),
                              ];
                              newHistory[i] = {
                                ...work,
                                startDate: e.target.value,
                              };
                              setEditingProfile({
                                ...editingProfile,
                                workHistory: newHistory,
                              });
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">
                            End Date (or 'Present')
                          </label>
                          <input
                            className="w-full bg-white dark:bg-[#121212] px-5 py-3 rounded-xl border border-slate-100 outline-none focus:border-brand-gold text-sm font-bold"
                            value={work.endDate}
                            onChange={(e) => {
                              const newHistory = [
                                ...(editingProfile.workHistory || []),
                              ];
                              newHistory[i] = {
                                ...work,
                                endDate: e.target.value,
                              };
                              setEditingProfile({
                                ...editingProfile,
                                workHistory: newHistory,
                              });
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">
                          Brief Role Description
                        </label>
                        <textarea
                          rows={3}
                          className="w-full bg-white dark:bg-[#121212] px-5 py-3 rounded-xl border border-slate-100 outline-none focus:border-brand-gold text-sm"
                          value={work.description}
                          onChange={(e) => {
                            const newHistory = [
                              ...(editingProfile.workHistory || []),
                            ];
                            newHistory[i] = {
                              ...work,
                              description: e.target.value,
                            };
                            setEditingProfile({
                              ...editingProfile,
                              workHistory: newHistory,
                            });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills Section */}
              <div className="pt-10 border-t border-gray-100 mb-10">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    Core Professional Skills
                  </h4>
                  <button
                    onClick={() =>
                      setEditingProfile({
                        ...editingProfile,
                        skills: [
                          ...(editingProfile.skills || []),
                          { name: "", level: "Intermediate" },
                        ],
                      })
                    }
                    className="text-brand-gold font-black text-[10px] uppercase flex items-center gap-2 hover:underline"
                  >
                    <Plus size={16} /> Add Skill
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {editingProfile.skills?.map((skill, i) => (
                    <div
                      key={i}
                      className="flex gap-2 items-center bg-slate-50 dark:bg-white/5 px-4 py-2 rounded-xl border border-slate-100 shadow-sm"
                    >
                      <input
                        className="w-32 bg-transparent outline-none text-xs font-bold text-brand-blue"
                        value={skill.name}
                        onChange={(e) => {
                          const newSkills = [...(editingProfile.skills || [])];
                          newSkills[i] = { ...skill, name: e.target.value };
                          setEditingProfile({
                            ...editingProfile,
                            skills: newSkills,
                          });
                        }}
                        placeholder="Skill..."
                      />
                      <button
                        onClick={() =>
                          setEditingProfile({
                            ...editingProfile,
                            skills: editingProfile.skills?.filter(
                              (_, idx) => idx !== i,
                            ),
                          })
                        }
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                  {(editingProfile.skills || []).length === 0 && (
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-widest italic py-4">
                      No specific skills indexed yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Languages Section */}
              <div className="pt-10 border-t border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    Linguistic Proficiencies
                  </h4>
                  <button
                    onClick={() =>
                      setEditingProfile({
                        ...editingProfile,
                        languages: [
                          ...(editingProfile.languages || []),
                          {
                            language: "",
                            level: "Intermediate",
                            proficiency: 50,
                          },
                        ],
                      })
                    }
                    className="text-brand-gold font-black text-[10px] uppercase flex items-center gap-2 hover:underline"
                  >
                    <Plus size={16} /> Add Language
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {editingProfile.languages?.map((lang, i) => (
                    <div
                      key={i}
                      className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6 group relative"
                    >
                      <button
                        onClick={() =>
                          setEditingProfile({
                            ...editingProfile,
                            languages: editingProfile.languages?.filter(
                              (_, idx) => idx !== i,
                            ),
                          })
                        }
                        className="absolute top-4 right-4 text-red-300 hover:text-red-500 transition-colors"
                      >
                        <Trash size={16} />
                      </button>
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-grow">
                          <label className="block text-[8px] font-black text-gray-400 uppercase mb-2">
                            Language
                          </label>
                          <input
                            list="common-languages"
                            className="w-full bg-white dark:bg-[#121212] px-5 py-3 rounded-xl border border-slate-100 outline-none focus:border-brand-gold text-sm font-bold"
                            value={lang.language}
                            onChange={(e) => {
                              const newLangs = [
                                ...(editingProfile.languages || []),
                              ];
                              newLangs[i] = {
                                ...lang,
                                language: e.target.value,
                              };
                              setEditingProfile({
                                ...editingProfile,
                                languages: newLangs,
                              });
                            }}
                            placeholder="e.g. English"
                          />
                          <datalist id="common-languages">
                            {COMMON_LANGUAGES.map((l) => (
                              <option key={l} value={l} />
                            ))}
                          </datalist>
                        </div>
                        <div className="w-full md:w-40">
                          <label className="block text-[8px] font-black text-gray-400 uppercase mb-2">
                            Level
                          </label>
                          <select
                            className="w-full bg-white dark:bg-[#121212] px-5 py-3 rounded-xl border border-slate-100 outline-none focus:border-brand-gold text-xs font-black uppercase tracking-widest"
                            value={lang.level}
                            onChange={(e) => {
                              const newLangs = [
                                ...(editingProfile.languages || []),
                              ];
                              newLangs[i] = { ...lang, level: e.target.value };
                              setEditingProfile({
                                ...editingProfile,
                                languages: newLangs,
                              });
                            }}
                          >
                            {PROFICIENCY_LEVELS.map((level) => (
                              <option key={level} value={level}>
                                {level}
                              </option>
                            ))}
                            <option value="Basic">Basic</option>
                            <option value="Conversational">
                              Conversational
                            </option>
                            <option value="Fluent">Fluent</option>
                            <option value="Native">Native</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100/50 space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <span>Proficiency Intelligence</span>
                          <span className="text-brand-gold bg-brand-gold/5 px-3 py-1 rounded-full border border-brand-gold/10 font-bold">
                            {lang.proficiency || 0}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-gold"
                          value={lang.proficiency || 0}
                          onChange={(e) => {
                            const newLangs = [
                              ...(editingProfile.languages || []),
                            ];
                            const val = parseInt(e.target.value);
                            newLangs[i] = { ...lang, proficiency: val };

                            // AI-assisted level classification
                            if (val >= 95) newLangs[i].level = "Native";
                            else if (val >= 80) newLangs[i].level = "Fluent";
                            else if (val >= 60) newLangs[i].level = "Advanced";
                            else if (val >= 40)
                              newLangs[i].level = "Conversational";
                            else if (val >= 20)
                              newLangs[i].level = "Intermediate";
                            else newLangs[i].level = "Basic";

                            setEditingProfile({
                              ...editingProfile,
                              languages: newLangs,
                            });
                          }}
                        />
                        <div className="flex gap-2 justify-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <div
                              key={star}
                              className={cn(
                                "w-3 h-3 rounded-full transition-all duration-300",
                                (lang.proficiency || 0) >= star * 20
                                  ? "bg-brand-gold shadow-[0_0_10px_rgba(212,175,55,0.4)] scale-110"
                                  : "bg-slate-200",
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(editingProfile.languages || []).length === 0 && (
                    <p className="col-span-full text-center py-12 bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-100 text-slate-300 font-bold uppercase tracking-widest text-[10px]">
                      Linguistic data stream currently offline.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Target Placement / Assignment */}
          <div
            className={cn(
              "bg-white p-8 rounded-[2.5rem] shadow-sm border border-brand-gold/30 relative overflow-hidden",
              activeTab !== "target-placement" && "hidden",
            )}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <h3 className="text-sm font-black text-brand-blue uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
              <Globe className="text-brand-gold" size={20} /> Target Placement
            </h3>
            <div className="space-y-5 relative z-10">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">
                  Target Country
                </label>
                <input
                  list="all-countries"
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-brand-gold text-sm font-bold text-brand-blue"
                  value={editingProfile.assignedCountry || ""}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      assignedCountry: e.target.value,
                    })
                  }
                  placeholder="e.g. Romania, Poland"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">
                  Enrolled Batch
                </label>
                <input
                  list="batch-options"
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-brand-gold text-sm font-bold text-brand-blue"
                  value={editingProfile.assignedBatch || ""}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      assignedBatch: e.target.value,
                    })
                  }
                  placeholder="e.g. Batch 1"
                />
                <datalist id="batch-options">
                  <option value="Batch 1" />
                  <option value="Batch 2" />
                  <option value="Batch 3" />
                </datalist>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">
                  Target Company
                </label>
                <input
                  list="company-options"
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-brand-gold text-sm font-bold text-brand-blue"
                  value={editingProfile.assignedCompany || ""}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      assignedCompany: e.target.value,
                    })
                  }
                  placeholder="e.g. ConstructorTech SRL"
                />
                <datalist id="company-options"></datalist>
              </div>
            </div>
          </div>

          {/* Visa & Deployment Master */}
          <div
            className={cn(
              "bg-white p-8 md:p-12 rounded-[3.5rem] shadow-sm border border-gray-100 relative overflow-hidden",
              activeTab !== "deployment" && "hidden",
            )}
          >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-blue/5 to-transparent pointer-events-none"></div>
            <div className="flex items-center gap-4 mb-10 border-b border-gray-50 pb-6">
              <div className="p-4 bg-brand-teal/10 rounded-2xl text-brand-teal">
                <Zap size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-brand-blue">
                  Mission Deployment Core
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Visa Authorization & Arrival Intelligence
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                    Global Visa Authorization
                  </label>
                  <select
                    className="w-full bg-transparent outline-none font-bold text-sm text-brand-blue"
                    value={editingProfile.visaStatus || "pending"}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        visaStatus: e.target.value as any,
                      })
                    }
                  >
                    <option value="pending">PENDING APPROVAL</option>
                    <option value="application_submitted">
                      APPLICATION SUBMITTED
                    </option>
                    <option value="embassy_appointment">
                      EMBASSY APPOINTMENT SCHEDULED
                    </option>
                    <option value="under_review">
                      UNDER REVIEW BY EMBASSY
                    </option>
                    <option value="approved">MISSION APPROVED (VISA OK)</option>
                    <option value="rejected">MISSION REJECTED</option>
                    <option value="appealed">APPEALED</option>
                    <option value="expired">EXPIRED</option>
                  </select>
                </div>
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                    Deployment (Joining) Date
                  </label>
                  <input
                    type="text"
                    className="w-full bg-transparent outline-none font-bold text-sm text-brand-blue"
                    value={editingProfile.joiningDate || ""}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        joiningDate: e.target.value,
                      })
                    }
                    placeholder="e.g. 25th May 2026"
                  />
                </div>
              </div>

              <div className="bg-brand-teal/5 p-8 rounded-[3rem] border border-brand-teal/10">
                <h4 className="text-[10px] font-black text-brand-teal uppercase tracking-widest mb-6">
                  Strategic Arrival Intel
                </h4>
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-brand-teal/10 pb-3">
                    <span className="text-xs font-bold text-slate-400">
                      Target Arrival
                    </span>
                    <input
                      className="bg-transparent text-right text-xs font-black outline-none w-24 text-brand-blue"
                      value={editingProfile.expectedArrivalDate || ""}
                      onChange={(e) =>
                        setEditingProfile({
                          ...editingProfile,
                          expectedArrivalDate: e.target.value,
                        })
                      }
                      placeholder="Date..."
                    />
                  </div>
                  <div className="flex items-center justify-between border-b border-brand-teal/10 pb-3">
                    <span className="text-xs font-bold text-slate-400">
                      Destination Position
                    </span>
                    <input
                      className="bg-transparent text-right text-xs font-black outline-none w-32 text-brand-blue"
                      value={editingProfile.interviewPosition || ""}
                      onChange={(e) =>
                        setEditingProfile({
                          ...editingProfile,
                          interviewPosition: e.target.value,
                        })
                      }
                      placeholder="Position..."
                    />
                  </div>
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-xs font-bold text-slate-400">
                      Operation Country
                    </span>
                    <input
                      className="bg-transparent text-right text-xs font-black outline-none w-24 text-brand-blue"
                      value={editingProfile.interviewCountry || ""}
                      onChange={(e) =>
                        setEditingProfile({
                          ...editingProfile,
                          interviewCountry: e.target.value,
                        })
                      }
                      placeholder="Country..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment & Financial Intelligence */}
          <div
            className={cn(
              "bg-white p-8 md:p-12 rounded-[3.5rem] shadow-sm border border-gray-100",
              activeTab !== "financial" && "hidden",
            )}
          >
            <div className="flex items-center gap-4 mb-10 border-b border-gray-50 pb-6">
              <div className="p-4 bg-green-100 rounded-2xl text-green-600">
                <CreditCard size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-brand-blue">
                  Financial Intelligence
                </h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Payment Milestones & Package Details
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-green-50/50 p-10 rounded-[3rem] border border-green-100 shadow-inner-soft">
                <label className="block text-[11px] font-black text-brand-blue uppercase mb-6 tracking-[0.2em] text-center">
                  Total Package Architecture
                </label>
                <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                  <div className="bg-white px-8 py-4 rounded-3xl shadow-sm border border-green-100 flex items-center gap-4 max-w-full overflow-x-auto no-scrollbar">
                    <select
                      className="text-4xl font-black text-brand-blue outline-none bg-transparent cursor-pointer"
                      value={editingProfile.paymentCurrency || "EUR"}
                      onChange={(e) =>
                        setEditingProfile({
                          ...editingProfile,
                          paymentCurrency: e.target.value as any,
                        })
                      }
                    >
                      <option value="EUR">€</option>
                      <option value="NPR">Rs</option>
                      <option value="INR">₹</option>
                      <option value="AED">د.إ</option>
                      <option value="USD">$</option>
                    </select>
                    <input
                      type="text"
                      className="text-3xl md:text-5xl font-black text-brand-blue outline-none w-[150px] md:w-full min-w-[150px] bg-transparent flex-1"
                      style={{
                        width: `${Math.max(4, (editingProfile.totalAmount || "").length)}ch`,
                      }}
                      value={editingProfile.totalAmount || ""}
                      onChange={(e) =>
                        setEditingProfile({
                          ...editingProfile,
                          totalAmount: e.target.value,
                        })
                      }
                      placeholder="0000"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">
                      Current Collection Status
                    </label>
                    <select
                      className="px-6 py-3 rounded-2xl bg-white dark:bg-[#121212] border border-green-100 outline-none text-xs font-black text-brand-blue uppercase tracking-widest"
                      value={editingProfile.paymentStatus || "pending"}
                      onChange={(e) =>
                        setEditingProfile({
                          ...editingProfile,
                          paymentStatus: e.target.value as any,
                        })
                      }
                    >
                      <option value="pending">⚠️ Pending Initial</option>
                      <option value="partially-paid">
                        ⏳ Partially Collected
                      </option>
                      <option value="fully-paid">✅ Fully Paid</option>
                    </select>
                  </div>
                </div>

                {/* Financial Counters */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-green-100/50 shadow-sm text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      Gross Received
                    </p>
                    <p className="text-xl font-black text-brand-blue">
                      {
                        CURRENCY_SYMBOLS[
                          editingProfile.paymentCurrency || "EUR"
                        ]
                      }{" "}
                      {calcRawPaidAmount}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 shadow-sm text-center">
                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">
                      Ris (Risk) Amount
                    </p>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-sm font-black text-orange-600">
                        {
                          CURRENCY_SYMBOLS[
                            editingProfile.paymentCurrency || "EUR"
                          ]
                        }
                      </span>
                      <input
                        type="number"
                        className="bg-transparent text-xl font-black text-orange-600 outline-none w-20 text-center"
                        value={editingProfile.riskAmount || ""}
                        onChange={(e) =>
                          setEditingProfile({
                            ...editingProfile,
                            riskAmount: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="bg-brand-blue/5 p-4 rounded-2xl border border-brand-blue/10 shadow-sm text-center">
                    <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest mb-1">
                      Net Paid (After Ris)
                    </p>
                    <p className="text-xl font-black text-brand-blue">
                      {
                        CURRENCY_SYMBOLS[
                          editingProfile.paymentCurrency || "EUR"
                        ]
                      }{" "}
                      {calcActualPaidAmount}
                    </p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-2xl border border-red-100 shadow-sm text-center">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">
                      Remaining Due
                    </p>
                    <p className="text-xl font-black text-red-600">
                      {
                        CURRENCY_SYMBOLS[
                          editingProfile.paymentCurrency || "EUR"
                        ]
                      }{" "}
                      {calcRemainingAmount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Growth Milestones */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Milestone 1: Initial
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-brand-gold">
                      {
                        CURRENCY_SYMBOLS[
                          editingProfile.paymentCurrency || "EUR"
                        ]
                      }
                    </span>
                    <input
                      className="w-full text-xl font-black text-brand-blue outline-none"
                      value={editingProfile.initialPay || ""}
                      onChange={(e) =>
                        setEditingProfile({
                          ...editingProfile,
                          initialPay: e.target.value,
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Milestone 2: After WP
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-brand-gold">
                      {
                        CURRENCY_SYMBOLS[
                          editingProfile.paymentCurrency || "EUR"
                        ]
                      }
                    </span>
                    <input
                      className="w-full text-xl font-black text-brand-blue outline-none"
                      value={editingProfile.payAfterWP || ""}
                      onChange={(e) =>
                        setEditingProfile({
                          ...editingProfile,
                          payAfterWP: e.target.value,
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Milestone 3: After Visa
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-brand-gold">
                      {
                        CURRENCY_SYMBOLS[
                          editingProfile.paymentCurrency || "EUR"
                        ]
                      }
                    </span>
                    <input
                      className="w-full text-xl font-black text-brand-blue outline-none"
                      value={editingProfile.payAfterVisa || ""}
                      onChange={(e) =>
                        setEditingProfile({
                          ...editingProfile,
                          payAfterVisa: e.target.value,
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    Actual Collections History
                  </h4>
                  <button
                    onClick={() =>
                      setEditingProfile({
                        ...editingProfile,
                        paymentHistory: [
                          ...(editingProfile.paymentHistory || []),
                          {
                            date: new Date().toISOString().split("T")[0],
                            amount: "",
                            method: "Cash",
                            note: "",
                          },
                        ],
                      })
                    }
                    className="text-brand-blue font-black text-[10px] uppercase flex items-center gap-2"
                  >
                    <Plus size={16} /> Log Collection
                  </button>
                </div>
                <div className="space-y-4">
                  {editingProfile.paymentHistory?.map((p, i) => (
                    <div
                      key={i}
                      className="bg-white p-6 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-5 gap-4 relative group"
                    >
                      <button
                        onClick={() => {
                          const newH = [
                            ...(editingProfile.paymentHistory || []),
                          ];
                          newH.splice(i, 1);
                          setEditingProfile({
                            ...editingProfile,
                            paymentHistory: newH,
                          });
                        }}
                        className="absolute -top-2 -right-2 w-7 h-7 bg-red-50 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                      >
                        <X size={12} />
                      </button>
                      <div>
                        <label className="block text-[8px] font-black text-gray-400 mb-1 uppercase">
                          Date
                        </label>
                        <input
                          type="date"
                          className="w-full text-xs font-bold outline-none"
                          value={p.date}
                          onChange={(e) => {
                            const newH = [
                              ...(editingProfile.paymentHistory || []),
                            ];
                            newH[i] = { ...p, date: e.target.value };
                            setEditingProfile({
                              ...editingProfile,
                              paymentHistory: newH,
                            });
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-gray-400 mb-1 uppercase">
                          Amount ({editingProfile.paymentCurrency})
                        </label>
                        <input
                          className="w-full text-xs font-bold outline-none text-brand-blue"
                          value={p.amount}
                          onChange={(e) => {
                            const newH = [
                              ...(editingProfile.paymentHistory || []),
                            ];
                            newH[i] = { ...p, amount: e.target.value };
                            setEditingProfile({
                              ...editingProfile,
                              paymentHistory: newH,
                            });
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-gray-400 mb-1 uppercase">
                          Method
                        </label>
                        <select
                          className="w-full text-xs font-bold outline-none"
                          value={p.method}
                          onChange={(e) => {
                            const newH = [
                              ...(editingProfile.paymentHistory || []),
                            ];
                            newH[i] = { ...p, method: e.target.value };
                            setEditingProfile({
                              ...editingProfile,
                              paymentHistory: newH,
                            });
                          }}
                        >
                          <option>Cash</option>
                          <option>Bank Transfer</option>
                          <option>Online Payment Gateway</option>
                          <option>E-Sewa</option>
                          <option>Khalti</option>
                          <option>IME Pay</option>
                          <option>Cheque</option>
                          <option>Credit Card</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-gray-400 mb-1 uppercase">
                          Transaction ID
                        </label>
                        <input
                          className="w-full text-xs font-bold outline-none uppercase"
                          value={p.transactionId || ""}
                          onChange={(e) => {
                            const newH = [
                              ...(editingProfile.paymentHistory || []),
                            ];
                            newH[i] = { ...p, transactionId: e.target.value };
                            setEditingProfile({
                              ...editingProfile,
                              paymentHistory: newH,
                            });
                          }}
                          placeholder="Ref..."
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-gray-400 mb-1 uppercase">
                          Notes
                        </label>
                        <input
                          list="payment-note-options"
                          className="w-full text-xs font-bold outline-none italic"
                          value={p.note}
                          onChange={(e) => {
                            const newH = [
                              ...(editingProfile.paymentHistory || []),
                            ];
                            newH[i] = { ...p, note: e.target.value };
                            setEditingProfile({
                              ...editingProfile,
                              paymentHistory: newH,
                            });
                          }}
                          placeholder="Optional memo..."
                        />
                        <datalist id="payment-note-options">
                          <option value="Initial" />
                          <option value="After WP" />
                          <option value="After Visa" />
                          <option value="Ris (Risk) Amount" />
                        </datalist>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick CV Download Section */}
          <div
            className={cn(
              "bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden relative",
              activeTab !== "cv-theme" && "hidden",
            )}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-brand-blue relative z-10">
              <FileText className="text-brand-teal" size={20} /> CV Theme Core
            </h3>
            <div className="space-y-4 relative z-10">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-[0.2em]">
                  Select Layout Style
                </label>
                <select
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-2xl px-4 py-3 outline-none focus:border-brand-teal text-sm font-bold appearance-none cursor-pointer"
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

          {/* Documents & Supporting Files */}
          <div
            className={cn(
              "bg-white p-8 md:p-12 rounded-[3.5rem] shadow-sm border border-gray-100 relative overflow-hidden mb-8",
              activeTab !== "documents" && "hidden",
            )}
          >
            <div className="flex items-center justify-between mb-10 border-b border-gray-50 pb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-brand-gold/10 rounded-2xl text-brand-gold">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-brand-blue">
                    Documents & Supporting Files
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Passport, Certificates, and CV Dossier
                  </p>
                </div>
              </div>
              <label className="bg-brand-blue text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 cursor-pointer hover:bg-brand-teal transition-all shadow-lg shadow-brand-blue/20">
                <Upload size={14} /> Upload File
                <input
                  type="file"
                  className="hidden"
                  onChange={handleDocumentUpload}
                />
              </label>
            </div>

            {editingProfile.documents && editingProfile.documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {editingProfile.documents.map((doc, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white dark:bg-[#121212] rounded-xl flex items-center justify-center text-brand-gold shadow-sm">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-brand-blue break-all max-w-[150px]">
                          {doc.name}
                        </p>
                        <p className="text-[8px] font-black text-gray-400 uppercase">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white dark:bg-[#121212] text-brand-blue rounded-lg opacity-0 group-hover:opacity-100 hover:text-brand-teal transition-all shadow-sm"
                      >
                        <Download size={14} />
                      </a>
                      <button
                        onClick={() =>
                          setEditingProfile((prev) => ({
                            ...prev,
                            documents: prev.documents?.filter(
                              (_, idx) => idx !== i,
                            ),
                          }))
                        }
                        className="p-2 bg-white dark:bg-[#121212] text-red-500 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all shadow-sm"
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
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  No documents attached to this mission.
                </p>
              </div>
            )}
          </div>

          {/* Candidate Applications */}
          <div
            className={cn(
              "bg-white p-8 md:p-12 rounded-[3.5rem] shadow-sm border border-gray-100 relative overflow-hidden mb-8",
              activeTab !== "applications" && "hidden",
            )}
          >
            <div className="flex items-center gap-4 mb-10 border-b border-gray-50 pb-6">
              <div className="p-4 bg-brand-blue/10 rounded-2xl text-brand-blue">
                <Briefcase size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-brand-blue">
                  Mission Applications
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Jobs Applied By Candidate
                </p>
              </div>
            </div>

            {applications.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                    <tr>
                      <th className="px-6 py-4 rounded-l-2xl">Target Role</th>
                      <th className="px-6 py-4">Status & Action</th>
                      <th className="px-6 py-4 rounded-r-2xl text-right">
                        Applied Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {applications.map((app) => (
                      <tr
                        key={app.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-brand-blue">
                            {app.jobTitle}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                              Orig:{" "}
                              {app.originalCountry ||
                                app.appliedCountry ||
                                "N/A"}
                            </span>
                            {app.targetCountry &&
                              app.targetCountry !==
                                (app.originalCountry || app.appliedCountry) && (
                                <>
                                  <span className="text-slate-300">|</span>
                                  <span className="text-[10px] font-bold text-brand-gold uppercase tracking-widest leading-none">
                                    Target: {app.targetCountry}
                                  </span>
                                </>
                              )}
                          </div>
                        </td>
                        <td className="px-6 py-4 flex items-center gap-2">
                          <span
                            className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border",
                              app.status === "approved"
                                ? "bg-green-50 text-green-600 border-green-100"
                                : app.status === "rejected"
                                  ? "bg-red-50 text-red-600 border-red-100"
                                  : "bg-brand-gold/10 text-brand-gold border-brand-gold/20",
                            )}
                          >
                            {app.status}
                          </span>
                          <Link
                            to="/admin/applications"
                            className="text-brand-blue hover:text-brand-gold transition-colors"
                            title="Manage Application"
                          >
                            <ArrowLeft className="rotate-180" size={16} />
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-right text-xs font-bold text-slate-500">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                <Briefcase className="mx-auto text-slate-200 mb-2" size={48} />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  No applications submitted yet.
                </p>
              </div>
            )}
          </div>

          {/* Verification Status */}
          <div
            className={cn(
              "bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100",
              activeTab !== "eligibility" && "hidden",
            )}
          >
            <h3 className="text-sm font-black text-brand-blue uppercase tracking-widest mb-6 flex items-center gap-2">
              <ShieldCheck className="text-green-500" size={20} /> Eligibility
              Core
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">
                  Profile Intel (Metadata)
                </label>
                <input
                  className="w-full bg-blue-50/50 border border-blue-100/50 rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-brand-gold text-xs font-black text-brand-blue"
                  value={editingProfile.profileIntel || ""}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      profileIntel: e.target.value,
                    })
                  }
                  placeholder="e.g. High Performance"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">
                  Work Permit Monitoring
                </label>
                <select
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-brand-gold text-xs font-black"
                  value={editingProfile.workPermitStatus || "Review Pending"}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      workPermitStatus: e.target.value as any,
                    })
                  }
                >
                  <option value="Review Pending">Review Pending</option>
                  <option value="Documents Submitted">
                    Documents Submitted
                  </option>
                  <option value="In Processing">In Processing</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Appealed">Appealed</option>
                  <option value="Expired">Expired</option>
                </select>
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
