import React, { useState } from 'react';
import { auth } from '../../firebase';
import { 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from 'firebase/auth';
import { 
  ShieldCheck, 
  Loader2, 
  User, 
  Mail, 
  Lock,
  Smartphone,
  Save,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export default function AdminAccount() {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const user = auth.currentUser;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error("Password should be at least 6 characters");
      return;
    }

    setUpdatingPassword(true);
    const toastId = toast.loading("Updating password...");

    try {
      if (!user || !user.email) throw new Error("No user found");

      // Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, passwordData.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, passwordData.newPassword);
      
      toast.success("Password updated successfully!", { id: toastId });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error("Password update error:", error);
      let message = "Failed to update password";
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = "Current password is incorrect";
      } else if (error.code === 'auth/too-many-requests') {
        message = "Too many failed attempts. Please try again later.";
      }
      toast.error(message, { id: toastId });
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-brand-blue uppercase tracking-tight">Account Settings</h1>
        <p className="text-gray-500 text-sm md:text-base">Manage your administrator account security and profile.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-brand-blue text-white rounded-3xl flex items-center justify-center text-3xl font-bold mb-6 shadow-xl shadow-brand-blue/10">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <h2 className="text-xl font-bold text-brand-blue mb-1">{user?.displayName || 'Administrator'}</h2>
            <p className="text-sm font-medium text-gray-400 mb-6">{user?.email}</p>
            
            <div className="w-full pt-6 border-t border-gray-50 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-xs font-bold text-gray-500 bg-gray-50 p-3 rounded-xl">
                <ShieldCheck className="text-brand-gold" size={16} />
                <span>Super Admin Access</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-green-600 bg-green-50 p-3 rounded-xl">
                <CheckCircle2 size={16} />
                <span>Status: Active</span>
              </div>
            </div>
          </div>

          <div className="bg-brand-blue p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-4">Security Notice</h4>
            <p className="text-xs text-brand-blue-light leading-relaxed font-medium opacity-80">
              Ensure your password is complex and kept private. Admin accounts handle sensitive candidate data and system configurations.
            </p>
          </div>
        </div>

        {/* Security Form */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-brand-blue mb-8 flex items-center gap-3 uppercase tracking-tight">
              <Lock className="text-brand-gold" size={24} /> 
              Change Password
            </h3>
            
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Authorization Password</label>
                <div className="relative">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                   <input 
                    type="password" 
                    required
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 outline-none focus:bg-white focus:border-brand-gold transition-all font-medium text-brand-blue"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Secure Password</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      type="password" 
                      required
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 outline-none focus:bg-white focus:border-brand-gold transition-all font-medium text-brand-blue"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Min. 6 characters"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      type="password" 
                      required
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 outline-none focus:bg-white focus:border-brand-gold transition-all font-medium text-brand-blue"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Repeat new password"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  type="submit"
                  disabled={updatingPassword}
                  className="bg-brand-blue text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand-gold hover:text-brand-blue hover:scale-105 transition-all shadow-xl shadow-brand-blue/10 disabled:opacity-50 active:scale-95 flex items-center gap-2"
                >
                  {updatingPassword ? <Loader2 className="animate-spin" size={20} /> : <><Save size={18} /> Update Access Password</>}
                </button>
              </div>
            </form>
          </section>

          <section className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-brand-blue mb-8 flex items-center gap-3 uppercase tracking-tight">
              <User className="text-brand-gold" size={24} /> 
              Admin Identity
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 opacity-60">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Email (Permanent)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="email" 
                    readOnly
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-100 outline-none font-medium text-brand-blue cursor-not-allowed"
                    value={user?.email || ''}
                  />
                </div>
              </div>
              <div className="space-y-2 opacity-60">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Authentication Provider</label>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="text" 
                    readOnly
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-100 outline-none font-medium text-brand-blue cursor-not-allowed"
                    value={user?.providerData[0]?.providerId === 'password' ? 'Email / Password' : 'External Provider'}
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50">
              <p className="text-xs text-brand-blue font-bold leading-relaxed">
                <span className="text-brand-gold mr-2 italic">Note:</span> 
                Contact the system technical administrator if you need to change your primary account email or update administrative permissions.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
