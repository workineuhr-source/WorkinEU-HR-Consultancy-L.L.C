import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { CandidateProfile } from '../../types';
import { Search, User, Mail, Phone, Globe, CreditCard, FileText, Trash2, Eye, Download, Save, Loader2, Plus, MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import EuropassCV from '../../components/EuropassCV';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CURRENCY_SYMBOLS } from '../../constants';

export default function AdminCandidates() {
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cvCandidate, setCvCandidate] = useState<CandidateProfile | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'candidates'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as CandidateProfile));
      setCandidates(data);
      setFilteredCandidates(data);
    } catch (error) {
      console.error("Error fetching candidates:", error);
      toast.error("Failed to load candidates.");
    } finally {
      setLoading(false);
    }
  };

  const downloadEuropassCV = async (candidate: CandidateProfile) => {
    const toastId = toast.loading(`Generating CV for ${candidate.fullName}...`);
    
    try {
      setCvCandidate(candidate);
      
      // Allow state to set and template to render
      setTimeout(async () => {
        try {
          const element = document.getElementById('europass-cv-quick-template');
          if (!element) throw new Error("Template not found");

          const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });
          
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`Europass_CV_${(candidate.fullName || 'Candidate').replace(/\s+/g, '_')}.pdf`);
          
          setCvCandidate(null);
          toast.success("CV Downloaded!", { id: toastId });
        } catch (error) {
          console.error("PDF Generation Error:", error);
          toast.error("Failed to generate PDF", { id: toastId });
          setCvCandidate(null);
        }
      }, 500);
    } catch (error) {
      toast.error("Failed to start CV generation", { id: toastId });
    }
  };

  useEffect(() => {
    const result = candidates.filter(c => 
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm))
    );
    setFilteredCandidates(result);
  }, [searchTerm, candidates]);

  const handleDelete = async (uid: string) => {
    if (!window.confirm("Are you sure you want to delete this candidate?")) return;
    try {
      await deleteDoc(doc(db, 'candidates', uid));
      toast.success("Candidate profile deleted.");
      fetchCandidates();
    } catch (error) {
      toast.error("Failed to delete candidate.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-blue">Registered Candidates</h1>
          <p className="text-gray-500 text-xs md:text-base">Manage users who have registered through the candidate portal.</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search candidates..."
            className="w-full pl-12 pr-4 py-2 md:py-3 rounded-xl border border-gray-100 focus:border-brand-gold outline-none transition-all text-sm md:text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 animate-pulse h-64"></div>
          ))
        ) : filteredCandidates.map((candidate) => (
          <div key={candidate.uid} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-brand-blue/5 text-brand-blue rounded-2xl flex items-center justify-center text-xl md:text-2xl font-bold shrink-0">
                  {(candidate.fullName || 'C').charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-bold text-brand-blue truncate text-sm md:text-base">{candidate.fullName || 'Candidate Name'}</h3>
                  <p className="text-[10px] md:text-xs text-gray-400 truncate">{candidate.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 md:space-y-3 mb-6 md:mb-8">
              <div className="flex items-center gap-3 text-xs md:text-sm text-gray-500">
                <Phone size={14} className="text-brand-gold md:w-4 md:h-4" />
                <span className="truncate">{candidate.phone || 'No phone'}</span>
              </div>
              <div className="flex items-center gap-3 text-xs md:text-sm text-gray-500">
                <Globe size={14} className="text-brand-gold md:w-4 md:h-4" />
                <span className="truncate">{candidate.nationality || 'No nationality'}</span>
              </div>
              <div className="flex items-center gap-3 text-xs md:text-sm text-gray-500">
                <FileText size={14} className="text-brand-gold md:w-4 md:h-4" />
                <span>{candidate.documents?.length || 0} Documents</span>
              </div>

              {/* Payment Tiers Preview */}
              {(candidate.initialPay || candidate.payAfterWP || candidate.payAfterVisa) && (
                <div className="pt-2 grid grid-cols-3 gap-2 border-t border-slate-50 mt-2">
                  <div className="text-center">
                    <p className="text-[8px] font-bold text-gray-400 uppercase leading-tight">Initial</p>
                    <p className="text-[10px] font-black text-brand-blue truncate">
                      {CURRENCY_SYMBOLS[candidate.paymentCurrency || 'EUR']}{candidate.initialPay || '0'}
                    </p>
                  </div>
                  <div className="text-center border-x border-slate-50">
                    <p className="text-[8px] font-bold text-gray-400 uppercase leading-tight">WP</p>
                    <p className="text-[10px] font-black text-brand-blue truncate">
                      {CURRENCY_SYMBOLS[candidate.paymentCurrency || 'EUR']}{candidate.payAfterWP || '0'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] font-bold text-gray-400 uppercase leading-tight">Visa</p>
                    <p className="text-[10px] font-black text-brand-blue truncate">
                      {CURRENCY_SYMBOLS[candidate.paymentCurrency || 'EUR']}{candidate.payAfterVisa || '0'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Link 
                to={`/candidate/profile/${candidate.uid}`}
                className="flex-grow bg-brand-gold text-brand-blue py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm hover:bg-brand-blue hover:text-white text-center transition-all shadow-lg shadow-brand-gold/20"
              >
                Full CV View
              </Link>
              <Link 
                to={`/admin/candidates/${candidate.uid}`}
                className="px-4 bg-brand-blue/5 text-brand-blue py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm hover:bg-brand-blue hover:text-white transition-all text-center flex items-center justify-center"
              >
                Manage
              </Link>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  downloadEuropassCV(candidate);
                }}
                className="flex items-center justify-center p-2.5 md:p-3 bg-brand-gold/10 text-brand-gold rounded-xl font-bold text-xs hover:bg-brand-gold hover:text-white transition-all"
                title="Download Europass CV"
              >
                <Download size={18} />
              </button>
              <button 
                onClick={() => setDeleteConfirmId(candidate.uid)}
                className="p-2.5 md:p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-100 sm:opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={18} className="md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick CV Download Hidden Template */}
      <div className="hidden">
        {cvCandidate && (
          <EuropassCV id="europass-cv-quick-template" candidate={cvCandidate} />
        )}
      </div>

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
              <h3 className="text-2xl font-bold text-brand-blue mb-4">Confirm Deletion</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Are you sure you want to delete this candidate profile? This action cannot be undone.
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
                  Delete Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
