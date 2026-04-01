import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Application } from '../../types';
import { Search, Filter, Eye, Download, Trash2, X, CheckCircle2, AlertCircle, Clock, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export default function AdminApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApps, setFilteredApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
      setApplications(apps);
      setFilteredApps(apps);
    } catch (error) {
      console.error("Error fetching applications:", error);
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
    try {
      await updateDoc(doc(db, 'applications', id), { status: newStatus });
      toast.success(`Application marked as ${newStatus}`);
      fetchApplications();
      if (selectedApp?.id === id) {
        setSelectedApp({ ...selectedApp, status: newStatus });
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this application?")) return;
    try {
      await deleteDoc(doc(db, 'applications', id));
      toast.success("Application deleted");
      fetchApplications();
      setSelectedApp(null);
    } catch (error) {
      toast.error("Failed to delete application");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-brand-blue">Candidate Applications</h1>
          <p className="text-gray-500">Review and manage job applications from candidates.</p>
        </div>
      </div>

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
          <table className="w-full text-left">
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
                    <p className="font-bold text-brand-blue">{app.fullName}</p>
                    <p className="text-xs text-gray-400">{app.email}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-medium text-gray-700">{app.jobTitle}</p>
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
              className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative z-10 p-8 md:p-12"
            >
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h2 className="text-3xl font-bold text-brand-blue mb-2">{selectedApp.fullName}</h2>
                  <p className="text-gray-500">Applied for: <span className="text-brand-gold font-bold">{selectedApp.jobTitle}</span></p>
                </div>
                <button onClick={() => setSelectedApp(null)} className="text-gray-400 hover:text-brand-blue transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-brand-blue border-b border-gray-100 pb-2">Contact Details</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase">Email</p>
                      <p className="font-medium">{selectedApp.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase">Phone</p>
                      <p className="font-medium">{selectedApp.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase">Passport Number</p>
                      <p className="font-medium">{selectedApp.passportNumber}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-brand-blue border-b border-gray-100 pb-2">Professional Info</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase">Experience</p>
                      <p className="font-medium">{selectedApp.experience}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase">Education</p>
                      <p className="font-medium">{selectedApp.education}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-12">
                <h3 className="text-lg font-bold text-brand-blue border-b border-gray-100 pb-2 mb-4">Cover Letter</h3>
                <p className="text-gray-600 bg-gray-50 p-6 rounded-2xl whitespace-pre-wrap italic">
                  {selectedApp.coverLetter || "No cover letter provided."}
                </p>
              </div>

              <div className="mb-12">
                <h3 className="text-lg font-bold text-brand-blue border-b border-gray-100 pb-2 mb-6">Attached Documents</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedApp.documents.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <FileText className="text-brand-gold" size={20} />
                        <span className="text-sm font-medium">{doc.name}</span>
                      </div>
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-brand-blue hover:text-brand-gold transition-colors"
                      >
                        <Download size={20} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-8 border-t border-gray-50">
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleStatusChange(selectedApp.id, 'approved')}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all",
                      selectedApp.status === 'approved' ? "bg-green-600 text-white" : "bg-green-50 text-green-600 hover:bg-green-100"
                    )}
                  >
                    <CheckCircle2 size={20} /> Approve
                  </button>
                  <button 
                    onClick={() => handleStatusChange(selectedApp.id, 'rejected')}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all",
                      selectedApp.status === 'rejected' ? "bg-red-600 text-white" : "bg-red-50 text-red-600 hover:bg-red-100"
                    )}
                  >
                    <AlertCircle size={20} /> Reject
                  </button>
                </div>
                <button 
                  onClick={() => handleDelete(selectedApp.id)}
                  className="flex items-center gap-2 text-gray-400 hover:text-red-500 font-bold transition-colors"
                >
                  <Trash2 size={20} /> Delete Application
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
