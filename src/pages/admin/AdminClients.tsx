import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  Building2,
  Upload,
  Globe,
  Star,
  MessageSquare,
  Save,
  X,
  Quote,
  AlertTriangle,
  ImageIcon,
} from "lucide-react";
import { db } from "../../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
import { toast } from "sonner";
import { ClientPartner } from "../../types";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { COUNTRIES } from "../../constants";
import { Edit2 } from "lucide-react";

export default function AdminClients() {
  const [clients, setClients] = useState<ClientPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientPartner | null>(
    null,
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newClient, setNewClient] = useState<Partial<ClientPartner>>({
    companyName: "",
    country: "",
    logoUrl: "",
    review: "",
    reviewerName: "",
    reviewerPosition: "",
    storyNote: "",
    rating: 5,
    order: 0,
  });

  useEffect(() => {
    const q = query(
      collection(db, "clients"),
      orderBy("order", "asc"),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClients(
        snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as ClientPartner,
        ),
      );
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `clients/logo-${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setNewClient({ ...newClient, logoUrl: url });
      toast.success("Company logo uploaded!");
    } catch (error: any) {
      console.error("Upload error:", error);
      let errorMessage = "Failed to upload logo";
      if (error.code === "storage/unauthorized") {
        errorMessage =
          "Permission denied. Please ensure you are logged in as an administrator.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.companyName || !newClient.country) {
      toast.error("Company name and country are required");
      return;
    }

    try {
      if (editingClient) {
        await setDoc(
          doc(db, "clients", editingClient.id),
          {
            ...newClient,
            updatedAt: Date.now(),
          },
          { merge: true },
        );
        toast.success("Client/Partner updated!");
      } else {
        await addDoc(collection(db, "clients"), {
          ...newClient,
          createdAt: Date.now(),
          order: clients.length,
        });
        toast.success("Client/Partner added!");
      }
      setIsAdding(false);
      setEditingClient(null);
      setNewClient({
        companyName: "",
        country: "",
        logoUrl: "",
        review: "",
        reviewerName: "",
        reviewerPosition: "",
        storyNote: "",
        order: 0,
      });
    } catch (error) {
      toast.error("Failed to save client");
    }
  };

  const handleEdit = (client: ClientPartner) => {
    setEditingClient(client);
    setNewClient({
      companyName: client.companyName,
      country: client.country,
      logoUrl: client.logoUrl,
      review: client.review,
      reviewerName: client.reviewerName,
      reviewerPosition: client.reviewerPosition,
      storyNote: client.storyNote,
      rating: client.rating || 5,
      order: client.order,
    });
    setIsAdding(true);
  };

  const handleMove = async (
    client: ClientPartner,
    direction: "up" | "down",
  ) => {
    const currentIndex = clients.findIndex((c) => c.id === client.id);
    if (direction === "up" && currentIndex > 0) {
      const prevClient = clients[currentIndex - 1];
      await setDoc(
        doc(db, "clients", client.id),
        { ...client, order: prevClient.order },
        { merge: true },
      );
      await setDoc(
        doc(db, "clients", prevClient.id),
        { ...prevClient, order: client.order },
        { merge: true },
      );
      toast.success("Order updated");
    } else if (direction === "down" && currentIndex < clients.length - 1) {
      const nextClient = clients[currentIndex + 1];
      await setDoc(
        doc(db, "clients", client.id),
        { ...client, order: nextClient.order },
        { merge: true },
      );
      await setDoc(
        doc(db, "clients", nextClient.id),
        { ...nextClient, order: client.order },
        { merge: true },
      );
      toast.success("Order updated");
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, "clients", deleteId));
      toast.success("Client deleted");
    } catch (error) {
      toast.error("Failed to delete client");
    } finally {
      setDeleteId(null);
    }
  };

  if (loading)
    return (
      <div className="animate-pulse h-96 bg-white dark:bg-[#121212] rounded-2xl"></div>
    );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white dark:bg-[#121212] p-8 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-brand-blue">
            Clients & Partners
          </h1>
          <p className="text-gray-500 dark:text-gray-300">
            Manage your international client companies, their reviews, and
            success stories.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-brand-blue text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-brand-gold hover:text-brand-blue transition-all shadow-xl shadow-brand-blue/20"
        >
          <Plus size={20} /> Add New Client
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white p-8 rounded-3xl shadow-lg border border-brand-gold/20 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-brand-blue">
                {editingClient
                  ? "Edit Client/Partner"
                  : "Add New Client/Partner"}
              </h2>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingClient(null);
                }}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddClient} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Company Info */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest mb-2">
                      Company Name
                    </label>
                    <div className="relative">
                      <Building2
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        required
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                        value={newClient.companyName}
                        onChange={(e) =>
                          setNewClient({
                            ...newClient,
                            companyName: e.target.value,
                          })
                        }
                        placeholder="Company Name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest mb-2">
                      Country of Operation
                    </label>
                    <div className="relative">
                      <Globe
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        required
                        list="countries-list"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                        value={newClient.country}
                        onChange={(e) =>
                          setNewClient({
                            ...newClient,
                            country: e.target.value,
                          })
                        }
                        placeholder="e.g. Romania"
                      />
                      <datalist id="countries-list">
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest mb-2">
                      Company Logo
                    </label>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                          {newClient.logoUrl && newClient.logoUrl !== "" ? (
                            <img
                              referrerPolicy="no-referrer"
                              src={newClient.logoUrl}
                              className="w-full h-full object-contain p-2"
                            />
                          ) : (
                            <Building2 className="text-gray-300" size={32} />
                          )}
                        </div>
                        <label className="flex-grow bg-brand-blue/5 border border-brand-blue/10 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-brand-blue/10 transition-all">
                          {uploading ? (
                            <Loader2 className="animate-spin text-brand-blue" />
                          ) : (
                            <Upload
                              className="text-brand-blue mb-1"
                              size={20}
                            />
                          )}
                          <span className="text-[10px] font-bold text-brand-blue uppercase font-sans">
                            Upload Logo
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileUpload}
                          />
                        </label>
                      </div>
                      <div className="relative">
                        <ImageIcon
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                        <input
                          type="text"
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-xs"
                          value={newClient.logoUrl || ""}
                          onChange={(e) =>
                            setNewClient({
                              ...newClient,
                              logoUrl: e.target.value,
                            })
                          }
                          placeholder="Or paste direct logo URL here..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review Info */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest mb-2">
                      Reviewer Name
                    </label>
                    <input
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                      value={newClient.reviewerName}
                      onChange={(e) =>
                        setNewClient({
                          ...newClient,
                          reviewerName: e.target.value,
                        })
                      }
                      placeholder="e.g. John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest mb-2">
                      Reviewer Position
                    </label>
                    <input
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm font-bold"
                      value={newClient.reviewerPosition}
                      onChange={(e) =>
                        setNewClient({
                          ...newClient,
                          reviewerPosition: e.target.value,
                        })
                      }
                      placeholder="e.g. HR Manager"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest mb-2">
                      Review Rating (Stars)
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() =>
                            setNewClient({ ...newClient, rating: star })
                          }
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all border",
                            newClient.rating === star
                              ? "bg-brand-gold text-white border-brand-gold shadow-lg shadow-brand-gold/20"
                              : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100",
                          )}
                        >
                          <Star
                            size={16}
                            className={cn(
                              newClient.rating && newClient.rating >= star
                                ? "fill-current"
                                : "",
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest mb-2">
                      Client Review/Testimonial
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm"
                      value={newClient.review}
                      onChange={(e) =>
                        setNewClient({ ...newClient, review: e.target.value })
                      }
                      placeholder="What the client says about your service..."
                    ></textarea>
                  </div>
                </div>

                {/* Story Note */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest mb-2">
                    Success Story Note
                  </label>
                  <textarea
                    rows={9}
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 dark:bg-white/5 outline-none focus:bg-white focus:border-brand-gold transition-all text-sm"
                    value={newClient.storyNote}
                    onChange={(e) =>
                      setNewClient({ ...newClient, storyNote: e.target.value })
                    }
                    placeholder="A small story about your collaboration with this client..."
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-8 py-3.5 rounded-2xl font-bold text-gray-500 dark:text-gray-300 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-blue text-white px-10 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-brand-gold hover:text-brand-blue transition-all shadow-xl shadow-brand-blue/20"
                >
                  <Save size={20} />{" "}
                  {editingClient
                    ? "Update Client Profile"
                    : "Save Client Profile"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {clients.map((client) => (
          <motion.div
            layout
            key={client.id}
            className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden group flex flex-col"
          >
            <div className="p-8 border-b border-gray-50 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 flex items-center justify-center p-2">
                  {client.logoUrl && client.logoUrl !== "" ? (
                    <img
                      referrerPolicy="no-referrer"
                      src={client.logoUrl}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Building2 className="text-gray-300" size={32} />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-brand-blue leading-tight">
                    {client.companyName}
                  </h3>
                  <div className="flex items-center gap-1.5 text-brand-gold mt-1">
                    <Globe size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {client.country}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex flex-col gap-1 mr-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => handleMove(client, "up")}
                    disabled={clients.indexOf(client) === 0}
                    className="w-8 h-8 bg-gray-50 dark:bg-white/5 text-gray-400 rounded-lg flex items-center justify-center hover:bg-brand-teal hover:text-white disabled:opacity-20 transition-all"
                    title="Move Up"
                  >
                    <Plus size={14} className="rotate-180" />
                  </button>
                  <button
                    onClick={() => handleMove(client, "down")}
                    disabled={clients.indexOf(client) === clients.length - 1}
                    className="w-8 h-8 bg-gray-50 dark:bg-white/5 text-gray-400 rounded-lg flex items-center justify-center hover:bg-brand-teal hover:text-white disabled:opacity-20 transition-all"
                    title="Move Down"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  onClick={() => handleEdit(client)}
                  className="w-10 h-10 bg-gray-50 dark:bg-white/5 text-blue-500 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-50 hover:text-blue-600 shadow-sm"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(client.id)}
                  className="w-10 h-10 bg-gray-50 dark:bg-white/5 text-red-400 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-600 shadow-sm"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 flex-grow">
              {client.review && (
                <div className="bg-brand-blue/5 p-6 rounded-2xl relative">
                  <Quote className="absolute -top-3 -left-3 text-brand-gold/20 w-10 h-10" />
                  <p className="text-gray-600 dark:text-gray-300 text-sm italic relative z-10">
                    "{client.review}"
                  </p>
                  {(client.reviewerName || client.reviewerPosition) && (
                    <div className="mt-4 pt-4 border-t border-brand-blue/10">
                      <p className="text-xs font-bold text-brand-blue">
                        {client.reviewerName}
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                        {client.reviewerPosition}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {client.storyNote && (
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Star size={12} className="text-brand-gold" /> Success Story
                  </h4>
                  <p className="text-gray-500 dark:text-gray-300 text-sm leading-relaxed">
                    {client.storyNote}
                  </p>
                </div>
              )}
            </div>

            <div className="px-8 py-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 flex justify-between items-center mt-auto">
              <span className="text-[10px] text-gray-400 font-medium">
                Added on {new Date(client.createdAt).toLocaleDateString()}
              </span>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={10}
                    className={cn(
                      "text-brand-gold",
                      i < (client.rating || 5)
                        ? "fill-brand-gold"
                        : "opacity-20",
                    )}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {clients.length === 0 && !isAdding && (
        <div className="bg-white p-20 rounded-[3rem] text-center border border-dashed border-gray-200">
          <Building2 className="mx-auto text-gray-200 mb-6" size={64} />
          <h3 className="text-2xl font-bold text-brand-blue mb-2">
            No Clients Added Yet
          </h3>
          <p className="text-gray-400 max-w-md mx-auto mb-8">
            Showcase your global partnerships and client testimonials to build
            trust with new candidates.
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="bg-brand-blue text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-brand-gold hover:text-brand-blue transition-all"
          >
            Add First Client
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-blue/60 backdrop-blur-sm"
              onClick={() => setDeleteId(null)}
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 p-8 text-center"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-2xl font-bold text-brand-blue mb-2">
                Confirm Deletion
              </h3>
              <p className="text-gray-500 dark:text-gray-300 mb-8">
                Are you sure you want to delete this client? This action cannot
                be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 px-6 py-3.5 rounded-xl font-bold text-gray-500 dark:text-gray-300 hover:bg-gray-50 transition-all border border-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-500 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Delete Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
