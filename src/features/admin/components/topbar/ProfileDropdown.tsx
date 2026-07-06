import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { ChevronDown, User, LogOut, Crown } from "lucide-react";
import { useTheme } from "../../../../app/hooks/useTheme";
import { useAuthStore } from "@/stores/authStore";

export default function ProfileDropdown() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, logout } = useAuthStore();
  const [show, setShow] = useState(false);
  const isAdmin = user?.role === "admin";
  const isSuperAdmin = user?.isSuperAdmin;

  const roleLabel = isSuperAdmin
    ? "Super Admin"
    : user?.role === "admin"
    ? "Administrator"
    : user?.role === "agent"
    ? (user?.permissions?.canBid ? "Agent & Buyer" : "Agent")
    : user?.role === "seller"
    ? (user?.permissions?.canBid ? "Owner & Buyer" : "Owner")
    : user?.role === "buyer"
    ? (user?.permissions?.canListProperties ? "Buyer & Owner" : "Buyer")
    : "User";

  const initials = user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "AD";

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <>
      <button onClick={() => setShow(!show)}
        className="flex items-center gap-3 pl-4 border-l-2 border-slate-200 hover:bg-slate-50 rounded-xl p-2 transition-all">
        <div className={`size-11 bg-gradient-to-br ${theme.primary} rounded-xl flex items-center justify-center shadow-lg`}>
          <span className="text-white font-black text-sm">{initials}</span>
        </div>
        <div className="text-left hidden sm:block min-w-0">
          <p className="text-xs xl:text-sm font-bold text-slate-900 truncate max-w-[120px] xl:max-w-[160px]">{user?.name || "Admin User"}</p>
          <p className="text-[10px] xl:text-xs text-slate-600 font-medium truncate max-w-[120px] xl:max-w-[160px]">{user?.email || ""}</p>
          <p className="text-[10px] xl:text-xs font-bold text-purple-600 flex items-center gap-1">
            {isSuperAdmin && <Crown className="size-3" />}
            {roleLabel}
          </p>
        </div>
        <ChevronDown className={`size-4 text-slate-400 transition-transform ${show ? "rotate-180" : ""}`} />
      </button>

      {show && createPortal(
        <>
          <div className="fixed inset-0 z-[99998]" onClick={() => setShow(false)} />
          <div className="fixed z-[99999] w-56 bg-white rounded-2xl shadow-2xl border-2 border-slate-100"
            style={{ top: "72px", right: "24px" }}>
            <div className="p-2">
              <button onClick={() => { navigate(isAdmin ? "/admin/profile" : "/dashboard/profile"); setShow(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl">
                <User className="size-5 text-slate-500" /> Profile
              </button>
              <hr className="my-2 border-slate-100" />
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl">
                <LogOut className="size-5 text-red-500" /> Logout
              </button>
            </div>
          </div>
        </>, document.body
      )}
    </>
  );
}