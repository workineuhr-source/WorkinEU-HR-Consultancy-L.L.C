import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Job } from '../types';
import JobCard from '../components/JobCard';
import { Search, Filter, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    country: '',
    category: '',
    experience: '',
  });

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
        setJobs(jobsData);
        setFilteredJobs(jobsData);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    let result = jobs;

    if (searchTerm) {
      result = result.filter(job => 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.country) {
      result = result.filter(job => job.country === filters.country);
    }

    if (filters.category) {
      result = result.filter(job => job.category === filters.category);
    }

    if (filters.experience) {
      result = result.filter(job => job.experience.includes(filters.experience));
    }

    setFilteredJobs(result);
  }, [searchTerm, filters, jobs]);

  const countries = Array.from(new Set(jobs.map(j => j.country)));
  const categories = Array.from(new Set(jobs.map(j => j.category)));
  const experiences = ["Entry Level", "1-3 Years", "3-5 Years", "5+ Years"];

  const clearFilters = () => {
    setFilters({ country: '', category: '', experience: '' });
    setSearchTerm('');
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-brand-blue mb-4">Job Portal</h1>
          <p className="text-gray-600">Find your dream career in Europe. Filter through hundreds of verified opportunities.</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Search by job title, country, or category..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-50 text-brand-blue font-bold rounded-xl hover:bg-gray-100 transition-all border border-gray-100"
            >
              <SlidersHorizontal size={20} />
              Filters
              {(filters.country || filters.category || filters.experience) && (
                <span className="w-2 h-2 bg-brand-gold rounded-full"></span>
              )}
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 mt-6 border-t border-gray-50">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Country</label>
                    <select 
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold"
                      value={filters.country}
                      onChange={(e) => setFilters({...filters, country: e.target.value})}
                    >
                      <option value="">All Countries</option>
                      {countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                    <select 
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold"
                      value={filters.category}
                      onChange={(e) => setFilters({...filters, category: e.target.value})}
                    >
                      <option value="">All Categories</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Experience</label>
                    <select 
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-gold"
                      value={filters.experience}
                      onChange={(e) => setFilters({...filters, experience: e.target.value})}
                    >
                      <option value="">Any Experience</option>
                      {experiences.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <button 
                    onClick={clearFilters}
                    className="text-sm font-bold text-gray-400 hover:text-brand-blue flex items-center gap-1"
                  >
                    <X size={16} /> Clear All Filters
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-xl h-64 animate-pulse border border-gray-100"></div>
            ))}
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
              <Filter size={40} />
            </div>
            <h3 className="text-2xl font-bold text-brand-blue mb-2">No jobs found</h3>
            <p className="text-gray-500 mb-8">Try adjusting your filters or search terms.</p>
            <button 
              onClick={clearFilters}
              className="bg-brand-blue text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-gold transition-all"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
