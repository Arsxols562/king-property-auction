import { useNavigate } from "react-router";
import {
  LayoutDashboard,
  Building2,
  Users,
  Gavel,
  Send,
  TrendingUp,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Mail,
  InboxIcon,
  Handshake,
  CheckCircle,
  FileChartColumn,
  FileText,
  X,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useTheme } from "../../../app/hooks/useTheme";
import { useAuthStore } from "@/stores/authStore";
import { useMenuData } from "@/hooks/useMenuData";

const menuItems = [
  { id: "overview", icon: LayoutDashboard, label: "Overview" },
  {
    id: "menuManager",
    icon: Menu,
    label: "Menu Manager",
    path: "/admin/menus",
  },
  { id: "properties", icon: Building2, label: "Properties" },
  { id: "auctions", icon: Gavel, label: "Auctions" },
  { id: "bids", icon: TrendingUp, label: "Bids" },
  {
    id: "offers",
    icon: Handshake,
    label: "Offers & Negotiations",
    path: "/admin/offers",
  },
  {
    id: "auction-bids",
    icon: BarChart3,
    label: "Auction Report",
    path: "/admin/auction-bids",
  },
  { id: "marketing", icon: Send, label: "Marketing", path: "/admin/campaigns" },
  { id: "leads", icon: Mail, label: "Leads", path: "/admin/leads" },
  { id: "inbox", icon: InboxIcon, label: "Inbox", path: "/admin/inbox" },
  { id: "users", icon: Users, label: "Users", path: "/admin/users" },
  {
    id: "approvals",
    icon: CheckCircle,
    label: "Approvals",
    path: "/admin/approvals",
  },

  {
    id: "analytics",
    icon: BarChart3,
    label: "Analytics",
    path: "/admin/analytics",
  },
  {
    id: "reports",
    icon: FileChartColumn,
    label: "Reports",
    path: "/admin/reports",
  },
  {
    id: "property-offers",
    icon: FileText,
    label: "Property Offers",
    path: "/admin/property-offers",
  },
  {
    id: "invoices",
    icon: FileText,
    label: "Invoices",
    path: "/admin/invoices",
  },
  {
    id: "settings",
    icon: Settings,
    label: "Settings",
    path: "/admin/settings",
  },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ activeTab, onTabChange, mobileOpen = false, onMobileClose }: SidebarProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const { logout } = useAuthStore();
  const { getAdminSidebarItems } = useMenuData();
  const dbItems = getAdminSidebarItems();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleNavigation = (item: any) => {
    const tab = typeof item === "string" ? item : item.id;
    const customPath = typeof item === "object" ? item.path : null;
    onTabChange(tab);
    if (customPath) {
      navigate(customPath);
    } else {
      navigate(`/admin/${tab}`);
    }
  };

    return (
    <>
      {/* Mobile overlay - only when drawer open, below lg */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          w-56 lg:w-60 xl:w-64 max-w-[85vw] bg-white/80 backdrop-blur-xl border-r-2 border-white/60
          flex flex-col shadow-xl h-screen overflow-hidden
          fixed top-0 left-0 z-50 transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:sticky lg:z-auto
        `}
      >
          <div style={{ zoom: '0.8' }} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 border-b-2 border-slate-100 flex items-center gap-2">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 group flex-1 min-w-0"
            title="Back to Website"
          >
            <div
              className={`size-12 rounded-2xl bg-gradient-to-br ${theme.primary} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0`}
            >
              <LayoutDashboard className="size-6 text-white" />
            </div>
            <div className="text-left min-w-0">
              <h1 className="font-black text-slate-900 text-sm leading-tight truncate">King Property Auction</h1>
              <p className="text-xs text-slate-600 font-bold">Admin Portal</p>
            </div>
          </button>
          <button
            onClick={onMobileClose}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-xl flex-shrink-0"
            aria-label="Close menu"
          >
            <X className="size-5 text-slate-500" />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-2">
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider px-4 mb-3">
              Main Navigation
            </p>
            {(() => {
              if (dbItems.length === 0) return menuItems;
              const dbUrls = new Set(
                dbItems.map((i: any) => i.url || `/admin/${i.id}`),
              );
              const hardcodedNotInDb = menuItems.filter((m) => {
                const url = m.path || `/admin/${m.id}`;
                return !dbUrls.has(url);
              });
              return [...dbItems, ...hardcodedNotInDb];
            })().map((item: any) => {
              const isDbItem = !!item._id;
              const icons: any = LucideIcons;
              const Icon = isDbItem
                ? icons[item.icon] || icons.FileText
                : item.icon;

              const itemPath = isDbItem
                ? item.url
                : item.path || `/admin/${item.id}`;
              const isActive =
                window.location.pathname === itemPath ||
                window.location.pathname.startsWith(itemPath + "/");

              return (
                <button
                  key={item.id || item._id}
                  onClick={() => {
                    if (isDbItem && item.url) {
                      navigate(item.url);
                    } else {
                      handleNavigation(item);
                    }
                    onMobileClose?.();
                  }}
                  title={item.label}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? `bg-gradient-to-r ${theme.secondary} text-white shadow-lg`
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="size-5" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] rounded-full font-black">
                      {item.badgeLabel || "NEW"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t-2 border-slate-100 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl text-sm font-bold transition-all"
          >
            <LogOut className="size-5" /> Logout
          </button>
        </div>
        </div>
      </aside>
    </>
  );
}
