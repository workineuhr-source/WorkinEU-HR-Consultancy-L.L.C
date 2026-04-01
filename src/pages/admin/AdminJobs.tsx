import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, deleteDoc, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Job } from '../../types';
import { Plus, Search, Edit2, Trash2, MapPin, Briefcase, Calendar, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      await deleteDoc(doc(db, 'jobs', id));
      toast.success("Job deleted successfully");
      fetchJobs();
    } catch (error) {
      toast.error("Failed to delete job");
    }
  };

  const openEditModal = (job: Job) => {
    setEditingJob(job);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingJob(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-brand-blue">Job Management</h1>
          <p className="text-gray-500">Add, edit or remove job listings from the portal.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-brand-blue text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-gold transition-all shadow-lg"
        >
          <Plus size={20} /> Post New Job
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white rounded-2xl animate-pulse"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 group">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-brand-blue">{job.title}</h3>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openEditModal(job)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(job.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-gray-500">
                  <MapPin size={16} className="text-brand-gold" />
                  <span className="text-sm font-medium">{job.country}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-500">
                  <Briefcase size={16} className="text-brand-gold" />
                  <span className="text-sm font-medium">{job.category}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-500">
                  <Calendar size={16} className="text-brand-gold" />
                  <span className="text-sm font-medium">Deadline: {job.deadline}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                <span className="text-lg font-bold text-brand-blue">{job.salary}</span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{job.type}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Job Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <JobModal 
            job={editingJob} 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={() => {
              setIsModalOpen(false);
              fetchJobs();
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface JobModalProps {
  job: Job | null;
  onClose: () => void;
  onSuccess: () => void;
}

function JobModal({ job, onClose, onSuccess }: JobModalProps) {
  const [formData, setFormData] = useState<Partial<Job>>(
    job || {
      title: '',
      country: '',
      category: '',
      salary: '',
      experience: 'Entry Level',
      type: 'Full-time',
      description: '',
      responsibilities: [''],
      requirements: [''],
      requiredDocuments: ['Passport', 'CV'],
      deadline: '',
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (job) {
        await updateDoc(doc(db, 'jobs', job.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        toast.success("Job updated successfully");
      } else {
        await addDoc(collection(db, 'jobs'), {
          ...formData,
          createdAt: Date.now()
        });
        toast.success("Job posted successfully");
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving job:", error);
      toast.error("Failed to save job");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArrayChange = (field: 'responsibilities' | 'requirements' | 'requiredDocuments', index: number, value: string) => {
    const newArray = [...(formData[field] as string[])];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const addArrayItem = (field: 'responsibilities' | 'requirements' | 'requiredDocuments') => {
    setFormData({ ...formData, [field]: [...(formData[field] as string[]), ''] });
  };

  const removeArrayItem = (field: 'responsibilities' | 'requirements' | 'requiredDocuments', index: number) => {
    const newArray = (formData[field] as string[]).filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newArray });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-brand-blue/60 backdrop-blur-sm"
        onClick={onClose}
      ></motion.div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 p-8 md:p-12"
      >
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold text-brand-blue">{job ? 'Edit Job' : 'Post New Job'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-brand-blue transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Job Title</label>
              <input 
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Warehouse Worker"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Country</label>
              <input 
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="e.g. Poland"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
              <input 
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. Logistics"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Salary</label>
              <input 
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                placeholder="e.g. €1200 - €1500 / Month"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Deadline</label>
              <input 
                required
                type="date"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Experience</label>
              <select 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              >
                <option value="Entry Level">Entry Level</option>
                <option value="1-3 Years">1-3 Years</option>
                <option value="3-5 Years">3-5 Years</option>
                <option value="5+ Years">5+ Years</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Job Type</label>
              <select 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Job Description</label>
            <textarea 
              required
              rows={6}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the job role..."
            ></textarea>
          </div>

          {/* Responsibilities */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-bold text-gray-700">Responsibilities</label>
              <button type="button" onClick={() => addArrayItem('responsibilities')} className="text-brand-gold font-bold text-sm flex items-center gap-1">
                <Plus size={16} /> Add More
              </button>
            </div>
            <div className="space-y-4">
              {formData.responsibilities?.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input 
                    className="flex-grow px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold transition-all"
                    value={item}
                    onChange={(e) => handleArrayChange('responsibilities', i, e.target.value)}
                  />
                  <button type="button" onClick={() => removeArrayItem('responsibilities', i)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Requirements */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-bold text-gray-700">Requirements</label>
              <button type="button" onClick={() => addArrayItem('requirements')} className="text-brand-gold font-bold text-sm flex items-center gap-1">
                <Plus size={16} /> Add More
              </button>
            </div>
            <div className="space-y-4">
              {formData.requirements?.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input 
                    className="flex-grow px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold transition-all"
                    value={item}
                    onChange={(e) => handleArrayChange('requirements', i, e.target.value)}
                  />
                  <button type="button" onClick={() => removeArrayItem('requirements', i)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-8 border-t border-gray-50">
            <button 
              type="button" 
              onClick={onClose}
              className="px-8 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="bg-brand-blue text-white px-12 py-3 rounded-xl font-bold hover:bg-brand-gold transition-all shadow-lg flex items-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? "Saving..." : job ? "Update Job" : "Post Job"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
