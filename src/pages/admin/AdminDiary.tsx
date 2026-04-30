import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, deleteDoc, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { DiaryPost } from '../../types';
import { Plus, Search, Edit2, Trash2, Calendar, X, Sparkles, Loader2, User, Tag, Image as ImageIcon, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

export default function AdminDiary() {
  const [posts, setPosts] = useState<DiaryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<DiaryPost | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const q = query(collection(db, 'diary'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DiaryPost)));
    } catch (error) {
      console.error("Error fetching diary posts:", error);
      toast.error("Failed to load diary posts");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'diary', id));
      toast.success("Post deleted successfully");
      fetchPosts();
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  const openEditModal = (post: DiaryPost) => {
    setEditingPost(post);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingPost(null);
    setIsModalOpen(true);
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (post.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 md:gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-blue">Diary Management</h1>
          <p className="text-gray-500 text-xs md:text-base">Manage your blog posts, success stories, and updates.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="w-full sm:w-auto bg-brand-blue text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-gold transition-all shadow-lg"
        >
          <Plus size={20} /> Create New Story
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search by title or category..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-xl outline-none focus:border-brand-gold transition-all text-sm shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {[1, 2, 3].map(i => <div key={i} className="h-80 bg-white rounded-2xl animate-pulse"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filteredPosts.map((post) => (
            <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group flex flex-col">
              <div className="h-48 relative overflow-hidden">
                <img 
                  src={post.imageUrl || 'https://images.unsplash.com/photo-1541746972996-4e0b0f43e01a?auto=format&fit=crop&q=80&w=800'} 
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-brand-gold text-brand-blue text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                    {post.category}
                  </span>
                </div>
              </div>
              
              <div className="p-6 flex-grow flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-brand-blue line-clamp-2 leading-tight group-hover:text-brand-gold transition-colors">
                    {post.title}
                  </h3>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-6">
                  <div className="flex items-center gap-1">
                    <User size={12} />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-auto pt-4 border-t border-gray-50">
                  <button 
                    onClick={() => openEditModal(post)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => setDeleteConfirmId(post.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Diary Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <DiaryModal 
            post={editingPost} 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={() => {
              setIsModalOpen(false);
              fetchPosts();
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
              <h3 className="text-2xl font-bold text-brand-blue mb-4">Delete Story?</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Are you sure you want to delete this diary entry? This action cannot be undone.
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

interface DiaryModalProps {
  post: DiaryPost | null;
  onClose: () => void;
  onSuccess: () => void;
}

function DiaryModal({ post, onClose, onSuccess }: DiaryModalProps) {
  const [formData, setFormData] = useState<Partial<DiaryPost>>(
    post || {
      title: '',
      content: '',
      imageUrl: '',
      author: 'Admin',
      category: 'Success Stories',
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `diary/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setFormData({ ...formData, imageUrl: url });
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const generateWithAI = async () => {
    if (!formData.title) {
      toast.error("Please enter a Title first");
      return;
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Write a professional blog post/diary entry for an HR consultancy called WorkinEU. 
        The title is "${formData.title}". 
        The category is "${formData.category}".
        IMPORTANT RULES:
        - Do NOT use markdown headings (no '#' symbols).
        - Use bold text (**like this**) for important key points instead of headings.
        - Make it sound natural, human-written, engaging, professional, and informative.
        Return the response in JSON format with a single key "content" (string).`,
        config: {
          responseMimeType: "application/json"
        }
      });

      const data = JSON.parse(response.text);
      setFormData({
        ...formData,
        content: data.content
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
      if (post) {
        await updateDoc(doc(db, 'diary', post.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        toast.success("Story updated successfully");
      } else {
        await addDoc(collection(db, 'diary'), {
          ...formData,
          createdAt: Date.now()
        });
        toast.success("Story created successfully");
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving story:", error);
      toast.error("Failed to save story");
    } finally {
      setIsSubmitting(false);
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
          <h2 className="text-2xl md:text-3xl font-bold text-brand-blue">{post ? 'Edit Story' : 'Create New Story'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-brand-blue transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-gray-700">Title</label>
                  <button 
                    type="button"
                    onClick={generateWithAI}
                    disabled={isGenerating}
                    className="text-brand-gold font-bold text-xs flex items-center gap-1 hover:text-brand-blue transition-colors disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    Generate with AI
                  </button>
                </div>
                <input 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Successful Placement of 50+ Candidates"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Author</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <select 
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all appearance-none"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="Success Stories">Success Stories</option>
                      <option value="Visa Updates">Visa Updates</option>
                      <option value="Company News">Company News</option>
                      <option value="Travel Tips">Travel Tips</option>
                      <option value="Career Advice">Career Advice</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Image</label>
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="Image URL or upload"
                    />
                  </div>
                  <label className="bg-brand-blue/5 p-3 rounded-xl cursor-pointer hover:bg-brand-blue/10 transition-all flex items-center justify-center text-brand-blue shrink-0">
                    {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </label>
                </div>
                {formData.imageUrl && formData.imageUrl !== "" && (
                  <div className="mt-4 aspect-video rounded-xl overflow-hidden border border-gray-100">
                    <img referrerPolicy="no-referrer" src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <p className="text-[10px] text-gray-400 mt-2 italic">Upload an image or provide a URL. Leave blank for a placeholder.</p>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="block text-sm font-bold text-gray-700 mb-2">Content</label>
              <textarea 
                required
                className="flex-grow w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all min-h-[300px]"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your story here..."
              ></textarea>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8 border-t border-gray-50">
            <button 
              type="button" 
              onClick={onClose}
              className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-brand-blue text-white px-12 py-3 rounded-xl font-bold hover:bg-brand-gold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? "Saving..." : post ? "Update Story" : "Publish Story"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
