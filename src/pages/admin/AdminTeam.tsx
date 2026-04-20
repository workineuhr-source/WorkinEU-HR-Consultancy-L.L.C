import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { TeamMember } from '../../types';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Save, X, Upload, Loader2, Phone, Briefcase, User, Mail } from 'lucide-react';

const HR_POSITIONS = [
  "CEO & Founder",
  "Managing Director",
  "HR Manager",
  "Recruitment Consultant",
  "Talent Acquisition Specialist",
  "HR Executive",
  "HR Coordinator",
  "Operations Manager",
  "Documentation Specialist",
  "Visa Consultant",
  "Admin Officer",
  "Public Relations Officer (PRO)"
];

export default function AdminTeam() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    position: '',
    whatsapp: '',
    email: '',
    photoUrl: '',
    bio: '',
    order: 0
  });

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const q = query(collection(db, 'team'), orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);
      const teamData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamMember));
      setTeam(teamData);
    } catch (error) {
      console.error("Error fetching team:", error);
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `team/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setFormData({ ...formData, photoUrl: url });
      toast.success("Photo uploaded!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      toast.error(`Upload failed: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.position || !formData.whatsapp) {
      toast.error("Please fill all required fields");
      return;
    }

    const DEFAULT_PHOTO = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    const finalPhotoUrl = formData.photoUrl || DEFAULT_PHOTO;

    try {
      if (editingMember) {
        await updateDoc(doc(db, 'team', editingMember.id), { ...formData, photoUrl: finalPhotoUrl });
        toast.success("Team member updated!");
      } else {
        await addDoc(collection(db, 'team'), { ...formData, photoUrl: finalPhotoUrl, order: team.length });
        toast.success("Team member added!");
      }
      setIsModalOpen(false);
      setEditingMember(null);
      setFormData({ name: '', position: '', whatsapp: '', email: '', photoUrl: '', bio: '', order: 0 });
      fetchTeam();
    } catch (error) {
      console.error("Error saving team member:", error);
      toast.error("Failed to save");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'team', deleteId));
      toast.success("Member deleted");
      setDeleteId(null);
      fetchTeam();
    } catch (error) {
      toast.error("Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      position: member.position,
      whatsapp: member.whatsapp,
      email: member.email || '',
      photoUrl: member.photoUrl,
      bio: member.bio || '',
      order: member.order
    });
    setIsModalOpen(true);
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newTeam = [...team];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= team.length) return;

    // Swap orders
    const tempOrder = newTeam[index].order;
    newTeam[index].order = newTeam[targetIndex].order;
    newTeam[targetIndex].order = tempOrder;

    try {
      await Promise.all([
        updateDoc(doc(db, 'team', newTeam[index].id), { order: newTeam[index].order }),
        updateDoc(doc(db, 'team', newTeam[targetIndex].id), { order: newTeam[targetIndex].order })
      ]);
      fetchTeam();
    } catch (error) {
      toast.error("Failed to reorder");
    }
  };

  if (loading) return <div className="animate-pulse h-96 bg-white rounded-2xl"></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-blue">Team Management</h1>
          <p className="text-gray-500 text-sm md:text-base">Manage your team members, their positions, and contact info.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={() => {
              setEditingMember(null);
              setFormData({ name: '', position: '', whatsapp: '', email: '', photoUrl: '', bio: '', order: team.length });
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-none bg-brand-blue text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-gold transition-all shadow-lg"
          >
            <Plus size={20} /> Add Member
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {team.map((member, index) => (
          <div key={member.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group relative">
            <div className="absolute left-2 top-2 z-10 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                disabled={index === 0}
                onClick={() => handleMove(index, 'up')}
                className="p-1.5 bg-white/90 text-brand-blue rounded-lg shadow-sm hover:bg-brand-gold disabled:opacity-30 disabled:hover:bg-white/90"
              >
                <Plus size={14} className="rotate-180" />
              </button>
              <button 
                disabled={index === team.length - 1}
                onClick={() => handleMove(index, 'down')}
                className="p-1.5 bg-white/90 text-brand-blue rounded-lg shadow-sm hover:bg-brand-gold disabled:opacity-30 disabled:hover:bg-white/90"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="aspect-square relative">
              {member.photoUrl && member.photoUrl !== "" && (
                <img 
                  src={member.photoUrl} 
                  alt={member.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <button 
                  onClick={() => openEditModal(member)}
                  className="p-3 bg-white text-brand-blue rounded-full hover:bg-brand-gold transition-colors shadow-lg"
                >
                  <Edit2 size={20} />
                </button>
                <button 
                  onClick={() => setDeleteId(member.id)}
                  className="p-3 bg-white text-red-500 rounded-full hover:bg-red-50 transition-colors shadow-lg"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
            <div className="p-5 md:p-6">
              <h3 className="text-lg md:text-xl font-bold text-brand-blue mb-1">{member.name}</h3>
              <p className="text-brand-gold font-medium mb-3 md:mb-4 text-sm md:text-base">{member.position}</p>
              <div className="flex items-center gap-2 text-gray-500 text-xs md:text-sm">
                <Phone size={14} className="md:w-4 md:h-4" />
                <span>{member.whatsapp}</span>
              </div>
              {member.email && (
                <div className="flex items-center gap-2 text-gray-500 text-xs md:text-sm mt-1">
                  <Mail size={14} className="md:w-4 md:h-4" />
                  <span className="truncate">{member.email}</span>
                </div>
              )}
              {member.bio && (
                <p className="text-gray-400 text-[10px] md:text-xs mt-3 line-clamp-2 italic">
                  "{member.bio}"
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-5 md:p-6 border-b border-gray-100 flex justify-between items-center bg-brand-blue text-white shrink-0">
              <h3 className="text-lg md:text-xl font-bold">{editingMember ? 'Edit Member' : 'Add New Member'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto">
              <div className="flex flex-col items-center">
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-4 uppercase tracking-widest">Photo (Optional)</label>
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-gray-100 bg-gray-50 group">
                  {formData.photoUrl ? (
                    <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <User size={40} className="md:w-12 md:h-12" />
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/40 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    {uploading ? <Loader2 className="animate-spin text-white" /> : <Upload className="text-white" />}
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">Full Name</label>
                  <input 
                    required
                    className="w-full px-4 py-2.5 md:py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold text-sm md:text-base"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">Position</label>
                  <input 
                    required
                    list="hr-positions"
                    className="w-full px-4 py-2.5 md:py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold text-sm md:text-base"
                    value={formData.position}
                    onChange={e => setFormData({...formData, position: e.target.value})}
                    placeholder="e.g. HR Manager"
                  />
                  <datalist id="hr-positions">
                    {HR_POSITIONS.map(pos => <option key={pos} value={pos} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">WhatsApp Number</label>
                  <input 
                    required
                    placeholder="+977 98XXXXXXXX"
                    className="w-full px-4 py-2.5 md:py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold text-sm md:text-base"
                    value={formData.whatsapp}
                    onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">Email Address</label>
                  <input 
                    type="email"
                    placeholder="example@gmail.com"
                    className="w-full px-4 py-2.5 md:py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold text-sm md:text-base"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">Short Bio</label>
                  <textarea 
                    rows={3}
                    placeholder="Brief description of the team member..."
                    className="w-full px-4 py-2.5 md:py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold text-sm md:text-base resize-none"
                    value={formData.bio}
                    onChange={e => setFormData({...formData, bio: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">Display Order</label>
                  <input 
                    type="number"
                    className="w-full px-4 py-2.5 md:py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-gold text-sm md:text-base"
                    value={isNaN(formData.order) ? '' : formData.order}
                    onChange={e => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-brand-blue text-white py-3 md:py-4 rounded-xl font-bold hover:bg-brand-gold transition-all shadow-lg flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <Save size={18} className="md:w-5 md:h-5" /> {editingMember ? 'Update Member' : 'Add Member'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-brand-blue mb-2">Delete Member?</h3>
              <p className="text-gray-500 mb-8">Are you sure you want to remove this team member? This action cannot be undone.</p>
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
