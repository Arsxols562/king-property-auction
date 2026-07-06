import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import {
  FileText,
  Download,
  Eye,
  Search,
  PoundSterling,
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useCustomerRole } from "../hooks/useCustomerRole";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
  refunded: "bg-purple-100 text-purple-700",
  withdrawn: "bg-orange-100 text-orange-700",
};

export default function InvoicesTab() {
  const { user } = useAuthStore();
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { activeView } = useCustomerRole();

  const { data, isLoading } = useQuery({
    queryKey: ["my-invoices", user?.role, activeView],
    queryFn: () => {
      const view = activeView === "seller" ? "seller" : "buyer";
      return apiClient.fetch(`/invoices/my/invoices?view=${view}`);
    },
  });

  const invoices = data?.data || [];

  const filtered = invoices.filter((inv: any) => {
    if (
      search &&
      !inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) &&
      !inv.property?.propertyTitle?.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (statusFilter && inv.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: invoices.length,
    pending: invoices.filter((i: any) => i.status === "pending").length,
    paid: invoices.filter((i: any) => i.status === "paid").length,
    totalAmount: invoices.reduce(
      (s: number, i: any) => s + (i.totalAmount || 0),
      0,
    ),
  };

  const formatPrice = (val: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(val || 0);

  const isSellerView = activeView === "seller";

  const downloadPDF = async (invoice: any) => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    const m = 14;
    let y = 20;

    // Header
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, 210, 36, "F");

    // Company name - "King" in gold, "Property Auction" in white
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 215, 0);
    doc.text("KING", m, 16);
    const kingWidth = doc.getTextWidth("KING");
    doc.setTextColor(255, 255, 255);
    doc.text(" PROPERTY AUCTION", m + kingWidth, 16);

    // Tagline
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 215, 255);
    doc.text("Scotland's Premier Property Auction Platform", m, 22);

    // Address & Contact
    doc.setTextColor(180, 195, 240);
    doc.text(
      "123 Auction House, Glasgow, G1 2AB  |  www.kingpropertyauction.co.uk  |  info@kingpropertyauction.co.uk",
      m,
      27,
    );

    // Gold divider
    doc.setDrawColor(255, 215, 0);
    doc.setLineWidth(0.6);
    doc.line(m, 32, 196, 32);

    // Invoice title right-aligned
    doc.setTextColor(255, 215, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", 196, 16, { align: "right" });

    doc.setTextColor(0);
    doc.setFontSize(12);
    y = 54;

    doc.text(`Invoice: ${invoice.invoiceNumber}`, m, y);
    y += 8;

       // Buyer info in PDF
    const buyerName = invoice.buyerName || invoice.buyer?.name;
    const buyerEmail = invoice.buyerEmail || invoice.buyer?.email;
    const buyerAddr = invoice.buyerAddress || invoice.buyer?.address;
    const buyerAddrStr = buyerAddr
      ? [buyerAddr.street, buyerAddr.city, buyerAddr.postcode].filter(Boolean).join(", ")
      : "";
    if (buyerName) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Buyer:", m, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.text(`  ${buyerName}`, m, y);
      y += 5;
      if (buyerEmail) {
        doc.text(`  ${buyerEmail}`, m, y);
        y += 5;
      }
      if (buyerAddrStr) {
        doc.setFontSize(8);
        doc.text(`  ${buyerAddrStr}`, m, y);
        y += 5;
      }
    }

    doc.setFontSize(10);
    doc.text(`Property: ${invoice.property?.propertyTitle || "N/A"}`, m, y);
    y += 5;
    const lotNo =
      invoice.property?.propertyID ||
      `LOT-${invoice.property?._id?.slice(-6) || "—"}`;
    doc.setFontSize(8);
    doc.text(`Lot: ${lotNo}`, m, y);
    y += 5;
    const propAddr = invoice.property?.location
      ? [
          invoice.property.location.streetAddress,
          invoice.property.location.city,
          invoice.property.location.postalCode,
        ]
          .filter(Boolean)
          .join(", ")
      : "";
    if (propAddr) {
      doc.setFontSize(8);
      doc.text(`  ${propAddr}`, m, y);
      y += 5;
    }
    y += 3;
    doc.text(
      `Purchase Date: ${new Date(invoice.issuedDate).toLocaleDateString("en-GB")}`,
      m,
      y,
    );
    y += 6;
    doc.text(
      `Due: ${new Date(invoice.dueDate).toLocaleDateString("en-GB")}`,
      m,
      y,
    );
    y += 6;
    doc.text(`Status: ${invoice.status.toUpperCase()}`, m, y);
    y += 10;

    autoTable(doc, {
      startY: y,
      head: [["Description", "Amount"]],
      body: [
        ["Sale Price", formatPrice(invoice.salePrice)],
        [
          `Buyer's Fee (${invoice.buyersFeePercent}%)`,
          formatPrice(invoice.buyersFeeAmount),
        ],
        [`VAT (${invoice.vatPercent}%)`, formatPrice(invoice.vatAmount)],
        ["Additional Fees", formatPrice(invoice.additionalFees || 0)],
        [
          `Deposit Due (${invoice.depositPercent}%)`,
          formatPrice(invoice.depositAmount),
        ],
        ["Total | Payable", formatPrice(invoice.totalAmount)],
      ],
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
    });

    doc.save(`${invoice.invoiceNumber}.pdf`);
  };
  console.log("DEBUG:", {
    role: user?.role,
    activeView: user?.activeView,
    isSellerView,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <FileText className="size-6 text-blue-600" />
          {activeView === "buyer" ? "My Invoices" : "Property Invoices"}
        </h2>
        <p className="text-slate-500 mt-1">
          {isSellerView
            ? "Invoices for your sold properties"
            : "Your property purchase invoices"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Total Invoices",
            value: stats.total,
            icon: FileText,
            color: "from-blue-500 to-indigo-600",
          },
          {
            label: "Pending",
            value: stats.pending,
            icon: Clock,
            color: "from-yellow-500 to-amber-600",
          },
          {
            label: "Paid",
            value: stats.paid,
            icon: CheckCircle,
            color: "from-green-500 to-emerald-600",
          },
          {
            label: "Total Value",
            value: formatPrice(stats.totalAmount),
            icon: PoundSterling,
            color: "from-purple-500 to-violet-600",
          },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white`}
            >
              <Icon className="size-5 opacity-80 mb-2" />
              <p className="text-xl sm:text-2xl font-black">{s.value}</p>
              <p className="text-white/80 text-xs font-medium">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice or property..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="size-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <FileText className="size-12 mx-auto mb-3 text-slate-300" />
          <p className="font-bold text-slate-500">No invoices found</p>
          <p className="text-sm text-slate-400 mt-1">
            {activeView === "buyer"
              ? "Invoices will appear here when you purchase a property"
              : "Invoices for your sold properties will appear here"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                {(isSellerView
                  ? [
                      "Invoice #",
                      "Lot No",
                      "Property Purchased",
                      "Buyer",
                      "Amount",
                      "Status",
                      "Date",
                      "",
                    ]
                  : ["Invoice #", "Lot #", "Property", "Amount", "Status", "Date", ""]
                ).map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((inv: any) => (
                <tr
                  key={inv._id}
                  className="hover:bg-blue-50 cursor-pointer"
                  onClick={() => setSelectedInvoice(inv)}
                >
                  <td className="px-4 py-3 font-bold text-blue-600 text-xs">
                    {inv.invoiceNumber}
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-500">
                    {inv.property?.propertyID ||
                      `LOT-${inv.property?._id?.slice(-6) || "—"}`}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 text-xs">
                    {inv.property?.propertyTitle || "N/A"}
                  </td>
                  {isSellerView && (
                    <td className="px-4 py-3 text-sm">
                      <p className="font-semibold text-slate-900">{inv.buyerName || inv.buyer?.name || "N/A"}</p>
                      <p className="text-xs text-slate-500">{inv.buyerEmail || inv.buyer?.email || ""}</p>
                      {(inv.buyerAddress || inv.buyer?.address) && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {[
                            (inv.buyerAddress || inv.buyer?.address)?.street,
                            (inv.buyerAddress || inv.buyer?.address)?.city,
                            (inv.buyerAddress || inv.buyer?.address)?.postcode,
                          ].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3 font-black text-green-700 text-xs">
                    {formatPrice(inv.totalAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold ${statusColors[inv.status]}`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(inv.issuedDate).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-4 py-3">
                    <Eye className="size-4 text-slate-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedInvoice && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedInvoice(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black">
                    {selectedInvoice.invoiceNumber}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {selectedInvoice.property?.propertyTitle}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-bold ${selectedInvoice.status === "paid" ? "bg-green-500" : selectedInvoice.status === "pending" ? "bg-yellow-500" : "bg-red-500"}`}
                >
                  {selectedInvoice.status.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Key Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-xl p-3 col-span-2">
                  <p className="text-xs text-slate-500">Property Purchased</p>
                  <p className="font-bold text-slate-900">
                    {selectedInvoice.property?.propertyTitle}
                  </p>
                  <p className="text-xs text-slate-500">
                    Lot:{" "}
                    {selectedInvoice.property?.propertyID ||
                      `LOT-${selectedInvoice.property?._id?.slice(-6) || "—"}`}
                  </p>
                  {selectedInvoice.property?.location && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      <MapPin className="size-3 inline mr-1" />
                      {[
                        selectedInvoice.property.location.streetAddress,
                        selectedInvoice.property.location.area,
                        selectedInvoice.property.location.city,
                        selectedInvoice.property.location.postalCode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500">Due Date</p>
                  <p className="font-bold text-slate-900">
                    {new Date(selectedInvoice.dueDate).toLocaleDateString(
                      "en-GB",
                    )}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500">Purchase Date</p>
                  <p className="font-bold text-slate-900">
                    {new Date(selectedInvoice.issuedDate).toLocaleDateString(
                      "en-GB",
                    )}
                  </p>
                </div>

                {isSellerView && (selectedInvoice.buyer || selectedInvoice.buyerName) && (
                  <div className="bg-slate-50 rounded-xl p-3 col-span-2">
                    <p className="text-xs text-slate-500">Buyer</p>
                    <p className="font-bold text-slate-900">
                      {selectedInvoice.buyerName || selectedInvoice.buyer?.name || "N/A"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedInvoice.buyerEmail || selectedInvoice.buyer?.email || ""}
                    </p>
                  {(selectedInvoice.buyerAddress || selectedInvoice.buyer?.address) && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {[
                        (selectedInvoice.buyerAddress || selectedInvoice.buyer?.address)?.street,
                        (selectedInvoice.buyerAddress || selectedInvoice.buyer?.address)?.city,
                        (selectedInvoice.buyerAddress || selectedInvoice.buyer?.address)?.postcode,
                      ].filter(Boolean).join(", ")}
                    </p>
                  )}
                  </div>
                )}
                {!isSellerView && selectedInvoice.seller && (
                  <div className="bg-slate-50 rounded-xl p-3 col-span-2">
                    <p className="text-xs text-slate-500">Seller/Agent</p>
                    <p className="font-bold text-slate-900">
                      {selectedInvoice.seller?.name || "N/A"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedInvoice.seller?.email || ""}
                    </p>
                  </div>
                )}
              </div>

              {/* Amounts */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-4 border border-slate-200">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="py-2 text-slate-600">Sale Price</td>
                      <td className="py-2 text-right font-bold">
                        {formatPrice(selectedInvoice.salePrice)}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-2 text-slate-600">
                        Buyer's Fee ({selectedInvoice.buyersFeePercent}%)
                      </td>
                      <td className="py-2 text-right font-bold text-blue-700">
                        {formatPrice(selectedInvoice.buyersFeeAmount)}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-2 text-slate-600">
                        VAT ({selectedInvoice.vatPercent}%)
                      </td>
                      <td className="py-2 text-right font-bold text-amber-700">
                        {formatPrice(selectedInvoice.vatAmount)}
                      </td>
                    </tr>

                    <tr className="border-b border-slate-200">
                      <td className="py-2 text-slate-600">Additional Fees</td>
                      <td className="py-2 text-right font-bold">
                        {formatPrice(selectedInvoice.additionalFees)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-600">
                        Deposit Due ({selectedInvoice.depositPercent}%)
                      </td>
                      <td className="py-2 text-right font-bold text-purple-700">
                        {formatPrice(selectedInvoice.depositAmount)}
                      </td>
                    </tr>
                    <tr className="border-b-2 border-slate-300">
                      <td className="py-3 font-black text-base">
                        Total | Payable
                      </td>
                      <td className="py-3 text-right font-black text-green-700 text-lg">
                        {formatPrice(selectedInvoice.totalAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Download */}
              <button
                onClick={() => downloadPDF(selectedInvoice)}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700"
              >
                <Download className="size-4" /> Download PDF
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="w-full py-2 bg-slate-100 rounded-xl font-bold text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
