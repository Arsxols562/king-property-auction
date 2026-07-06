import { useState } from "react";
import { mediaUrl } from "@/lib/mediaUrl";
import { useNavigate } from "react-router";
import AdminLayout from "../components/AdminLayout";
import { apiClient } from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";
import { useAuctionApi } from "@/features/auction/api/useAuctionApi";
import {
  Gavel,
  Building2,
  Trophy,
  Users,
  Search,
  Download,
  Eye,
  FileText,
} from "lucide-react";

export default function AuctionBids() {
  const navigate = useNavigate();
  const [selectedAuctionId, setSelectedAuctionId] = useState("");
  const [search, setSearch] = useState("");

  const { useGetAuctions } = useAuctionApi();
  const { data: auctionsData } = useGetAuctions({});
  const auctions = (auctionsData?.data || []) as any[];

  const selectedAuction = auctions.find(
    (a: any) => a._id === selectedAuctionId,
  );

  const { data: bidStats, isLoading: loadingStats } = useQuery({
    queryKey: ["auction-bids-stats", selectedAuctionId],
    queryFn: async () => {
      if (!selectedAuctionId) return {};
      const r = await apiClient.fetch(
        `/bids/auction/${selectedAuctionId}/property-stats`,
      );
      return r.success ? r.data : {};
    },
    enabled: !!selectedAuctionId,
  });

  const { data: allBids, isLoading: loadingBids } = useQuery({
    queryKey: ["auction-all-bids", selectedAuctionId],
    queryFn: async () => {
      if (!selectedAuctionId) return [];
      const r = await apiClient.fetch(
        `/bids/auction/${selectedAuctionId}/admin-bids?limit=200`,
      );
      return r.success ? r.data?.bids || r.data || [] : [];
    },
    enabled: !!selectedAuctionId,
  });

  const properties = (selectedAuction?.properties || []) as any[];
  const filteredProps = properties.filter(
    (p: any) =>
      !search ||
      (p.propertyTitle || "").toLowerCase().includes(search.toLowerCase()),
  );

  const exportCSV = () => {
    if (!allBids?.length) return;
    const headers = ["Property", "Bidder", "Email", "Amount", "Status", "Date"];
    const rows = (allBids as any[]).map((b: any) => [
      b.property?.propertyTitle || "",
      b.bidder?.name || "",
      b.bidder?.email || "",
      b.amount || 0,
      b.status || "",
      new Date(b.createdAt).toLocaleDateString("en-GB"),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v: any) => `"${v}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedAuction?.auctionTitle || "auction"}-bids.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    if (!allBids?.length) return;

    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();

    // Title
    doc.setFontSize(16);
    doc.text(`Auction Bids Report`, 14, 20);
    doc.setFontSize(11);
    doc.text(`Auction: ${selectedAuction?.auctionTitle || "N/A"}`, 14, 28);
    doc.text(`Date: ${new Date().toLocaleDateString("en-GB")}`, 14, 34);

    // Table
    const headers = [
      ["Property", "Bidder", "Email", "Amount", "Status", "Date"],
    ];
    const rows = (allBids as any[]).map((b: any) => [
      b.property?.propertyTitle || "—",
      b.bidder?.name || "—",
      b.bidder?.email || "—",
      `£${(b.amount || 0).toLocaleString()}`,
      b.status || "—",
      new Date(b.createdAt).toLocaleDateString("en-GB"),
    ]);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    doc.save(`${selectedAuction?.auctionTitle || "auction"}-bids.pdf`);
  };

  return (
    <AdminLayout
      activeTab="auction-bids"
      onTabChange={(tab) => navigate(`/admin/${tab}`)}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Auction Bidding Report
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              View all properties, bidders and results per auction
            </p>
          </div>
          {selectedAuctionId && (
            <div className="flex items-center gap-1.5 sm:gap-2 sm:hidden">
              <button
                onClick={exportCSV}
                className="px-2.5 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-all flex items-center gap-1.5"
              >
                <Download className="size-3.5" />
                Export CSV
              </button>
              <button
                onClick={exportPDF}
                className="px-2.5 py-2 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-all flex items-center gap-1.5"
              >
                <FileText className="size-3.5" />
                Export PDF
              </button>
            </div>
          )}
        </div>

        {/* Export Buttons - Desktop */}
        {selectedAuctionId && (
          <div className="hidden sm:flex items-center gap-2 justify-end">
            <button
              onClick={exportCSV}
              className="px-5 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all flex items-center gap-2"
            >
              <Download className="size-4" />
              Export CSV
            </button>
            <button
              onClick={exportPDF}
              className="px-5 py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all flex items-center gap-2"
            >
              <FileText className="size-4" />
              Export PDF
            </button>
          </div>
        )}

        {/* Auction Selector */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Select Auction
          </label>
          <select
            value={selectedAuctionId}
            onChange={(e) => setSelectedAuctionId(e.target.value)}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose an auction...</option>
            {auctions.map((a: any) => (
              <option key={a._id} value={a._id}>
                {a.auctionTitle} ({a.status}) — {a.properties?.length || 0} lots
              </option>
            ))}
          </select>
        </div>

        {!selectedAuctionId ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <Gavel className="size-16 text-slate-300 mx-auto mb-4" />
            <p className="font-bold text-slate-500 text-lg">
              Select an auction to view bidding details
            </p>
          </div>
        ) : loadingStats || loadingBids ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl h-32 animate-pulse border border-slate-200"
              />
            ))}
          </div>
        ) : (
          <>
            {/* Auction Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Lots",
                  value: properties.length,
                  gradient: "from-blue-500 to-indigo-600",
                  Icon: Building2,
                },
                {
                  label: "Total Bids",
                  value: (allBids as any[])?.length || 0,
                  gradient: "from-purple-500 to-violet-600",
                  Icon: Gavel,
                },
                {
                  label: "Sold",
                  value: Object.values(bidStats || {}).filter(
                    (s: any) => s.isSold,
                  ).length,
                  gradient: "from-emerald-500 to-teal-600",
                  Icon: Trophy,
                },
                {
                  label: "Unsold",
                  value: Object.values(bidStats || {}).filter(
                    (s: any) => !s.isSold,
                  ).length,
                  gradient: "from-red-500 to-pink-600",
                  Icon: Users,
                },
              ].map(({ label, value, gradient, Icon }) => (
                <div
                  key={label}
                  className={`bg-gradient-to-br ${gradient} rounded-2xl p-4 text-white shadow-lg`}
                >
                  <Icon className="size-6 text-white/80 mb-2" />
                  <p className="text-2xl font-black">{value}</p>
                  <p className="text-xs text-white/80 font-bold">{label}</p>
                </div>
              ))}
            </div>

            {/* Property Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search properties..."
                className="w-full pl-10 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Properties + Bids */}
            <div className="space-y-4">
              {filteredProps.map((prop: any) => {
                const stats = (bidStats as any)?.[prop._id] || {};
                const propBids = ((allBids as any[]) || []).filter(
                  (b: any) =>
                    b.property?._id === prop._id || b.property === prop._id,
                );

                return (
                  <div
                    key={prop._id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                  >
                    {/* Property Header */}
                    <div
                      className={`flex items-center gap-4 p-5 border-b border-slate-100 ${stats.isSold ? "bg-emerald-50" : "bg-slate-50"}`}
                    >
                      {prop.media?.propertyImages?.[0] ? (
                        <img
                          src={mediaUrl(prop.media.propertyImages[0])}
                          className="w-14 h-14 rounded-xl object-cover"
                          alt=""
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-200 flex items-center justify-center">
                          <Building2 className="size-6 text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-900">
                          {prop.propertyTitle}
                        </p>
                        <p className="text-sm text-slate-500">
                          {prop.location?.city}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {stats.isSold ? (
                          <div>
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold block mb-1">
                              🎉 SOLD
                            </span>
                            <p className="text-lg font-black text-emerald-700">
                              £{stats.highestBid?.toLocaleString()}
                            </p>
                          </div>
                        ) : stats.highestBid > 0 ? (
                          <div>
                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold block mb-1">
                              ❌ UNSOLD
                            </span>
                            <p className="text-sm font-bold text-slate-600">
                              Highest: £{stats.highestBid?.toLocaleString()}
                            </p>
                          </div>
                        ) : (
                          <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">
                            No Bids
                          </span>
                        )}
                      </div>
                      <button
                        title="View Property"
                        onClick={() =>
                          navigate(`/properties/${prop.slug || prop._id}`)
                        }
                        className="p-2 hover:bg-white rounded-lg transition-all"
                      >
                        <Eye className="size-4 text-slate-500" />
                      </button>
                    </div>

                    {/* Winner */}
                    {stats.winner && (
                      <div className="px-5 py-3 bg-emerald-50/50 border-b border-slate-100 flex items-center gap-3">
                        <Trophy className="size-4 text-amber-500 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-slate-500">
                            Winner:{" "}
                          </span>
                          <span className="font-bold text-slate-900">
                            {stats.winner.name}
                          </span>
                          <span className="text-xs text-slate-400 ml-2">
                            {stats.winner.email}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Bids Table */}
                    {propBids.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                              {[
                                "Bidder",
                                "Email",
                                "Amount",
                                "Status",
                                "Time",
                              ].map((h) => (
                                <th
                                  key={h}
                                  className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {[...propBids]
                              .sort((a: any, b: any) => b.amount - a.amount)
                              .map((bid: any) => (
                                <tr
                                  key={bid._id}
                                  className={`hover:bg-slate-50 ${bid.status === "won" ? "bg-emerald-50/30" : ""}`}
                                >
                                  <td className="px-4 py-3 font-bold text-slate-900">
                                    {bid.bidder?.name || "—"}
                                    {bid.status === "won" && (
                                      <span className="ml-2 text-amber-500">
                                        🏆
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-slate-500">
                                    {bid.bidder?.email || "—"}
                                  </td>
                                  <td className="px-4 py-3 font-black text-slate-900">
                                    £{bid.amount?.toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                        bid.status === "won"
                                          ? "bg-emerald-100 text-emerald-700"
                                          : bid.status === "winning"
                                            ? "bg-green-100 text-green-700"
                                            : bid.status === "outbid"
                                              ? "bg-orange-100 text-orange-700"
                                              : bid.status === "lost"
                                                ? "bg-red-100 text-red-700"
                                                : "bg-slate-100 text-slate-500"
                                      }`}
                                    >
                                      {bid.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-slate-400 text-xs">
                                    {new Date(bid.createdAt).toLocaleString(
                                      "en-GB",
                                      {
                                        day: "2-digit",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-slate-400 text-sm">
                        No bids for this property
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
