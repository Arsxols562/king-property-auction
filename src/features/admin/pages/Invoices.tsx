import { useState } from "react";
import { useNavigate } from "react-router";
import AdminLayout from "../components/AdminLayout";
import { apiClient } from "@/lib/apiClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { showSuccess, showError } from "@/lib/toast";
import {
  FileText,
  Search,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  PoundSterling,
  TrendingUp,
  AlertCircle,
  Home,
  MapPin,
} from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
  refunded: "bg-purple-100 text-purple-700",
  withdrawn: "bg-orange-100 text-orange-700",
};

export default function Invoices() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    propertyId: "",
    buyerId: "",
    sellerId: "",
    salePrice: "",
    notes: "",
  });
  const [properties, setProperties] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [preview, setPreview] = useState<any>(null);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  const [propertySearch, setPropertySearch] = useState("");
  const [buyerSearch, setBuyerSearch] = useState("");
  const [showPropertyList, setShowPropertyList] = useState(false);
  const [showBuyerList, setShowBuyerList] = useState(false);

  const [topBidders, setTopBidders] = useState<any[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-invoices", statusFilter],
    queryFn: () => apiClient.fetch(`/invoices?status=${statusFilter}`),
  });

  const { data: stats } = useQuery({
    queryKey: ["invoice-stats"],
    queryFn: () => apiClient.fetch("/invoices/stats"),
  });

  const invoices = data?.invoices || data?.data || [];
  const invoiceStats = stats?.data || {};

  const filtered = invoices.filter(
    (inv: any) =>
      !search ||
      inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      inv.buyer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.property?.propertyTitle?.toLowerCase().includes(search.toLowerCase()),
  );

  const formatPrice = (val: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(val || 0);

  const handleUpdateStatus = async (id: string, status: string) => {
    setProcessing(true);
    try {
      const result = await apiClient.fetch(`/invoices/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (result.success) {
        showSuccess(`Invoice marked as ${status}`);
        queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
        queryClient.invalidateQueries({ queryKey: ["invoice-stats"] });
        setSelectedInvoice(null);
      }
    } catch (e: any) {
      showError("Failed", e.message);
    } finally {
      setProcessing(false);
    }
  };

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
    doc.setFontSize(10);
    doc.text(
      `Purchase Date: ${new Date(invoice.issuedDate).toLocaleDateString("en-GB")}`,
      m,
      y,
    );
    y += 6;
    doc.text(
      `Due Date: ${new Date(invoice.dueDate).toLocaleDateString("en-GB")}`,
      m,
      y,
    );
    y += 6;
    doc.text(`Status: ${invoice.status.toUpperCase()}`, m, y);
    y += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Buyer:", m, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`  ${invoice.buyerName || invoice.buyer?.name || "N/A"}`, m, y);
    y += 5;
    doc.text(`  ${invoice.buyerEmail || invoice.buyer?.email || ""}`, m, y);

    y += 5;
    const buyerAddr = invoice.buyerAddress || invoice.buyer?.address;
    if (buyerAddr) {
      const parts = [buyerAddr.street, buyerAddr.city, buyerAddr.postcode].filter(Boolean);
      if (parts.length > 0) {
        doc.setFontSize(8);
        doc.text(`  ${parts.join(", ")}`, m, y);
        y += 5;
      }
    }
    y += 3;

    doc.setFont("helvetica", "bold");
    doc.text("Property:", m, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`  ${invoice.property?.propertyTitle || "N/A"}`, m, y);
    y += 5;
    const lotNo =
      invoice.property?.propertyID ||
      `LOT-${invoice.property?._id?.slice(-6) || "—"}`;
    doc.setFontSize(8);
    doc.text(`  Lot: ${lotNo}`, m, y);
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
    y += 5;

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

  const openGenerateModal = async () => {
    setShowGenerateModal(true);
    setPreview(null);
    setSelectedProperty(null);
    const [propsRes, usersRes, invoicesRes] = await Promise.all([
      apiClient.fetch("/properties?limit=500&status=sold"),
      apiClient.fetch("/users?limit=500"),
      apiClient.fetch("/invoices?limit=500"),
    ]);
    // Exclude properties that have an active invoice (not cancelled/withdrawn)
    const activeInvoicedIds = (invoicesRes?.invoices || invoicesRes?.data || [])
      .filter((i: any) => !["cancelled", "withdrawn"].includes(i.status))
      .map((i: any) => i.property?._id || i.property);
    const availableProperties = (propsRes.data || []).filter(
      (p: any) => !activeInvoicedIds.includes(p._id),
    );
    setProperties(availableProperties);
    setBuyers(usersRes.data || usersRes.users || []);
  };

  const handlePropertyChange = async (propertyId: string) => {
    setGenerateForm({
      ...generateForm,
      propertyId,
      buyerId: "",
      salePrice: "",
    });
    setPreview(null);
    if (!propertyId) return;

    const prop = properties.find((p: any) => p._id === propertyId);
    setSelectedProperty(prop);

    const price =
      prop?.soldPrice ||
      prop?.currentBid ||
      prop?.pricing?.startingAuctionPrice ||
      0;
    const priceStr = price.toString();

    let bidderId = "";
    if (prop?.winningBidder) {
      bidderId =
        typeof prop.winningBidder === "object"
          ? prop.winningBidder._id
          : prop.winningBidder;
    }

    const sellerId = prop?.createdBy?._id || prop?.createdBy || "";
    setGenerateForm((prev) => ({
      ...prev,
      salePrice: priceStr,
      buyerId: bidderId,
      sellerId,
    }));

    // Auto-calculate preview
    if (price > 0) {
      try {
        const customSettings: any = {};
        if (prop?.termsOfSale) {
          const t = prop.termsOfSale;
          if (t.buyersFeePercent)
            customSettings.buyersFeePercent = t.buyersFeePercent;
          if (t.buyersFeeMin) customSettings.buyersFeeMin = t.buyersFeeMin;
          if (t.depositPercent)
            customSettings.depositPercent = t.depositPercent;
          if (t.depositMin) customSettings.depositMin = t.depositMin;
          if (t.vatPercent) customSettings.vatPercent = t.vatPercent;
          if (t.additionalFees != null && t.additionalFees > 0)
            customSettings.additionalFees = t.additionalFees;
        }
        const result = await apiClient.fetch("/invoices/calculate", {
          method: "POST",
          body: JSON.stringify({ salePrice: price, customSettings }),
        });
        if (result.success) setPreview(result.data);
      } catch {}
    }

    // Fetch top 3 bidders - find auction for this property first
    try {
      // Find which auction this property belongs to
      const auctionsRes = await apiClient.fetch("/auctions?limit=50");
      const auction = (auctionsRes?.data || auctionsRes?.auctions || []).find(
        (a: any) =>
          a.properties?.some(
            (p: any) => (typeof p === "string" ? p : p._id) === propertyId,
          ),
      );

      if (auction) {
        const bidsRes = await apiClient.fetch(
          `/bids/auction/${auction._id}/property/${propertyId}`,
        );
        if (bidsRes.success && bidsRes.data?.bids) {
          const seen = new Set();
          const uniqueBidders = bidsRes.data.bids
            .filter((b: any) => {
              const id = b.bidder?._id || b.bidder;
              if (seen.has(id)) return false;
              seen.add(id);
              return true;
            })
            .sort((a: any, b: any) => b.amount - a.amount)
            .slice(0, 3);
          setTopBidders(uniqueBidders);
        }
      }
    } catch {
      setTopBidders([]);
    }
  };

  const handlePriceChange = async (price: string) => {
    setGenerateForm({ ...generateForm, salePrice: price });
    if (price && parseFloat(price) > 0) {
      try {
        const customSettings: any = {};
        if (selectedProperty?.termsOfSale) {
          const t = selectedProperty.termsOfSale;
          if (t.buyersFeePercent)
            customSettings.buyersFeePercent = t.buyersFeePercent;
          if (t.buyersFeeMin) customSettings.buyersFeeMin = t.buyersFeeMin;
          if (t.depositPercent)
            customSettings.depositPercent = t.depositPercent;
          if (t.depositMin) customSettings.depositMin = t.depositMin;
          if (t.vatPercent) customSettings.vatPercent = t.vatPercent;
          if (t.additionalFees != null && t.additionalFees > 0)
            customSettings.additionalFees = t.additionalFees;
        }
        const result = await apiClient.fetch("/invoices/calculate", {
          method: "POST",
          body: JSON.stringify({
            salePrice: parseFloat(price),
            customSettings,
          }),
        });
        if (result.success) setPreview(result.data);
      } catch {}
    } else {
      setPreview(null);
    }
  };

  const handleGenerateInvoice = async () => {
    if (
      !generateForm.propertyId ||
      !generateForm.buyerId ||
      !generateForm.salePrice
    ) {
      showError("Please fill all required fields");
      return;
    }
    setProcessing(true);
    try {
      const customSettings: any = {};
      if (selectedProperty?.termsOfSale) {
        const t = selectedProperty.termsOfSale;
        if (t.buyersFeePercent)
          customSettings.buyersFeePercent = t.buyersFeePercent;
        if (t.buyersFeeMin) customSettings.buyersFeeMin = t.buyersFeeMin;
        if (t.depositPercent) customSettings.depositPercent = t.depositPercent;
        if (t.depositMin) customSettings.depositMin = t.depositMin;
        if (t.vatPercent) customSettings.vatPercent = t.vatPercent;
        if (t.additionalFees != null && t.additionalFees > 0)
          customSettings.additionalFees = t.additionalFees;
      }

      const result = await apiClient.fetch("/invoices", {
        method: "POST",
        body: JSON.stringify({
          propertyId: generateForm.propertyId,
          buyerId: generateForm.buyerId,
          sellerId: generateForm.sellerId,
          salePrice: parseFloat(generateForm.salePrice),
          notes: generateForm.notes,
          invoiceType: "manual",
          customSettings,
        }),
      });
      if (result.success) {
        showSuccess("Invoice generated!");
        queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
        queryClient.invalidateQueries({ queryKey: ["invoice-stats"] });
        setShowGenerateModal(false);
        // Reset form
        setGenerateForm({
          propertyId: "",
          buyerId: "",
          sellerId: "",
          salePrice: "",
          notes: "",
        });
        setSelectedProperty(null);
        setPreview(null);
        setTopBidders([]);
        setPropertySearch("");
        setBuyerSearch("");
      }
    } catch (e: any) {
      showError("Failed", e.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AdminLayout activeTab="invoices" onTabChange={() => {}}>
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">Invoices</h2>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              Manage all property invoices
            </p>
          </div>
          <button
            onClick={openGenerateModal}
            className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-all flex items-center gap-2 w-fit"
          >
            <FileText className="size-4" /> Generate Invoice
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Total Invoices",
              value: invoiceStats.total || 0,
              icon: FileText,
              color: "from-blue-500 to-indigo-600",
            },
            {
              label: "Pending",
              value: invoiceStats.pending || 0,
              icon: Clock,
              color: "from-yellow-500 to-amber-600",
            },
            {
              label: "Paid",
              value: invoiceStats.paid || 0,
              icon: CheckCircle,
              color: "from-green-500 to-emerald-600",
            },
            {
              label: "Total Value",
              value: formatPrice(invoiceStats.totalAmount || 0),
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
                <p className="text-2xl font-black">{s.value}</p>
                <p className="text-white/80 text-xs font-medium">{s.label}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border-2 border-white/60 shadow-lg mb-6 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice number, buyer or property..."
              className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-bold"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border-2 border-white/60 shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="size-8 animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <FileText className="size-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold">No invoices found</p>
              <p className="text-sm text-slate-400 mt-1">
                Click "Generate Invoice" to create one for a sold property
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600">
                <tr>
                  {[
                    "Invoice #",
                    "Lot No",
                    "Buyer",
                    "Property Purchased",
                    "Sale Price",
                    "Total",
                    "Status",
                    "Date",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-black text-white uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
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
                    <td className="px-4 py-3 text-sm">
                      <p className="font-semibold text-slate-900">
                        {inv.buyerName || inv.buyer?.name || "N/A"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {inv.buyerEmail || inv.buyer?.email || ""}
                      </p>
                      {(inv.buyerAddress || inv.buyer?.address) && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {[
                            (inv.buyerAddress || inv.buyer?.address)?.street,
                            (inv.buyerAddress || inv.buyer?.address)?.city,
                            (inv.buyerAddress || inv.buyer?.address)?.postcode,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <p className="font-semibold text-slate-900">
                        {inv.property?.propertyTitle || "N/A"}
                      </p>
                      {inv.property?.propertyType && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold capitalize mt-0.5 inline-block">
                          {inv.property.propertyType}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {formatPrice(inv.salePrice)}
                    </td>
                    <td className="px-4 py-3 font-black text-green-700">
                      {formatPrice(inv.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const isOverdue =
                          inv.status === "pending" &&
                          new Date(inv.dueDate) < new Date();
                        const displayStatus = isOverdue
                          ? "overdue"
                          : inv.status;
                        return (
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusColors[displayStatus]}`}
                          >
                            {displayStatus}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(inv.issuedDate).toLocaleDateString("en-GB")}
                    </td>
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold hover:bg-blue-200"
                        >
                          View
                        </button>
                        {inv.status === "pending" && (
                          <button
                            onClick={() => handleUpdateStatus(inv._id, "paid")}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-bold hover:bg-green-200"
                          >
                            Mark Paid
                          </button>
                        )}
                        {inv.status === "paid" && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(inv._id, "withdrawn")
                            }
                            className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-[10px] font-bold hover:bg-orange-200"
                          >
                            Mark Withdraw
                          </button>
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
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={() => setSelectedInvoice(null)}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 sm:p-6 text-white rounded-t-2xl sm:rounded-t-3xl sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="size-7" />
                  <div>
                    <h3 className="text-xl font-black">
                      {selectedInvoice.invoiceNumber}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {selectedInvoice.property?.propertyTitle}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="size-10 bg-white/20 rounded-full flex items-center justify-center"
                >
                  <XCircle className="size-5" />
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div className="flex justify-between items-center">
                <span
                  className={`px-3 py-1.5 rounded-xl text-sm font-bold ${statusColors[selectedInvoice.status]}`}
                >
                  {selectedInvoice.status.toUpperCase()}
                </span>
                <button
                  onClick={() => downloadPDF(selectedInvoice)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2"
                >
                  <Download className="size-4" /> PDF
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div className="col-span-2">
                  <p className="text-slate-500 text-xs">Buyer</p>
                  <p className="font-bold">
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
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500 text-xs">Property Purchased</p>
                  <p className="font-bold">
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
                <div>
                  <p className="text-slate-500 text-xs">Purchase Date</p>
                  <p className="font-bold">
                    {new Date(selectedInvoice.issuedDate).toLocaleDateString(
                      "en-GB",
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Due Date</p>
                  <p className="font-bold">
                    {new Date(selectedInvoice.dueDate).toLocaleDateString(
                      "en-GB",
                    )}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ["Sale Price", formatPrice(selectedInvoice.salePrice)],
                      [
                        `Buyer's Fee (${selectedInvoice.buyersFeePercent}%)`,
                        formatPrice(selectedInvoice.buyersFeeAmount),
                      ],
                      [
                        `VAT (${selectedInvoice.vatPercent}%)`,
                        formatPrice(selectedInvoice.vatAmount),
                      ],
                      [
                        "Additional Fees",
                        formatPrice(selectedInvoice.additionalFees || 0),
                      ],
                    ].map(([label, value]) => (
                      <tr key={label} className="border-b border-slate-100">
                        <td className="py-2 text-slate-600">{label}</td>
                        <td className="py-2 text-right font-bold">{value}</td>
                      </tr>
                    ))}
                    <tr>
                      <td className="py-2 text-slate-600">
                        Deposit Due ({selectedInvoice.depositPercent}%)
                      </td>
                      <td className="py-2 text-right font-bold text-amber-600">
                        {formatPrice(selectedInvoice.depositAmount)}
                      </td>
                    </tr>
                    <tr className="text-lg">
                      <td className="py-3 font-black text-slate-900">
                        Total | Payable
                      </td>
                      <td className="py-3 text-right font-black text-green-700">
                        {formatPrice(selectedInvoice.totalAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {(selectedInvoice.status === "pending" ||
                selectedInvoice.status === "paid") && (
                <div className="flex gap-3 flex-wrap">
                  {selectedInvoice.status === "pending" && (
                    <>
                      <button
                        onClick={() =>
                          handleUpdateStatus(selectedInvoice._id, "paid")
                        }
                        disabled={processing}
                        className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {processing ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <CheckCircle className="size-4" />
                        )}{" "}
                        Mark as Paid
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateStatus(selectedInvoice._id, "cancelled")
                        }
                        disabled={processing}
                        className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <XCircle className="size-4" /> Cancel Invoice
                      </button>
                    </>
                  )}
                  <button
                    onClick={() =>
                      handleUpdateStatus(selectedInvoice._id, "withdrawn")
                    }
                    disabled={processing}
                    className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <AlertCircle className="size-4" /> Mark Withdrawn
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generate Invoice Modal */}
      {showGenerateModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={() => setShowGenerateModal(false)}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 sm:p-6 text-white rounded-t-2xl sm:rounded-t-3xl sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <FileText className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">Generate Invoice</h3>
                    <p className="text-white/70 text-sm">
                      Create a new invoice for a property
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="size-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30"
                >
                  <XCircle className="size-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Property Selection */}
              <div>
                <label className="block text-sm font-black text-slate-800 mb-2">
                  Property <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search property..."
                    value={propertySearch}
                    onChange={(e) => {
                      setPropertySearch(e.target.value);
                      setShowPropertyList(true);
                    }}
                    onFocus={() => setShowPropertyList(true)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  {generateForm.propertyId && selectedProperty && (
                    <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-3">
                      <Home className="size-5 text-purple-600" />
                      <div>
                        <p className="font-bold text-purple-900 text-sm">
                          {selectedProperty.propertyTitle}
                        </p>
                        <p className="text-xs text-purple-600">
                          {selectedProperty.propertyStatus} • £
                          {(
                            selectedProperty.soldPrice ||
                            selectedProperty.currentBid ||
                            selectedProperty.pricing?.startingAuctionPrice ||
                            0
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {showPropertyList && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {properties
                        .filter(
                          (p) =>
                            !propertySearch ||
                            p.propertyTitle
                              ?.toLowerCase()
                              .includes(propertySearch.toLowerCase()),
                        )
                        .slice(0, 20)
                        .map((p: any) => (
                          <button
                            key={p._id}
                            type="button"
                            onClick={() => {
                              handlePropertyChange(p._id);
                              setShowPropertyList(false);
                              setPropertySearch("");
                            }}
                            className="w-full px-4 py-2.5 text-left hover:bg-purple-50 flex items-center justify-between border-b border-slate-50"
                          >
                            <span className="text-sm font-medium text-slate-700">
                              {p.propertyTitle}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-bold ${p.propertyStatus === "sold" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}
                            >
                              {p.propertyStatus}
                            </span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Buyer Selection */}
              <div>
                <label className="block text-sm font-black text-slate-800 mb-2">
                  Buyer <span className="text-red-500">*</span>
                  {selectedProperty?.winningBidder && (
                    <span className="text-xs font-normal text-green-600 ml-2">
                      ✅ Auto-selected from property
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search buyer..."
                    value={buyerSearch}
                    onChange={(e) => {
                      setBuyerSearch(e.target.value);
                      setShowBuyerList(true);
                    }}
                    onFocus={() => setShowBuyerList(true)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  {generateForm.buyerId && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                      <div className="size-10 bg-green-200 rounded-xl flex items-center justify-center text-green-700 font-bold">
                        {buyers
                          .find(
                            (b) =>
                              String(b._id) === String(generateForm.buyerId),
                          )
                          ?.name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="font-bold text-green-900 text-sm">
                          {
                            buyers.find(
                              (b) =>
                                String(b._id) === String(generateForm.buyerId),
                            )?.name
                          }
                        </p>
                        <p className="text-xs text-green-600">
                          {
                            buyers.find(
                              (b) =>
                                String(b._id) === String(generateForm.buyerId),
                            )?.email
                          }
                        </p>
                      </div>
                    </div>
                  )}
                  {showBuyerList && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {buyers
                        .filter(
                          (b) =>
                            !buyerSearch ||
                            b.name
                              ?.toLowerCase()
                              .includes(buyerSearch.toLowerCase()) ||
                            b.email
                              ?.toLowerCase()
                              .includes(buyerSearch.toLowerCase()),
                        )
                        .slice(0, 20)
                        .map((b: any) => (
                          <button
                            key={b._id}
                            type="button"
                            onClick={() => {
                              setGenerateForm({
                                ...generateForm,
                                buyerId: b._id,
                              });
                              setShowBuyerList(false);
                              setBuyerSearch("");
                            }}
                            className="w-full px-4 py-2.5 text-left hover:bg-green-50 flex items-center gap-3 border-b border-slate-50"
                          >
                            <div className="size-8 bg-slate-200 rounded-lg flex items-center justify-center text-xs font-bold">
                              {b.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-700">
                                {b.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {b.email}
                              </p>
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Top 3 Bidders Quick Select */}
              {topBidders.length > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-4 border-2 border-amber-200">
                  <p className="text-xs font-black text-amber-800 mb-3 flex items-center gap-1">
                    🏆 Top Bidders - Click to Select
                  </p>
                  <div className="space-y-2">
                    {topBidders.map((bid: any, i: number) => {
                      const isSelected =
                        String(generateForm.buyerId) ===
                        String(bid.bidder?._id || bid.bidder);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() =>
                            setGenerateForm({
                              ...generateForm,
                              buyerId: bid.bidder?._id || bid.bidder,
                            })
                          }
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                            isSelected
                              ? "bg-amber-200 border-2 border-amber-400 font-bold"
                              : "bg-white border border-amber-100 hover:bg-amber-50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                i === 0
                                  ? "bg-yellow-400 text-yellow-900"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {i + 1}
                            </span>
                            <span className="font-medium text-slate-700">
                              {bid.bidder?.name || "Bidder"}
                            </span>
                            {i === 0 && (
                              <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">
                                Winner
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-green-700">
                            £{bid.amount?.toLocaleString()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sale Price */}
              <div>
                <label className="block text-sm font-black text-slate-800 mb-2">
                  Sale Price (£) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={generateForm.salePrice}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="Enter sale price"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Live Preview */}
              {preview && (
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-5 border-2 border-slate-200">
                  <h4 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2">
                    <FileText className="size-4 text-blue-600" /> Invoice
                    Preview
                  </h4>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="py-2 text-slate-600">Sale Price</td>
                        <td className="py-2 text-right font-bold text-slate-900">
                          £{preview.salePrice?.toLocaleString()}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-2 text-slate-600">
                          Buyer's Fee ({preview.buyersFeePercent}%)
                        </td>
                        <td className="py-2 text-right font-bold text-blue-700">
                          £{preview.buyersFeeAmount?.toLocaleString()}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-2 text-slate-600">
                          VAT ({preview.vatPercent}%)
                        </td>
                        <td className="py-2 text-right font-bold text-amber-700">
                          £{preview.vatAmount?.toLocaleString()}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-2 text-slate-600">Additional Fees</td>
                        <td className="py-2 text-right font-bold text-slate-700">
                          £{preview.additionalFees?.toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-slate-600">
                          Deposit Required ({preview.depositPercent}%)
                        </td>
                        <td className="py-2 text-right font-bold text-purple-700">
                          £{preview.depositAmount?.toLocaleString()}
                        </td>
                      </tr>
                      <tr className="border-b-2 border-slate-300">
                        <td className="py-3 font-black text-slate-900 text-base">
                          Total | Payable
                        </td>
                        <td className="py-3 text-right font-black text-green-700 text-lg">
                          £{preview.totalAmount?.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-black text-slate-800 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={generateForm.notes}
                  onChange={(e) =>
                    setGenerateForm({ ...generateForm, notes: e.target.value })
                  }
                  placeholder="Add any additional notes..."
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowGenerateModal(false);
                    setPreview(null);
                  }}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateInvoice}
                  disabled={
                    processing ||
                    !generateForm.propertyId ||
                    !generateForm.buyerId ||
                    !generateForm.salePrice
                  }
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="size-4" /> Generate Invoice
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
