import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { ContactMessage } from '../../types';
import { Search, Trash2, X, Mail, Phone, Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function AdminContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const q = query(collection(db, 'contactMessages'), orderBy('createdAt', 'desc'));
      
      let snapshot;
      try {
        snapshot = await getDocs(q);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'contactMessages');
        return;
      }

      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactMessage));
      setMessages(msgs);
      setFilteredMessages(msgs);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      try {
        const parsedError = JSON.parse(error.message);
        setErrorMessage(parsedError.error);
      } catch {
        setErrorMessage(error.message || "Failed to fetch messages.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = messages;
    if (searchTerm) {
      result = result.filter(msg => 
        msg.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredMessages(result);
  }, [searchTerm, messages]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'contactMessages', deleteId));
      toast.success("Message deleted");
      fetchMessages();
      setSelectedMessage(null);
      setDeleteId(null);
    } catch (error) {
      toast.error("Failed to delete message");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-blue">Contact Messages</h1>
          <p className="text-gray-500 text-sm md:text-base">View and manage inquiries from the contact form.</p>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name, email, or message content..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 focus:border-brand-gold outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Messages List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 animate-pulse h-48"></div>
          ))
        ) : filteredMessages.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <MessageSquare className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500 font-medium">No messages found.</p>
          </div>
        ) : filteredMessages.map((msg) => (
          <motion.div 
            key={msg.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
            onClick={() => setSelectedMessage(msg)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-brand-blue/5 rounded-full flex items-center justify-center text-brand-blue font-bold">
                {msg.fullName.charAt(0)}
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {new Date(msg.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h3 className="font-bold text-brand-blue mb-1 truncate">{msg.fullName}</h3>
            <p className="text-xs text-gray-400 mb-4 truncate">{msg.email}</p>
            <p className="text-sm text-gray-600 line-clamp-3 mb-4 italic">
              "{msg.message}"
            </p>
            <div className="flex justify-between items-center pt-4 border-t border-gray-50">
              <span className="text-xs font-bold text-brand-gold flex items-center gap-1">
                <Mail size={12} /> View Details
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteId(msg.id);
                }}
                className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-100 md:opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Message Detail Modal */}
      <AnimatePresence>
        {selectedMessage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-blue/60 backdrop-blur-sm"
              onClick={() => setSelectedMessage(null)}
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 p-6 md:p-12 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-start mb-6 md:mb-10">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-brand-blue text-white rounded-2xl flex items-center justify-center text-xl md:text-2xl font-bold">
                    {selectedMessage.fullName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-brand-blue">{selectedMessage.fullName}</h2>
                    <p className="text-xs md:text-sm text-gray-500 flex items-center gap-2">
                      <Calendar size={14} /> {new Date(selectedMessage.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedMessage(null)} className="text-gray-400 hover:text-brand-blue transition-colors p-2">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-10">
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Email Address</p>
                  <p className="text-sm md:text-base font-medium text-brand-blue flex items-center gap-2 break-all">
                    <Mail size={16} className="text-brand-gold shrink-0" /> {selectedMessage.email}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Phone Number</p>
                  <p className="text-sm md:text-base font-medium text-brand-blue flex items-center gap-2">
                    <Phone size={16} className="text-brand-gold shrink-0" /> {selectedMessage.phone}
                  </p>
                </div>
              </div>

              <div className="mb-6 md:mb-10">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Message Content</p>
                <div className="bg-brand-blue/5 p-6 md:p-8 rounded-3xl relative">
                  <MessageSquare className="absolute -top-4 -left-4 text-brand-gold/20 hidden sm:block" size={48} />
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed italic whitespace-pre-wrap">
                    {selectedMessage.message}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 md:gap-4 pt-6 md:pt-8 border-t border-gray-100">
                <button 
                  onClick={() => setDeleteId(selectedMessage.id)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-all text-sm md:text-base"
                >
                  <Trash2 size={18} className="md:w-5 md:h-5" /> Delete Message
                </button>
                <a 
                  href={`mailto:${selectedMessage.email}`}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-brand-blue text-white rounded-xl font-bold hover:bg-brand-gold transition-all shadow-lg text-sm md:text-base"
                >
                  <Mail size={18} className="md:w-5 md:h-5" /> Reply via Email
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-brand-blue mb-2">Delete Message?</h3>
              <p className="text-gray-500 mb-8">Are you sure you want to delete this message? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteId(null)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
