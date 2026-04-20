import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Sparkles, Loader2, User, Bot, Briefcase, ChevronRight } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';
import { collection, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Job, SiteContent, AIAssistant } from '../types';

interface Message {
  role: 'user' | 'bot';
  text: string;
  timestamp: number;
  assistantId?: string;
}

interface SmartAssistantProps {
  externalOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

export default function SmartAssistant({ externalOpen, onOpen, onClose }: SmartAssistantProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  
  const setIsOpen = (val: boolean) => {
    if (externalOpen !== undefined) {
      if (val && onOpen) {
        onOpen();
      } else if (!val && onClose) {
        onClose();
      }
    } else {
      setInternalOpen(val);
    }
  };
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent | null>(null);
  const [selectedAssistant, setSelectedAssistant] = useState<AIAssistant | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch Jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const jobsSnapshot = await getDocs(collection(db, 'jobs'));
        const jobsData = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
        setJobs(jobsData);
      } catch (error) {
        console.error("Error fetching jobs for AI:", error);
      }
    };
    fetchJobs();

    // Listen to Site Content for assistants
    const unsub = onSnapshot(doc(db, 'settings', 'siteContent'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as SiteContent;
        setSiteContent(data);
        
        // Find active assistants
        const active = data.assistants?.filter(a => a.isActive) || [];
        if (active.length > 0) {
          // If no assistant selected, or previously selected one is now inactive, pick the first active one
          setSelectedAssistant(prev => {
            if (!prev || !active.find(a => a.id === prev.id)) {
              return active[0];
            }
            return prev;
          });
        } else {
          // Fallback to default Raj if none configured
          const defaultRaj: AIAssistant = {
            id: 'raj_default',
            name: 'Raj',
            role: 'Senior HR Consultant',
            systemPrompt: 'You are RAJ, the Senior HR Consultant at WorkinEU HR Consultancy. Your tone MUST be professional, direct, knowledgeable, and polite—exactly like a senior HR professional.',
            isActive: true,
            color: '#1e293b'
          };
          setSelectedAssistant(defaultRaj);
        }
      }
    });

    return () => unsub();
  }, []);

  // Welcome message when assistant changes
  useEffect(() => {
    if (selectedAssistant && messages.length === 0) {
      setMessages([
        { 
          role: 'bot', 
          text: `Namaste! I am ${selectedAssistant.name}, your ${selectedAssistant.role} at WorkinEU. How can I help you today?`, 
          timestamp: Date.now(),
          assistantId: selectedAssistant.id
        }
      ]);
    }
  }, [selectedAssistant, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || isLoading || !selectedAssistant) return;

    const userMessage = message.trim();
    setMessage('');
    
    setMessages(prev => [...prev, { role: 'user', text: userMessage, timestamp: Date.now() }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const jobsContext = jobs.length > 0 
        ? `STRICT AVAILABLE JOBS LIST (ONLY RECOMMEND FROM THESE):
${jobs.map(j => `- ${j.title} in ${j.country}. Category: ${j.category}. Salary: ${j.currency || '€'}${j.minSalary} - ${j.maxSalary}. Exp: ${j.experience}. Details: ${j.description.substring(0, 100)}...`).join('\n')}`
        : "No specific jobs listed at the moment.";

      const siteContext = siteContent ? `SITE INFORMATION:
- About Us: ${siteContent.aboutUs}
- Mission: ${siteContent.mission}
- Vision: ${siteContent.vision}
- Services: ${JSON.stringify(siteContent.services)}
- Why Choose Us: ${JSON.stringify(siteContent.whyChooseUs)}
- Contact Phone: ${siteContent.contactPhone || siteContent.whatsappNumber}
- Contact Email: ${siteContent.contactEmail}
- Website: workineu.com` : "Standard WorkinEU guidance applies.";

      const systemInstruction = `${selectedAssistant.systemPrompt}
      
      STRICT CONSTRAINTS:
      1. ONLY provide information about "WorkinEU" based on the provided context.
      2. ONLY recommend jobs from the provided "STRICT AVAILABLE JOBS LIST".
      3. If a user asks for a job NOT in the list, politely tell them that it's currently unavailable.
      4. Your name is ${selectedAssistant.name}. Always act as the ${selectedAssistant.role}.
      5. Use the provided context to answer questions about documents, processing times, and fees.
      6. PROCESSING TIME: 3 to 6 months for European work visas.
      7. REQUIRED DOCUMENTS: Passport, European format CV, Education certificates, Experience letters.
      
      Respond to the user's message as ${selectedAssistant.name}. Keep it concise but professional.
      
      CONTEXT:
      ${siteContext}
      
      ${jobsContext}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMessage,
        config: {
          systemInstruction: systemInstruction
        }
      });

      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: response.text || "I am currently adjusting my schedule. Please try again in a moment.", 
        timestamp: Date.now(),
        assistantId: selectedAssistant.id
      }]);
    } catch (error) {
      console.error("AI Assistant Error:", error);
      setMessages(prev => [...prev, { role: 'bot', text: `I'm having some trouble connecting right now. Please reach out to our team via WhatsApp for direct assistance.`, timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const activeAssistants = siteContent?.assistants?.filter(a => a.isActive) || [selectedAssistant].filter(Boolean) as AIAssistant[];

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="hidden md:flex fixed bottom-28 right-8 bg-brand-blue text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-50 items-center justify-center group"
      >
        <div className="relative">
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand-gold rounded-full animate-ping"></div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand-gold rounded-full"></div>
          <Briefcase size={32} className="group-hover:rotate-12 transition-transform" />
        </div>
        <span className="absolute right-full mr-4 bg-white text-brand-blue px-4 py-2 rounded-xl font-bold text-sm shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-100">
          WorkinEU Assistant
        </span>
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] md:inset-auto md:bottom-28 md:right-8 md:w-[450px] md:h-[700px] flex flex-col p-0 md:p-0">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full h-full md:rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(15,23,42,0.25)] flex flex-col overflow-hidden border border-slate-100 pb-[env(safe-area-inset-bottom)] md:pb-0"
            >
              {/* Header */}
              <div className="bg-slate-900 p-8 flex justify-between items-center text-white relative overflow-hidden transition-colors duration-500" style={{ backgroundColor: selectedAssistant?.color || '#020617' }}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-14 h-14 bg-white/10 backdrop-blur-md text-white rounded-2xl flex items-center justify-center shadow-lg border border-white/10 overflow-hidden">
                    {selectedAssistant?.photoUrl ? (
                      <img src={selectedAssistant.photoUrl} alt={selectedAssistant.name} className="w-full h-full object-cover" />
                    ) : (
                      <Bot size={28} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-xl tracking-tight">{selectedAssistant?.name || 'Assistant'}</h3>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">{selectedAssistant?.role || 'Expert Advisor'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="p-3 hover:bg-white/10 rounded-2xl transition-all border border-white/5 active:scale-90"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Multi-Assistant Selector */}
              {activeAssistants.length > 1 && (
                <div className="bg-slate-50 border-b border-slate-100 p-4 flex gap-3 overflow-x-auto no-scrollbar scroll-smooth">
                  {activeAssistants.map(asst => (
                    <button
                      key={asst.id}
                      onClick={() => {
                        setSelectedAssistant(asst);
                        // Optional: Clear or keep history? Let's add an intro message
                        setMessages(prev => [...prev, { 
                          role: 'bot', 
                          text: `I'm now switching you to ${asst.name}. How can I assist you in my capacity as ${asst.role}?`, 
                          timestamp: Date.now(),
                          assistantId: asst.id
                        }]);
                      }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border shrink-0",
                        selectedAssistant?.id === asst.id 
                          ? "bg-slate-900 text-white border-slate-900 shadow-lg scale-105" 
                          : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div className="w-5 h-5 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center">
                        {asst.photoUrl ? (
                          <img src={asst.photoUrl} alt={asst.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: asst.color }}></div>
                        )}
                      </div>
                      {asst.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Messages */}
              <div className="flex-grow overflow-y-auto p-8 space-y-6 bg-slate-50/50">
                {messages.map((msg, i) => {
                  const asst = activeAssistants.find(a => a.id === msg.assistantId);
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={i} 
                      className={cn(
                        "flex gap-4 max-w-[90%]",
                        msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border overflow-hidden",
                        msg.role === 'user' ? "bg-white border-slate-100 text-slate-400" : "bg-white border-slate-100 text-slate-800"
                      )}>
                        {msg.role === 'user' ? (
                          <User size={18} />
                        ) : asst?.photoUrl ? (
                          <img src={asst.photoUrl} alt={asst.name} className="w-full h-full object-cover" />
                        ) : (
                          <Bot size={18} style={{ color: asst?.color }} />
                        )}
                      </div>
                      <div className={cn(
                        "p-5 rounded-2xl text-[14px] leading-[1.6] shadow-md transition-all font-medium",
                        msg.role === 'user' 
                          ? "bg-slate-900 text-white rounded-tr-none" 
                          : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                      )}>
                        {msg.text}
                      </div>
                    </motion.div>
                  );
                })}
                {isLoading && (
                  <div className="flex gap-4 max-w-[90%]">
                    <div className="w-10 h-10 bg-white border border-slate-100 text-slate-400 rounded-xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                      {selectedAssistant?.photoUrl ? (
                         <img src={selectedAssistant.photoUrl} alt={selectedAssistant.name} className="w-full h-full object-cover" />
                      ) : (
                        <Bot size={18} style={{ color: selectedAssistant?.color }} />
                      )}
                    </div>
                    <div className="bg-white p-5 rounded-2xl rounded-tl-none border border-slate-100 shadow-md">
                      <Loader2 size={18} className="animate-spin" style={{ color: selectedAssistant?.color }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-8 bg-white border-t border-slate-100">
                <div className="relative group">
                  <div className="absolute inset-0 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" style={{ backgroundColor: `${selectedAssistant?.color}10` }}></div>
                  <input 
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Write to ${selectedAssistant?.name}...`}
                    className="w-full pl-6 pr-14 py-5 rounded-2xl border border-slate-200 outline-none focus:ring-4 transition-all bg-white relative z-10 font-bold"
                    style={{ borderColor: selectedAssistant?.color ? `${selectedAssistant.color}30` : undefined }}
                  />
                  <button 
                    type="submit"
                    disabled={!message.trim() || isLoading || !selectedAssistant}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-3 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-50 active:scale-95 z-20"
                    style={{ color: selectedAssistant?.color }}
                  >
                    <Send size={24} />
                  </button>
                </div>
                <div className="flex items-center justify-center gap-2 mt-4 text-slate-400">
                  <Sparkles size={12} style={{ color: selectedAssistant?.color }} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    {selectedAssistant?.name} is powered by WorkinEU AI
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
