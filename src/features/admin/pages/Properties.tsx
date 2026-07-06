import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Building2,
  Search,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Plus,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { showSuccess, showError } from "@/lib/toast";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  active: "bg-blue-100 text-blue-700",
  sold: "bg-purple-100 text-purple-700",
  rejected: "bg-red-100 text-red-700",
  archived: "bg-slate-100 text-slate-500",
};

export default function Properties() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-properties-mgmt", statusFilter, search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      const result = await apiClient.fetch(`/properties?${params}`);
      return result;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const result = await apiClient.fetch(`/properties/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-properties-mgmt"] }),
  });

  const properties = data?.data || data?.properties || [];
  const pagination = data?.pagination || {};


  const handleApprove = async (id: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: "approved" });
      showSuccess("Property approved");
    } catch (err: any) {
      showError("Update failed", err.message);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: "rejected" });
      showSuccess("Property rejected");
    } catch (err: any) {
      showError("Update failed", err.message);
    }
  };

  return (
    <AdminLayout activeTab="properties" onTabChange={() => {}}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Building2 className="size-7 text-blue-600" /> Properties
              Management
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {properties.length} properties
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              title="Refresh"
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <RefreshCw className="size-5 text-slate-500" />
            </button>
            <button
              onClick={() => navigate("/add-property")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors"
            >
              <Plus className="size-4" /> Add Property
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, location, owner, type, status, price, lot#..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
          >
            <option value="">All Status</option>
            {[
              "pending",
              "approved",
              "active",
              "sold",
              "rejected",
              "archived",
            ].map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="size-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Building2 className="size-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold">No properties found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {[
                      "Lot No",
                      "Property",
                      "Location",
                      "Owner",
                      "Contact",
                      "Agent",
                      "Price",
                      "Status",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {properties.map((p: any) => (
                    <tr
                      key={p._id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {/* Lot No */}
                      <td className="px-4 py-3 text-xs font-bold text-slate-500">
                        {p.propertyID || `LOT-${p._id?.slice(-6) || "—"}`}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.media?.[0] && (
                            <img
                              src={p.media[0]}
                              alt=""
                              className="size-10 rounded-lg object-cover flex-shrink-0"
                            />
                          )}
                          <p className="font-bold text-slate-900 line-clamp-1">
                            {p.propertyTitle}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {typeof p.location === "object"
                          ? `${p.location.city || ""}, ${p.location.state || ""}`
                          : p.location || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800 text-xs">
                          {p.seller?.name || "—"}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {p.seller?.email}
                        </p>
                      </td>
                      {/* Contact */}
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {p.sellerInfo?.agentContact || p.seller?.phone || "—"}
                      </td>
                      {/* Agent Company */}
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {p.sellerInfo?.agentName || "—"}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {p.startingPrice
                          ? `£${Number(p.startingPrice).toLocaleString()}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-bold ${STATUS_COLORS[p.status] || "bg-slate-100"}`}
                        >
                          {p.status || "pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {new Date(p.createdAt).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              navigate(`/properties/${p.slug || p._id}`)
                            }
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                            title="View"
                          >
                            <Eye className="size-4" />
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/admin/properties/${p._id}/edit`)
                            }
                            className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <Edit className="size-4" />
                          </button>
                          {p.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(p._id)}
                                className="p-1.5 hover:bg-green-50 rounded-lg text-green-600 transition-colors"
                                title="Approve"
                              >
                                <CheckCircle className="size-4" />
                              </button>
                              <button
                                onClick={() => handleReject(p._id)}
                                className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                                title="Reject"
                              >
                                <XCircle className="size-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pagination.total > 20 && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-slate-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 20 >= pagination.total}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
