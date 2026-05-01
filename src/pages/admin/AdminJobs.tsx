import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "../../firebase";
import { Job, SiteContent } from "../../types";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  Briefcase,
  Calendar,
  X,
  Sparkles,
  Loader2,
  Upload,
  Image as ImageIcon,
  CreditCard,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  COUNTRIES,
  JOB_POSITIONS,
  JOB_CATEGORIES,
  CATEGORY_TO_POSITIONS,
} from "../../constants";
import { GoogleGenAI } from "@google/genai";

const PREDEFINED_DOCUMENTS = [
  "Passport Copy (Front & Back)",
  "Passport Size Photo",
  "Europass CV",
  "Experience Certificate",
  "Driving License Copy (Both Sides)",
  "Police Clearance Certificate (after selection)",
];

export default function AdminJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [lists, setLists] = useState({
    countries: COUNTRIES,
    positions: JOB_POSITIONS,
    categories: JOB_CATEGORIES,
  });

  useEffect(() => {
    fetchJobs();
    fetchLists();
  }, []);

  const fetchJobs = async () => {
    try {
      const q = query(collection(db, "jobs"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setJobs(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Job),
      );
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLists = async () => {
    try {
      const docRef = doc(db, "settings", "siteContent");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as SiteContent;
        setLists({
          countries: data.countries?.length ? data.countries : COUNTRIES,
          positions: data.jobPositions?.length
            ? data.jobPositions
            : JOB_POSITIONS,
          categories: data.jobCategories?.length
            ? data.jobCategories
            : JOB_CATEGORIES,
        });
      }
    } catch (error) {
      console.error("Error fetching lists:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "jobs", id));
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 md:gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-blue">
            Job Management
          </h1>
          <p className="text-gray-500 dark:text-gray-300 text-xs md:text-base">
            Add, edit or remove job listings from the portal.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="w-full sm:w-auto bg-brand-blue text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-gold transition-all shadow-lg"
        >
          <Plus size={20} /> Post New Job
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 bg-white dark:bg-[#121212] rounded-2xl animate-pulse"
            ></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 group overflow-hidden"
            >
              {job.imageUrl && job.imageUrl !== "" && (
                <div className="h-48 w-full overflow-hidden">
                  <img
                    src={job.imageUrl}
                    alt={job.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-start mb-4 md:mb-6">
                  <h3 className="text-lg md:text-xl font-bold text-brand-blue line-clamp-1">
                    {job.title}
                  </h3>
                  <div className="flex gap-1 md:gap-2 transition-opacity">
                    <button
                      onClick={() => openEditModal(job)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} className="md:w-[18px] md:h-[18px]" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(job.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 md:space-y-3 mb-6 md:mb-8">
                  <div className="flex items-center gap-3 text-gray-500 dark:text-gray-300">
                    <MapPin
                      size={14}
                      className="text-brand-gold md:w-4 md:h-4"
                    />
                    <span className="text-xs md:text-sm font-medium">
                      {job.country}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-500 dark:text-gray-300">
                    <Briefcase
                      size={14}
                      className="text-brand-gold md:w-4 md:h-4"
                    />
                    <span className="text-xs md:text-sm font-medium">
                      {job.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-500 dark:text-gray-300">
                    <Calendar
                      size={14}
                      className="text-brand-gold md:w-4 md:h-4"
                    />
                    <span className="text-xs md:text-sm font-medium">
                      Deadline: {job.deadline}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-500 dark:text-gray-300">
                    <Users
                      size={14}
                      className="text-brand-gold md:w-4 md:h-4"
                    />
                    <span className="text-xs md:text-sm font-medium">
                      Vacancies: {job.vacancies || "-"}
                      {job.vacanciesMale || job.vacanciesFemale
                        ? ` (M: ${job.vacanciesMale || 0}, F: ${job.vacanciesFemale || 0})`
                        : ""}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 md:pt-6 border-t border-gray-50">
                  <span className="text-base md:text-lg font-bold text-brand-blue">
                    {job.currency || "€"} {job.minSalary} - {job.maxSalary}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {job.type}
                  </span>
                </div>
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
            lists={lists}
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => {
              setIsModalOpen(false);
              fetchJobs();
            }}
          />
        )}
      </AnimatePresence>

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
              <h3 className="text-2xl font-bold text-brand-blue mb-4">
                Delete Job?
              </h3>
              <p className="text-gray-500 dark:text-gray-300 mb-8 leading-relaxed">
                Are you sure you want to delete this job listing? This action
                cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-grow px-6 py-3 rounded-xl font-bold text-gray-500 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 transition-all"
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
                  Delete Job
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface JobModalProps {
  job: Job | null;
  lists: {
    countries: string[];
    positions: string[];
    categories: string[];
  };
  onClose: () => void;
  onSuccess: () => void;
}

function JobModal({ job, lists, onClose, onSuccess }: JobModalProps) {
  const [activePricingTab, setActivePricingTab] = useState<
    "Nepal" | "Gulf" | "Europe"
  >("Nepal");
  const [formData, setFormData] = useState<Partial<Job>>(
    job || {
      title: "",
      country: "",
      category: "",
      minSalary: "",
      maxSalary: "",
      currency: "€",
      experience: "Entry Level",
      type: "Full-time",
      description: "",
      responsibilities: [""],
      requirements: [""],
      requiredDocuments: ["Passport Copy (Front & Back)", "Europass CV"],
      deadline: "",
      totalAmount: "",
      initialPay: "",
      payAfterWP: "",
      payAfterVisa: "",
      visaFeeMin: "",
      visaFeeMax: "",
      pricingNepal: {
        currency: "NPR",
        totalAmount: "",
        initialPay: "",
        payAfterWP: "",
        payAfterVisa: "",
        visaFeeMin: "",
        visaFeeMax: "",
        riskAmount: "",
      },
      pricingGulf: {
        currency: "AED",
        totalAmount: "",
        initialPay: "",
        payAfterWP: "",
        payAfterVisa: "",
        visaFeeMin: "",
        visaFeeMax: "",
        riskAmount: "",
      },
      pricingEurope: {
        currency: "€",
        totalAmount: "",
        initialPay: "",
        payAfterWP: "",
        payAfterVisa: "",
        visaFeeMin: "",
        visaFeeMax: "",
        riskAmount: "500",
      },
    },
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const storage = getStorage();
      const fileRef = ref(storage, `jobs/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setFormData({ ...formData, imageUrl: url });
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const generateWithAI = async () => {
    if (!formData.title || !formData.country) {
      toast.error("Please enter a Job Title and Country first");
      return;
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a professional job description, responsibilities (list), and requirements (list) for the position of "${formData.title}" in ${formData.country}. 
        IMPORTANT RULES:
        - Do NOT use markdown headings (no '#' symbols).
        - Use bold text for key points and make the tone natural and professional for an HR consultancy portal.
        Return the response in JSON format with the following keys: 
        "description" (string), 
        "responsibilities" (array of strings), 
        "requirements" (array of strings).`,
        config: {
          responseMimeType: "application/json",
        },
      });

      const data = JSON.parse(response.text);
      setFormData({
        ...formData,
        description: data.description,
        responsibilities: data.responsibilities,
        requirements: data.requirements,
      });
      toast.success("AI Content Generated!");
    } catch (error) {
      console.error("AI Generation Error:", error);
      toast.error("Failed to generate content with AI");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (job) {
        await updateDoc(doc(db, "jobs", job.id), {
          ...formData,
          updatedAt: serverTimestamp(),
        });
        toast.success("Job updated successfully");
      } else {
        await addDoc(collection(db, "jobs"), {
          ...formData,
          createdAt: Date.now(),
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

  const handleArrayChange = (
    field: "responsibilities" | "requirements" | "requiredDocuments",
    index: number,
    value: string,
  ) => {
    const newArray = [...(formData[field] as string[])];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const addArrayItem = (
    field: "responsibilities" | "requirements" | "requiredDocuments",
  ) => {
    setFormData({
      ...formData,
      [field]: [...(formData[field] as string[]), ""],
    });
  };

  const removeArrayItem = (
    field: "responsibilities" | "requirements" | "requiredDocuments",
    index: number,
  ) => {
    const newArray = (formData[field] as string[]).filter(
      (_, i) => i !== index,
    );
    setFormData({ ...formData, [field]: newArray });
  };

  const togglePredefinedDoc = (doc: string) => {
    const currentDocs = formData.requiredDocuments || [];
    if (currentDocs.includes(doc)) {
      setFormData({
        ...formData,
        requiredDocuments: currentDocs.filter((d) => d !== doc),
      });
    } else {
      // Filter out empty strings if any, then add
      const filtered = currentDocs.filter((d) => d.trim() !== "");
      setFormData({
        ...formData,
        requiredDocuments: [...filtered, doc],
      });
    }
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
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 p-6 md:p-12"
      >
        <div className="flex justify-between items-center mb-8 md:mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-brand-blue">
            {job ? "Edit Job" : "Post New Job"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-brand-blue transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Job Image */}
          <div className="space-y-4">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
              Job Image (Optional)
            </label>
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="w-full sm:w-48 h-32 bg-gray-50 dark:bg-white/5 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                {formData.imageUrl && formData.imageUrl !== "" ? (
                  <>
                    <img
                      referrerPolicy="no-referrer"
                      src={formData.imageUrl}
                      alt="Job Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: "" })}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    >
                      <Trash2 size={24} />
                    </button>
                  </>
                ) : (
                  <div className="text-gray-400 flex flex-col items-center gap-2">
                    <ImageIcon size={32} />
                    <span className="text-[10px] uppercase font-bold tracking-widest">
                      No Image
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-grow space-y-4 w-full">
                <div className="flex gap-2">
                  <input
                    className="flex-grow px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm"
                    value={formData.imageUrl || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, imageUrl: e.target.value })
                    }
                    placeholder="Paste image URL or upload"
                  />
                  <label className="bg-brand-blue text-white p-3 rounded-xl cursor-pointer hover:bg-brand-gold transition-all flex items-center justify-center min-w-[50px]">
                    {uploading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <Upload size={20} />
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                  Recommended: 1200x800px, Max 5MB
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            <div>
              <label className="block text-xs md:text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                Category
              </label>
              <input
                required
                list="job-categories"
                className="w-full px-4 py-2 md:py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all text-sm md:text-base"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                placeholder="e.g. Logistics"
              />
              <datalist id="job-categories">
                {lists.categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs md:text-sm font-bold text-gray-700 dark:text-gray-200">
                  Job Title
                </label>
                <button
                  type="button"
                  onClick={generateWithAI}
                  disabled={isGenerating}
                  className="text-brand-gold font-bold text-[10px] md:text-xs flex items-center gap-1 hover:text-brand-blue transition-colors disabled:opacity-50"
                >
                  {isGenerating ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <Sparkles size={10} />
                  )}
                  Generate with AI
                </button>
              </div>
              <input
                required
                list="job-positions"
                className="w-full px-4 py-2 md:py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all text-sm md:text-base"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g. Warehouse Worker"
              />
              <datalist id="job-positions">
                {(formData.category && CATEGORY_TO_POSITIONS[formData.category]
                  ? CATEGORY_TO_POSITIONS[formData.category]
                  : lists.positions
                ).map((pos) => (
                  <option key={pos} value={pos} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-xs md:text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                Country
              </label>
              <input
                required
                list="countries"
                className="w-full px-4 py-2 md:py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all text-sm md:text-base"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                placeholder="e.g. Poland"
              />
              <datalist id="countries">
                {lists.countries.map((country) => (
                  <option key={country} value={country} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6 md:gap-8">
            <div>
              <label className="block text-xs md:text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                Currency
              </label>
              <select
                className="w-full px-4 py-2 md:py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all text-sm md:text-base"
                value={formData.currency || "€"}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
              >
                <option value="€">Euro (€)</option>
                <option value="$">US Dollar ($)</option>
                <option value="£">British Pound (£)</option>
                <option value="AED">UAE Dirham (AED)</option>
                <option value="NPR">Nepalese Rupee (NPR)</option>
                <option value="PLN">Polish Zloty (PLN)</option>
                <option value="RON">Romanian Leu (RON)</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                  Min Salary
                </label>
                <input
                  required
                  className="w-full px-4 py-2 md:py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all text-sm md:text-base"
                  value={formData.minSalary}
                  onChange={(e) =>
                    setFormData({ ...formData, minSalary: e.target.value })
                  }
                  placeholder="e.g. 1200"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                  Max Salary
                </label>
                <input
                  required
                  className="w-full px-4 py-2 md:py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all text-sm md:text-base"
                  value={formData.maxSalary}
                  onChange={(e) =>
                    setFormData({ ...formData, maxSalary: e.target.value })
                  }
                  placeholder="e.g. 1500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <label className="block text-xs md:text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                Deadline
              </label>
              <input
                required
                type="date"
                className="w-full px-4 py-2 md:py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all text-sm md:text-base"
                value={formData.deadline}
                onChange={(e) =>
                  setFormData({ ...formData, deadline: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                Experience
              </label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all"
                value={formData.experience}
                onChange={(e) =>
                  setFormData({ ...formData, experience: e.target.value })
                }
              >
                <option value="Entry Level">Entry Level</option>
                <option value="1-3 Years">1-3 Years</option>
                <option value="3-5 Years">3-5 Years</option>
                <option value="5+ Years">5+ Years</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                Job Type
              </label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                Total Vacancies
              </label>
              <input
                type="number"
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all text-sm md:text-base"
                value={formData.vacancies || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    vacancies: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="e.g. 50"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                Vacancies (Male)
              </label>
              <input
                type="number"
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all text-sm md:text-base"
                value={formData.vacanciesMale || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    vacanciesMale: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="e.g. 30"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                Vacancies (Female)
              </label>
              <input
                type="number"
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all text-sm md:text-base"
                value={formData.vacanciesFemale || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    vacanciesFemale: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="e.g. 20"
              />
            </div>
          </div>

          {/* Fees & Package Section */}
          <div className="bg-gray-50 p-6 rounded-3xl space-y-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-brand-blue font-bold flex items-center gap-2">
                <CreditCard size={18} className="text-brand-gold" /> Fees &
                Package Details
              </h3>

              <div className="flex bg-white dark:bg-[#121212] p-1 rounded-xl border border-gray-200 shadow-sm self-stretch sm:self-auto">
                {(["Nepal", "Gulf", "Europe"] as const).map((region) => (
                  <button
                    key={region}
                    type="button"
                    onClick={() => setActivePricingTab(region)}
                    className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      activePricingTab === region
                        ? "bg-brand-blue text-white shadow-md"
                        : "text-gray-400 hover:text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>

            {/* Regional Pricing Fields */}
            {(() => {
              const regionKey = `pricing${activePricingTab}` as
                | "pricingNepal"
                | "pricingGulf"
                | "pricingEurope";
              const pricing = formData[regionKey] || {
                currency:
                  activePricingTab === "Nepal"
                    ? "NPR"
                    : activePricingTab === "Gulf"
                      ? "AED"
                      : "€",
              };

              const updatePricing = (updates: Partial<typeof pricing>) => {
                setFormData({
                  ...formData,
                  [regionKey]: { ...pricing, ...updates },
                });
              };

              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                        Currency
                      </label>
                      <input
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold bg-white dark:bg-[#121212] text-sm"
                        value={pricing.currency || ""}
                        onChange={(e) =>
                          updatePricing({ currency: e.target.value })
                        }
                        placeholder="e.g. NPR"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                        Total Amount
                      </label>
                      <input
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold bg-white dark:bg-[#121212] text-sm font-bold text-brand-blue"
                        value={pricing.totalAmount || ""}
                        onChange={(e) =>
                          updatePricing({ totalAmount: e.target.value })
                        }
                        placeholder="e.g. 1000"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                        Initial Pay
                      </label>
                      <input
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold bg-white dark:bg-[#121212] text-sm"
                        value={pricing.initialPay || ""}
                        onChange={(e) =>
                          updatePricing({ initialPay: e.target.value })
                        }
                        placeholder="e.g. 200"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                        After WP / After Visa
                      </label>
                      <div className="flex gap-2">
                        <input
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold bg-white dark:bg-[#121212] text-sm"
                          value={pricing.payAfterWP || ""}
                          onChange={(e) =>
                            updatePricing({ payAfterWP: e.target.value })
                          }
                          placeholder="WP"
                        />
                        <input
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold bg-white dark:bg-[#121212] text-sm"
                          value={pricing.payAfterVisa || ""}
                          onChange={(e) =>
                            updatePricing({ payAfterVisa: e.target.value })
                          }
                          placeholder="Visa"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50/50 rounded-2xl border border-yellow-100/50">
                    <label className="block text-[10px] font-bold text-yellow-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Sparkles size={12} /> Visa / VFS / Embassy Fees (
                      {activePricingTab})
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">
                          Min
                        </label>
                        <input
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold bg-white dark:bg-[#121212] text-sm"
                          value={pricing.visaFeeMin || ""}
                          onChange={(e) =>
                            updatePricing({ visaFeeMin: e.target.value })
                          }
                          placeholder="Min"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">
                          Max
                        </label>
                        <input
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold bg-white dark:bg-[#121212] text-sm"
                          value={pricing.visaFeeMax || ""}
                          onChange={(e) =>
                            updatePricing({ visaFeeMax: e.target.value })
                          }
                          placeholder="Max"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50">
                    <label className="block text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                      Risk Amount (In case of visa refusal)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                      <input
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold bg-white dark:bg-[#121212] text-sm"
                        value={pricing.riskAmount || ""}
                        onChange={(e) =>
                          updatePricing({ riskAmount: e.target.value })
                        }
                        placeholder="e.g. 500"
                      />
                      <p className="text-[10px] text-gray-500 dark:text-gray-300 font-medium italic">
                        This amount will be charged if the visa is refused.
                        Reapplication is always possible.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Inclusions & Exclusions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    Included in Package
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        includedPackageItems: [
                          ...(formData.includedPackageItems || []),
                          "",
                        ],
                      })
                    }
                    className="text-blue-600 font-bold text-[10px] flex items-center gap-1 hover:underline"
                  >
                    <Plus size={14} /> Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.includedPackageItems?.map((item, i) => (
                    <div key={i} className="flex gap-2 group">
                      <input
                        list="common-package-items"
                        className="flex-grow px-3 py-1.5 rounded-xl border border-blue-100 text-xs font-bold outline-none focus:border-blue-400"
                        value={item}
                        onChange={(e) => {
                          const items = [
                            ...(formData.includedPackageItems || []),
                          ];
                          items[i] = e.target.value;
                          setFormData({
                            ...formData,
                            includedPackageItems: items,
                          });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            includedPackageItems:
                              formData.includedPackageItems?.filter(
                                (_, idx) => idx !== i,
                              ),
                          })
                        }
                        className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest">
                    Candidate Pays (Excluded)
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        excludedPackageItems: [
                          ...(formData.excludedPackageItems || []),
                          "",
                        ],
                      })
                    }
                    className="text-rose-600 font-bold text-[10px] flex items-center gap-1 hover:underline"
                  >
                    <Plus size={14} /> Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.excludedPackageItems?.map((item, i) => (
                    <div key={i} className="flex gap-2 group">
                      <input
                        list="common-package-items"
                        className="flex-grow px-3 py-1.5 rounded-xl border border-rose-100 text-xs font-bold outline-none focus:border-rose-400"
                        value={item}
                        onChange={(e) => {
                          const items = [
                            ...(formData.excludedPackageItems || []),
                          ];
                          items[i] = e.target.value;
                          setFormData({
                            ...formData,
                            excludedPackageItems: items,
                          });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            excludedPackageItems:
                              formData.excludedPackageItems?.filter(
                                (_, idx) => idx !== i,
                              ),
                          })
                        }
                        className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
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

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                Other Fees / Notes
              </label>
              <input
                className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold bg-white dark:bg-[#121212] text-sm"
                value={formData.otherFees || ""}
                onChange={(e) =>
                  setFormData({ ...formData, otherFees: e.target.value })
                }
                placeholder="e.g. Medical: 50, Insurance: 30"
              />
            </div>

            <label className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl bg-gray-50/50 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-gray-300 text-brand-gold focus:ring-brand-gold"
                checked={!!formData.hideFeeDetails}
                onChange={(e) =>
                  setFormData({ ...formData, hideFeeDetails: e.target.checked })
                }
              />
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Hide Fees & Package Details from Candidates
                </p>
                <p className="text-xs text-slate-500">
                  Enable this to hide the financial breakdown on the job details
                  page.
                </p>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
              Job Description
            </label>
            <textarea
              required
              rows={6}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Detailed description of the job role..."
            ></textarea>
          </div>

          {/* Responsibilities */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
                Responsibilities
              </label>
              <button
                type="button"
                onClick={() => addArrayItem("responsibilities")}
                className="text-brand-gold font-bold text-sm flex items-center gap-1"
              >
                <Plus size={16} /> Add More
              </button>
            </div>
            <div className="space-y-4">
              {formData.responsibilities?.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="flex-grow px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold transition-all"
                    value={item}
                    onChange={(e) =>
                      handleArrayChange("responsibilities", i, e.target.value)
                    }
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem("responsibilities", i)}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Requirements */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
                Requirements
              </label>
              <button
                type="button"
                onClick={() => addArrayItem("requirements")}
                className="text-brand-gold font-bold text-sm flex items-center gap-1"
              >
                <Plus size={16} /> Add More
              </button>
            </div>
            <div className="space-y-4">
              {formData.requirements?.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="flex-grow px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold transition-all"
                    value={item}
                    onChange={(e) =>
                      handleArrayChange("requirements", i, e.target.value)
                    }
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem("requirements", i)}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Required Documents */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">
              Required Documents (Shown to Candidates)
            </label>

            {/* Predefined Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {PREDEFINED_DOCUMENTS.map((doc) => (
                <label
                  key={doc}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-brand-gold cursor-pointer transition-all"
                >
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-gray-300 text-brand-gold focus:ring-brand-gold"
                    checked={formData.requiredDocuments?.includes(doc)}
                    onChange={() => togglePredefinedDoc(doc)}
                  />
                  <span className="text-sm font-medium text-brand-blue">
                    {doc}
                  </span>
                </label>
              ))}
            </div>

            {/* Custom Documents */}
            <div className="flex justify-between items-center mb-4">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                Custom Documents
              </label>
              <button
                type="button"
                onClick={() => addArrayItem("requiredDocuments")}
                className="text-brand-gold font-bold text-sm flex items-center gap-1"
              >
                <Plus size={16} /> Add Custom
              </button>
            </div>
            <div className="space-y-4">
              {formData.requiredDocuments?.map((item, i) => {
                if (PREDEFINED_DOCUMENTS.includes(item)) return null;
                return (
                  <div key={i} className="flex gap-2">
                    <input
                      className="flex-grow px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold transition-all"
                      value={item}
                      onChange={(e) =>
                        handleArrayChange(
                          "requiredDocuments",
                          i,
                          e.target.value,
                        )
                      }
                      placeholder="e.g. Health Certificate"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem("requiredDocuments", i)}
                      className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8 border-t border-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-gray-500 dark:text-gray-300 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-brand-blue text-white px-12 py-3 rounded-xl font-bold hover:bg-brand-gold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? "Saving..." : job ? "Update Job" : "Post Job"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
