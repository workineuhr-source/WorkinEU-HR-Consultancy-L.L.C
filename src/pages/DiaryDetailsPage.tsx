import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { DiaryPost } from "../types";
import { motion } from "motion/react";
import {
  Calendar,
  User,
  ArrowLeft,
  Share2,
  Bookmark,
  Home,
} from "lucide-react";

export default function DiaryDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<DiaryPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      try {
        const docSnap = await getDoc(doc(db, "diary", id));
        if (docSnap.exists()) {
          setPost({ id: docSnap.id, ...docSnap.data() } as DiaryPost);
        }
      } catch (error) {
        console.error("Error fetching diary post:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#121212]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#121212] px-6">
        <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">
          Story Not Found
        </h2>
        <Link
          to="/diary"
          className="text-brand-gold font-bold flex items-center gap-2 hover:underline"
        >
          <ArrowLeft size={20} /> Back to Diary
        </Link>
      </div>
    );
  }

  const date = new Date(post.createdAt).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* Back Buttons */}
        <div className="flex items-center gap-6 mb-12">
          <Link
            to="/diary"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-brand-gold transition-colors group"
          >
            <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center group-hover:border-brand-gold transition-colors shadow-sm">
              <ArrowLeft size={18} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">
              Back to Diary
            </span>
          </Link>
          <div className="h-4 w-px bg-slate-100"></div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-brand-teal transition-colors group"
          >
            <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center group-hover:border-brand-teal transition-colors shadow-sm text-brand-teal">
              <Home size={18} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">
              Site Home
            </span>
          </Link>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-8">
            <span className="bg-brand-gold/10 text-brand-gold px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em]">
              {post.category || "Updates"}
            </span>
            <div className="h-px flex-grow bg-slate-100"></div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-8 leading-[1.1] tracking-tight font-serif">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-8 text-slate-400 text-sm">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-brand-gold" />
              {date}
            </div>
            {post.author && (
              <div className="flex items-center gap-2">
                <User size={16} className="text-brand-gold" />
                By {post.author}
              </div>
            )}
            <div className="flex items-center gap-4 ml-auto">
              <button className="hover:text-brand-gold transition-colors">
                <Share2 size={18} />
              </button>
              <button className="hover:text-brand-gold transition-colors">
                <Bookmark size={18} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Featured Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative aspect-video rounded-[3rem] overflow-hidden mb-16 shadow-2xl"
        >
          <img
            src={
              post.imageUrl ||
              `https://images.unsplash.com/photo-1541746972996-4e0b0f43e01a?auto=format&fit=crop&q=80&w=1200`
            }
            alt={post.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="prose prose-xl prose-slate max-w-none"
        >
          <div className="text-slate-600 dark:text-slate-300 leading-relaxed font-light whitespace-pre-wrap text-xl">
            {post.content}
          </div>
        </motion.div>

        {/* Footer CTA */}
        <div className="mt-20 p-12 bg-slate-50 dark:bg-white/5 rounded-[3rem] border border-slate-100 text-center">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Interested in starting your journey?
          </h3>
          <p className="text-slate-500 mb-8 font-light">
            Contact our experts today for a free consultation.
          </p>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-3 bg-brand-blue text-white px-10 py-4 rounded-2xl font-bold hover:bg-brand-gold transition-all shadow-xl"
          >
            Browse Jobs <ArrowLeft className="rotate-180" size={20} />
          </Link>
        </div>
      </div>
    </div>
  );
}
