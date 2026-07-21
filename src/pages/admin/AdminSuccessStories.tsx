import { getDirectImageUrl } from "../../lib/utils";
import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Upload,
  User,
  Globe,
  Briefcase,
  FileText,
  Save,
  X,
  Sparkles,
} from "lucide-react";
import { db } from "../../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { toast } from "sonner";
import { VisaSuccessStory } from "../../types";
import { motion, AnimatePresence } from "framer-motion";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { COUNTRIES, JOB_POSITIONS } from "../../constants";
import { Edit2 } from "lucide-react";

export default function AdminSuccessStories() {
  const [stories, setStories] = useState<VisaSuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingStory, setEditingStory] = useState<VisaSuccessStory | null>(
    null,
  );
  const [uploading, setUploading] = useState<"photo" | "visa" | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [newStory, setNewStory] = useState<Partial<VisaSuccessStory>>({
    candidateName: "",
    candidatePhotoUrl: "",
    visaImageUrl: "",
    country: "",
    position: "",
    story: "",
    order: 0,
  });

  const handleGenerateAI = async () => {
    if (!newStory.candidateName || !newStory.country || !newStory.position) {
      toast.error("Please enter Candidate Name, Country, and Position first.");
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading("AI is generating story and candidate photo...");
    try {
      const response = await fetch("/api/generate-success-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStory.candidateName,
          country: newStory.country,
          position: newStory.position,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate AI data");

      const data = await response.json();
      
      let finalPhotoUrl = newStory.candidatePhotoUrl;
      // If AI generated an image, upload it to storage
      if (data.imageUrl) {
        toast.loading("Uploading generated photo...", { id: toastId });
        const base64Response = await fetch(data.imageUrl);
        const blob = await base64Response.blob();
        const storage = getStorage();
        const storageRef = ref(storage, `success-stories/ai-photo-${Date.now()}`);
        await uploadBytes(storageRef, blob);
        finalPhotoUrl = await getDownloadURL(storageRef);
      }

      setNewStory((prev) => ({
        ...prev,
        story: data.story || prev.story,
        candidatePhotoUrl: finalPhotoUrl,
      }));
      
      toast.success("AI Generation Complete!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate with AI", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const q = query(
      collection(db, "successStories"),
      orderBy("order", "asc"),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStories(
        snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as VisaSuccessStory,
        ),
      );
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "photo" | "visa",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(type);
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `success-stories/${type}-${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      if (type === "photo") {
        setNewStory({ ...newStory, candidatePhotoUrl: url });
      } else {
        setNewStory({ ...newStory, visaImageUrl: url });
      }

      toast.success(
        `${type === "photo" ? "Candidate photo" : "Visa image"} uploaded!`,
      );
    } catch (error: any) {
      console.error("Upload error:", error);
      let errorMessage = "Failed to upload image";
      if (error.code === "storage/unauthorized") {
        errorMessage =
          "Permission denied. Please ensure you are logged in as an administrator.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setUploading(null);
    }
  };

  const handleAddStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newStory.candidateName ||
      !newStory.candidatePhotoUrl ||
      !newStory.visaImageUrl ||
      !newStory.country ||
      !newStory.position
    ) {
      toast.error("Please fill all required fields and upload both images");
      return;
    }

    try {
      if (editingStory) {
        await setDoc(
          doc(db, "successStories", editingStory.id),
          {
            ...newStory,
            updatedAt: Date.now(),
          },
          { merge: true },
        );
        toast.success("Success story updated!");
      } else {
        await addDoc(collection(db, "successStories"), {
          ...newStory,
          createdAt: Date.now(),
          order: stories.length,
        });
        toast.success("Success story added!");
      }
      setIsAdding(false);
      setEditingStory(null);
      setNewStory({
        candidateName: "",
        candidatePhotoUrl: "",
        visaImageUrl: "",
        country: "",
        position: "",
        story: "",
        order: 0,
      });
    } catch (error) {
      toast.error("Failed to save story");
    }
  };

  const handleEdit = (story: VisaSuccessStory) => {
    setEditingStory(story);
    setNewStory({
      candidateName: story.candidateName,
      candidatePhotoUrl: story.candidatePhotoUrl,
      visaImageUrl: story.visaImageUrl,
      country: story.country,
      position: story.position,
      story: story.story,
      order: story.order,
    });
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "successStories", id));
      toast.success("Story deleted");
    } catch (error) {
      toast.error("Failed to delete story");
    }
  };

  if (loading)
    return (
      <div className="animate-pulse h-96 bg-white dark:bg-[#121212] rounded-2xl"></div>
    );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white dark:bg-[#121212] p-8 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-brand-blue">
            Visa Success Stories
          </h1>
          <p className="text-gray-500 dark:text-gray-300">
            Manage candidate photos and received visas to showcase on the home
            page.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-brand-blue text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-brand-gold hover:text-brand-blue transition-all shadow-xl shadow-brand-blue/20"
        >
          <Plus size={20} /> Add New Story
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white p-8 rounded-3xl shadow-lg border border-brand-gold/20 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-brand-blue">
                {editingStory ? "Edit Success Story" : "Add New Success Story"}
              </h2>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingStory(null);
                }}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddStory} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Candidate Info */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest mb-2">
                      Candidate Name
                    </label>
                    <div className="relative">
                      <User
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        required
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                        value={newStory.candidateName}
                        onChange={(e) =>
                          setNewStory({
                            ...newStory,
                            candidateName: e.target.value,
                          })
                        }
                        placeholder="Full Name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest mb-2">
                      Country
                    </label>
                    <div className="relative">
                      <Globe
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        required
                        list="countries-list"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                        value={newStory.country}
                        onChange={(e) =>
                          setNewStory({ ...newStory, country: e.target.value })
                        }
                        placeholder="e.g. Poland"
                      />
                      <datalist id="countries-list">
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest mb-2">
                      Position
                    </label>
                    <div className="relative">
                      <Briefcase
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        required
                        list="job-positions"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                        value={newStory.position}
                        onChange={(e) =>
                          setNewStory({ ...newStory, position: e.target.value })
                        }
                        placeholder="e.g. Warehouse Worker"
                      />
                      <datalist id="job-positions">
                        {JOB_POSITIONS.map((pos) => (
                          <option key={pos} value={pos} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>

                {/* Images */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest mb-2">
                      Candidate Photo
                    </label>
                    <div className="space-y-3">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                          {newStory.candidatePhotoUrl &&
                          newStory.candidatePhotoUrl !== "" ? (
                            <img
                              referrerPolicy="no-referrer"
                              src={getDirectImageUrl(newStory.candidatePhotoUrl)}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <ImageIcon className="text-gray-300" size={24} />
                          )}
                        </div>
                        <label className="flex-grow bg-brand-blue/5 border border-brand-blue/10 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-brand-blue/10 transition-all">
                          {uploading === "photo" ? (
                            <Loader2 className="animate-spin text-brand-blue" />
                          ) : (
                            <Upload
                              className="text-brand-blue mb-1"
                              size={18}
                            />
                          )}
                          <span className="text-[9px] font-bold text-brand-blue uppercase">
                            Upload Photo
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, "photo")}
                          />
                        </label>
                      </div>
                      <input
                        type="text"
                        className="w-full px-3 py-2 rounded-xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-[10px]"
                        value={newStory.candidatePhotoUrl || ""}
                        onChange={(e) =>
                          setNewStory({
                            ...newStory,
                            candidatePhotoUrl: e.target.value,
                          })
                        }
                        placeholder="Or Candidate Photo URL..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest mb-2">
                      Visa Image
                    </label>
                    <div className="space-y-3">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                          {newStory.visaImageUrl &&
                          newStory.visaImageUrl !== "" ? (
                            <img
                              referrerPolicy="no-referrer"
                              src={getDirectImageUrl(newStory.visaImageUrl)}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <FileText className="text-gray-300" size={24} />
                          )}
                        </div>
                        <label className="flex-grow bg-brand-gold/5 border border-brand-gold/10 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-brand-gold/10 transition-all">
                          {uploading === "visa" ? (
                            <Loader2 className="animate-spin text-brand-gold" />
                          ) : (
                            <Upload
                              className="text-brand-gold mb-1"
                              size={18}
                            />
                          )}
                          <span className="text-[9px] font-bold text-brand-gold uppercase">
                            Upload Visa
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, "visa")}
                          />
                        </label>
                      </div>
                      <input
                        type="text"
                        className="w-full px-3 py-2 rounded-xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-[10px]"
                        value={newStory.visaImageUrl || ""}
                        onChange={(e) =>
                          setNewStory({
                            ...newStory,
                            visaImageUrl: e.target.value,
                          })
                        }
                        placeholder="Or Visa Image URL..."
                      />
                    </div>
                  </div>
                </div>

                {/* Story Note */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest">
                      Short Story/Note (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateAI}
                      disabled={isGenerating}
                      className="text-[10px] font-black uppercase tracking-widest bg-brand-gold/10 text-brand-gold px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-brand-gold/20 transition-all disabled:opacity-50"
                    >
                      {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      AI Auto-Fill
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm"
                    value={newStory.story}
                    onChange={(e) =>
                      setNewStory({ ...newStory, story: e.target.value })
                    }
                    placeholder="Write a small success note..."
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-8 py-3.5 rounded-2xl font-bold text-gray-500 dark:text-gray-300 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-blue text-white px-10 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-brand-gold hover:text-brand-blue transition-all shadow-xl shadow-brand-blue/20"
                >
                  <Save size={20} />{" "}
                  {editingStory ? "Update Success Story" : "Save Success Story"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {stories.map((story) => (
          <motion.div
            layout
            key={story.id}
            className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden group"
          >
            <div className="relative h-48 bg-gray-100">
              {story.visaImageUrl && story.visaImageUrl !== "" && (
                <img
                  referrerPolicy="no-referrer"
                  src={getDirectImageUrl(story.visaImageUrl)}
                  className="w-full h-full object-contain"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl border-2 border-white overflow-hidden shadow-lg">
                  {story.candidatePhotoUrl &&
                    story.candidatePhotoUrl !== "" && (
                      <img
                        referrerPolicy="no-referrer"
                        src={getDirectImageUrl(story.candidatePhotoUrl)}
                        className="w-full h-full object-contain"
                      />
                    )}
                </div>
                <div className="text-white">
                  <h3 className="font-bold leading-tight">
                    {story.candidateName}
                  </h3>
                  <p className="text-[10px] text-white/70 uppercase tracking-widest">
                    {story.position}
                  </p>
                </div>
              </div>
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => handleEdit(story)}
                  className="w-10 h-10 bg-white/90 text-blue-500 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-500 hover:text-white shadow-lg"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => setDeleteConfirmId(story.id)}
                  className="w-10 h-10 bg-white/90 text-red-500 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-lg"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 text-brand-gold mb-3">
                <Globe size={14} />
                <span className="text-xs font-bold uppercase tracking-widest">
                  {story.country}
                </span>
              </div>
              {story.story && (
                <div 
                  className="text-gray-500 dark:text-gray-300 text-sm line-clamp-3 italic prose-sm"
                  dangerouslySetInnerHTML={{ __html: `"${story.story}"` }} 
                />
              )}
              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                <span className="text-[10px] text-gray-400 font-medium">
                  Added on {new Date(story.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {stories.length === 0 && !isAdding && (
        <div className="bg-white p-20 rounded-[3rem] text-center border border-dashed border-gray-200">
          <ImageIcon className="mx-auto text-gray-200 mb-6" size={64} />
          <h3 className="text-2xl font-bold text-brand-blue mb-2">
            No Success Stories Yet
          </h3>
          <p className="text-gray-400 max-w-md mx-auto mb-8">
            Start by adding your first visa success story to showcase your
            achievements to potential candidates.
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="bg-brand-blue text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-brand-gold hover:text-brand-blue transition-all"
          >
            Add First Story
          </button>
        </div>
      )}

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
                Delete Success Story?
              </h3>
              <p className="text-gray-500 dark:text-gray-300 mb-8 leading-relaxed">
                Are you sure you want to delete this success story? This action
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
                  Delete Story
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
