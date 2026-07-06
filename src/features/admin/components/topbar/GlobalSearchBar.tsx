import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Search, Building2, Gavel, Users, Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export default function GlobalSearchBar() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setShowResults(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data: results } = useQuery({
    queryKey: ["globalSearch", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return null;
      const r = await apiClient.fetch(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
      return r.success ? r.data : null;
    },
    enabled: searchQuery.length >= 2,
  });

  const select = (route: string) => { setShowResults(false); setSearchQuery(""); navigate(route); };

  return (
    <div ref={ref} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 z-10" />
        <input
          type="text"
          placeholder="Search properties, auctions, users..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
          onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
          className="pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 w-full lg:w-96 transition-all"
        />
      </div>

      {showResults && searchQuery.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border-2 border-slate-100 z-50 max-h-80 overflow-y-auto">
          {!results ? (
            <div className="p-6 text-center text-sm text-slate-400">
              <div className="size-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Searching...
            </div>
          ) : (
            <>
              {[
                { label: "Properties", icon: Building2, color: "text-blue-500", bg: "hover:bg-blue-50", items: results.properties } as any,
                { label: "Auctions", icon: Gavel, color: "text-purple-500", bg: "hover:bg-purple-50", items: results.auctions } as any,
                { label: "Users", icon: Users, color: "text-green-500", bg: "hover:bg-green-50", items: results.users } as any,
                { label: "Leads", icon: Mail, color: "text-orange-500", bg: "hover:bg-orange-50", items: results.leads } as any,
              ].map((section: any) => section.items?.length > 0 && (
                <div key={section.label}>
                  <p className="px-4 py-2 text-xs font-black text-slate-500 uppercase bg-slate-50">{section.label}</p>
                  {section.items.map((item: any) => {
                    const Icon = section.icon;
                    return (
                      <button key={item._id} onClick={() => select(item.route)}
                        className={`w-full px-4 py-3 text-left ${section.bg} flex items-center gap-3 border-b border-slate-50`}>
                        <Icon className={`size-4 ${section.color} flex-shrink-0`} />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{item.title}</p>
                          <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
              {!results.properties?.length && !results.auctions?.length && !results.users?.length && !results.leads?.length && (
                <div className="p-6 text-center text-slate-400 text-sm font-medium">
                  No results for "{searchQuery}"
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}