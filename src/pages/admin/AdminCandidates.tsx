import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { CandidateProfile } from '../../types';
import { Search, User, Mail, Phone, Globe, CreditCard, FileText, Trash2, Eye, Download, Save, Loader2, Plus, MapPin, Calendar, Edit2, Building2, X } from 'lucide-react';
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
  const [filterCountry, setFilterCountry] = useState('');
  const [assignModalCandidate, setAssignModalCandidate] = useState<CandidateProfile | null>(null);
  const [assignData, setAssignData] = useState({ country: '', batch: '', company: '' });
  const [savingAssignment, setSavingAssignment] = useState(false);

  // Derive unique assigned attributes for the filter dropdown and datalists
  const uniqueCountries = Array.from(new Set(candidates.map(c => c.assignedCountry).filter(Boolean))) as string[];
  const uniqueBatches = Array.from(new Set(candidates.map(c => c.assignedBatch).filter(Boolean))) as string[];
  const uniqueCompanies = Array.from(new Set(candidates.map(c => c.assignedCompany).filter(Boolean))) as string[];

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
    let result = candidates;
    
    if (searchTerm) {
      result = result.filter(c => 
        c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm))
      );
    }
    
    if (filterCountry) {
      result = result.filter(c => c.assignedCountry === filterCountry);
    }
    
    setFilteredCandidates(result);
  }, [searchTerm, filterCountry, candidates]);

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

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalCandidate) return;
    
    setSavingAssignment(true);
    try {
      await updateDoc(doc(db, 'candidates', assignModalCandidate.uid), {
        assignedCountry: assignData.country,
        assignedBatch: assignData.batch,
        assignedCompany: assignData.company,
        updatedAt: Date.now()
      });
      toast.success("Candidate assignment updated successfully.");
      setAssignModalCandidate(null);
      fetchCandidates();
    } catch (error) {
      console.error("Error updating assignment:", error);
      toast.error("Failed to update assignment.");
    } finally {
      setSavingAssignment(false);
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

      {/* Search and Filters */}
      <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search candidates..."
            className="w-full pl-12 pr-4 py-2 md:py-3 rounded-xl border border-gray-100 focus:border-brand-gold outline-none transition-all text-sm md:text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative min-w-[200px]">
          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select
            className="w-full pl-12 pr-4 py-2 md:py-3 rounded-xl border border-gray-100 focus:border-brand-gold outline-none transition-all text-sm md:text-base appearance-none bg-white font-semibold text-gray-700"
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
          >
            <option value="">All Countries</option>
            {uniqueCountries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Candidates Grouped by Country */}
      <div className="space-y-12">
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 animate-pulse h-64"></div>
            ))}
          </div>
        ) : (
          Object.entries(
            filteredCandidates.reduce((acc, candidate) => {
              const country = candidate.assignedCountry || 'Unassigned';
              if (!acc[country]) {
                acc[country] = [];
              }
              acc[country].push(candidate);
              return acc;
            }, {} as Record<string, CandidateProfile[]>)
          ).sort(([countryA], [countryB]) => {
            if (countryA === 'Unassigned') return 1;
            if (countryB === 'Unassigned') return -1;
            return countryA.localeCompare(countryB);
          }).map(([country, groupCandidates]) => (
            <div key={country} className="space-y-6">
              <div className="flex items-center gap-4 border-b border-gray-100 pb-2">
                <div className="p-2 bg-brand-blue/5 rounded-xl text-brand-blue">
                  <Globe size={20} />
                </div>
                <h2 className="text-xl font-bold text-brand-blue">{country} <span className="text-sm text-gray-400 font-normal ml-2">({groupCandidates.length})</span></h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                {groupCandidates.map((candidate) => (
                  <div key={candidate.uid} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all group flex flex-col">
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div className="flex items-start gap-4 flex-grow">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-brand-blue/5 text-brand-blue rounded-2xl flex items-center justify-center text-xl md:text-2xl font-bold shrink-0">
                          {(candidate.fullName || 'C').charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <h3 className="font-bold text-brand-blue text-sm md:text-lg break-words leading-tight">{candidate.fullName || 'Candidate Name'}</h3>
                          <p className="text-[10px] md:text-xs text-gray-400 break-all mt-1">{candidate.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6 flex-grow flex flex-col">
                      <div className="flex items-start gap-3 text-xs md:text-sm text-gray-500">
                        <Phone size={14} className="text-brand-gold shrink-0 mt-0.5 md:w-4 md:h-4" />
                        <span className="break-all">{candidate.phone || 'No phone'}</span>
                      </div>
                      <div className="flex items-start gap-3 text-xs md:text-sm text-gray-500">
                        <Globe size={14} className="text-brand-gold shrink-0 mt-0.5 md:w-4 md:h-4" />
                        <span className="break-words">{candidate.nationality || 'No nationality'}</span>
                      </div>
                      <div className="flex items-start gap-3 text-xs md:text-sm text-gray-500">
                        <FileText size={14} className="text-brand-gold shrink-0 mt-0.5 md:w-4 md:h-4" />
                        <span>{candidate.documents?.length || 0} Documents</span>
                      </div>

                      {/* Payment Tiers Preview */}
                      {(candidate.initialPay || candidate.payAfterWP || candidate.payAfterVisa) && (
                        <div className="pt-3 grid grid-cols-3 gap-2 border-t border-slate-50 mt-3">
                          <div className="text-center bg-slate-50 rounded-lg p-2 flex flex-col justify-center">
                            <p className="text-[8px] font-bold text-gray-400 uppercase leading-tight mb-1">Initial</p>
                            <p className="text-[10px] md:text-xs font-black text-brand-blue break-all">
                              {CURRENCY_SYMBOLS[candidate.paymentCurrency || 'EUR']}{candidate.initialPay || '0'}
                            </p>
                          </div>
                          <div className="text-center bg-slate-50 rounded-lg p-2 flex flex-col justify-center">
                            <p className="text-[8px] font-bold text-gray-400 uppercase leading-tight mb-1">WP</p>
                            <p className="text-[10px] md:text-xs font-black text-brand-blue break-all">
                              {CURRENCY_SYMBOLS[candidate.paymentCurrency || 'EUR']}{candidate.payAfterWP || '0'}
                            </p>
                          </div>
                          <div className="text-center bg-slate-50 rounded-lg p-2 flex flex-col justify-center">
                            <p className="text-[8px] font-bold text-gray-400 uppercase leading-tight mb-1">Visa</p>
                            <p className="text-[10px] md:text-xs font-black text-brand-blue break-all">
                              {CURRENCY_SYMBOLS[candidate.paymentCurrency || 'EUR']}{candidate.payAfterVisa || '0'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Placement Assignment Widget */}
                      <div className="mt-auto pt-4 relative group/placement">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest flex items-center gap-1.5">
                              <Globe size={12} className="text-brand-gold"/> Placement
                            </span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setAssignData({
                                  country: candidate.assignedCountry || '',
                                  batch: candidate.assignedBatch || '',
                                  company: candidate.assignedCompany || ''
                                });
                                setAssignModalCandidate(candidate);
                              }}
                              className="text-brand-blue hover:text-brand-gold text-xs transition-colors p-1 bg-white rounded-md shadow-sm border border-slate-100"
                              title="Set Assignment"
                            >
                              <Edit2 size={12} />
                            </button>
                          </div>
                          {candidate.assignedCountry ? (
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-gold"></div>
                              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 break-words mb-2 pl-1">
                                {candidate.assignedCountry}
                              </div>
                              {(candidate.assignedCompany || candidate.assignedBatch) && (
                                <div className="flex flex-col gap-2 pl-1">
                                  {candidate.assignedCompany && <span className="flex items-start gap-2 text-[11px] text-gray-500 font-bold uppercase leading-tight"><Building2 size={12} className="text-brand-gold shrink-0 mt-0.5"/> <span className="break-words">{candidate.assignedCompany}</span></span>}
                                  {candidate.assignedBatch && <span className="flex items-start gap-2 text-[11px] text-gray-500 font-bold uppercase leading-tight"><Calendar size={12} className="text-brand-gold shrink-0 mt-0.5"/> <span className="break-words">{candidate.assignedBatch}</span></span>}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center py-3 border border-dashed border-gray-200 rounded-xl bg-white">
                              Not Assigned
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      <Link 
                        to={`/candidate/profile/${candidate.uid}`}
                        className="flex-[2] bg-brand-gold text-brand-blue py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm hover:bg-yellow-500 text-center transition-all shadow-lg shadow-brand-gold/20 flex justify-center items-center"
                      >
                        Full CV
                      </Link>
                      <Link 
                        to={`/admin/candidates/${candidate.uid}`}
                        className="flex-[2] px-2 bg-slate-100 text-brand-blue py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm hover:bg-slate-200 transition-all text-center flex items-center justify-center"
                      >
                        Manage
                      </Link>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadEuropassCV(candidate);
                        }}
                        className="flex-1 flex items-center justify-center p-2.5 md:p-3 bg-brand-blue/5 text-brand-blue rounded-xl font-bold hover:bg-brand-blue hover:text-white transition-all min-w-[44px]"
                        title="Download CV"
                      >
                        <Download size={18} />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(candidate.uid)}
                        className="flex-1 flex items-center justify-center p-2.5 md:p-3 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-xl transition-all opacity-100 sm:opacity-0 group-hover:opacity-100 min-w-[44px]"
                        title="Delete"
                      >
                        <Trash2 size={18} className="md:w-5 md:h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick CV Download Hidden Template */}
      <div className="hidden">
        {cvCandidate && (
          <EuropassCV id="europass-cv-quick-template" candidate={cvCandidate} />
        )}
      </div>

      {/* Assign Modal */}
      <AnimatePresence>
        {assignModalCandidate && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-blue/60 backdrop-blur-sm"
              onClick={() => setAssignModalCandidate(null)}
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 p-6 sm:p-8"
            >
              <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-brand-blue mb-1">Set Placement</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{assignModalCandidate.fullName}</p>
                </div>
                <button onClick={() => setAssignModalCandidate(null)} className="p-2 bg-gray-50 text-gray-400 hover:text-brand-blue hover:bg-gray-100 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveAssignment} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Target Country</label>
                  <input 
                    list="modal-country-options"
                    type="text" 
                    required
                    placeholder="e.g., Romania, Poland, Croatia"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-gold outline-none text-sm font-semibold text-slate-700 bg-gray-50 focus:bg-white"
                    value={assignData.country}
                    onChange={(e) => setAssignData({...assignData, country: e.target.value})}
                  />
                  <datalist id="modal-country-options">
                    <option value="Romania" />
                    <option value="Poland" />
                    <option value="Croatia" />
                    <option value="Serbia" />
                    <option value="Czech Republic" />
                    <option value="Slovakia" />
                    <option value="Hungary" />
                    {uniqueCountries.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Batch</label>
                    <input 
                      list="modal-batch-options"
                      type="text" 
                      placeholder="e.g., Batch 1"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-gold outline-none text-sm font-semibold text-slate-700 bg-gray-50 focus:bg-white"
                      value={assignData.batch}
                      onChange={(e) => setAssignData({...assignData, batch: e.target.value})}
                    />
                    <datalist id="modal-batch-options">
                      <option value="Batch 1" />
                      <option value="Batch 2" />
                      <option value="Batch 3" />
                      {uniqueBatches.map(b => <option key={b} value={b} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Company Name</label>
                    <input 
                      list="modal-company-options"
                      type="text" 
                      placeholder="e.g., Client X"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-gold outline-none text-sm font-semibold text-slate-700 bg-gray-50 focus:bg-white"
                      value={assignData.company}
                      onChange={(e) => setAssignData({...assignData, company: e.target.value})}
                    />
                    <datalist id="modal-company-options">
                      {uniqueCompanies.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                </div>
                
                <div className="pt-2 flex gap-4 mt-8">
                  <button 
                    type="button"
                    onClick={() => setAssignModalCandidate(null)}
                    disabled={savingAssignment}
                    className="flex-grow px-6 py-3.5 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all border border-gray-200 uppercase tracking-widest text-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={savingAssignment}
                    className="flex-grow flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-brand-blue bg-brand-gold hover:bg-yellow-500 transition-all shadow-lg shadow-brand-gold/20 uppercase tracking-widest text-xs"
                  >
                    {savingAssignment ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {savingAssignment ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
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
