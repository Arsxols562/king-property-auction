import { useState } from "react";
import { X, Users, Lock, Mail, Phone, User } from "lucide-react";
import { useTheme } from "../../../app/hooks/useTheme";
import { apiClient } from "@/lib/apiClient";
import { showSuccess, showError } from "@/lib/toast";

export default function AddUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [permissions, setPermissions] = useState({
    canBid: true,
    canListProperties: false,
    emailNotifications: true,
    smsAlerts: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    
    const firstName = (formData.get('firstName') as string || '').trim();
    const lastName = (formData.get('lastName') as string || '').trim();
    const email = (formData.get('email') as string || '').trim();
    const phone = (formData.get('phone') as string || '').trim();
    if (!firstName || firstName.length < 2 || !lastName || lastName.length < 2) { setError("First and last name must each be at least 2 characters"); setLoading(false); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Please enter a valid email address"); setLoading(false); return; }
    if (!phone || phone.replace(/[\s\-\+\(\)]/g, "").length < 10) { setError("Please enter a valid phone number"); setLoading(false); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); setLoading(false); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); setLoading(false); return; }

    const data = {
      name: `${formData.get('firstName')} ${formData.get('lastName')}`,
      email: formData.get('email') as string,
      password: password,
      phone: formData.get('phone') as string,
      role: formData.get('role') as string || 'user',
      isActive: formData.get('status') !== 'inactive',
      permissions: permissions,
    };
    
    try {
      const result = await apiClient.fetch('/auth/register', { method: 'POST', body: JSON.stringify(data) });
      if (result.success) {
        setSuccess('✅ User created successfully!');
        showSuccess("User created!", "The user account has been created successfully.");
        if (onSuccess) onSuccess();
        setTimeout(() => { setSuccess(''); onClose(); }, 1500);
      } else {
        setError(result.message || 'Failed to create user');
        showError("Creation failed", result.message || "Failed to create user");
      }
    } catch (err: any) {
      setError(err?.message || 'Cannot connect to server');
      showError("Error", err?.message || "Cannot connect to server");
    }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border-2 border-white/60">
        <div className={`sticky top-0 bg-gradient-to-br ${theme.primary} px-4 sm:px-8 py-4 sm:py-6 rounded-t-2xl sm:rounded-t-3xl border-b-2 border-white/20`}>
          <div className="flex items-center justify-between">
            <div><h2 className="text-xl sm:text-3xl font-black text-white mb-1 sm:mb-2">Add New User</h2><p className="text-sm text-white/90 font-medium">Create a new user account</p></div>
            <button onClick={onClose} title="Close" className="size-10 rounded-xl bg-white/20 backdrop-blur-md hover:bg-white/30 flex items-center justify-center transition-all border border-white/30 hover:scale-110"><X className="size-5 text-white" /></button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-4 sm:space-y-6">
          
          <div className="space-y-4">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><Users className="size-6 text-blue-600" />Personal Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-bold text-slate-700 mb-2">First Name *</label><div className="relative"><User className="absolute left-3 top-3.5 size-5 text-slate-400" /><input name="firstName" type="text" placeholder="John" className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" required /></div></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-2">Last Name *</label><div className="relative"><User className="absolute left-3 top-3.5 size-5 text-slate-400" /><input name="lastName" type="text" placeholder="Smith" className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" required /></div></div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-bold text-slate-700 mb-2">Email *</label><div className="relative"><Mail className="absolute left-3 top-3.5 size-5 text-slate-400" /><input name="email" type="email" placeholder="john@example.com" className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" required /></div></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-2">Phone *</label><div className="relative"><Phone className="absolute left-3 top-3.5 size-5 text-slate-400" /><input name="phone" type="tel" placeholder="+44 7700 900000" className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" required /></div></div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><Lock className="size-6 text-purple-600" />Account Details</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-bold text-slate-700 mb-2">User Role *</label><select name="role" className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" required><option value="buyer">Buyer</option><option value="seller">Owner</option><option value="agent">Agent</option><option value="admin">Administrator</option></select></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-2">Account Status</label><select name="status" className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-bold text-slate-700 mb-2">Password *</label><input name="password" type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" required /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-2">Confirm Password *</label><input name="confirmPassword" type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" required /></div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200">
            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              🔐 Permissions
              <span className="text-xs font-normal text-slate-400">(saved for future use)</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'canBid', label: 'Can Bid in Auctions' },
                { key: 'canListProperties', label: 'Can List Properties' },
                { key: 'emailNotifications', label: 'Email Notifications' },
                { key: 'smsAlerts', label: 'SMS Alerts' },
              ].map(perm => (
                <div key={perm.key} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-xs font-medium text-slate-700">{perm.label}</span>
                  <button
                    type="button"
                    onClick={() => setPermissions(prev => ({ ...prev, [perm.key]: !prev[perm.key as keyof typeof prev] }))}
                    className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${permissions[perm.key as keyof typeof permissions] ? 'bg-green-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-0.5 size-4 bg-white rounded-full shadow transition-all ${permissions[perm.key as keyof typeof permissions] ? 'left-4' : 'left-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {success && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">{success}</div>}
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">{error}</div>}


          <div className="flex items-center gap-4 pt-6 border-t-2 border-slate-100">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-4 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-all">Cancel</button>
            <button type="submit" disabled={loading} className={`flex-1 px-6 py-4 bg-gradient-to-r ${theme.secondary} text-white rounded-xl font-bold hover:scale-105 transition-all shadow-lg disabled:opacity-50`}>{loading ? "Creating..." : "Create User"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}