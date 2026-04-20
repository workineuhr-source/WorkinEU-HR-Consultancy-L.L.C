import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { CandidateProfile, RefundRequest } from '../../types';
import { 
  Search, 
  RotateCcw, 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Save, 
  TrendingDown,
  Calendar,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export default function AdminRefunds() {
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProfile | null>(null);
  const [riskAmount, setRiskAmount] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'candidates'), orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs
        .map(doc => ({ uid: doc.id, ...doc.data() } as CandidateProfile))
        .filter(c => c.refundRequest); // Only those with refund requests
      setCandidates(data);
      setFilteredCandidates(data);
    } catch (error) {
      console.error("Error fetching candidates:", error);
      toast.error("Failed to load refund requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const result = candidates.filter(c => 
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.refundRequest?.id && c.refundRequest.id.includes(searchTerm))
    );
    setFilteredCandidates(result);
  }, [searchTerm, candidates]);

  const handleProposeRefund = async () => {
    if (!selectedCandidate || !selectedCandidate.refundRequest) return;
    setSaving(true);
    try {
      const totalPaid = selectedCandidate.refundRequest.totalReceivedAmount;
      const refundable = totalPaid - riskAmount;

      const updatedRefund: RefundRequest = {
        ...selectedCandidate.refundRequest,
        riskAmount,
        refundableAmount: refundable,
        status: 'proposed',
        updatedAt: Date.now()
      };

      await updateDoc(doc(db, 'candidates', selectedCandidate.uid), {
        refundRequest: updatedRefund,
        updatedAt: serverTimestamp()
      });

      toast.success("Refund proposal sent to candidate!");
      fetchCandidates();
      setSelectedCandidate({ ...selectedCandidate, refundRequest: updatedRefund });
    } catch (error) {
      toast.error("Failed to send proposal.");
    } finally {
      setSaving(false);
    }
  };

  const handleStartProcessing = async () => {
    if (!selectedCandidate || !selectedCandidate.refundRequest) return;
    setSaving(true);
    try {
      const refundable = selectedCandidate.refundRequest.refundableAmount;
      const installmentAmount = Math.floor(refundable / 3);
      const lastInstallment = refundable - (installmentAmount * 2);

      const installments = [
        { amount: installmentAmount, dueDate: Date.now() + (30 * 24 * 60 * 60 * 1000), status: 'pending' as const },
        { amount: installmentAmount, dueDate: Date.now() + (60 * 24 * 60 * 60 * 1000), status: 'pending' as const },
        { amount: lastInstallment, dueDate: Date.now() + (90 * 24 * 60 * 60 * 1000), status: 'pending' as const },
      ];

      const updatedRefund: RefundRequest = {
        ...selectedCandidate.refundRequest,
        status: 'processing',
        installments,
        updatedAt: Date.now()
      };

      await updateDoc(doc(db, 'candidates', selectedCandidate.uid), {
        refundRequest: updatedRefund,
        updatedAt: serverTimestamp()
      });

      toast.success("Refund processing started with 3 installments.");
      fetchCandidates();
      setSelectedCandidate({ ...selectedCandidate, refundRequest: updatedRefund });
    } catch (error) {
      toast.error("Failed to start processing.");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkInstallmentPaid = async (index: number) => {
    if (!selectedCandidate || !selectedCandidate.refundRequest) return;
    
    try {
      const newInstallments = [...selectedCandidate.refundRequest.installments];
      newInstallments[index] = {
        ...newInstallments[index],
        status: 'paid',
        paidAt: Date.now()
      };

      const allPaid = newInstallments.every(inst => inst.status === 'paid');

      const updatedRefund: RefundRequest = {
        ...selectedCandidate.refundRequest,
        installments: newInstallments,
        status: allPaid ? 'completed' : 'processing',
        updatedAt: Date.now()
      };

      await updateDoc(doc(db, 'candidates', selectedCandidate.uid), {
        refundRequest: updatedRefund,
        updatedAt: serverTimestamp()
      });

      toast.success(`Installment ${index + 1} marked as paid!`);
      fetchCandidates();
      setSelectedCandidate({ ...selectedCandidate, refundRequest: updatedRefund });
    } catch (error) {
      toast.error("Failed to update installment.");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-brand-blue">Refund Management</h1>
        <p className="text-gray-500">Manage candidate refund requests and installment payments.</p>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, email or refund ID..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 focus:border-brand-gold outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-400 text-xs font-bold uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Candidate</th>
                <th className="px-8 py-4">Refund ID</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Amount</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-6 h-20 bg-gray-50/50"></td>
                  </tr>
                ))
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-gray-400">No refund requests found.</td>
                </tr>
              ) : filteredCandidates.map((candidate) => (
                <tr key={candidate.uid} className="hover:bg-gray-50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-blue/5 text-brand-blue rounded-xl flex items-center justify-center font-bold">
                        {candidate.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-brand-blue">{candidate.fullName}</p>
                        <p className="text-xs text-gray-400">{candidate.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-medium text-gray-500">
                    {candidate.refundRequest?.id}
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      candidate.refundRequest?.status === 'pending' ? "bg-orange-100 text-orange-600" :
                      candidate.refundRequest?.status === 'proposed' ? "bg-blue-100 text-blue-600" :
                      candidate.refundRequest?.status === 'agreed' ? "bg-purple-100 text-purple-600" :
                      candidate.refundRequest?.status === 'processing' ? "bg-indigo-100 text-indigo-600" :
                      "bg-green-100 text-green-600"
                    )}>
                      {candidate.refundRequest?.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-brand-blue">€ {candidate.refundRequest?.refundableAmount || candidate.refundRequest?.totalReceivedAmount}</p>
                    <p className="text-[10px] text-gray-400">Total Paid: € {candidate.refundRequest?.totalReceivedAmount}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => {
                        setSelectedCandidate(candidate);
                        setRiskAmount(candidate.refundRequest?.riskAmount || 0);
                      }}
                      className="text-brand-blue font-bold text-xs hover:underline"
                    >
                      Manage Refund
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedCandidate && selectedCandidate.refundRequest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-blue/60 backdrop-blur-sm"
              onClick={() => setSelectedCandidate(null)}
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative z-10 p-8 md:p-12"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-brand-blue">Manage Refund Request</h2>
                  <p className="text-gray-500 text-sm">ID: {selectedCandidate.refundRequest.id}</p>
                </div>
                <button onClick={() => setSelectedCandidate(null)} className="text-gray-400 hover:text-brand-blue transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Candidate Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-brand-blue font-bold">
                        <User size={18} className="text-brand-gold" /> {selectedCandidate.fullName}
                      </div>
                      <div className="flex items-center gap-3 text-gray-600 text-sm">
                        <Mail size={18} className="text-brand-gold" /> {selectedCandidate.email}
                      </div>
                      <div className="flex items-center gap-3 text-gray-600 text-sm">
                        <Phone size={18} className="text-brand-gold" /> {selectedCandidate.phone || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Refund Details</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Status:</span>
                        <span className="font-bold text-brand-blue capitalize">{selectedCandidate.refundRequest.status}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total Paid:</span>
                        <span className="font-bold text-brand-blue">€ {selectedCandidate.refundRequest.totalReceivedAmount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Requested On:</span>
                        <span className="font-bold text-brand-blue">{new Date(selectedCandidate.refundRequest.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
                  <h4 className="font-bold text-red-900 mb-2">Reason for Refund:</h4>
                  <p className="text-red-700 text-sm italic">"{selectedCandidate.refundRequest.reason}"</p>
                </div>

                {/* Step 1: Propose Refund */}
                {(selectedCandidate.refundRequest.status === 'pending' || selectedCandidate.refundRequest.status === 'proposed') && (
                  <div className="bg-white p-8 rounded-3xl border-2 border-brand-blue/10 shadow-sm">
                    <h4 className="text-xl font-bold text-brand-blue mb-6 flex items-center gap-2">
                      <TrendingDown className="text-brand-gold" size={24} /> Step 1: Calculate & Propose Refund
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Risk Amount (Deduction)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
                          <input 
                            type="number"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold transition-all font-bold text-brand-blue"
                            value={riskAmount}
                            onChange={(e) => setRiskAmount(Number(e.target.value))}
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">This amount will be deducted from the total paid amount.</p>
                      </div>
                      <div className="p-4 bg-brand-blue/5 rounded-2xl border border-brand-blue/10">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Final Refundable Amount</p>
                        <p className="text-3xl font-bold text-brand-blue">€ {selectedCandidate.refundRequest.totalReceivedAmount - riskAmount}</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleProposeRefund}
                      disabled={saving}
                      className="w-full bg-brand-blue text-white py-4 rounded-xl font-bold hover:bg-brand-gold transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                      {selectedCandidate.refundRequest.status === 'proposed' ? 'Update Proposal' : 'Send Proposal to Candidate'}
                    </button>
                  </div>
                )}

                {/* Step 2: Start Processing (After Agreement) */}
                {selectedCandidate.refundRequest.status === 'agreed' && (
                  <div className="bg-purple-50 p-8 rounded-3xl border border-purple-100">
                    <h4 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                      <CheckCircle2 size={24} /> Candidate Agreed
                    </h4>
                    <p className="text-purple-700 text-sm mb-8">
                      The candidate has agreed to the refund amount of <span className="font-bold">€ {selectedCandidate.refundRequest.refundableAmount}</span>. 
                      You can now start the 90-day processing period which will automatically generate 3 installments.
                    </p>
                    <button 
                      onClick={handleStartProcessing}
                      disabled={saving}
                      className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="animate-spin" /> : <Clock size={20} />}
                      Start 90-Day Processing (3 Installments)
                    </button>
                  </div>
                )}

                {/* Step 3: Manage Installments */}
                {(selectedCandidate.refundRequest.status === 'processing' || selectedCandidate.refundRequest.status === 'completed') && (
                  <div className="space-y-6">
                    <h4 className="text-xl font-bold text-brand-blue flex items-center gap-2">
                      <Calendar className="text-brand-gold" size={24} /> Installment Tracking (90 Days)
                    </h4>
                    <div className="space-y-4">
                      {selectedCandidate.refundRequest.installments.map((inst, i) => (
                        <div key={i} className="flex items-center justify-between p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center",
                              inst.status === 'paid' ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"
                            )}>
                              {inst.status === 'paid' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                            </div>
                            <div>
                              <p className="font-bold text-brand-blue text-lg">Installment {i + 1}</p>
                              <p className="text-sm text-gray-400">Due: {new Date(inst.dueDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-8">
                            <div className="text-right">
                              <p className="text-xl font-bold text-brand-blue">€ {inst.amount}</p>
                              <p className={cn(
                                "text-xs font-bold uppercase tracking-widest",
                                inst.status === 'paid' ? "text-green-600" : "text-orange-500"
                              )}>
                                {inst.status === 'paid' ? `Paid on ${new Date(inst.paidAt!).toLocaleDateString()}` : 'Pending'}
                              </p>
                            </div>
                            {inst.status === 'pending' && (
                              <button 
                                onClick={() => handleMarkInstallmentPaid(i)}
                                className="bg-green-500 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-green-600 transition-all"
                              >
                                Mark as Paid
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
