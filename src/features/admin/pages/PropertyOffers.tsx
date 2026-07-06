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
  X,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Home,
  PoundSterling,
  Clock,
  Loader2,
  Send,
  Image as ImageIcon,
} from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
  withdrawn: "bg-slate-100 text-slate-500",
  updated: "bg-blue-100 text-blue-700",
};

export default function PropertyOffers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const [showPriceRequest, setShowPriceRequest] = useState(false);
  const [priceRequestMsg, setPriceRequestMsg] = useState("");
  const [suggestedPrice, setSuggestedPrice] = useState("");
  const [priceRequestOffer, setPriceRequestOffer] = useState<any>(null);

  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["property-offers", statusFilter],
    queryFn: () => apiClient.fetch(`/offers?status=${statusFilter}`),
  });

  const offers = data?.data || [];

  const filtered = offers.filter(
    (o: any) =>
      !search ||
      o.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.email?.toLowerCase().includes(search.toLowerCase()) ||
      o.property?.propertyTitle?.toLowerCase().includes(search.toLowerCase()),
  );

  const formatPrice = (val: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(val || 0);

  const handleRespond = async (
    status: "accepted" | "declined",
    offer?: any,
  ) => {
    const targetOffer = offer || selectedOffer;
    if (!targetOffer?._id) {
      showError("Error", "Offer not found");
      return;
    }
    setProcessingId(targetOffer._id);
    try {
      const result = await apiClient.fetch(
        `/offers/${targetOffer._id}/${status === "accepted" ? "accept" : "decline"}`,
        {
          method: "PUT",
          body: JSON.stringify({ message: replyMessage }),
        },
      );
      if (result.success) {
        showSuccess(`Offer ${status}`, "Offeror has been notified by email");
        queryClient.invalidateQueries({ queryKey: ["property-offers"] });
        setSelectedOffer(null);
        setReplyMessage("");
      } else {
        showError("Failed", result.message || "Something went wrong");
      }
    } catch (e: any) {
      showError("Error", e.message || "Failed to process");
    } finally {
      setProcessingId(null);
    }
  };

  const handlePriceRequest = async () => {
    if (!priceRequestOffer) return;
    setProcessingId(priceRequestOffer._id);
    try {
      const result = await apiClient.fetch(
        `/offers/${priceRequestOffer._id}/request-price`,
        {
          method: "POST",
          body: JSON.stringify({ message: priceRequestMsg, suggestedPrice }),
        },
      );
      if (result.success) {
        showSuccess("Price change request sent!");
        setShowPriceRequest(false);
        setPriceRequestMsg("");
        setSuggestedPrice("");
        queryClient.invalidateQueries({ queryKey: ["property-offers"] });
      }
    } catch (e: any) {
      showError("Failed", e.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AdminLayout activeTab="property-offers" onTabChange={() => {}}>
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
              Property Offers
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              Review and respond to property offers
            </p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border-2 border-white/60 shadow-lg mb-6 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or property..."
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
            <option value="updated">Updated</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
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
              <p className="font-bold">No offers yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gradient-to-r from-purple-600 to-indigo-600">
                <tr>
                  {[
                    "Offeror",
                    "Property",
                    "Offer Amount",
                    "Solicitor",
                    "Status",
                    "Date",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-left text-xs font-black text-white uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((offer: any) => (
                  <tr
                    key={offer._id}
                    className="hover:bg-purple-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedOffer(offer);
                      setReplyMessage("");
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                          {offer.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">
                            {offer.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {offer.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <p className="font-semibold text-slate-900">
                        {offer.property?.propertyTitle || "N/A"}
                      </p>
                      {offer.property?.location && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          <MapPin className="size-3 inline mr-1" />
                          {[
                            offer.property.location.streetAddress,
                            offer.property.location.area,
                            offer.property.location.city,
                            offer.property.location.postalCode,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 font-black text-green-700">
                      {formatPrice(offer.offerAmount)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-[120px] truncate">
                      {offer.solicitorDetails || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusColors[offer.status]}`}
                      >
                        {offer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(offer.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td
                      className="px-6 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOffer(offer);
                            setReplyMessage("");
                          }}
                          className="px-2.5 py-1.5 bg-blue-500 text-white rounded-lg text-[10px] font-bold hover:bg-blue-600 transition-colors"
                          title="View offer details"
                        >
                          View
                        </button>
                        {offer.status === "pending" && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRespond("accepted", offer);
                              }}
                              disabled={processingId === offer._id}
                              className="px-2.5 py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
                              title="Accept this offer"
                            >
                               Accept
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRespond("declined", offer);
                              }}
                              disabled={processingId === offer._id}
                              className="px-2.5 py-1.5 bg-red-500 text-white rounded-lg text-[10px] font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                              title="Decline this offer"
                            >
                            Decline
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPriceRequestOffer(offer);
                                setShowPriceRequest(true);
                                setPriceRequestMsg("");
                                setSuggestedPrice("");
                              }}
                              className="px-2.5 py-1.5 bg-amber-500 text-white rounded-lg text-[10px] font-bold hover:bg-amber-600 transition-colors"
                              title="Request price change"
                            >
                              Request Price
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
      </div>

      {/* Offer Detail Modal */}
      {selectedOffer && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={() => setSelectedOffer(null)}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 sm:p-6 text-white rounded-t-2xl sm:rounded-t-3xl sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <FileText className="size-5 sm:size-7" />
                  <div>
                    <h3 className="text-lg sm:text-xl font-black">Offer Details</h3>
                    <p className="text-white/80 text-sm">
                      {selectedOffer.property?.propertyTitle}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOffer(null)}
                  className="size-10 bg-white/20 rounded-full flex items-center justify-center"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Status + Amount */}
              <div className="flex items-center justify-between">
                <span
                  className={`px-3 py-1.5 rounded-xl text-sm font-bold ${statusColors[selectedOffer.status]}`}
                >
                  {selectedOffer.status?.toUpperCase()}
                </span>
                <p className="text-3xl font-black text-green-700">
                  {formatPrice(selectedOffer.offerAmount)}
                </p>
              </div>

              {/* Offeror Details */}
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                <h4 className="font-black text-slate-900 text-sm">
                  Offeror Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-slate-400" />
                    <span>{selectedOffer.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="size-4 text-slate-400" />
                    <span>{selectedOffer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <MapPin className="size-4 text-slate-400" />
                    <span>
                      {selectedOffer.address}, {selectedOffer.city},{" "}
                      {selectedOffer.postcode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Property */}
              <div className="bg-blue-50 rounded-2xl p-4">
                <h4 className="font-black text-slate-900 text-sm mb-2">
                  Property
                </h4>
                <button
                  onClick={() =>
                    navigate(
                      `/properties/${selectedOffer.property?.slug || selectedOffer.property?._id}`,
                    )
                  }
                  className="text-blue-600 font-bold hover:underline"
                >
                  {selectedOffer.property?.propertyTitle}
                </button>
                {selectedOffer.property?.location && (
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="size-3" />
                    {[
                      selectedOffer.property.location.streetAddress,
                      selectedOffer.property.location.area,
                      selectedOffer.property.location.city,
                      selectedOffer.property.location.postalCode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </div>

              {/* Solicitor */}
              <div className="bg-amber-50 rounded-2xl p-4">
                <h4 className="font-black text-slate-900 text-sm mb-1">
                  Solicitor Details
                </h4>
                <p className="text-sm text-slate-700">
                  {selectedOffer.solicitorDetails}
                </p>
              </div>

              {/* Amount in Words */}
              <div className="bg-slate-50 rounded-2xl p-4">
                <h4 className="font-black text-slate-900 text-sm mb-1">
                  Amount in Words
                </h4>
                <p className="text-sm text-slate-700 italic">
                  {selectedOffer.offerAmountInWords}
                </p>
              </div>

              {/* Terms */}
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="size-4 text-green-600" />
                <span className="text-slate-700">Terms of Sale Accepted</span>
              </div>

              {/* Signature */}
              {selectedOffer.signature && (
                <div>
                  <h4 className="font-black text-slate-900 text-sm mb-2">
                    Signature
                  </h4>
                  <img
                    src={selectedOffer.signature}
                    alt="Signature"
                    className="border rounded-xl max-h-32 bg-white"
                  />
                </div>
              )}

              {/* Admin Reply (for pending offers) */}
              {selectedOffer.status === "pending" && (
                <div className="border-t-2 border-slate-200 pt-5 space-y-4">
                  <h4 className="font-black text-slate-900">
                    Respond to Offer
                  </h4>
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Add a message to the offeror (optional)..."
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleRespond("accepted")}
                      disabled={!!processingId}
                      className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {processingId ? "..." : <><CheckCircle className="size-4" /> Accept Offer</>}
                    </button>
                    <button
                      onClick={() => handleRespond("declined")}
                      disabled={!!processingId}
                      className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {processingId ? "..." : <><XCircle className="size-4" /> Decline Offer</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Price Change Request Modal */}
      {showPriceRequest && priceRequestOffer && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={() => setShowPriceRequest(false)}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-md shadow-2xl p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-black text-slate-900 mb-4">
              Request Price Change
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Send a message to <strong>{priceRequestOffer.name}</strong>{" "}
              requesting a new price for{" "}
              <strong>{priceRequestOffer.property?.propertyTitle}</strong>.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Suggested Price (£)
                </label>
                <input
                  type="number"
                  value={suggestedPrice}
                  onChange={(e) => setSuggestedPrice(e.target.value)}
                  placeholder="e.g. 650000"
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Message
                </label>
                <textarea
                  value={priceRequestMsg}
                  onChange={(e) => setPriceRequestMsg(e.target.value)}
                  placeholder="Explain why you're requesting a price change..."
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPriceRequest(false)}
                  className="flex-1 py-2.5 bg-slate-100 rounded-xl font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePriceRequest}
                  disabled={!!processingId}
                  className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl font-bold text-sm disabled:opacity-50"
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
