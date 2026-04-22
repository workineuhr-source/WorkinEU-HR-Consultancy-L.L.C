import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, updateDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Application, CandidateProfile } from '../../types';
import { Search, Filter, Eye, Download, Trash2, X, CheckCircle2, AlertCircle, Clock, FileText, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function AdminApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApps, setFilteredApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteAppId, setDeleteAppId] = useState<string | null>(null);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [isShiftingCountry, setIsShiftingCountry] = useState(false);
  const [newTargetCountry, setNewTargetCountry] = useState('');

  useEffect(() => {
    fetchApplications();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'siteContent');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.countries) setAvailableCountries(data.countries);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (selectedApp?.candidateUid) {
        setLoadingProfile(true);
        try {
          const docSnap = await getDoc(doc(db, 'candidates', selectedApp.candidateUid));
          if (docSnap.exists()) {
            setCandidateProfile({ uid: docSnap.id, ...docSnap.data() } as CandidateProfile);
          } else {
            setCandidateProfile(null);
          }
        } catch (error) {
          console.error("Error fetching candidate profile:", error);
          handleFirestoreError(error, OperationType.GET, `candidates/${selectedApp.candidateUid}`);
        } finally {
          setLoadingProfile(false);
        }
      } else {
        setCandidateProfile(null);
      }
    };
    fetchProfile();
  }, [selectedApp]);

  const getErrorMessage = (error: any) => {
    try {
      const parsed = JSON.parse(error.message);
      return parsed.error;
    } catch {
      return error.message || "An unexpected error occurred";
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
      
      let snapshot;
      try {
        snapshot = await getDocs(q);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'applications');
        return;
      }

      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
      setApplications(apps);
      setFilteredApps(apps);
    } catch (error: any) {
      console.error("Error fetching applications:", error);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = applications;
    if (searchTerm) {
      result = result.filter(app => 
        app.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterStatus !== 'all') {
      result = result.filter(app => app.status === filterStatus);
    }
    setFilteredApps(result);
  }, [searchTerm, filterStatus, applications]);

  const handleStatusChange = async (id: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    const appToUpdate = applications.find(a => a.id === id);
    if (!appToUpdate) return;
    
    const prevStatus = appToUpdate.status;
    if (prevStatus === newStatus) return;

    const historyEntry = {
      prevStatus,
      newStatus,
      changedAt: Date.now(),
      changedBy: auth.currentUser?.email || 'Admin'
    };

    try {
      try {
        await updateDoc(doc(db, 'applications', id), { 
          status: newStatus,
          statusHistory: [...(appToUpdate.statusHistory || []), historyEntry]
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `applications/${id}`);
      }
      toast.success(`Application marked as ${newStatus}`);
      fetchApplications();
      if (selectedApp?.id === id) {
        setSelectedApp({ 
          ...selectedApp, 
          status: newStatus,
          statusHistory: [...(selectedApp.statusHistory || []), historyEntry]
        });
      }
    } catch (error) {
      toast.error(`Failed to update status: ${getErrorMessage(error)}`);
    }
  };

  const handleCountryShift = async () => {
    if (!selectedApp || !newTargetCountry) return;
    setIsShiftingCountry(true);
    try {
      await updateDoc(doc(db, 'applications', selectedApp.id), { 
        targetCountry: newTargetCountry 
      });
      toast.success(`Candidate shifted to ${newTargetCountry}`);
      fetchApplications();
      setSelectedApp({ ...selectedApp, targetCountry: newTargetCountry });
      setNewTargetCountry('');
    } catch (error) {
      toast.error("Failed to shift country");
      console.error(error);
    } finally {
      setIsShiftingCountry(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      try {
        await deleteDoc(doc(db, 'applications', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `applications/${id}`);
      }
      toast.success("Application deleted");
      fetchApplications();
      setSelectedApp(null);
      setDeleteAppId(null);
    } catch (error) {
      toast.error(`Failed to delete application: ${getErrorMessage(error)}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-blue">Candidate Applications</h1>
          <p className="text-sm md:text-base text-gray-500">Review and manage job applications from candidates.</p>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name, email, or job..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 focus:border-brand-gold outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="px-6 py-3 bg-gray-50 text-brand-blue font-bold rounded-xl outline-none border border-gray-100"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-gray-50 text-gray-400 text-xs font-bold uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Candidate</th>
                <th className="px-8 py-4">Job Position</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Applied Date</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-6 h-20 bg-gray-50/50"></td>
                  </tr>
                ))
              ) : filteredApps.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-brand-blue">{app.fullName}</p>
                      {app.candidateUid && (
                        <span className="bg-brand-gold/10 text-brand-gold text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Portal User
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{app.email}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-brand-blue">{app.jobTitle}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Orig: {app.originalCountry || app.appliedCountry || 'N/A'}
                      </span>
                      {app.targetCountry && app.targetCountry !== (app.originalCountry || app.appliedCountry) && (
                        <>
                          <span className="text-gray-300">|</span>
                          <span className="text-[10px] font-bold text-brand-blue uppercase tracking-widest leading-none">
                            Target: {app.targetCountry}
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                      app.status === 'pending' ? "bg-orange-100 text-orange-600" :
                      app.status === 'approved' ? "bg-green-100 text-green-600" :
                      "bg-red-100 text-red-600"
                    )}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-sm text-gray-400">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => setSelectedApp(app)}
                      className="p-2 text-brand-blue hover:bg-brand-blue/5 rounded-lg transition-colors"
                    >
                      <Eye size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Application Detail Modal */}
      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-blue/60 backdrop-blur-sm"
              onClick={() => setSelectedApp(null)}
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative z-10 p-6 md:p-12"
            >
              <div className="flex justify-between items-start mb-8 md:mb-10">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-brand-blue mb-2">{selectedApp.fullName}</h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm md:text-base text-gray-500">
                    <p>Applied for: <span className="text-brand-gold font-bold">{selectedApp.jobTitle}</span></p>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">|</span>
                      <p>Original: <span className="font-bold">{selectedApp.originalCountry || selectedApp.appliedCountry || 'N/A'}</span></p>
                      <span className="text-gray-400">|</span>
                      <p>Target: <span className="text-brand-blue font-bold">{selectedApp.targetCountry || selectedApp.appliedCountry || 'N/A'}</span></p>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedApp(null)} className="text-gray-400 hover:text-brand-blue transition-colors p-2">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-8 md:mb-12">
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-brand-blue border-b border-gray-100 pb-2">Contact Details</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Email</p>
                      <p className="text-sm md:text-base font-medium break-all">{selectedApp.email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Phone</p>
                      <p className="text-sm md:text-base font-medium">{selectedApp.phone}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Passport Number</p>
                      <p className="text-sm md:text-base font-medium">{selectedApp.passportNumber}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-brand-blue border-b border-gray-100 pb-2">Professional Info</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Nationality</p>
                      <p className="text-sm md:text-base font-medium">{selectedApp.nationality}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Experience</p>
                      <p className="text-sm md:text-base font-medium">{selectedApp.experience}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Education</p>
                      <p className="text-sm md:text-base font-medium">{selectedApp.education}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Candidate Profile Info */}
              {selectedApp.candidateUid && (
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-12">
                  <h4 className="font-bold text-brand-blue mb-4 flex items-center gap-2">
                    <AlertCircle size={18} className="text-brand-gold" /> Candidate Portal Information
                  </h4>
                  {loadingProfile ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="animate-spin" size={16} /> Loading profile...
                    </div>
                  ) : candidateProfile ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600 font-medium">Nationality</p>
                        <p className="font-medium">{candidateProfile.nationality || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 font-medium">Passport Number</p>
                        <p className="font-medium">{candidateProfile.passportNumber || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 font-medium">Education</p>
                        <p className="font-medium">{candidateProfile.education || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 font-medium">Experience</p>
                        <p className="font-medium">{candidateProfile.experience || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Visa Status</p>
                        <p className="font-medium capitalize">{candidateProfile.visaStatus || 'Pending'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Joining Date</p>
                        <p className="font-medium">{candidateProfile.joiningDate || 'Not set'}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Profile not found or deleted.</p>
                  )}
                </div>
              )}

              <div className="mb-8 md:mb-12">
                <h3 className="text-lg font-bold text-brand-blue border-b border-gray-100 pb-2 mb-4">Cover Letter</h3>
                <p className="text-sm md:text-base text-gray-600 bg-gray-50 p-4 md:p-6 rounded-2xl whitespace-pre-wrap italic">
                  {selectedApp.coverLetter || "No cover letter provided."}
                </p>
              </div>

              <div className="mb-8 md:mb-12">
                <h3 className="text-lg font-bold text-brand-blue border-b border-gray-100 pb-2 mb-6">Attached Documents</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedApp.documents.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <FileText className="text-brand-gold" size={20} />
                        <span className="text-xs md:text-sm font-medium">{doc.name}</span>
                      </div>
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-brand-blue hover:text-brand-gold transition-colors p-2"
                      >
                         <Download size={20} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8 md:mb-12">
                <h3 className="text-lg font-bold text-brand-blue border-b border-gray-100 pb-2 mb-6">Status History</h3>
                <div className="space-y-4">
                  {selectedApp.statusHistory && selectedApp.statusHistory.length > 0 ? (
                    selectedApp.statusHistory.map((log, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 relative overflow-hidden group">
                        <div className="w-1 h-full absolute left-0 top-0 bg-brand-gold"></div>
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-blue shadow-sm shrink-0">
                          <Clock size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status Change</span>
                            <span className="text-xs text-gray-500">{new Date(log.changedAt).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-[10px] font-bold uppercase">{log.prevStatus}</span>
                            <ArrowRight size={14} className="text-gray-300" />
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                              log.newStatus === 'approved' ? "bg-green-100 text-green-600" :
                              log.newStatus === 'rejected' ? "bg-red-100 text-red-600" :
                              "bg-orange-100 text-orange-600"
                            )}>
                              {log.newStatus}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-2 italic">Updated by: {log.changedBy}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center italic text-gray-500 text-sm">
                      No status changes logged yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Country Shift Interface */}
              <div className="mb-8 md:mb-12 p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50">
                <h3 className="text-lg font-bold text-brand-blue mb-4">Shift Target Country</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <select 
                    value={newTargetCountry}
                    onChange={(e) => setNewTargetCountry(e.target.value)}
                    className="flex-grow px-4 py-3 rounded-xl border border-gray-200 bg-white outline-none focus:border-brand-gold text-sm font-medium"
                  >
                    <option value="">Select New Destination</option>
                    {availableCountries.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button 
                    onClick={handleCountryShift}
                    disabled={!newTargetCountry || isShiftingCountry}
                    className="bg-brand-blue text-white px-8 py-3 rounded-xl font-bold text-sm disabled:opacity-50 transition-all hover:bg-brand-blue/90"
                  >
                    {isShiftingCountry ? 'Shifting...' : 'Update Country'}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-3 font-medium uppercase tracking-widest">
                  This will change the candidate's active processing path while preserving the original intent.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-8 border-t border-gray-50">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button 
                    onClick={() => handleStatusChange(selectedApp.id, 'approved')}
                    className={cn(
                      "w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all",
                      selectedApp.status === 'approved' ? "bg-green-600 text-white" : "bg-green-50 text-green-600 hover:bg-green-100"
                    )}
                  >
                    <CheckCircle2 size={20} /> Approve
                  </button>
                  <button 
                    onClick={() => handleStatusChange(selectedApp.id, 'rejected')}
                    className={cn(
                      "w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all",
                      selectedApp.status === 'rejected' ? "bg-red-600 text-white" : "bg-red-50 text-red-600 hover:bg-red-100"
                    )}
                  >
                    <AlertCircle size={20} /> Reject
                  </button>
                </div>
                <button 
                  onClick={() => setDeleteAppId(selectedApp.id)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 text-gray-400 hover:text-red-500 font-bold transition-colors py-3"
                >
                  <Trash2 size={20} /> Delete Application
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {/* Delete Confirmation Modal */}
        {deleteAppId && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-blue/60 backdrop-blur-sm"
              onClick={() => setDeleteAppId(null)}
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
                Are you sure you want to delete this application? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteAppId(null)}
                  className="flex-grow px-6 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDelete(deleteAppId)}
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
