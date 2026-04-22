import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { CandidateProfile, Application, Job } from '../types';
import { getJobRecommendations } from '../services/aiService';
import { CURRENCY_SYMBOLS } from '../constants';
import { 
  User, 
  FileText, 
  Briefcase, 
  Plus, 
  Trash2, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  LogOut,
  Settings,
  Mail,
  Phone,
  Globe,
  CreditCard,
  ShieldCheck,
  Plane,
  X,
  Video,
  Calendar,
  RotateCcw,
  History,
  TrendingDown,
  Loader2,
  Sparkles,
  Bell,
  Search,
  Home,
  Link,
  ArrowUp,
  Upload,
  Camera
} from 'lucide-react';
import JobCard from '../components/JobCard';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'applications' | 'profile' | 'payments' | 'refunds' | 'alerts'>('overview');

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const calculateCompleteness = () => {
    if (!profile) return 0;
    let score = 0;
    if (profile.photoUrl) score += 15;
    if (profile.fullName) score += 10;
    if (profile.email) score += 10;
    if (profile.phone) score += 10;
    if (profile.address || profile.nationality) score += 10;
    if (profile.experience) score += 10;
    if (profile.education) score += 10;
    if (profile.workHistory && profile.workHistory.length > 0) score += 10;
    if (profile.educationHistory && profile.educationHistory.length > 0) score += 10;
    if (profile.skills && profile.skills.length > 0) score += 5;
    return Math.min(score, 100);
  };
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [isRequestingRefund, setIsRequestingRefund] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [newDoc, setNewDoc] = useState({ name: '', url: '', type: 'CV' });
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [countries, setCountries] = useState<string[]>([]);
  const [deleteDocIndex, setDeleteDocIndex] = useState<number | null>(null);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isAddingAlert, setIsAddingAlert] = useState(false);
  const [newAlert, setNewAlert] = useState({ country: '', category: '', keywords: '' });
  const [categories, setCategories] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

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
  const LANGUAGE_LEVELS = ["Basic", "Conversational", "Fluent", "Native"];

  useEffect(() => {
    fetchData();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'siteContent');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.countries?.length) {
          setCountries(data.countries);
        }
        if (data.jobCategories?.length) {
          setCategories(data.jobCategories);
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const fetchData = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      // Fetch Profile
      const profileDoc = await getDoc(doc(db, 'candidates', auth.currentUser.uid));
      if (profileDoc.exists()) {
        setProfile({ uid: profileDoc.id, ...profileDoc.data() } as CandidateProfile);
      }

      // Fetch Applications
      const q = query(collection(db, 'applications'), where('candidateUid', '==', auth.currentUser.uid));
      const appsSnap = await getDocs(q);
      setApplications(appsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application)));

      // Fetch Recommendations
      fetchRecommendations(profileDoc.exists() ? { uid: profileDoc.id, ...profileDoc.data() } as CandidateProfile : null);
    } catch (error) {
      console.error("Error fetching candidate data:", error);
      toast.error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const viewAppDetails = async (app: Application) => {
    setSelectedApp(app);
    try {
      const jobDoc = await getDoc(doc(db, 'jobs', app.jobId));
      if (jobDoc.exists()) {
        setSelectedJob({ id: jobDoc.id, ...jobDoc.data() } as Job);
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
    }
  };

  const handleCandidateDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target.files && e.target.files.length > 0) ? e.target.files[0] : null;
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setNewDoc(prev => ({ 
        ...prev, 
        url: base64, 
        name: prev.name || file.name 
      }));
      toast.success("File attached. Please click the checkmark to save.");
    };
    reader.readAsDataURL(file);
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !auth.currentUser) return;

    try {
      const updatedDocs = [...(profile.documents || []), { ...newDoc, uploadedAt: Date.now() }];
      await updateDoc(doc(db, 'candidates', auth.currentUser.uid), {
        documents: updatedDocs,
        updatedAt: serverTimestamp()
      });
      setProfile({ ...profile, documents: updatedDocs });
      setIsAddingDoc(false);
      setNewDoc({ name: '', url: '', type: 'CV' });
      toast.success("Document added successfully!");
    } catch (error) {
      toast.error("Failed to add document.");
    }
  };

  const handleDeleteDocument = async (index: number) => {
    if (!profile || !auth.currentUser) return;

    try {
      const updatedDocs = profile.documents.filter((_, i) => i !== index);
      await updateDoc(doc(db, 'candidates', auth.currentUser.uid), {
        documents: updatedDocs,
        updatedAt: serverTimestamp()
      });
      setProfile({ ...profile, documents: updatedDocs });
      toast.success("Document deleted.");
      setDeleteDocIndex(null);
    } catch (error) {
      toast.error("Failed to delete document.");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !auth.currentUser) return;

    try {
      setIsUpdating(true);
      const { uid, documents, createdAt, updatedAt, refundRequest, searchHistory, jobAlerts, ...updateData } = profile;
      await updateDoc(doc(db, 'candidates', auth.currentUser.uid), {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !auth.currentUser) return;

    try {
      const alertId = `ALERT-${Date.now()}`;
      const alertData = {
        id: alertId,
        candidateUid: auth.currentUser.uid,
        email: profile.email,
        country: newAlert.country || undefined,
        category: newAlert.category || undefined,
        keywords: newAlert.keywords || undefined,
        active: true,
        createdAt: Date.now()
      };

      const updatedAlerts = [...(profile.jobAlerts || []), alertData];
      await updateDoc(doc(db, 'candidates', auth.currentUser.uid), {
        jobAlerts: updatedAlerts,
        updatedAt: serverTimestamp()
      });

      setProfile({ ...profile, jobAlerts: updatedAlerts });
      setIsAddingAlert(false);
      setNewAlert({ country: '', category: '', keywords: '' });
      toast.success("Job alert subscription successful!");
    } catch (error) {
      toast.error("Failed to add job alert.");
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!profile || !auth.currentUser) return;

    try {
      const updatedAlerts = (profile.jobAlerts || []).filter(a => a.id !== alertId);
      await updateDoc(doc(db, 'candidates', auth.currentUser.uid), {
        jobAlerts: updatedAlerts,
        updatedAt: serverTimestamp()
      });
      setProfile({ ...profile, jobAlerts: updatedAlerts });
      toast.success("Job alert removed.");
    } catch (error) {
      toast.error("Failed to remove job alert.");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser || !profile) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo size must be less than 2MB");
      return;
    }

    setUploadingPhoto(true);
    const toastId = toast.loading("Processing photo...");
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        try {
          await updateDoc(doc(db, 'candidates', auth.currentUser.uid), {
            photoUrl: base64,
            updatedAt: serverTimestamp()
          });

          setProfile({ ...profile, photoUrl: base64 });
          toast.success("Profile photo updated!", { id: toastId });
        } catch (dbError) {
          console.error("Firestore update error:", dbError);
          toast.error("Cloud document size limit reached. Please use a smaller photo.", { id: toastId });
        } finally {
          setUploadingPhoto(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing photo:", error);
      toast.error("Failed to process photo.", { id: toastId });
      setUploadingPhoto(false);
    }
  };

  const fetchRecommendations = async (currentProfile: CandidateProfile | null) => {
    if (!currentProfile) return;
    
    setLoadingRecommendations(true);
    try {
      const jobsSnap = await getDocs(collection(db, 'jobs'));
      const allJobs = jobsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      
      const recommendedIds = await getJobRecommendations(currentProfile, allJobs);
      const recommended = allJobs.filter(job => recommendedIds.includes(job.id));
      setRecommendedJobs(recommended);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleRequestRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !auth.currentUser) return;

    setSubmittingRefund(true);
    try {
      const refundRequest = {
        id: `REF-${Date.now()}`,
        candidateUid: auth.currentUser.uid,
        candidateName: profile.fullName,
        reason: refundReason,
        status: 'pending',
        totalReceivedAmount: Number(profile.paidAmount || 0),
        riskAmount: 0,
        refundableAmount: 0,
        agreedByCandidate: false,
        installments: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await updateDoc(doc(db, 'candidates', auth.currentUser.uid), {
        refundRequest,
        updatedAt: serverTimestamp()
      });

      setProfile({ ...profile, refundRequest: refundRequest as any });
      setIsRequestingRefund(false);
      setRefundReason('');
      toast.success("Refund request submitted successfully!");
    } catch (error) {
      console.error("Error requesting refund:", error);
      toast.error("Failed to submit refund request.");
    } finally {
      setSubmittingRefund(false);
    }
  };

  const handleAgreeToRefund = async () => {
    if (!profile || !auth.currentUser || !profile.refundRequest) return;

    try {
      const updatedRefund = {
        ...profile.refundRequest,
        status: 'agreed',
        agreedByCandidate: true,
        updatedAt: Date.now()
      };

      await updateDoc(doc(db, 'candidates', auth.currentUser.uid), {
        refundRequest: updatedRefund,
        updatedAt: serverTimestamp()
      });

      setProfile({ ...profile, refundRequest: updatedRefund as any });
      toast.success("You have agreed to the refund proposal. Admin will start processing.");
    } catch (error) {
      toast.error("Failed to update agreement.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue dark:border-brand-gold"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-4">
        <div className="text-center bg-white dark:bg-slate-900 p-12 rounded-3xl shadow-xl max-w-md border border-gray-100 dark:border-white/5">
          <AlertCircle className="mx-auto text-red-500 mb-6" size={64} />
          <h2 className="text-2xl font-bold text-brand-blue dark:text-white mb-4">Profile Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">We couldn't find your candidate profile. Please try logging in again.</p>
          <button 
            onClick={() => navigate('/')} 
            className="w-full bg-brand-blue dark:bg-brand-gold text-white dark:text-brand-blue px-8 py-3 rounded-xl font-bold hover:scale-[1.02] transition-all"
          >
            Back to Website
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pt-20 pb-20 transition-colors duration-500">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10">
        
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-8 px-2">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-lg border border-gray-100 dark:border-white/5 group-active:scale-95 transition-all">
              <Home size={20} className="text-brand-teal" />
            </div>
            <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Return Home</span>
          </Link>
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-brand-teal/20 shadow-md">
                {profile.photoUrl ? (
                  <img src={profile.photoUrl} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-brand-blue flex items-center justify-center text-white font-bold text-xs">
                    {profile.fullName.charAt(0)}
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Mobile Tab Selector */}
        <div className="lg:hidden mb-6 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 min-w-max pb-2">
            {[
              { id: 'overview', name: 'Overview', icon: <User size={18} /> },
              { id: 'documents', name: 'Documents', icon: <FileText size={18} /> },
              { id: 'applications', name: 'Applications', icon: <Briefcase size={18} /> },
              { id: 'payments', name: 'Payments', icon: <CreditCard size={18} /> },
              { id: 'refunds', name: 'Refunds', icon: <RotateCcw size={18} /> },
              { id: 'alerts', name: 'Job Alerts', icon: <Bell size={18} /> },
              { id: 'profile', name: 'Profile', icon: <Settings size={18} /> },
              { id: 'view_profile', name: 'Full Profile', icon: <User size={18} /> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'view_profile') {
                    navigate(`/candidate/profile/${profile?.uid}`);
                  } else {
                    setActiveTab(item.id as any);
                  }
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full transition-all font-bold text-xs whitespace-nowrap",
                  activeTab === item.id 
                    ? "bg-brand-gold text-brand-blue shadow-md" 
                    : "bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-white/5"
                )}
              >
                {item.icon}
                {item.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar - Desktop Only */}
          <div className="hidden lg:block lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-[#020617] rounded-[3rem] shadow-xl border border-gray-100 dark:border-white/5 overflow-hidden transition-all duration-500">
              <div className="p-10 text-center bg-[#020617] text-white relative">
                <div className="absolute inset-0 bg-mesh opacity-10"></div>
                <div className="relative z-10">
                  <div className="w-28 h-28 bg-white dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-4xl font-black overflow-hidden border-4 border-brand-teal/20 shadow-2xl">
                    {profile.photoUrl ? (
                      <img src={profile.photoUrl} alt={profile.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      profile.fullName.charAt(0)
                    )}
                  </div>
                  <h2 className="text-2xl font-black tracking-tight">{profile.fullName}</h2>
                  <p className="text-brand-teal text-[10px] font-black uppercase tracking-[0.2em] mt-2">Candidate Profile</p>
                </div>
              </div>
              <nav className="p-6 space-y-2">
                <Link 
                  to="/"
                  className="flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest bg-brand-teal/10 text-brand-teal mb-8 hover:scale-[1.02] active:scale-95 border border-brand-teal/20 shadow-inner group"
                >
                  <Home size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                  Return to Home
                </Link>

                {[
                  { id: 'overview', name: 'Dashboard', icon: <User size={18} /> },
                  { id: 'documents', name: 'My Documents', icon: <FileText size={18} /> },
                  { id: 'applications', name: 'My Applications', icon: <Briefcase size={18} /> },
                  { id: 'payments', name: 'My Payments', icon: <CreditCard size={18} /> },
                  { id: 'refunds', name: 'Refund Requests', icon: <RotateCcw size={18} /> },
                  { id: 'alerts', name: 'Job Alerts', icon: <Bell size={18} /> },
                  { id: 'profile', name: 'Edit Profile', icon: <Settings size={18} /> },
                  { id: 'view_profile', name: 'View Full CV', icon: <FileText size={18} /> },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'view_profile') {
                        navigate(`/candidate/profile/${profile?.uid}`);
                      } else {
                        setActiveTab(item.id as any);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest border",
                      activeTab === item.id 
                        ? "bg-brand-teal text-[#020617] shadow-xl shadow-brand-teal/10 border-brand-teal/20" 
                        : "text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 border-transparent"
                    )}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {item.name}
                  </button>
                ))}
                
                <div className="pt-6 mt-6 border-t border-slate-100 dark:border-white/5">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all font-black text-xs uppercase tracking-widest"
                  >
                    <LogOut size={18} />
                    End Session
                  </button>
                </div>
              </nav>
            </div>

            <div className="bg-[#020617] rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden border border-white/5 group">
              <div className="absolute inset-0 bg-mesh opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative z-10">
                <p className="text-brand-teal font-black text-[10px] uppercase tracking-[0.3em] mb-4">Support Center</p>
                <h3 className="text-2xl font-black mb-4 tracking-tight">Need Help?</h3>
                <p className="text-slate-200 text-sm mb-8 font-medium leading-relaxed">Our world-class support team is here to assist your global journey.</p>
                <a href="https://wa.me/971501942811" className="w-full bg-white text-[#020617] px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-brand-teal hover:text-white transition-all shadow-xl">
                  <Globe size={18} /> WhatsApp Support
                </a>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div 
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-brand-gold/10 transition-all"></div>
                      <div className="relative z-10">
                        <div className="flex justify-between items-end mb-4">
                          <div>
                            <p className="text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest mb-1">CV Readiness</p>
                            <h4 className="text-2xl font-black text-brand-blue dark:text-white">Profile Strength</h4>
                          </div>
                          <p className="text-4xl font-black text-brand-gold">{calculateCompleteness()}%</p>
                        </div>
                        <div className="w-full h-4 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden mb-6 shadow-inner">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${calculateCompleteness()}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-brand-blue to-brand-gold shadow-lg"
                          />
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {calculateCompleteness() < 100 ? (
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                              <Sparkles size={16} className="text-brand-gold" />
                              Tip: {calculateCompleteness() < 50 ? "Add your work & education history" : "Add some skills and a photo"} to stand out!
                            </p>
                          ) : (
                            <p className="text-sm font-bold text-green-500 flex items-center gap-2">
                              <CheckCircle2 size={16} />
                              Excellent! Your profile is highly competitive.
                            </p>
                          )}
                          {calculateCompleteness() < 100 && (
                            <button 
                              onClick={() => setActiveTab('profile')}
                              className="text-xs font-black text-brand-blue dark:text-brand-gold uppercase tracking-widest hover:underline"
                            >
                              Complete Now →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link 
                      to={`/candidate/profile/${profile?.uid}`}
                      className="relative bg-brand-blue dark:bg-brand-gold p-8 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center transition-all hover:scale-[1.02] active:scale-95 group overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-mesh opacity-10"></div>
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-white/20 text-white dark:text-brand-blue rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg backrop-blur-md">
                          <User size={32} />
                        </div>
                        <h4 className="text-white dark:text-brand-blue font-black text-xs uppercase tracking-widest">Live Profile</h4>
                        <p className="text-white/80 dark:text-brand-blue/80 text-[10px] font-bold mt-1">View your full CV page</p>
                      </div>
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 group hover:shadow-xl transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Briefcase size={24} />
                        </div>
                        <p className="text-3xl font-black text-brand-blue dark:text-white">{applications.length}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Applications</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 group hover:shadow-xl transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FileText size={24} />
                        </div>
                        <p className="text-3xl font-black text-brand-blue dark:text-white">{profile.documents?.length || 0}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Documents</p>
                    </div>
                  </div>

                  {/* Quick Photo Upload Alert */}
                  {!profile.photoUrl && (
                    <div className="bg-brand-gold/10 p-6 rounded-3xl border border-dashed border-brand-gold/40 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-gold text-brand-blue rounded-xl flex items-center justify-center shadow-lg">
                          <Plus size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-brand-blue">Add Professional Photo</h4>
                          <p className="text-sm text-brand-blue/60">Having a photo increases your selection chances by 40%.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setActiveTab('profile')}
                        className="bg-brand-blue text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all text-sm uppercase tracking-widest"
                      >
                        Upload Now
                      </button>
                    </div>
                  )}

                  {/* Recommended Jobs Section */}
                  {(recommendedJobs.length > 0 || loadingRecommendations) && (
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-brand-gold/10 text-brand-gold rounded-2xl flex items-center justify-center shadow-lg">
                          <Sparkles size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-brand-blue dark:text-white">Recommended for You</h3>
                          <p className="text-sm text-gray-400 dark:text-gray-500">AI-powered suggestions based on your profile and interests</p>
                        </div>
                      </div>

                      {loadingRecommendations ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="bg-gray-50 dark:bg-slate-800 rounded-3xl h-[400px] animate-pulse"></div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {recommendedJobs.map((job) => (
                            <motion.div
                              key={`rec-${job.id}`}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                            >
                              <JobCard job={job} />
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Online Interview Section */}
                  {profile.interviewLink && (
                    <div className="bg-brand-gold/10 dark:bg-brand-gold/5 p-8 rounded-3xl border border-brand-gold/20 dark:border-brand-gold/10 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-brand-gold text-brand-blue rounded-2xl flex items-center justify-center shadow-lg">
                            <Video size={32} />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-brand-blue dark:text-white mb-1">Online Interview Scheduled</h3>
                            <p className="text-brand-blue/60 dark:text-white/60 font-medium">
                              For <span className="text-brand-blue dark:text-brand-gold font-bold">{profile.interviewPosition}</span> in <span className="text-brand-blue dark:text-brand-gold font-bold">{profile.interviewCountry}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                          <div className="text-left md:text-right">
                            <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Date & Time</p>
                            <p className="text-lg font-bold text-brand-blue dark:text-white">{profile.interviewDate} at {profile.interviewTime}</p>
                          </div>
                          <a 
                            href={profile.interviewLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto bg-brand-blue dark:bg-brand-gold text-white dark:text-brand-blue px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-xl shadow-brand-blue/20"
                          >
                            <Video size={20} /> Join Interview
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Processing & Deployment Status */}
                  <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5">
                    <h3 className="text-xl font-bold text-brand-blue dark:text-white mb-6">Processing & Deployment Status</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0",
                          profile.documentProcessingStatus === 'completed' ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" :
                          profile.documentProcessingStatus === 'in-progress' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" :
                          "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                        )}>
                          <FileText size={20} className="md:w-6 md:h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Doc Processing</p>
                          <p className="text-base md:text-lg font-bold text-brand-blue dark:text-white capitalize">{profile.documentProcessingStatus || 'Pending'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0",
                          profile.workPermitStatus === 'approved' ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" :
                          profile.workPermitStatus === 'rejected' ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" :
                          "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                        )}>
                          <ShieldCheck size={20} className="md:w-6 md:h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Work Permit</p>
                          <p className="text-base md:text-lg font-bold text-brand-blue dark:text-white capitalize">{profile.workPermitStatus || 'Pending'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0",
                          profile.visaStatus === 'approved' ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" :
                          profile.visaStatus === 'rejected' ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" :
                          "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                        )}>
                          <ShieldCheck size={20} className="md:w-6 md:h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Visa Status</p>
                          <p className="text-base md:text-lg font-bold text-brand-blue dark:text-white capitalize">{profile.visaStatus || 'Pending'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                          <Plane size={20} className="md:w-6 md:h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Expected Arrival</p>
                          <p className="text-base md:text-lg font-bold text-brand-blue dark:text-white">{profile.expectedArrivalDate || 'To be announced'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                    <div className="p-8 border-b border-gray-50 dark:border-white/5 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-brand-blue dark:text-white">Recent Applications</h3>
                      <button onClick={() => setActiveTab('applications')} className="text-brand-gold font-bold text-sm hover:underline">View All</button>
                    </div>
                    <div className="p-0">
                      {applications.length === 0 ? (
                        <div className="p-12 text-center">
                          <p className="text-gray-400 dark:text-gray-500 font-medium">You haven't applied for any jobs yet.</p>
                          <button onClick={() => navigate('/jobs')} className="mt-4 text-brand-blue dark:text-brand-gold font-bold hover:underline">Browse Jobs</button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest">
                              <tr>
                                <th className="px-8 py-4">Job Title</th>
                                <th className="px-8 py-4">Status</th>
                                <th className="px-8 py-4">Applied Date</th>
                                <th className="px-8 py-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                              {applications.slice(0, 5).map((app) => (
                                <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                  <td className="px-8 py-6 font-bold text-brand-blue dark:text-white">{app.jobTitle}</td>
                                  <td className="px-8 py-6">
                                    <span className={cn(
                                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                      app.status === 'pending' ? "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400" :
                                      app.status === 'approved' ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" :
                                      "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                                    )}>
                                      {app.status}
                                    </span>
                                  </td>
                                  <td className="px-8 py-6 text-sm text-gray-400 dark:text-gray-500">
                                    {new Date(app.createdAt).toLocaleDateString()}
                                  </td>
                                  <td className="px-8 py-6 text-right">
                                    <button 
                                      onClick={() => viewAppDetails(app)}
                                      className="text-brand-blue dark:text-brand-gold font-bold text-xs hover:underline"
                                    >
                                      View Details
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

               {activeTab === 'documents' && (
                <motion.div 
                  key="documents"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                      <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-bold text-brand-blue dark:text-white">My Documents</h3>
                        <div className="flex gap-4 items-center">
                          <div className="hidden sm:block text-right">
                            <p className="text-xs font-bold text-brand-gold uppercase tracking-wider">Recommended</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">Use Google Drive links for faster processing</p>
                          </div>
                          <button 
                            onClick={() => setIsAddingDoc(true)}
                            className="bg-[#0a192f] dark:bg-brand-gold text-white dark:text-brand-blue px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-gold dark:hover:bg-brand-gold/80 transition-all shadow-lg shrink-0"
                          >
                            <Plus size={20} /> Add Document
                          </button>
                        </div>
                      </div>

                      {/* Required Documents Guide */}
                      <div className="bg-brand-blue/5 dark:bg-slate-900 border border-brand-blue/10 dark:border-white/5 p-6 rounded-3xl">
                        <h4 className="font-bold text-brand-blue dark:text-white mb-4 flex items-center gap-2">
                          <FileText className="text-brand-gold" size={20} /> Required Documents Checklist
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {[
                            "Passport Copy (Front & Back)",
                            "Passport Size Photo",
                            "Europass CV",
                            "Experience Certificate",
                            "Driving License Copy (Both Sides)",
                            "Police Clearance Certificate (after selection)"
                          ].map((doc, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
                              <CheckCircle2 size={16} className="text-brand-gold shrink-0" />
                              <span>{doc}</span>
                            </div>
                          ))}
                        </div>
                        <p className="mt-4 text-xs text-brand-blue dark:text-brand-gold font-bold italic">
                          Note: Basic English Speaking is Required for All Positions.
                        </p>
                      </div>

                  {isAddingDoc && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-white dark:bg-slate-900 p-8 rounded-3xl border-2 border-dashed border-brand-gold/30"
                    >
                      <form onSubmit={handleAddDocument} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                          <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Document Name</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. My CV"
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-white/5 bg-transparent outline-none focus:border-brand-gold transition-all dark:text-white"
                            value={newDoc.name}
                            onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                          />
                        </div>
                        <div className="md:col-span-1">
                          <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Upload File (PDF/Photo)</label>
                          <div className="relative group">
                            <input 
                              type="file" 
                              required={!newDoc.url}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              onChange={handleCandidateDocumentUpload}
                            />
                            <div className={cn(
                              "w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-white/5 bg-transparent flex items-center justify-between transition-all",
                              newDoc.url ? "border-brand-gold bg-brand-gold/5" : "group-hover:border-brand-gold"
                            )}>
                              <span className="text-xs font-bold text-gray-400 truncate">
                                {newDoc.url ? "✅ File Attached" : "Select File..."}
                              </span>
                              <Upload size={18} className="text-gray-400" />
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-medium">Max size: 5MB (PDF or Image)</p>
                        </div>
                        <div className="md:col-span-1 flex items-end gap-3">
                          <div className="flex-grow">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Type</label>
                            <select 
                              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-white/5 bg-white dark:bg-slate-900 outline-none focus:border-brand-gold transition-all dark:text-white"
                              value={newDoc.type}
                              onChange={(e) => setNewDoc({ ...newDoc, type: e.target.value })}
                            >
                              <option value="Passport Copy" className="dark:bg-slate-900">Passport Copy (Front & Back)</option>
                              <option value="Passport Photo" className="dark:bg-slate-900">Passport Size Photo</option>
                              <option value="Europass CV" className="dark:bg-slate-900">Europass CV</option>
                              <option value="Experience Certificate" className="dark:bg-slate-900">Experience Certificate</option>
                              <option value="Driving License" className="dark:bg-slate-900">Driving License Copy (Both Sides)</option>
                              <option value="Police Clearance" className="dark:bg-slate-900">Police Clearance Certificate</option>
                              <option value="Other" className="dark:bg-slate-900">Other Document</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <button type="submit" className="bg-[#0a192f] dark:bg-brand-gold text-white dark:text-brand-blue p-3 rounded-xl hover:scale-110 transition-all shadow-lg">
                              <CheckCircle2 size={24} />
                            </button>
                            <button type="button" onClick={() => setIsAddingDoc(false)} className="bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 p-3 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all">
                              <X size={24} />
                            </button>
                          </div>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profile.documents?.length === 0 ? (
                      <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
                        <FileText className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                        <p className="text-gray-500 dark:text-gray-400 font-bold">No documents uploaded yet.</p>
                      </div>
                    ) : (
                      profile.documents?.map((doc, index) => (
                        <div key={index} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-between group hover:shadow-xl transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-brand-blue/5 dark:bg-slate-800 text-brand-blue dark:text-brand-gold rounded-xl flex items-center justify-center">
                              <FileText size={24} />
                            </div>
                            <div>
                              <h4 className="font-bold text-brand-blue dark:text-white">{doc.name}</h4>
                              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{doc.type} • {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a 
                              href={doc.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 text-brand-blue hover:bg-brand-blue/5 rounded-lg transition-colors"
                            >
                              <Download size={20} />
                            </a>
                            <button 
                              onClick={() => setDeleteDocIndex(index)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'applications' && (
                <motion.div 
                  key="applications"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <h3 className="text-2xl font-bold text-brand-blue dark:text-white">My Applications</h3>
                  <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                    {applications.length === 0 ? (
                      <div className="p-20 text-center">
                        <Briefcase className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                        <p className="text-gray-500 dark:text-gray-400 font-bold">You haven't applied for any jobs yet.</p>
                        <button onClick={() => navigate('/jobs')} className="mt-6 bg-brand-blue dark:bg-brand-gold text-white dark:text-brand-blue px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all">
                          Browse Jobs
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest">
                            <tr>
                              <th className="px-8 py-4">Job Title</th>
                              <th className="px-8 py-4">Status</th>
                              <th className="px-8 py-4">Applied Date</th>
                              <th className="px-8 py-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                            {applications.map((app) => (
                              <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <td className="px-8 py-6">
                                  <p className="font-bold text-brand-blue dark:text-white">{app.jobTitle}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">
                                      Orig: {app.originalCountry || app.appliedCountry || 'N/A'}
                                    </span>
                                    {app.targetCountry && app.targetCountry !== (app.originalCountry || app.appliedCountry) && (
                                      <>
                                        <span className="text-gray-300 dark:text-gray-600">|</span>
                                        <span className="text-[10px] font-bold text-brand-blue dark:text-brand-gold uppercase tracking-widest leading-none">
                                          Target: {app.targetCountry}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </td>
                                <td className="px-8 py-6">
                                  <div className="flex items-center gap-2">
                                    {app.status === 'pending' && <Clock className="text-orange-500" size={16} />}
                                    {app.status === 'approved' && <CheckCircle2 className="text-green-500" size={16} />}
                                    {app.status === 'rejected' && <AlertCircle className="text-red-500" size={16} />}
                                    <span className={cn(
                                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                      app.status === 'pending' ? "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400" :
                                      app.status === 'approved' ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" :
                                      "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                                    )}>
                                      {app.status}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-8 py-6 text-sm text-gray-400 dark:text-gray-500">
                                  {new Date(app.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-8 py-6 text-right">
                                  <button 
                                    onClick={() => viewAppDetails(app)}
                                    className="text-brand-blue dark:text-brand-gold font-bold text-xs hover:underline"
                                  >
                                    View Details
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'payments' && (
                <motion.div 
                  key="payments"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <h3 className="text-2xl font-bold text-brand-blue dark:text-white">My Payments</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 border-t-4 border-t-brand-blue">
                      <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Total Package</p>
                      <p className="text-3xl font-bold text-brand-blue dark:text-white">{CURRENCY_SYMBOLS[profile.paymentCurrency || 'EUR']} {profile.totalAmount || '0'}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 border-t-4 border-t-green-500">
                      <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Total Paid</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">{CURRENCY_SYMBOLS[profile.paymentCurrency || 'EUR']} {profile.paidAmount || '0'}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 border-t-4 border-t-brand-gold">
                      <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Remaining</p>
                      <p className="text-3xl font-bold text-brand-gold">{CURRENCY_SYMBOLS[profile.paymentCurrency || 'EUR']} {Number(profile.totalAmount || 0) - Number(profile.paidAmount || 0)}</p>
                    </div>
                  </div>

                  {/* Package Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50/50 dark:bg-blue-900/10 p-8 rounded-[2.5rem] border border-blue-100 dark:border-blue-900/30">
                      <h4 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <CheckCircle2 size={16} /> Included in your Package
                      </h4>
                      <ul className="space-y-3">
                        {profile.includedPackageItems?.filter(i => i.trim()).map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            {item}
                          </li>
                        ))}
                        {(!profile.includedPackageItems || profile.includedPackageItems.filter(i => i.trim()).length === 0) && (
                          <li className="text-xs text-slate-400 italic">No specific items listed as included.</li>
                        )}
                      </ul>
                    </div>

                    <div className="bg-red-50/50 dark:bg-red-900/10 p-8 rounded-[2.5rem] border border-red-100 dark:border-red-900/30">
                      <h4 className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <ArrowUp size={16} className="rotate-45" /> Candidate Must Pay
                      </h4>
                      <ul className="space-y-3">
                        {profile.excludedPackageItems?.filter(i => i.trim()).map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            {item}
                          </li>
                        ))}
                        {(!profile.excludedPackageItems || profile.excludedPackageItems.filter(i => i.trim()).length === 0) && (
                          <li className="text-xs text-slate-400 italic">No specific items listed as excluded.</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                    <div className="p-8 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
                      <h3 className="text-xl font-bold text-brand-blue dark:text-white">Payment History</h3>
                      <button className="text-xs font-bold text-brand-gold uppercase tracking-widest hover:underline">Download Statements</button>
                    </div>
                    <div className="p-0">
                      {!profile.paymentHistory || profile.paymentHistory.length === 0 ? (
                        <div className="p-12 text-center">
                          <CreditCard className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                          <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-xs">No payment records found.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest">
                              <tr>
                                <th className="px-8 py-4">Date</th>
                                <th className="px-8 py-4">Method</th>
                                <th className="px-8 py-4">Amount</th>
                                <th className="px-8 py-4">Note</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                              {profile.paymentHistory.map((payment, i) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                  <td className="px-8 py-6 text-sm font-bold text-brand-blue dark:text-white">{payment.date}</td>
                                  <td className="px-8 py-6 text-sm text-gray-500 dark:text-gray-400 font-medium">{payment.method}</td>
                                  <td className="px-8 py-6 text-sm font-bold text-green-600 dark:text-green-400">{CURRENCY_SYMBOLS[profile.paymentCurrency || 'EUR']} {payment.amount}</td>
                                  <td className="px-8 py-6 text-sm text-gray-400 dark:text-gray-500 italic font-medium">{payment.note || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-brand-blue/5 dark:bg-brand-gold/5 p-8 rounded-3xl border border-brand-blue/10 dark:border-brand-gold/10">
                    <div className="flex items-start gap-4">
                      <AlertCircle className="text-brand-gold shrink-0 mt-1" size={24} />
                      <div>
                        <h4 className="font-bold text-brand-blue dark:text-brand-gold mb-2">Payment Information</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                          All payments are recorded and tracked in our system. If you have made a payment that is not reflected here, please contact our support team with your receipt.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'refunds' && (
                <motion.div 
                  key="refunds"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-brand-blue dark:text-white">Refund Requests</h3>
                    {!profile.refundRequest && (
                      <button 
                        onClick={() => setIsRequestingRefund(true)}
                        className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-600 transition-all shadow-lg active:scale-95"
                      >
                        <RotateCcw size={20} /> Request Refund
                      </button>
                    )}
                  </div>

                  {isRequestingRefund && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-white dark:bg-slate-900 p-8 rounded-3xl border-2 border-dashed border-red-200 dark:border-red-900/30"
                    >
                      <form onSubmit={handleRequestRefund} className="space-y-6">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Reason for Refund</label>
                          <textarea 
                            required
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-white/5 bg-transparent outline-none focus:border-red-400 dark:focus:border-red-500 transition-all dark:text-white"
                            placeholder="Please explain why you are requesting a refund..."
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                          />
                        </div>
                        <div className="flex justify-end gap-4">
                          <button 
                            type="button" 
                            onClick={() => setIsRequestingRefund(false)}
                            className="px-6 py-3 rounded-xl font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            disabled={submittingRefund}
                            className="bg-red-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-600 transition-all flex items-center gap-2 disabled:opacity-50"
                          >
                            {submittingRefund ? <Loader2 className="animate-spin" size={20} /> : <RotateCcw size={20} />}
                            Submit Request
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {!profile.refundRequest ? (
                    <div className="bg-white dark:bg-slate-900 p-20 text-center rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                      <RotateCcw className="mx-auto text-gray-200 dark:text-gray-700 mb-6" size={64} />
                      <h4 className="text-xl font-bold text-brand-blue dark:text-white mb-2">No Refund Requests</h4>
                      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto font-medium">If you wish to cancel your application and request a refund, you can do so here.</p>
                      <button onClick={() => navigate('/')} className="mt-8 text-brand-blue dark:text-brand-gold font-bold hover:underline flex items-center gap-2 mx-auto">
                        <Home size={18} /> Back to Website
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5">
                        <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
                          <div className="flex items-center gap-6">
                            <div className={cn(
                              "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg",
                              profile.refundRequest.status === 'pending' ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20" :
                              profile.refundRequest.status === 'proposed' ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20" :
                              profile.refundRequest.status === 'agreed' ? "bg-purple-50 text-purple-600 dark:bg-purple-900/20" :
                              profile.refundRequest.status === 'processing' ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20" :
                              "bg-green-50 text-green-600 dark:bg-green-900/20"
                            )}>
                              <RotateCcw size={32} />
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h4 className="text-2xl font-bold text-brand-blue dark:text-white">Refund #{profile.refundRequest.id}</h4>
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                  profile.refundRequest.status === 'pending' ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30" :
                                  profile.refundRequest.status === 'proposed' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30" :
                                  profile.refundRequest.status === 'agreed' ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30" :
                                  profile.refundRequest.status === 'processing' ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30" :
                                  "bg-green-100 text-green-600 dark:bg-green-900/30"
                                )}>
                                  {profile.refundRequest.status}
                                </span>
                              </div>
                              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Requested on {new Date(profile.refundRequest.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-left md:text-right">
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Total Paid Amount</p>
                            <p className="text-3xl font-bold text-brand-blue dark:text-white">€ {profile.refundRequest.totalReceivedAmount}</p>
                          </div>
                        </div>

                        <div className="p-6 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-white/5 mb-8">
                          <h5 className="font-bold text-brand-blue dark:text-white mb-2">Reason for Request:</h5>
                          <p className="text-gray-600 dark:text-gray-400 text-sm italic font-medium">"{profile.refundRequest.reason}"</p>
                        </div>

                        {profile.refundRequest.status === 'proposed' && (
                          <div className="bg-brand-blue/5 dark:bg-slate-900 p-8 rounded-3xl border border-brand-blue/10 dark:border-white/5 mb-8">
                            <h5 className="text-xl font-bold text-brand-blue dark:text-white mb-6 flex items-center gap-2">
                              <AlertCircle className="text-brand-gold" size={24} /> Refund Proposal
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                              <div>
                                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Total Paid</p>
                                <p className="text-xl font-bold text-brand-blue dark:text-white">€ {profile.refundRequest.totalReceivedAmount}</p>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Risk Amount (Deduction)</p>
                                <p className="text-xl font-bold text-red-500">- € {profile.refundRequest.riskAmount}</p>
                              </div>
                              <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-brand-blue/10 dark:border-white/5 shadow-sm">
                                <p className="text-xs font-bold text-green-500 dark:text-green-400 uppercase tracking-widest mb-1">Refundable Amount</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-300">€ {profile.refundRequest.refundableAmount}</p>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                              <button 
                                onClick={handleAgreeToRefund}
                                className="w-full sm:w-auto bg-brand-blue dark:bg-brand-gold text-white dark:text-brand-blue px-10 py-4 rounded-xl font-bold hover:bg-brand-gold dark:hover:bg-brand-gold/80 transition-all shadow-xl"
                              >
                                I Agree to this Amount
                              </button>
                              <p className="text-xs text-gray-400 dark:text-gray-500 italic font-medium">By clicking agree, you accept the deduction and the refund processing terms.</p>
                            </div>
                          </div>
                        )}

                        {(profile.refundRequest.status === 'agreed' || profile.refundRequest.status === 'processing' || profile.refundRequest.status === 'completed') && (
                          <div className="space-y-8">
                            <div className="bg-indigo-50 dark:bg-indigo-950/20 p-8 rounded-3xl border border-indigo-100 dark:border-indigo-900/30">
                              <h5 className="text-xl font-bold text-indigo-900 dark:text-indigo-300 mb-4 flex items-center gap-2">
                                <Clock size={24} /> Processing Timeline
                              </h5>
                              <p className="text-indigo-700 dark:text-indigo-400 text-sm mb-6 font-medium">
                                Your refund of <span className="font-bold">€ {profile.refundRequest.refundableAmount}</span> is being processed. 
                                As per our policy, this will be completed within <span className="font-bold">90 days</span> in <span className="font-bold">3 installments</span>.
                              </p>
                              
                              <div className="space-y-4">
                                {profile.refundRequest.installments.map((inst, i) => (
                                  <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-white/5 shadow-sm">
                                    <div className="flex items-center gap-4">
                                      <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                        inst.status === 'paid' ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" : "bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-gray-500"
                                      )}>
                                        {inst.status === 'paid' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                                      </div>
                                      <div>
                                        <p className="font-bold text-brand-blue dark:text-white">Installment {i + 1}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Due: {new Date(inst.dueDate).toLocaleDateString()}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-brand-blue dark:text-white">€ {inst.amount}</p>
                                      <p className={cn(
                                        "text-[10px] font-black uppercase tracking-widest",
                                        inst.status === 'paid' ? "text-green-600 dark:text-green-400" : "text-orange-500 dark:text-orange-400"
                                      )}>
                                        {inst.status === 'paid' ? `Paid on ${new Date(inst.paidAt!).toLocaleDateString()}` : 'Pending'}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'alerts' && (
                <motion.div 
                  key="alerts"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-brand-blue dark:text-white">Job Alerts</h3>
                    <button 
                      onClick={() => setIsAddingAlert(true)}
                      className="bg-brand-blue dark:bg-brand-gold text-white dark:text-brand-blue px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-lg active:scale-95"
                    >
                      <Plus size={20} /> Create New Alert
                    </button>
                  </div>

                  {isAddingAlert && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-white dark:bg-slate-900 p-8 rounded-3xl border-2 border-dashed border-brand-gold/30 dark:border-brand-gold/20"
                    >
                      <form onSubmit={handleAddAlert} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2 tracking-widest">Country</label>
                          <select 
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-white/5 bg-transparent outline-none focus:border-brand-gold transition-all dark:text-white"
                            value={newAlert.country}
                            onChange={(e) => setNewAlert({ ...newAlert, country: e.target.value })}
                          >
                            <option value="" className="dark:bg-slate-900">All Countries</option>
                            {countries.map(c => <option key={c} value={c} className="dark:bg-slate-900">{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2 tracking-widest">Category</label>
                          <select 
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-white/5 bg-transparent outline-none focus:border-brand-gold transition-all dark:text-white"
                            value={newAlert.category}
                            onChange={(e) => setNewAlert({ ...newAlert, category: e.target.value })}
                          >
                            <option value="" className="dark:bg-slate-900">All Categories</option>
                            {categories.map(c => <option key={c} value={c} className="dark:bg-slate-900">{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2 tracking-widest">Keywords</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder="e.g. Driver, Nurse"
                              className="flex-grow px-4 py-3 rounded-xl border border-gray-100 dark:border-white/5 bg-transparent outline-none focus:border-brand-gold transition-all dark:text-white"
                              value={newAlert.keywords}
                              onChange={(e) => setNewAlert({ ...newAlert, keywords: e.target.value })}
                            />
                            <button type="submit" className="bg-brand-blue dark:bg-brand-gold text-white dark:text-brand-blue p-3 rounded-xl hover:scale-105 transition-all">
                              <CheckCircle2 size={24} />
                            </button>
                            <button type="button" onClick={() => setIsAddingAlert(false)} className="bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 p-3 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all">
                              <X size={24} />
                            </button>
                          </div>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(!profile.jobAlerts || profile.jobAlerts.length === 0) ? (
                      <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-200 dark:border-white/10 shadow-sm">
                        <Bell className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                        <p className="text-gray-500 dark:text-gray-400 font-bold">You haven't created any job alerts yet.</p>
                      </div>
                    ) : (
                      profile.jobAlerts.map((alert) => (
                        <div key={alert.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-between group hover:shadow-xl transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-brand-gold/10 dark:bg-brand-gold/20 text-brand-gold rounded-xl flex items-center justify-center">
                              <Bell size={24} />
                            </div>
                            <div>
                              <h4 className="font-bold text-brand-blue dark:text-white">
                                {alert.keywords || 'Any Job'} 
                                {alert.category && <span className="text-gray-400 dark:text-gray-500 font-normal"> in {alert.category}</span>}
                              </h4>
                              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">
                                {alert.country || 'Global'} • Created {new Date(alert.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDeleteAlert(alert.id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="bg-brand-blue/5 dark:bg-brand-gold/5 p-8 rounded-3xl border border-brand-blue/10 dark:border-brand-gold/10">
                    <div className="flex items-start gap-4">
                      <Sparkles className="text-brand-gold shrink-0 mt-1" size={24} />
                      <div>
                        <h4 className="font-bold text-brand-blue dark:text-brand-gold mb-2">Smart Job Alerts</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                          We'll notify you via email whenever a new job matches your preferences. You can create multiple alerts for different countries or roles.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'profile' && (
                <motion.div 
                  key="profile"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <h3 className="text-2xl font-bold text-brand-blue">Edit Profile</h3>
                  
                  {/* Photo Upload Section */}
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                      <div className="relative group">
                        <div className="w-32 h-32 bg-gray-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-4xl font-bold text-gray-400 dark:text-gray-500 overflow-hidden border-2 border-gray-100 dark:border-slate-700 group-hover:border-brand-gold transition-all">
                          {profile.photoUrl ? (
                            <img src={profile.photoUrl} alt={profile.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            profile.fullName.charAt(0)
                          )}
                          {uploadingPhoto && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Loader2 className="animate-spin text-white" size={32} />
                            </div>
                          )}
                        </div>
                        <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-gold text-brand-blue rounded-xl flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
                          <Plus size={20} />
                          <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                        </label>
                      </div>
                      <div className="flex-grow text-center md:text-left">
                        <h4 className="text-xl font-bold text-brand-blue dark:text-white mb-2">Profile Photo</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium">Upload a professional photo to make your profile stand out to employers. Max size 2MB.</p>
                        <div className="flex justify-center md:justify-start gap-4">
                          <label className="bg-brand-blue dark:bg-brand-gold text-white dark:text-brand-blue px-6 py-2 rounded-xl font-bold text-sm cursor-pointer hover:scale-105 transition-all">
                            Change Photo
                            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                          </label>
                          {profile.photoUrl && (
                            <button 
                              onClick={async () => {
                                if (!auth.currentUser) return;
                                await updateDoc(doc(db, 'candidates', auth.currentUser.uid), { photoUrl: null });
                                setProfile({ ...profile, photoUrl: undefined });
                                toast.success("Photo removed");
                              }}
                              className="text-red-500 dark:text-red-400 font-bold text-sm hover:underline"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5">
                    <form onSubmit={handleUpdateProfile} className="space-y-8">
                      <div className="pt-4 pb-8 border-b border-gray-100 dark:border-white/5">
                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">About Me / Professional Introduction</label>
                        <textarea 
                          rows={4}
                          className="w-full px-4 py-3 rounded-2xl border border-gray-100 dark:border-white/5 bg-transparent outline-none focus:border-brand-gold transition-all dark:text-white leading-relaxed font-medium"
                          placeholder="Write a brief professional summary about yourself. This will appear at the top of your Europass CV..."
                          value={profile.aboutMe || ''}
                          onChange={(e) => setProfile({ ...profile, aboutMe: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Full Name</label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" size={20} />
                            <input 
                              type="text" 
                              required
                              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 dark:border-white/5 bg-transparent outline-none focus:border-brand-gold transition-all dark:text-white"
                              value={profile.fullName}
                              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" size={20} />
                            <input 
                              type="email" 
                              disabled
                              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                              value={profile.email}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Phone Number</label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" size={20} />
                            <input 
                              type="tel" 
                              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 dark:border-white/5 bg-transparent outline-none focus:border-brand-gold transition-all dark:text-white"
                              placeholder="+977 9800000000"
                              value={profile.phone || ''}
                              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Passport Number</label>
                          <div className="relative">
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" size={20} />
                            <input 
                              type="text" 
                              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 dark:border-white/5 bg-transparent outline-none focus:border-brand-gold transition-all dark:text-white"
                              placeholder="A1234567"
                              value={profile.passportNumber || ''}
                              onChange={(e) => setProfile({ ...profile, passportNumber: e.target.value })}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Nationality</label>
                          <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" size={20} />
                            <input 
                              type="text" 
                              list="nationality-options"
                              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 dark:border-white/5 bg-transparent outline-none focus:border-brand-gold transition-all dark:text-white"
                              placeholder="e.g. Nepalese"
                              value={profile.nationality || ''}
                              onChange={(e) => setProfile({ ...profile, nationality: e.target.value })}
                            />
                            <datalist id="nationality-options">
                              {countries.map(c => <option key={c} value={c} />)}
                            </datalist>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Highest Education</label>
                          <div className="relative">
                            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" size={20} />
                            <input 
                              type="text" 
                              list="education-options"
                              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 dark:border-white/5 bg-transparent outline-none focus:border-brand-gold transition-all dark:text-white"
                              placeholder="e.g. Bachelor's in CS"
                              value={profile.education || ''}
                              onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                            />
                            <datalist id="education-options">
                              {EDUCATION_LEVELS.map(level => <option key={level} value={level} />)}
                            </datalist>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Experience</label>
                          <div className="relative">
                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" size={20} />
                            <input 
                              type="text" 
                              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 dark:border-white/5 bg-transparent outline-none focus:border-brand-gold transition-all dark:text-white"
                              placeholder="e.g. 5 Years in Construction"
                              value={profile.experience || ''}
                              onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Profile Intel / Metadata</label>
                          <div className="relative">
                            <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" size={20} />
                            <input 
                              type="text" 
                              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 dark:border-white/5 bg-transparent outline-none focus:border-brand-gold transition-all dark:text-white"
                              placeholder="e.g. Identity Verified, Premium Candidate"
                              value={profile.profileIntel || ''}
                              onChange={(e) => setProfile({ ...profile, profileIntel: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Skills Section */}
                      <div className="pt-8 border-t border-gray-100 dark:border-white/5">
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="text-lg font-bold text-brand-blue dark:text-white">Skills & Expertise</h4>
                          <button 
                            type="button"
                            onClick={() => {
                              const currentSkills = profile.skills || [];
                              setProfile({ ...profile, skills: [...currentSkills, { name: '', level: 'Beginner' }] });
                            }}
                            className="text-brand-gold font-bold text-sm flex items-center gap-2 hover:underline"
                          >
                            <Plus size={16} /> Add Skill
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(profile.skills || []).map((skill, index) => (
                            <div key={index} className="flex gap-3 items-start bg-gray-50 dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                              <div className="flex-grow space-y-3">
                                <input 
                                  type="text" 
                                  placeholder="Skill Name (e.g. Welding)"
                                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 outline-none focus:border-brand-gold bg-white dark:bg-slate-900 dark:text-white text-sm"
                                  value={skill.name}
                                  onChange={(e) => {
                                    const newSkills = [...(profile.skills || [])];
                                    newSkills[index].name = e.target.value;
                                    setProfile({ ...profile, skills: newSkills });
                                  }}
                                />
                                <select 
                                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 outline-none focus:border-brand-gold bg-white dark:bg-slate-900 dark:text-white text-sm"
                                  value={skill.level}
                                  onChange={(e) => {
                                    const newSkills = [...(profile.skills || [])];
                                    newSkills[index].level = e.target.value;
                                    setProfile({ ...profile, skills: newSkills });
                                  }}
                                >
                                  {PROFICIENCY_LEVELS.map(level => (
                                    <option key={level} value={level} className="dark:bg-slate-900">{level}</option>
                                  ))}
                                </select>
                              </div>
                              <button 
                                type="button"
                                onClick={() => {
                                  const newSkills = profile.skills?.filter((_, i) => i !== index);
                                  setProfile({ ...profile, skills: newSkills });
                                }}
                                className="p-2 text-red-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ))}
                          {(profile.skills || []).length === 0 && (
                            <p className="col-span-full text-center py-8 text-gray-400 dark:text-gray-500 text-sm font-medium bg-gray-50 dark:bg-slate-800 rounded-2xl border border-dashed border-gray-200 dark:border-white/5">
                              No skills added yet. Add your professional skills to stand out.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Languages Section */}
                      <div className="pt-8 border-t border-gray-100 dark:border-white/5">
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="text-lg font-bold text-brand-blue dark:text-white">Languages</h4>
                          <button 
                            type="button"
                            onClick={() => {
                              const currentLangs = profile.languages || [];
                              setProfile({ ...profile, languages: [...currentLangs, { language: '', level: 'Basic' }] });
                            }}
                            className="text-brand-gold font-bold text-sm flex items-center gap-2 hover:underline"
                          >
                            <Plus size={16} /> Add Language
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(profile.languages || []).map((lang, index) => (
                            <div key={index} className="flex gap-3 items-start bg-gray-50 dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                              <div className="flex-grow space-y-3">
                                <input 
                                  type="text" 
                                  placeholder="Language (e.g. English)"
                                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 outline-none focus:border-brand-gold bg-white dark:bg-slate-900 dark:text-white text-sm"
                                  value={lang.language}
                                  onChange={(e) => {
                                    const newLangs = [...(profile.languages || [])];
                                    newLangs[index].language = e.target.value;
                                    setProfile({ ...profile, languages: newLangs });
                                  }}
                                />
                                <select 
                                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 outline-none focus:border-brand-gold bg-white dark:bg-slate-900 dark:text-white text-sm"
                                  value={lang.level}
                                  onChange={(e) => {
                                    const newLangs = [...(profile.languages || [])];
                                    newLangs[index].level = e.target.value;
                                    setProfile({ ...profile, languages: newLangs });
                                  }}
                                >
                                  {LANGUAGE_LEVELS.map(level => (
                                    <option key={level} value={level} className="dark:bg-slate-900">{level}</option>
                                  ))}
                                </select>
                              </div>
                              <button 
                                type="button"
                                onClick={() => {
                                  const newLangs = profile.languages?.filter((_, i) => i !== index);
                                  setProfile({ ...profile, languages: newLangs });
                                }}
                                className="p-2 text-red-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ))}
                          {(profile.languages || []).length === 0 && (
                            <p className="col-span-full text-center py-8 text-gray-400 dark:text-gray-500 text-sm font-medium bg-gray-50 dark:bg-slate-800 rounded-2xl border border-dashed border-gray-200 dark:border-white/5">
                              No languages added yet.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Work History Section */}
                      <div className="pt-8 border-t border-gray-100 dark:border-white/5">
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="text-lg font-bold text-brand-blue dark:text-white">Work History</h4>
                          <button 
                            type="button"
                            onClick={() => {
                              const currentWork = profile.workHistory || [];
                              setProfile({ ...profile, workHistory: [...currentWork, { company: '', position: '', startDate: '', endDate: '', description: '' }] });
                            }}
                            className="text-brand-gold font-bold text-sm flex items-center gap-2 hover:underline"
                          >
                            <Plus size={16} /> Add Work
                          </button>
                        </div>
                        <div className="space-y-4">
                          {(profile.workHistory || []).map((work, index) => (
                            <div key={index} className="p-6 bg-gray-50 dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-white/5 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input 
                                  type="text" 
                                  placeholder="Company Name"
                                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-brand-gold"
                                  value={work.company}
                                  onChange={(e) => {
                                    const newWork = [...(profile.workHistory || [])];
                                    newWork[index].company = e.target.value;
                                    setProfile({ ...profile, workHistory: newWork });
                                  }}
                                />
                                <input 
                                  type="text" 
                                  placeholder="Position"
                                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-brand-gold"
                                  value={work.position}
                                  onChange={(e) => {
                                    const newWork = [...(profile.workHistory || [])];
                                    newWork[index].position = e.target.value;
                                    setProfile({ ...profile, workHistory: newWork });
                                  }}
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input 
                                  type="text" 
                                  placeholder="Start Date (e.g. Jan 2020)"
                                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-brand-gold"
                                  value={work.startDate}
                                  onChange={(e) => {
                                    const newWork = [...(profile.workHistory || [])];
                                    newWork[index].startDate = e.target.value;
                                    setProfile({ ...profile, workHistory: newWork });
                                  }}
                                />
                                <input 
                                  type="text" 
                                  placeholder="End Date (or 'Present')"
                                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-brand-gold"
                                  value={work.endDate}
                                  onChange={(e) => {
                                    const newWork = [...(profile.workHistory || [])];
                                    newWork[index].endDate = e.target.value;
                                    setProfile({ ...profile, workHistory: newWork });
                                  }}
                                />
                              </div>
                              <textarea 
                                placeholder="Description of your roles and achievements..."
                                rows={3}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-brand-gold"
                                value={work.description}
                                onChange={(e) => {
                                  const newWork = [...(profile.workHistory || [])];
                                  newWork[index].description = e.target.value;
                                  setProfile({ ...profile, workHistory: newWork });
                                }}
                              />
                              <button 
                                type="button"
                                onClick={() => {
                                  const newWork = profile.workHistory?.filter((_, i) => i !== index);
                                  setProfile({ ...profile, workHistory: newWork });
                                }}
                                className="text-red-500 font-bold text-xs flex items-center gap-1 hover:underline ml-auto"
                              >
                                <Trash2 size={14} /> Remove Job
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Education History Section */}
                      <div className="pt-8 border-t border-gray-100 dark:border-white/5">
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="text-lg font-bold text-brand-blue dark:text-white">Education History</h4>
                          <button 
                            type="button"
                            onClick={() => {
                              const currentEdu = profile.educationHistory || [];
                              setProfile({ ...profile, educationHistory: [...currentEdu, { institution: '', degree: '', startDate: '', endDate: '', description: '' }] });
                            }}
                            className="text-brand-gold font-bold text-sm flex items-center gap-2 hover:underline"
                          >
                            <Plus size={16} /> Add Education
                          </button>
                        </div>
                        <div className="space-y-4">
                          {(profile.educationHistory || []).map((edu, index) => (
                            <div key={index} className="p-6 bg-gray-50 dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-white/5 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input 
                                  type="text" 
                                  placeholder="Institution Name"
                                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-brand-gold"
                                  value={edu.institution}
                                  onChange={(e) => {
                                    const newEdu = [...(profile.educationHistory || [])];
                                    newEdu[index].institution = e.target.value;
                                    setProfile({ ...profile, educationHistory: newEdu });
                                  }}
                                />
                                <input 
                                  type="text" 
                                  placeholder="Degree / Certificate"
                                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-brand-gold"
                                  value={edu.degree}
                                  onChange={(e) => {
                                    const newEdu = [...(profile.educationHistory || [])];
                                    newEdu[index].degree = e.target.value;
                                    setProfile({ ...profile, educationHistory: newEdu });
                                  }}
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input 
                                  type="text" 
                                  placeholder="Start Date"
                                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-brand-gold"
                                  value={edu.startDate}
                                  onChange={(e) => {
                                    const newEdu = [...(profile.educationHistory || [])];
                                    newEdu[index].startDate = e.target.value;
                                    setProfile({ ...profile, educationHistory: newEdu });
                                  }}
                                />
                                <input 
                                  type="text" 
                                  placeholder="End Date"
                                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-brand-gold"
                                  value={edu.endDate}
                                  onChange={(e) => {
                                    const newEdu = [...(profile.educationHistory || [])];
                                    newEdu[index].endDate = e.target.value;
                                    setProfile({ ...profile, educationHistory: newEdu });
                                  }}
                                />
                              </div>
                              <textarea 
                                placeholder="Description of your studies..."
                                rows={2}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-brand-gold"
                                value={edu.description}
                                onChange={(e) => {
                                  const newEdu = [...(profile.educationHistory || [])];
                                  newEdu[index].description = e.target.value;
                                  setProfile({ ...profile, educationHistory: newEdu });
                                }}
                              />
                              <button 
                                type="button"
                                onClick={() => {
                                  const newEdu = profile.educationHistory?.filter((_, i) => i !== index);
                                  setProfile({ ...profile, educationHistory: newEdu });
                                }}
                                className="text-red-500 font-bold text-xs flex items-center gap-1 hover:underline ml-auto"
                              >
                                <Trash2 size={14} /> Remove Education
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-8 border-t border-gray-100 dark:border-white/5">
                        <h4 className="text-lg font-bold text-brand-blue dark:text-white mb-6">Processing & Deployment Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Document Processing</label>
                            <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-white/5 text-brand-blue dark:text-white font-bold capitalize">
                              {profile.documentProcessingStatus || 'Pending'}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Work Permit Status</label>
                            <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-white/5 text-brand-blue dark:text-white font-bold capitalize">
                              {profile.workPermitStatus || 'Pending'}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Visa Status</label>
                            <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-white/5 text-brand-blue dark:text-white font-bold capitalize">
                              {profile.visaStatus || 'Pending'}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Joining Date</label>
                            <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-white/5 text-brand-blue dark:text-white font-bold">
                              {profile.joiningDate || 'To be announced'}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Expected Arrival</label>
                            <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-white/5 text-brand-blue dark:text-white font-bold">
                              {profile.expectedArrivalDate || 'To be announced'}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 italic">* This information is updated by the WorkinEU HR team.</p>
                      </div>

                      <div className="flex justify-end">
                        <button 
                          type="submit"
                          disabled={isUpdating}
                          className="bg-brand-blue dark:bg-brand-gold text-white dark:text-brand-blue px-12 py-4 rounded-xl font-black uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl disabled:opacity-50 active:scale-95"
                        >
                          {isUpdating ? <Loader2 className="animate-spin" size={24} /> : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Application Details Modal */}
      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-blue/60 backdrop-blur-sm"
              onClick={() => {
                setSelectedApp(null);
                setSelectedJob(null);
              }}
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 p-8 md:p-12"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-brand-blue dark:text-white">Application Details</h2>
                <button 
                  onClick={() => {
                    setSelectedApp(null);
                    setSelectedJob(null);
                  }} 
                  className="text-gray-400 dark:text-gray-500 hover:text-brand-blue dark:hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-6 p-6 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-white/5">
                  <div className="w-16 h-16 bg-brand-blue dark:bg-brand-gold text-white dark:text-brand-blue rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0">
                    {selectedApp.jobTitle.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-brand-blue dark:text-white">{selectedApp.jobTitle}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                       <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Applied: {new Date(selectedApp.createdAt).toLocaleDateString()}</p>
                       <span className="text-gray-300 dark:text-gray-700">•</span>
                       <p className="text-[10px] font-black uppercase tracking-widest text-brand-gold">
                         Target: {selectedApp.targetCountry || selectedApp.appliedCountry || 'Global'}
                       </p>
                    </div>
                    <div className="mt-2">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        selectedApp.status === 'pending' ? "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400" :
                        selectedApp.status === 'approved' ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" :
                        "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                      )}>
                        {selectedApp.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Required Documents Section */}
                {selectedJob && (
                  <div className="bg-brand-gold/5 dark:bg-brand-gold/10 border border-brand-gold/20 dark:border-brand-gold/30 p-6 rounded-2xl">
                    <h4 className="font-bold text-brand-blue dark:text-brand-gold mb-4 flex items-center gap-2">
                      <FileText className="text-brand-gold" size={20} /> Required Documents for this Position
                    </h4>
                    {selectedJob.requiredDocuments && selectedJob.requiredDocuments.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedJob.requiredDocuments.map((doc, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-brand-blue dark:text-brand-gold font-bold bg-white dark:bg-slate-900 p-3 rounded-xl border border-brand-gold/10 dark:border-white/5 shadow-sm">
                            <CheckCircle2 size={16} className="text-brand-gold" />
                            {doc}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic font-medium">No specific documents required for this position.</p>
                    )}
                  </div>
                )}

                <div>
                  <h4 className="font-bold text-brand-blue dark:text-white mb-4">Your Uploaded Documents</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedApp.documents.map((doc, i) => (
                      <a 
                        key={i} 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/5 rounded-2xl hover:border-brand-gold dark:hover:border-brand-gold transition-all group"
                      >
                        <div className="w-10 h-10 bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-gray-500 group-hover:text-brand-gold dark:group-hover:text-brand-gold rounded-xl flex items-center justify-center transition-colors">
                          <FileText size={20} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-brand-blue dark:text-white truncate">{doc.name}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">{doc.type}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 dark:border-white/10">
                  <h4 className="font-bold text-brand-blue dark:text-white mb-2">Cover Letter</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-white/5 italic font-medium">
                    {selectedApp.coverLetter || "No cover letter provided."}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {/* Delete Document Confirmation Modal */}
        {deleteDocIndex !== null && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-blue/60 backdrop-blur-sm"
              onClick={() => setDeleteDocIndex(null)}
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md relative z-10 p-8 text-center"
            >
              <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={40} />
              </div>
              <h3 className="text-2xl font-bold text-brand-blue dark:text-white mb-4">Delete Document</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed font-medium">
                Are you sure you want to delete this document? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteDocIndex(null)}
                  className="flex-grow px-6 py-3 rounded-xl font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all font-bold"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDeleteDocument(deleteDocIndex)}
                  className="flex-grow px-6 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
