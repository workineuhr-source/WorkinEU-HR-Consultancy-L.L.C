import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Server, Key, Shield, Zap, Image as ImageIcon, 
  Settings2, Activity, Play, Square, Loader2, Save, Trash2, Plus, 
  RefreshCcw, Info, CheckCircle2, Eye, EyeOff
} from "lucide-react";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";

export interface ApiIntegration {
  id: string;
  name: string;
  provider: string;
  apiKey: string;
  isEnabled: boolean;
  usageCount: number;
  lastUsed?: number;
  createdAt: number;
}

export default function AdminApiManagement() {
  const [integrations, setIntegrations] = useState<ApiIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, "checking" | "online" | "offline" | "idle">>({});

  const testConnection = async (api: ApiIntegration) => {
    setStatuses(prev => ({ ...prev, [api.id]: "checking" }));
    try {
      if (api.provider === "pollinations") {
        const res = await fetch("https://text.pollinations.ai/", { method: "GET" });
        if (res.ok) {
          setStatuses(prev => ({ ...prev, [api.id]: "online" }));
        } else {
          setStatuses(prev => ({ ...prev, [api.id]: "offline" }));
        }
      } else if (api.provider === "gemini") {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${api.apiKey}`);
        if (res.ok) {
          setStatuses(prev => ({ ...prev, [api.id]: "online" }));
        } else {
          setStatuses(prev => ({ ...prev, [api.id]: "offline" }));
        }
      } else {
        setStatuses(prev => ({ ...prev, [api.id]: "offline" }));
      }
    } catch (err) {
      setStatuses(prev => ({ ...prev, [api.id]: "offline" }));
    }
  };

  useEffect(() => {
    const fetchApis = async () => {
      try {
        const docRef = doc(db, "settings", "api_management");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setIntegrations(docSnap.data().integrations || []);
        } else {
          // Initialize with defaults if none exists
          const initialApis: ApiIntegration[] = [
            {
              id: "pollinations-primary",
              name: "Pollinations AI",
              provider: "pollinations",
              apiKey: "sk_FhJCovrPXCWEjXPSBaS6Ttk9AwRtsfaF",
              isEnabled: true,
              usageCount: 0,
              createdAt: Date.now()
            },
            {
              id: "gemini-primary",
              name: "Google Gemini",
              provider: "gemini",
              apiKey: "AIzaSy_YOUR_DEFAULT_GEMINI_KEY",
              isEnabled: true,
              usageCount: 0,
              createdAt: Date.now()
            }
          ];
          await setDoc(docRef, { integrations: initialApis });
          setIntegrations(initialApis);
        }
      } catch (error) {
        console.error("Error fetching APIs:", error);
        toast.error("Failed to load API configurations.");
      } finally {
        setLoading(false);
      }
    };
    fetchApis();
  }, []);

  const toggleApi = (id: string) => {
    setIntegrations(prev => 
      prev.map(api => api.id === id ? { ...api, isEnabled: !api.isEnabled } : api)
    );
  };

  const updateApiKey = (id: string, newKey: string) => {
    setIntegrations(prev => 
      prev.map(api => api.id === id ? { ...api, apiKey: newKey } : api)
    );
  };

  const updateApiField = (id: string, field: keyof ApiIntegration, value: string) => {
    setIntegrations(prev => 
      prev.map(api => api.id === id ? { ...api, [field]: value } : api)
    );
  };

  const deleteApi = (id: string) => {
    if (window.confirm("Are you sure you want to remove this API integration?")) {
      setIntegrations(prev => prev.filter(api => api.id !== id));
    }
  };

  const addNewApi = () => {
    const newApi: ApiIntegration = {
      id: `custom-${Date.now()}`,
      name: "New Integration",
      provider: "custom",
      apiKey: "",
      isEnabled: false,
      usageCount: 0,
      createdAt: Date.now()
    };
    setIntegrations(prev => [newApi, ...prev]);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "api_management"), { integrations });
      toast.success("API configurations saved successfully!");
    } catch (error) {
      console.error("Error saving API keys", error);
      toast.error("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin text-brand-blue"><Loader2 size={32} /></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-[1700px] mx-auto space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-[#121212] p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
            <Server className="text-brand-gold" size={32} />
            API & Integrations
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">
            Manage your AI endpoints, monitor usage, and secure API keys
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={addNewApi}
            className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:border-brand-blue hover:text-brand-blue transition-all"
          >
            <Plus size={16} />
            Add API
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="bg-brand-blue text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-brand-gold hover:text-brand-blue transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {integrations.map((api) => (
          <div key={api.id} className={cn(
            "bg-white dark:bg-white/5 rounded-[2.5rem] p-8 border-2 transition-all relative overflow-hidden",
            api.isEnabled ? "border-brand-teal/20" : "border-slate-100 dark:border-white/5 opacity-80"
          )}>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center border-2",
                  api.isEnabled 
                    ? "bg-brand-teal/10 border-brand-teal text-brand-teal" 
                    : "bg-slate-100 border-slate-200 text-slate-400"
                )}>
                  {api.provider === 'pollinations' ? <ImageIcon size={28} /> : <Zap size={28} />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <input 
                      value={api.name}
                      onChange={(e) => updateApiField(api.id, "name", e.target.value)}
                      className="bg-transparent outline-none border-b border-transparent focus:border-slate-200 w-full"
                    />
                    {!api.isEnabled && (
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase font-black tracking-widest">
                        Offline
                      </span>
                    )}
                    {api.isEnabled && (
                      <button
                        onClick={() => testConnection(api)}
                        className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/10 hover:border-brand-teal transition-colors group"
                        title="Test Connection"
                      >
                        {statuses[api.id] === 'checking' ? (
                          <Loader2 size={12} className="animate-spin text-brand-blue" />
                        ) : statuses[api.id] === 'online' ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        ) : statuses[api.id] === 'offline' ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-brand-teal transition-colors"></div>
                        )}
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                           {statuses[api.id] === 'checking' ? 'Testing' : statuses[api.id] === 'online' ? 'Connected' : statuses[api.id] === 'offline' ? 'Failed' : 'Test'}
                        </span>
                      </button>
                    )}
                  </h3>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                    Provider: 
                    <input 
                      value={api.provider}
                      onChange={(e) => updateApiField(api.id, "provider", e.target.value)}
                      className="bg-transparent outline-none border-b border-transparent focus:border-slate-200 ml-1"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => deleteApi(api.id)}
                  className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                  title="Remove API"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={() => toggleApi(api.id)}
                  className={cn(
                    "p-3 rounded-2xl transition-all",
                    api.isEnabled ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white" : "bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white"
                  )}
                >
                  {api.isEnabled ? <Square size={18} /> : <Play size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Secret API Key
                </label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type={showKey === api.id ? "text" : "password"}
                    value={api.apiKey}
                    onChange={(e) => updateApiKey(api.id, e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-brand-teal transition-colors"
                    placeholder="Enter API Key"
                  />
                  <button
                    onClick={() => setShowKey(showKey === api.id ? null : api.id)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-brand-blue transition-colors"
                  >
                    {showKey === api.id ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400">
                    <Activity size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Usage Tracker</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{api.usageCount} <span className="text-sm font-medium text-slate-500">requests</span></p>
                  </div>
                </div>
                {api.lastUsed && (
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Last Accessed</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {new Date(api.lastUsed).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
