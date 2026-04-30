import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { CandidateProfile } from '../../types';
import { 
  Search, 
  User, 
  CreditCard,
  TrendingDown,
  ArrowRight,
  Loader2,
  Save,
  Wallet
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { CURRENCY_SYMBOLS } from '../../constants';

export default function AdminFinancialAccounts() {
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingRiskId, setEditingRiskId] = useState<string | null>(null);
  const [editRiskValue, setEditRiskValue] = useState<string>('');
  const [savingRiskId, setSavingRiskId] = useState<string | null>(null);

  const navigate = useNavigate();

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
      console.error("Error fetching financial data:", error);
      toast.error("Failed to load financial records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const result = candidates.filter(c => 
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCandidates(result);
  }, [searchTerm, candidates]);

  const handleSaveRisk = async (uid: string) => {
    try {
      setSavingRiskId(uid);
      const val = parseFloat(editRiskValue) || 0;
      await updateDoc(doc(db, 'candidates', uid), {
        riskAmount: val,
        updatedAt: serverTimestamp()
      });
      
      const newCands = candidates.map(c => c.uid === uid ? { ...c, riskAmount: val } : c);
      setCandidates(newCands);
      
      setEditingRiskId(null);
      toast.success("Risk Amount updated!");
    } catch (error) {
      console.error("Error saving risk amount:", error);
      toast.error("Failed to update Risk Amount.");
    } finally {
      setSavingRiskId(null);
    }
  };

  // Helper functions for math
  const getMath = (c: CandidateProfile) => {
    const tot = parseFloat(c.totalAmount || '0') || 0;
    const ris = c.riskAmount || 0;
    const gross = (c.paymentHistory || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    const net = gross - ris;
    const rem = Math.max(0, tot - net);
    const sym = CURRENCY_SYMBOLS[c.paymentCurrency || 'EUR'];
    return { tot, ris, gross, net, rem, sym };
  };

  type CurrencyTotals = {
    [key: string]: {
      tot: number;
      gross: number;
      ris: number;
      net: number;
      rem: number;
    }
  };

  const totalsByCurrency: CurrencyTotals = candidates.reduce((acc, c) => {
    const cur = c.paymentCurrency || 'EUR';
    if (!acc[cur]) {
      acc[cur] = { tot: 0, gross: 0, ris: 0, net: 0, rem: 0 };
    }
    const m = getMath(c);
    acc[cur].tot += m.tot;
    acc[cur].gross += m.gross;
    acc[cur].ris += m.ris;
    acc[cur].net += m.net;
    acc[cur].rem += m.rem;
    return acc;
  }, {} as CurrencyTotals);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-brand-blue">Finance & Accounts</h1>
        <p className="text-gray-500">Track candidate packages, collection history, risk amounts, and remaining balances.</p>
      </div>

      {/* Overall Summary (Per Currency) */}
      {!loading && Object.entries(totalsByCurrency).map(([currency, totals]) => (
        <div key={currency} className="mb-8">
          <h2 className="text-lg font-black text-slate-800 mb-4">{currency} Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
             <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm border-t-4 border-t-brand-blue">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Pkg</p>
               <p className="text-2xl font-bold text-brand-blue">{CURRENCY_SYMBOLS[currency] || currency} {totals.tot.toLocaleString()}</p>
             </div>
             <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm border-t-4 border-t-green-400">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Gross Collected</p>
               <p className="text-2xl font-bold text-green-600">{CURRENCY_SYMBOLS[currency] || currency} {totals.gross.toLocaleString()}</p>
             </div>
             <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm border-t-4 border-t-orange-400">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Risk (Ris) Amount</p>
               <p className="text-2xl font-bold text-orange-500">{CURRENCY_SYMBOLS[currency] || currency} {totals.ris.toLocaleString()}</p>
             </div>
             <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm border-t-4 border-t-brand-teal">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Net Collected</p>
               <p className="text-2xl font-bold text-brand-teal">{CURRENCY_SYMBOLS[currency] || currency} {totals.net.toLocaleString()}</p>
             </div>
             <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm border-t-4 border-t-rose-400">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Remaining</p>
               <p className="text-2xl font-bold text-rose-500">{CURRENCY_SYMBOLS[currency] || currency} {totals.rem.toLocaleString()}</p>
             </div>
          </div>
        </div>
      ))}

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search candidates by name or email..."
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
            <thead className="bg-[#020617] text-white tracking-widest text-[10px] uppercase font-black">
              <tr>
                <th className="px-6 py-4 rounded-tl-3xl">Candidate</th>
                <th className="px-6 py-4">Total Pkg</th>
                <th className="px-6 py-4">Gross Collected</th>
                <th className="px-6 py-4 text-orange-400">Risk (Ris) Amount</th>
                <th className="px-6 py-4 text-brand-teal">Net Collected</th>
                <th className="px-6 py-4 text-rose-400">Remaining</th>
                <th className="px-6 py-4 text-right rounded-tr-3xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-6 py-6 h-20 bg-gray-50/50"></td>
                  </tr>
                ))
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-bold">No candidate accounts found.</td>
                </tr>
              ) : filteredCandidates.map((candidate) => {
                const math = getMath(candidate);
                const isEditingRisk = editingRiskId === candidate.uid;

                return (
                  <tr key={candidate.uid} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-blue/5 text-brand-blue rounded-xl flex items-center justify-center font-bold">
                          {candidate.fullName.charAt(0)}
                        </div>
                        <div>
                          <button onClick={() => navigate(`/admin/candidates/${candidate.uid}`)} className="font-bold text-brand-blue hover:text-brand-gold transition-colors text-left">
                            {candidate.fullName}
                          </button>
                          <p className="text-[10px] text-gray-400">{candidate.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{math.sym} {math.tot}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-500">{math.sym} {math.gross}</p>
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest">{candidate.paymentHistory?.length || 0} collections</p>
                    </td>
                    <td className="px-6 py-4">
                      {isEditingRisk ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="number"
                            autoFocus
                            className="w-20 px-2 py-1 bg-orange-50 border border-orange-200 rounded outline-none font-bold text-orange-600 text-sm"
                            value={editRiskValue}
                            onChange={(e) => setEditRiskValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRisk(candidate.uid);
                              if (e.key === 'Escape') setEditingRiskId(null);
                            }}
                          />
                          <button 
                            onClick={() => handleSaveRisk(candidate.uid)}
                            disabled={savingRiskId === candidate.uid}
                            className="text-brand-blue hover:text-brand-gold disabled:opacity-50"
                          >
                            {savingRiskId === candidate.uid ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="group cursor-pointer font-bold text-orange-500 flex items-center gap-2"
                          onClick={() => {
                            setEditRiskValue(math.ris.toString());
                            setEditingRiskId(candidate.uid);
                          }}
                        >
                          {math.sym} {math.ris}
                          <TrendingDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-brand-teal bg-brand-teal/10 px-2 py-1 rounded inline-block">
                        {math.sym} {math.net}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-rose-500">
                        {math.sym} {math.rem}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate(`/admin/candidates/${candidate.uid}`)}
                        className="text-brand-blue p-2 hover:bg-brand-blue/10 rounded-xl transition-colors"
                        title="View Full Intel"
                      >
                        <ArrowRight size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
