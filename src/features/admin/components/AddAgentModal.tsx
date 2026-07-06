import { useState } from "react";
import { X, UserCheck, Briefcase, PoundSterling, Mail, Phone, User, Lock } from "lucide-react";
import { preventMinus } from "@/utils/validation";

export default function AddAgentModal({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      role: 'agent',
      isActive: true, // Admin-created agents are active by default
      agentDetails: {
        companyName: formData.get('companyName') as string || undefined,
        licenseNumber: formData.get('license') as string || undefined,
        commissionRate: formData.get('commission') ? Number(formData.get('commission')) : undefined,
        specialization: formData.get('specialization') as string || undefined,
      },
    };
    
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await res.json();
      if (result.success) {
        setSuccess('✅ Agent created successfully!');
        if (onSuccess) onSuccess();
        setTimeout(() => { setSuccess(''); onClose(); }, 1500);
      } else {
        setError(result.message || 'Failed to create agent');
      }
    } catch (err) { setError('Cannot connect to server'); }
    finally { setLoading(false); }
  };

  return (
               <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border-2 border-white/60">
        <div className="sticky top-0 bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-600 px-4 sm:px-8 py-4 sm:py-6 rounded-t-2xl sm:rounded-t-3xl border-b-2 border-white/20">
          <div className="flex items-center justify-between">
            <div><h2 className="text-xl sm:text-3xl font-black text-white mb-1 sm:mb-2">Add New Agent</h2><p className="text-sm text-white/90 font-medium">Register a new property agent</p></div>
            <button onClick={onClose} title="Close" className="size-10 rounded-xl bg-white/20 backdrop-blur-md hover:bg-white/30 flex items-center justify-center transition-all border border-white/30 hover:scale-110"><X className="size-5 text-white" /></button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-4 sm:space-y-6">
          
          <div className="space-y-4">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><UserCheck className="size-6 text-orange-600" />Agent Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-bold text-slate-700 mb-2">First Name *</label><div className="relative"><User className="absolute left-3 top-3.5 size-5 text-slate-400" /><input name="firstName" type="text" placeholder="Sarah" className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500" required /></div></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-2">Last Name *</label><div className="relative"><User className="absolute left-3 top-3.5 size-5 text-slate-400" /><input name="lastName" type="text" placeholder="Johnson" className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500" required /></div></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-bold text-slate-700 mb-2">Email *</label><div className="relative"><Mail className="absolute left-3 top-3.5 size-5 text-slate-400" /><input name="email" type="email" placeholder="sarah@agency.com" className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500" required /></div></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-2">Phone *</label><div className="relative"><Phone className="absolute left-3 top-3.5 size-5 text-slate-400" /><input name="phone" type="tel" placeholder="+44 7700 900000" className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500" required /></div></div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><Briefcase className="size-6 text-blue-600" />Company Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-bold text-slate-700 mb-2">Company Name *</label><input name="companyName" type="text" placeholder="Premium Property Agency" className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500" /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-2">License Number</label><input name="license" type="text" placeholder="AG-123456" className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500" /></div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><PoundSterling className="size-6 text-green-600" />Commission & Account</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-bold text-slate-700 mb-2">Commission Rate (%)</label><input name="commission" type="number" placeholder="2.5" step="0.1" min="0" onKeyDown={preventMinus} className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500" /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-2">Specialization</label><select name="specialization" className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"><option value="">Select...</option><option value="residential">Residential</option><option value="commercial">Commercial</option><option value="luxury">Luxury Properties</option><option value="all">All Types</option></select></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div><label className="block text-sm font-bold text-slate-700 mb-2">Password *</label><div className="relative"><Lock className="absolute left-3 top-3.5 size-5 text-slate-400" /><input name="password" type="password" placeholder="••••••••" className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500" required /></div></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-2">Confirm Password *</label><div className="relative"><Lock className="absolute left-3 top-3.5 size-5 text-slate-400" /><input name="confirmPassword" type="password" placeholder="••••••••" className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500" required /></div></div>
            </div>
          </div>

          {success && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">{success}</div>}
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">{error}</div>}


          <div className="flex items-center gap-4 pt-6 border-t-2 border-slate-100">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-4 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-all">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-6 py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-bold hover:scale-105 transition-all shadow-lg disabled:opacity-50">{loading ? "Creating..." : "Create Agent"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}