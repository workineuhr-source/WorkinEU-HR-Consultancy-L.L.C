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
      whileHover={{ y: -15 }}
      className="bg-white rounded-[3rem] overflow-hidden border border-slate-100 group flex flex-col h-full transition-all duration-700 hover:shadow-[0_60px_100px_-20px_rgba(15,23,42,0.15)] relative"
    >
      <Link to={`/diary/${post.id}`} className="flex flex-col h-full">
        <div className="relative h-80 overflow-hidden">
          <img
            src={getDirectImageUrl(
              post.imageUrl ||
              `https://images.unsplash.com/photo-1541746972996-4e0b0f43e01a?auto=format&fit=crop&q=80&w=800`
            )}
            alt={post.title}
            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-1000"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-700"></div>

          <div className="absolute top-6 right-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-2xl"
            >
              {post.category || "Updates"}
            </motion.div>
          </div>

          <div className="absolute bottom-8 left-8 right-8">
            <div className="flex items-center gap-6 text-white/80 text-[10px] font-bold uppercase tracking-[0.2em]">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-brand-gold" />
                {date}
              </div>
              {post.author && (
                <div className="flex items-center gap-2">
                  <User size={14} className="text-brand-gold" />
                  {post.author}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-10 flex flex-col flex-grow relative">
          <div className="absolute top-0 right-10 -translate-y-1/2 w-16 h-16 bg-brand-gold text-slate-900 dark:text-white rounded-2xl flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-transform duration-500">
            <ArrowRight size={28} />
          </div>

          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 group-hover:text-brand-gold transition-colors leading-[1.1] tracking-tighter font-serif">
            {post.title}
          </h3>

          <p className="text-slate-500 line-clamp-3 mb-10 leading-relaxed font-light flex-grow text-lg">
            {post.content}
          </p>

          <div className="flex items-center justify-between pt-8 border-t border-slate-50">
            <span className="text-slate-900 dark:text-white font-bold text-xs uppercase tracking-[0.3em] group-hover:text-brand-gold transition-colors">
              Read Full Story
            </span>
            <div className="w-10 h-1 bg-slate-100 group-hover:w-20 group-hover:bg-brand-gold transition-all duration-500 rounded-full"></div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
