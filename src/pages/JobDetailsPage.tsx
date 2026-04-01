import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Job } from '../types';
import { 
  MapPin, 
  Briefcase, 
  Calendar, 
  Clock, 
  ChevronLeft, 
  CheckCircle2, 
  FileText,
  Share2,
  MessageCircle
} from 'lucide-react';
import ApplicationForm from '../components/ApplicationForm';
import { motion } from 'motion/react';

export default function JobDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplyForm, setShowApplyForm] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'jobs', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setJob({ id: docSnap.id, ...docSnap.data() } as Job);
        }
      } catch (error) {
        console.error("Error fetching job:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job?.title,
        text: `Check out this job opportunity in ${job?.country}: ${job?.title}`,
        url: window.location.href,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-brand-blue mb-4">Job Not Found</h2>
        <Link to="/jobs" className="text-brand-gold font-bold flex items-center gap-2">
          <ChevronLeft size={20} /> Back to Job Portal
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/jobs" className="inline-flex items-center gap-2 text-gray-500 hover:text-brand-blue mb-8 transition-colors font-medium">
          <ChevronLeft size={20} /> Back to Listings
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
                <div>
                  <h1 className="text-4xl font-bold text-brand-blue mb-4">{job.title}</h1>
                  <div className="flex flex-wrap gap-4 text-gray-500">
                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full">
                      <MapPin size={18} className="text-brand-gold" />
                      <span className="font-medium">{job.country}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full">
                      <Briefcase size={18} className="text-brand-gold" />
                      <span className="font-medium">{job.category}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full">
                      <Clock size={18} className="text-brand-gold" />
                      <span className="font-medium">{job.type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleShare}
                    className="p-3 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition-all"
                    title="Share Job"
                  >
                    <Share2 size={20} />
                  </button>
                  <a 
                    href={`https://wa.me/971500000000?text=Hi, I'm interested in the ${job.title} position in ${job.country}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all"
                    title="Apply via WhatsApp"
                  >
                    <MessageCircle size={20} />
                  </a>
                </div>
              </div>

              <div className="prose prose-brand max-w-none mb-12">
                <h3 className="text-2xl font-bold text-brand-blue mb-4">Job Description</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                <div>
                  <h3 className="text-xl font-bold text-brand-blue mb-6 flex items-center gap-2">
                    <CheckCircle2 className="text-brand-gold" /> Responsibilities
                  </h3>
                  <ul className="space-y-4">
                    {job.responsibilities.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-600">
                        <span className="w-1.5 h-1.5 bg-brand-gold rounded-full mt-2 shrink-0"></span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-brand-blue mb-6 flex items-center gap-2">
                    <CheckCircle2 className="text-brand-gold" /> Requirements
                  </h3>
                  <ul className="space-y-4">
                    {job.requirements.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-600">
                        <span className="w-1.5 h-1.5 bg-brand-gold rounded-full mt-2 shrink-0"></span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-brand-blue/5 p-8 rounded-2xl border border-brand-blue/10">
                <h3 className="text-xl font-bold text-brand-blue mb-6 flex items-center gap-2">
                  <FileText className="text-brand-gold" /> Required Documents
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {job.requiredDocuments.map((doc, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100">
                      <div className="w-8 h-8 bg-brand-gold/10 text-brand-gold rounded-lg flex items-center justify-center shrink-0">
                        <FileText size={16} />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar / Apply Card */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 sticky top-32">
              <div className="mb-8">
                <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mb-2">Salary Package</p>
                <p className="text-3xl font-bold text-brand-blue">{job.salary}</p>
              </div>

              <div className="space-y-6 mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-brand-gold">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Deadline</p>
                    <p className="font-bold text-brand-blue">{job.deadline}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-brand-gold">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Experience</p>
                    <p className="font-bold text-brand-blue">{job.experience}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowApplyForm(true)}
                className="w-full bg-brand-blue text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-gold transition-all shadow-lg mb-4"
              >
                Apply for this Job
              </button>
              <p className="text-center text-xs text-gray-400">
                By applying, you agree to our Terms & Conditions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showApplyForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-brand-blue/60 backdrop-blur-sm"
            onClick={() => setShowApplyForm(false)}
          ></motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 p-8 md:p-12"
          >
            <button 
              onClick={() => setShowApplyForm(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-brand-blue transition-colors"
            >
              <X size={24} />
            </button>
            <ApplicationForm job={job} onSuccess={() => setShowApplyForm(false)} />
          </motion.div>
        </div>
      )}
    </div>
  );
}

function X({ size }: { size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
