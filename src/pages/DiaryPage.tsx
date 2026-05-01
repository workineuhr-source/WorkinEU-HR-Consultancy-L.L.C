import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { DiaryPost } from "../types";
import DiaryCard from "../components/DiaryCard";
import { Loader2, Search, Filter } from "lucide-react";
import BottomCTA from "../components/BottomCTA";

export default function DiaryPage() {
  const [posts, setPosts] = useState<DiaryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const q = query(collection(db, "diary"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const diaryData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as DiaryPost,
        );
        setPosts(diaryData);
      } catch (error) {
        console.error("Error fetching diary posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const categories = [
    "All",
    ...Array.from(new Set(posts.map((p) => p.category).filter(Boolean))),
  ];

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Fallback posts if none in DB
  const displayPosts =
    filteredPosts.length > 0
      ? filteredPosts
      : posts.length === 0 && !loading
        ? [
            {
              id: "1",
              title: "Successful Placement of 50+ Candidates in Poland",
              content:
                "We are thrilled to announce the successful placement of over 50 skilled workers in the construction and logistics sectors across Poland this month. Our commitment to ethical recruitment continues to drive success for both employers and candidates.",
              imageUrl:
                "https://images.unsplash.com/photo-1541746972996-4e0b0f43e01a?auto=format&fit=crop&q=80&w=800",
              author: "Admin",
              category: "Success Stories",
              createdAt: Date.now() - 86400000 * 2,
            },
            {
              id: "2",
              title: "New Visa Regulations for Germany: What You Need to Know",
              content:
                "Germany has recently updated its skilled migration laws, making it easier for qualified professionals from non-EU countries to secure work permits. Our experts break down the key changes and how they benefit our candidates.",
              imageUrl:
                "https://images.unsplash.com/photo-1589252392322-45cbbdad6f73?auto=format&fit=crop&q=80&w=800",
              author: "Legal Team",
              category: "Visa Updates",
              createdAt: Date.now() - 86400000 * 5,
            },
            {
              id: "3",
              title: "Expanding Our Reach: New Branch Office in Nepal",
              content:
                "To better serve our candidates in South Asia, WorkinEU has officially opened its new branch office in Kathmandu, Nepal. This expansion allows us to provide more localized support and faster processing for our Nepalese applicants.",
              imageUrl:
                "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800",
              author: "Management",
              category: "Company News",
              createdAt: Date.now() - 86400000 * 10,
            },
          ]
        : filteredPosts;

  return (
    <div className="min-h-screen bg-slate-50/50 pt-40 pb-32 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-mesh opacity-20 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-gold/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2 animate-pulse"></div>

      <div className="max-w-[1920px] mx-auto px-4 md:px-8 lg:px-12 relative z-10">
        <div className="mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <span className="text-brand-gold font-bold uppercase tracking-[0.5em] mb-8 block text-xs">
              Our Diary
            </span>
            <h1 className="text-6xl md:text-9xl font-bold text-slate-900 dark:text-white mb-10 tracking-tighter leading-none">
              Stories from <br /> the{" "}
              <span className="text-brand-gold italic">Field</span>
            </h1>
            <p className="text-slate-500 text-2xl font-light leading-relaxed">
              Stay updated with the latest news, success stories, and visa
              updates from WorkinEU.
            </p>
          </motion.div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 mb-20 items-center justify-between bg-white dark:bg-[#121212] p-10 rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(15,23,42,0.1)] border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>

          <div className="relative w-full lg:w-[450px] group">
            <Search
              className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-gold transition-colors"
              size={24}
            />
            <input
              type="text"
              placeholder="Search stories..."
              className="w-full pl-20 pr-10 py-6 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-slate-100 focus:border-brand-gold focus:bg-white outline-none focus:ring-8 focus:ring-brand-gold/5 transition-all duration-500 text-slate-900 dark:text-white font-medium shadow-inner text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-6 overflow-x-auto w-full lg:w-auto pb-4 lg:pb-0 no-scrollbar relative z-10">
            <div className="w-12 h-12 bg-brand-gold/10 text-brand-gold rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
              <Filter size={24} />
            </div>
            {categories.map((cat) => (
              <motion.button
                key={cat}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(cat || "All")}
                className={`px-10 py-5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap shadow-sm ${
                  selectedCategory === (cat || "All")
                    ? "bg-slate-900 text-white shadow-xl"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100"
                }`}
              >
                {cat}
              </motion.button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-10">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-brand-gold"></div>
            <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-xs">
              Loading Stories...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {displayPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <DiaryCard post={post as DiaryPost} />
              </motion.div>
            ))}
          </div>
        )}

        {!loading && displayPosts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-40 bg-white dark:bg-[#121212] rounded-[5rem] border border-slate-100 shadow-2xl"
          >
            <div className="w-40 h-40 bg-slate-50 dark:bg-white/5 rounded-[3rem] flex items-center justify-center mx-auto mb-12 text-slate-200 shadow-inner">
              <Search size={72} />
            </div>
            <h3 className="text-5xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
              No stories found
            </h3>
            <p className="text-slate-500 text-2xl font-light mb-16 max-w-lg mx-auto leading-relaxed">
              Try adjusting your search or category filter to find what you're
              looking for.
            </p>
            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="bg-brand-gold text-slate-900 dark:text-white px-16 py-6 rounded-[2rem] font-bold text-xl shadow-2xl hover:bg-slate-900 hover:text-white transition-all"
            >
              Reset All Filters
            </motion.button>
          </motion.div>
        )}
      </div>
      <BottomCTA />
    </div>
  );
}
