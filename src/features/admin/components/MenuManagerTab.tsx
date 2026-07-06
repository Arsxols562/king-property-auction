import { Plus, Edit, Menu } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

interface MenuManagerTabProps {
  theme: any;
  onCreateMenu: () => void;
  onEditMenu: (menu: any) => void;
}

export default function MenuManagerTab({
  theme,
  onCreateMenu,
  onEditMenu,
}: MenuManagerTabProps) {
  const { data: menusData = [], isLoading } = useQuery({
    queryKey: ["menus-list"],
    queryFn: async () => {
      const result = await apiClient.fetch("/menus");
      return result.success ? result.data : [];
    },
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1 sm:mb-2">
            Menu Manager
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium">
            Create and manage dynamic navigation menus
          </p>
        </div>
        <button
          onClick={onCreateMenu}
          className={`px-5 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r ${theme.secondary} text-white rounded-xl text-sm font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2 flex-shrink-0`}
        >
          <Plus className="size-4 sm:size-5" />
          Create Menu
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white/80 rounded-2xl p-6 h-40 animate-pulse"
            />
          ))}
        </div>
      ) : (menusData as any[]).length === 0 ? (
        <div className="text-center py-16 bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-white/60 shadow-xl">
          <Menu className="size-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-black text-slate-700 mb-2">
            No Menus Yet
          </h3>
          <p className="text-slate-500 mb-6">
            Create your first navigation menu to get started
          </p>
          <button
            onClick={onCreateMenu}
            className={`px-6 py-3 bg-gradient-to-r ${theme.secondary} text-white rounded-xl font-bold hover:scale-105 transition-all`}
          >
            Create First Menu
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(menusData as any[]).map((menu: any) => (
            <div
              key={menu._id}
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/60 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-black text-slate-900">
                  {menu.name}
                </h4>
                <span
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    menu.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {menu.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-slate-600 font-medium">
                  <strong>Location:</strong> {menu.location}
                </p>
                <p className="text-sm text-slate-600 font-medium">
                  <strong>Menu Items:</strong> {menu.items?.length || 0}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEditMenu(menu)}
                  className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-1"
                >
                  <Edit className="size-4" />
                  Edit Menu
                </button>
                <button className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all">
                  <Menu className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
