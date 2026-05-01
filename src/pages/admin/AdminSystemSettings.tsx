import React, { useState, useEffect } from "react";
import {
  Save,
  Loader2,
  Cpu,
  Key,
  Globe,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Power,
  PowerOff,
  History,
  LayoutDashboard,
  Settings2,
  Eye,
  EyeOff,
} from "lucide-react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { SystemSettings, APIConfig } from "../../types";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";

export default function AdminSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    activeConfigId: "",
    apiConfigs: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showKey, setShowKey] = useState<string | null>(null);

  const [newConfig, setNewConfig] = useState<Partial<APIConfig>>({
    provider: "gemini",
    label: "",
    apiKey: "",
    modelName: "gemini-1.5-flash",
    isEnabled: true,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "system");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as SystemSettings;
          // Support for migration from old structure
          if (!data.apiConfigs) {
            const oldData = docSnap.data() as any;
            if (oldData.aiApiKey) {
              const migratedConfig: APIConfig = {
                id: "migrated-primary",
                provider: oldData.aiProvider || "gemini",
                apiKey: oldData.aiApiKey,
                modelName: oldData.aiModelName || "gemini-1.5-flash",
                endpoint: oldData.aiEndpoint || "",
                label: "Migrated Primary Key",
                isEnabled: true,
                createdAt: Date.now(),
              };
              setSettings({
                activeConfigId: "migrated-primary",
                apiConfigs: [migratedConfig],
                updatedAt: Date.now(),
              });
            } else {
              setSettings({ activeConfigId: "", apiConfigs: [] });
            }
          } else {
            setSettings(data);
          }
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Failed to load system settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "system"), {
        ...settings,
        updatedAt: Date.now(),
      });
      toast.success("Configuration Cluster synchronized successfully.");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const addConfig = () => {
    if (!newConfig.label || !newConfig.apiKey) {
      toast.error("Label and API Key are required");
      return;
    }

    const config: APIConfig = {
      id: `cfg-${Date.now()}`,
      provider: (newConfig.provider as any) || "gemini",
      apiKey: newConfig.apiKey || "",
      modelName: newConfig.modelName || "",
      endpoint: newConfig.endpoint || "",
      label: newConfig.label || "",
      isEnabled: true,
      createdAt: Date.now(),
    };

    const updatedConfigs = [...settings.apiConfigs, config];
    setSettings({
      ...settings,
      apiConfigs: updatedConfigs,
      activeConfigId: settings.activeConfigId || config.id,
    });
    setIsAddingNew(false);
    setNewConfig({
      provider: "gemini",
      label: "",
      apiKey: "",
      modelName: "gemini-1.5-flash",
      isEnabled: true,
    });
    toast.success("New API configuration node added to stack.");
  };

  const deleteConfig = (id: string) => {
    if (settings.apiConfigs.length <= 1) {
      toast.error(
        "At least one configuration must remain in the stack for system stability.",
      );
      return;
    }
    const updated = settings.apiConfigs.filter((c) => c.id !== id);
    setSettings({
      ...settings,
      apiConfigs: updated,
      activeConfigId:
        settings.activeConfigId === id
          ? updated[0].id
          : settings.activeConfigId,
    });
    toast.success("Configuration node offline and purged.");
  };

  const toggleConfig = (id: string) => {
    const updated = settings.apiConfigs.map((c) =>
      c.id === id ? { ...c, isEnabled: !c.isEnabled } : c,
    );
    setSettings({ ...settings, apiConfigs: updated });
  };

  const setActive = (id: string) => {
    setSettings({ ...settings, activeConfigId: id });
    toast.info(
      `Routing logic shifted to: ${settings.apiConfigs.find((c) => c.id === id)?.label}`,
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="animate-spin text-brand-gold w-16 h-16" />
          <p className="text-white font-black uppercase tracking-[0.5em] text-xs animate-pulse">
            Initializing Core Settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-white/5 pb-24 space-y-10">
      {/* High Contrast Industrial Header */}
      <div className="bg-slate-900 text-white p-12 md:p-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div
            className="absolute top-0 left-0 w-full h-full"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          ></div>
        </div>

        <div className="max-w-[1920px] mx-auto relative z-10">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-brand-gold text-slate-950 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                  <Settings2 size={32} />
                </div>
                <div>
                  <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white uppercase italic">
                    System Core
                  </h1>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse"></span>
                    <p className="text-brand-gold font-black text-xs uppercase tracking-[0.3em]">
                      Infrastructure Management Dashboard
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-slate-400 text-lg font-bold max-w-3xl leading-relaxed">
                Configure your multi-provider AI stack. Managed configurations
                allow instant failover and routing between Gemini, OpenAI, and
                Custom endpoints.
              </p>
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="bg-slate-800/50 backdrop-blur-md p-8 rounded-[2rem] border border-white/5 shadow-2xl">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Active Node
                </p>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-gold/10 rounded-xl">
                    <Zap className="text-brand-gold" size={24} />
                  </div>
                  <p className="text-2xl font-black text-white truncate max-w-[200px]">
                    {settings.apiConfigs.find(
                      (c) => c.id === settings.activeConfigId,
                    )?.label || "None Selected"}
                  </p>
                </div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-md p-8 rounded-[2rem] border border-white/5 shadow-2xl">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Total Nodes
                </p>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <LayoutDashboard className="text-blue-400" size={24} />
                  </div>
                  <p className="text-2xl font-black text-white">
                    {settings.apiConfigs.length} Clusters
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* API Nodes Architecture Listing */}
        <div className="lg:col-span-8 space-y-10">
          <div className="flex justify-between items-center bg-white dark:bg-[#121212] p-10 rounded-[3rem] shadow-sm border border-slate-100">
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                <History className="text-brand-gold" size={32} />
                Configuration Stack
              </h2>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">
                Manage and monitor all deployed API endpoints
              </p>
            </div>
            <button
              onClick={() => setIsAddingNew(true)}
              className="bg-brand-blue text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-brand-gold hover:text-brand-blue transition-all shadow-xl shadow-brand-blue/10 active:scale-95"
            >
              <Plus size={18} /> Provision New Node
            </button>
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {settings.apiConfigs.map((config) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={config.id}
                  className={cn(
                    "bg-white rounded-[2.5rem] p-8 border-2 transition-all duration-500 relative group overflow-hidden",
                    settings.activeConfigId === config.id
                      ? "border-brand-gold shadow-2xl ring-4 ring-brand-gold/5"
                      : "border-slate-100 shadow-sm hover:border-slate-300",
                  )}
                >
                  {/* High Contrast Indicator for Active Node */}
                  {settings.activeConfigId === config.id && (
                    <div className="absolute top-0 right-0 bg-brand-gold text-slate-950 px-6 py-2 rounded-bl-3xl font-black text-[10px] uppercase tracking-widest shadow-lg">
                      ACTIVE ROUTE
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row justify-between gap-10 relative z-10">
                    <div className="flex gap-8 items-start">
                      <div
                        className={cn(
                          "w-20 h-20 rounded-3xl flex items-center justify-center shrink-0 border-4 transition-colors",
                          config.isEnabled
                            ? "bg-slate-950 border-emerald-500/30 text-emerald-500"
                            : "bg-slate-100 border-slate-200 text-slate-400",
                        )}
                      >
                        {config.provider === "gemini" ? (
                          <Zap size={32} />
                        ) : config.provider === "openai" ? (
                          <Cpu size={32} />
                        ) : (
                          <Globe size={32} />
                        )}
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {config.label}
                          </h3>
                          {!config.isEnabled && (
                            <span className="bg-slate-100 text-slate-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                              OFFLINE
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4">
                          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <Cpu size={12} className="text-brand-gold" />{" "}
                            {config.provider}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <Settings2 size={12} className="text-brand-gold" />{" "}
                            {config.modelName || "System Default"}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                          <div className="relative group/key">
                            <p className="text-xs font-mono text-slate-300 bg-slate-50 dark:bg-white/5 px-3 py-2 rounded-lg border border-slate-100 italic transition-all group-hover/key:text-slate-600 dark:text-slate-300">
                              {showKey === config.id
                                ? config.apiKey
                                : "••••••••••••••••••••••••••••"}
                            </p>
                            <button
                              onClick={() =>
                                setShowKey(
                                  showKey === config.id ? null : config.id,
                                )
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:text-brand-blue text-slate-300 transition-colors"
                            >
                              {showKey === config.id ? (
                                <EyeOff size={14} />
                              ) : (
                                <Eye size={14} />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex md:flex-col justify-end gap-3 min-w-[200px]">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setActive(config.id)}
                          disabled={
                            !config.isEnabled ||
                            settings.activeConfigId === config.id
                          }
                          className={cn(
                            "flex-grow px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2",
                            settings.activeConfigId === config.id
                              ? "bg-emerald-500 text-white border-emerald-500 shadow-xl shadow-emerald-500/20"
                              : config.isEnabled
                                ? "bg-white text-slate-900 dark:text-white border-slate-200 hover:border-brand-gold hover:text-brand-gold"
                                : "bg-slate-50 text-slate-400 border-transparent cursor-not-allowed",
                          )}
                        >
                          {settings.activeConfigId === config.id
                            ? "Live Status"
                            : "Set Active"}
                        </button>
                        <button
                          onClick={() => toggleConfig(config.id)}
                          className={cn(
                            "p-4 rounded-2xl transition-all border-2",
                            config.isEnabled
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-500 hover:text-white"
                              : "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-500 hover:text-white",
                          )}
                        >
                          {config.isEnabled ? (
                            <Power size={20} />
                          ) : (
                            <PowerOff size={20} />
                          )}
                        </button>
                      </div>
                      <button
                        onClick={() => deleteConfig(config.id)}
                        className="w-full px-6 py-3 rounded-xl border border-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        <Trash2 size={14} /> Purge Node
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Global Action & Instructions Sidebar */}
        <div className="lg:col-span-4 space-y-10">
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <h4 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-3">
              <ShieldCheck className="text-brand-gold" size={24} /> Security
              Protocol
            </h4>
            <div className="space-y-6">
              {[
                "Configurations are encrypted during storage.",
                "Primary routing prioritizes 'Live Status' nodes.",
                "API keys are jamais exposed to client-side logic.",
                "Ensure your model identifiers match provider specs.",
              ].map((text, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase">
                    {text}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-12 border-t border-white/5">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-brand-gold text-slate-950 p-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:translate-y-[-4px] transition-all shadow-2xl shadow-brand-gold/20 active:scale-95 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <Save size={20} /> Push Configuration
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-brand-blue/5 text-brand-blue rounded-xl">
                <LayoutDashboard size={20} />
              </div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                Stack Operations
              </h4>
            </div>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">
              Adding multiple configurations allows for seamless transition
              between development and production keys or between different AI
              providers without code modifications.
            </p>
            <ul className="space-y-4 pt-4">
              <li className="flex items-center gap-3 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                <CheckCircle2 size={14} /> Only enabled nodes can be set to
                active
              </li>
              <li className="flex items-center gap-3 text-[10px] font-black text-amber-600 uppercase tracking-widest">
                <CheckCircle2 size={14} /> At least 1 node must remain in stack
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modern Modal for New Config */}
      <AnimatePresence>
        {isAddingNew && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingNew(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl relative z-10 overflow-hidden flex flex-col md:flex-row"
            >
              <div className="w-full md:w-[40%] bg-slate-950 p-12 text-white flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 bg-brand-gold rounded-2xl flex items-center justify-center text-slate-950 mb-8">
                    <Plus size={32} />
                  </div>
                  <h2 className="text-4xl font-black tracking-tight uppercase italic mb-6 leading-tight">
                    Provision New Node
                  </h2>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest leading-relaxed">
                    Extend the intelligence cluster by adding a new provider
                    endpoint to the configuration stack.
                  </p>
                </div>
                <div className="pt-12">
                  <div className="flex items-center gap-4 text-emerald-500">
                    <ShieldCheck size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Validation Active
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-[60%] p-12 space-y-8 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Descriptive Label
                    </label>
                    <input
                      type="text"
                      className="w-full px-8 py-5 rounded-3xl border border-slate-100 bg-slate-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold placeholder:text-slate-300"
                      placeholder="e.g., Gemini-1.5-Production"
                      value={newConfig.label}
                      onChange={(e) =>
                        setNewConfig({ ...newConfig, label: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Intelligence Provider
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {["gemini", "openai", "custom"].map((p) => (
                        <button
                          key={p}
                          onClick={() =>
                            setNewConfig({ ...newConfig, provider: p as any })
                          }
                          className={cn(
                            "py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all",
                            newConfig.provider === p
                              ? "bg-slate-950 text-white border-slate-950"
                              : "bg-slate-50 border-transparent text-slate-400",
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Secret API Key
                    </label>
                    <input
                      type="password"
                      className="w-full px-8 py-5 rounded-3xl border border-slate-100 bg-slate-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                      placeholder="Enter credentials..."
                      value={newConfig.apiKey}
                      onChange={(e) =>
                        setNewConfig({ ...newConfig, apiKey: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Model Identifier
                      </label>
                      <input
                        type="text"
                        className="w-full px-8 py-5 rounded-3xl border border-slate-100 bg-slate-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                        placeholder="e.g. gemini-1.5-flash"
                        value={newConfig.modelName}
                        onChange={(e) =>
                          setNewConfig({
                            ...newConfig,
                            modelName: e.target.value,
                          })
                        }
                      />
                    </div>
                    {newConfig.provider === "custom" && (
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Base API Endpoint
                        </label>
                        <input
                          type="text"
                          className="w-full px-8 py-5 rounded-3xl border border-slate-100 bg-slate-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                          placeholder="https://apiUrl.com/v1"
                          value={newConfig.endpoint}
                          onChange={(e) =>
                            setNewConfig({
                              ...newConfig,
                              endpoint: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-8">
                  <button
                    onClick={() => setIsAddingNew(false)}
                    className="flex-grow py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                  >
                    Abort Operation
                  </button>
                  <button
                    onClick={addConfig}
                    className="flex-grow bg-slate-950 text-white py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-gold hover:text-slate-950 transition-all shadow-2xl shadow-slate-950/20 active:scale-95"
                  >
                    Commit Node to Cluster
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
