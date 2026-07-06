import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function AdminLayout({ children, activeTab, onTabChange }: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 flex">
      <Sidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0" style={{ zoom: '0.8' }}>
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-2.5 sm:p-3 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}