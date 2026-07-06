import { useState } from "react";
import { X, Save, Mail, User, Shield } from "lucide-react";
import { useTheme } from "../../../app/hooks/useTheme";
import { useUserApi } from "../api/useUserApi";
import { showSuccess, showError } from "@/lib/toast";

interface EditUserModalProps {
  user: any;
  onClose: () => void;
}

export default function EditUserModal({ user, onClose }: EditUserModalProps) {
  const theme = useTheme();
  const { useUpdateUserStatus, useUpdateUser } = useUserApi();
  const updateStatus = useUpdateUserStatus();
  const updateUser = useUpdateUser();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "user",
    isActive: user?.isActive ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      await updateUser.mutateAsync({
        id: user._id,
        data: {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        },
      });
      await updateStatus.mutateAsync({
        id: user._id,
        status: formData.isActive ? "active" : "pending",
      });
      showSuccess("User updated! ✅");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update user");
      showError("Update failed", err.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg">
        <div className={`bg-gradient-to-r ${theme.primary} p-4 sm:p-6 flex items-center justify-between text-white rounded-t-2xl sm:rounded-t-3xl`}>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center">
              <User className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-black">Edit User</h2>
              <p className="text-sm text-white/80">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 rounded-xl hover:bg-white/30"
          >
            <X className="size-5" />
          </button>
        </div>

          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 size-5 text-slate-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 size-5 text-slate-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Role
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-3.5 size-5 text-slate-400" />
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="buyer">Buyer</option>
                <option value="seller">Owner</option>
                <option value="agent">Agent</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="size-5 rounded accent-blue-600"
            />
            <span className="text-sm font-bold text-slate-700">
              Account Active
            </span>
          </label>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className={`flex-1 py-3 bg-gradient-to-r ${theme.secondary} text-white rounded-xl font-bold hover:scale-105 transition-all flex items-center justify-center gap-2`}
            >
              <Save className="size-5" />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
