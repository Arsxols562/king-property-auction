import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Plus, Gavel, Menu, Search, X } from "lucide-react";
import GlobalSearchBar from "./topbar/GlobalSearchBar";
import NotificationBell from "./topbar/NotificationBell";
import ProfileDropdown from "./topbar/ProfileDropdown";

interface TopBarProps {
  onMenuClick?: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const navigate = useNavigate();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const actions = [
    { id: "newProperty", label: "Add Property", icon: Plus, action: () => navigate("/admin/properties/new") },
    { id: "createAuction", label: "Create Auction", icon: Gavel, action: () => navigate("/admin/auctions") },
  ];

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b-2 border-white/60 shadow-sm sticky top-0 z-40">
      <div className="px-3 sm:px-5 py-2 flex items-center justify-between gap-2">
        {/* Left */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-all"
            aria-label="Open menu"
          >
            <Menu className="size-4 sm:size-5 text-slate-600" />
          </button>

          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-slate-100 rounded-lg transition-all hidden sm:block"
            title="Back to Website"
          >
            <ArrowLeft className="size-4 sm:size-5 text-slate-600" />
          </button>

          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="xl:hidden p-2 hover:bg-slate-100 rounded-lg transition-all"
            aria-label="Toggle search"
          >
            {mobileSearchOpen ? (
              <X className="size-4 sm:size-5 text-slate-600" />
            ) : (
              <Search className="size-4 sm:size-5 text-slate-600" />
            )}
          </button>
        </div>

        {/* Center: Search - xl+ */}
        <div className="hidden xl:flex flex-1 mx-4 max-w-xl">
          <GlobalSearchBar />
        </div>

        {/* Right */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.action}
                title={action.label}
                className="flex items-center gap-1.5 p-2 xl:px-3 xl:py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs xl:text-sm font-bold hover:scale-105 transition-all shadow-lg"
              >
                <Icon className="size-3.5 xl:size-4" />
                <span className="hidden xl:inline">{action.label}</span>
              </button>
            );
          })}

          <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />

          <NotificationBell />
          <ProfileDropdown />
        </div>
      </div>

      {/* Search row - mobile/tablet */}
      {mobileSearchOpen && (
        <div className="xl:hidden px-3 sm:px-5 pb-3 border-t border-slate-100 pt-3">
          <GlobalSearchBar />
        </div>
      )}
    </header>
  );
}