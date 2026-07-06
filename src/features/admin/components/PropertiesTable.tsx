import { useState } from "react";
import {
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { usePropertyApi } from "@/features/property/api/usePropertyApi";
import { apiClient } from "@/lib/apiClient";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import ConfirmModal from "@/features/shared/components/ConfirmModal";
import FilterBar from "@/features/shared/components/FilterBar";

export default function PropertiesTable() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { useGetProperties } = usePropertyApi();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const searchParam = search || undefined;
  const typeParam = typeFilter || undefined;
  const statusParam = statusFilter || undefined;

  const { data: lotsData, isLoading } = useGetProperties({
    page,
    pageSize: 10,
    approvalStatus: "all",
    search: searchParam,
    type: typeParam,
    status: statusParam,
  });
  const properties = lotsData?.data || [];
  const total = lotsData?.total || 0;
  const totalPages = lotsData?.totalPages || 1;


  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    await apiClient.fetch(`/properties/${id}/approve`, {
      method: "PATCH",
      body: JSON.stringify({ status: "approved" }),
    });
    queryClient.invalidateQueries({ queryKey: ["properties"] });
  };

  const handleReject = async (id: string) => {
    await apiClient.fetch(`/properties/${id}/approve`, {
      method: "PATCH",
      body: JSON.stringify({ status: "rejected" }),
    });
    queryClient.invalidateQueries({ queryKey: ["properties"] });
  };

  return (
    <div>
      <FilterBar
        searchPlaceholder="Search by title, location, owner, type, status, price, lot#"
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        filters={[
          {
            label: "All Types",
            value: typeFilter,
            options: [
              { value: "house", label: "House" },
              { value: "apartment", label: "Apartment" },
              { value: "land", label: "Land" },
              { value: "commercial", label: "Commercial" },
              { value: "farmhouse", label: "Farmhouse" },
            ],
            onChange: (v) => {
              setTypeFilter(v);
              setPage(1);
            },
          },
          {
            label: "All Status",
            value: statusFilter,
            options: [
              { value: "available", label: "Available" },
              { value: "sold", label: "Sold" },
              { value: "pending", label: "Pending" },
            ],
            onChange: (v) => {
              setStatusFilter(v);
              setPage(1);
            },
          },
        ]}
        className="mb-4"
      />

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border-2 border-white/60 shadow-lg overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-xs sm:text-sm min-w-[1100px]">
            <thead className="bg-slate-50 border-b-2 border-slate-100">
              <tr>
                {[
                  "Lot No",
                  "Property",
                  "Location",
                  "Owner",
                  "Contact",
                  "Agent",
                  "Type",
                  "Price",
                  "Approval",
                  "Sale",
                  "Zoopla",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-1.5 sm:px-3 py-2.5 text-left text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="text-center py-8 text-slate-500">
                    Loading properties...
                  </td>
                </tr>
              ) : properties.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-8 text-slate-500">
                    No properties found.
                  </td>
                </tr>
              ) : (
                properties.map((property: any) => (
                  <tr
                    key={property._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-1.5 sm:px-3 py-2 text-[10px] sm:text-xs font-bold text-slate-500">
                      {property.propertyID || property._id?.slice(-6) || "—"}
                    </td>
                    <td className="px-1.5 sm:px-3 py-2">
                      <p className="font-bold text-slate-900 text-[11px] sm:text-sm max-w-[120px] sm:max-w-none truncate">
                        {property.propertyTitle}
                      </p>
                    </td>
                    <td className="px-1.5 sm:px-3 py-2 text-[10px] sm:text-xs text-slate-600 max-w-[80px] sm:max-w-none truncate">
                      {typeof property.location === "object"
                        ? `${property.location?.city || ""}`
                        : property.location || "—"}
                    </td>
                    <td className="px-1.5 sm:px-3 py-2 text-[10px] sm:text-xs">
                      <p className="font-bold text-slate-800">
                        {property.createdBy?.name || "—"}
                      </p>
                      <p className="text-slate-400 text-[8px] sm:text-xs hidden sm:block">
                        {property.createdBy?.email || ""}
                      </p>
                    </td>
                    <td className="px-1.5 sm:px-3 py-2 text-[10px] sm:text-xs text-slate-600 max-w-[80px] sm:max-w-none truncate">
                      {property.createdBy?.phone || "—"}
                    </td>
                    <td className="px-1.5 sm:px-3 py-2 text-[10px] sm:text-xs text-slate-600 max-w-[80px] sm:max-w-none truncate">
                      {property.sellerInfo?.agentName ||
                        property.createdBy?.name ||
                        "—"}
                    </td>
                    <td className="px-1.5 sm:px-3 py-2">
                      <span className="px-1.5 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-[9px] sm:text-xs font-bold capitalize">
                        {property.propertyType}
                      </span>
                    </td>
                    <td className="px-1.5 sm:px-3 py-2 text-[11px] sm:text-sm font-bold text-slate-900">
                      £
                      {(
                        property.pricing?.startingAuctionPrice || 0
                      ).toLocaleString()}
                    </td>
                    <td className="px-1.5 sm:px-3 py-2">
                      <span
                        className={`px-1.5 sm:px-3 py-1 rounded-lg text-[9px] sm:text-xs font-bold ${property.approvalStatus === "approved" ? "bg-green-100 text-green-700" : property.approvalStatus === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}
                      >
                        {property.approvalStatus || "pending"}
                      </span>
                    </td>
                    <td className="px-1.5 sm:px-3 py-2">
                      {property.propertyStatus === "sold" ? (
                        <span className="px-1.5 sm:px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] sm:text-xs font-bold">
                          Sold £
                          {(
                            property.soldPrice ||
                            property.currentBid ||
                            0
                          ).toLocaleString()}
                        </span>
                      ) : property.propertyStatus === "unsold" ? (
                        <span className="px-1.5 sm:px-3 py-1 bg-red-100 text-red-700 rounded-lg text-[9px] sm:text-xs font-bold">
                          Unsold
                        </span>
                      ) : (
                        <span className="px-1.5 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-[9px] sm:text-xs font-bold">
                          Available
                        </span>
                      )}
                    </td>
                    <td className="px-1.5 sm:px-3 py-2">
                      {property.zoopla?.status === "active" ? (
                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[9px] sm:text-xs font-bold">
                          🏠 Active
                        </span>
                      ) : property.zoopla?.status === "failed" ? (
                        <span
                          className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[9px] sm:text-xs font-bold"
                          title={property.zoopla?.errorMessage}
                        >
                          ❌
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-1.5 sm:px-3 py-2">
                      <div className="flex items-center gap-0.5 sm:gap-2">
                        <button
                          onClick={() =>
                            navigate(
                              `/properties/${property.slug || property._id}`,
                            )
                          }
                          className="p-1 sm:p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                        >
                          <Eye className="size-3 sm:size-4" />
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/admin/properties/${property._id}/edit`)
                          }
                          className="p-1 sm:p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                        >
                          <Edit className="size-3 sm:size-4" />
                        </button>
                        {property.approvalStatus === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(property._id)}
                              className="p-1 sm:p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                            >
                              <CheckCircle className="size-3 sm:size-4" />
                            </button>
                            <button
                              onClick={() => handleReject(property._id)}
                              className="p-1 sm:p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                            >
                              <XCircle className="size-3 sm:size-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setDeleteTarget(property._id)}
                          className="p-1 sm:p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 hidden sm:block"
                        >
                          <Trash2 className="size-3 sm:size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200 bg-slate-50">
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, total)} of{" "}
              {total}
            </p>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 sm:p-2 bg-white border-2 border-slate-200 rounded-xl disabled:opacity-50 hover:bg-slate-100"
              >
                <ChevronLeft className="size-3 sm:size-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`size-7 sm:size-9 rounded-xl text-xs sm:text-sm font-bold ${page === i + 1 ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white" : "bg-white border-2 border-slate-200"}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 sm:p-2 bg-white border-2 border-slate-200 rounded-xl disabled:opacity-50 hover:bg-slate-100"
              >
                <ChevronRight className="size-3 sm:size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        show={!!deleteTarget}
        title="Delete Property"
        message="This property will be permanently deleted and removed from all auctions."
        onConfirm={() => {
          apiClient
            .fetch(`/properties/${deleteTarget}`, { method: "DELETE" })
            .then(() => {
              queryClient.invalidateQueries({ queryKey: ["properties"] });
              queryClient.invalidateQueries({ queryKey: ["auctions"] });
              setDeleteTarget(null);
            });
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
