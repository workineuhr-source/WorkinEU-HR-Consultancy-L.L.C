import { getDirectImageUrl } from "../lib/utils";
import { motion } from "motion/react";
import { Calendar, User, ArrowRight } from "lucide-react";
import { DiaryPost } from "../types";
import { Link } from "react-router-dom";

interface DiaryCardProps {
  post: DiaryPost;
}

export default function DiaryCard({ post }: DiaryCardProps) {
  const date = new Date(post.createdAt).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="bg-white dark:bg-white/5 rounded-3xl overflow-hidden border border-slate-100 dark:border-white/5 group flex flex-col h-full transition-all duration-700 hover:shadow-2xl hover:shadow-brand-teal/10 relative"
    >
      <Link to={`/diary/${post.id}`} className="flex flex-col h-full">
        <div className="relative h-64 overflow-hidden">
          <img
            src={getDirectImageUrl(
              post.imageUrl ||
              `https://images.unsplash.com/photo-1541746972996-4e0b0f43e01a?auto=format&fit=crop&q=80&w=800`
            )}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-700"></div>

          <div className="absolute top-5 right-5">
            <span className="bg-brand-gold text-slate-900 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
              {post.category || "Updates"}
            </span>
          </div>

          <div className="absolute bottom-5 left-6 right-6">
            <div className="flex flex-wrap items-center gap-4 text-white/90 text-xs font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-brand-teal" />
                {date}
              </div>
              {post.author && (
                <div className="flex items-center gap-1.5">
                  <User size={14} className="text-brand-teal" />
                  {post.author}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 flex flex-col flex-grow bg-white dark:bg-transparent">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 group-hover:text-brand-teal transition-colors leading-snug tracking-tight font-sans line-clamp-2">
            {post.title}
          </h3>

          <p className="text-slate-500 dark:text-slate-400 line-clamp-3 mb-8 leading-relaxed font-normal flex-grow text-base">
            {post.content}
          </p>

          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5 mt-auto">
            <span className="text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-[0.3em] group-hover:text-brand-teal transition-colors flex items-center gap-2">
              Read Story
              <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </span>
            <div className="w-8 h-1 bg-slate-200 dark:bg-white/10 group-hover:w-16 group-hover:bg-brand-teal transition-all duration-500 rounded-full"></div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
