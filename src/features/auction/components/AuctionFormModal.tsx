import { useState } from "react";
import { X, Save, Gavel, Search } from "lucide-react";
import { useTheme } from "../../../app/hooks/useTheme";
import { usePropertyApi } from "@/features/property/api/usePropertyApi";
import { useAuctionApi } from "@/features/auction/api/useAuctionApi";
import { showSuccess, showError } from "@/lib/toast";

interface AuctionFormModalProps {
  onClose: () => void;
  onSave?: (auction: any) => void;
  editData?: any;
}

function formatForDateTimeLocal(isoString: string) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toISOString().slice(0, 16); // "2026-05-15T10:00"
}

export default function AuctionFormModal({
  onClose,
  onSave,
  editData,
}: AuctionFormModalProps) {
  const theme = useTheme();
  const { useGetProperties } = usePropertyApi();
  const { useGetAuctions } = useAuctionApi();
  const { data: auctionsData } = useGetAuctions();
  const allAuctions = auctionsData?.data || [];

  const { data: propsData } = useGetProperties({
    approvalStatus: "approved",
    listingType: "auction",
    status: "available,unsold", // Show available AND unsold properties
  } as any);
  const allProperties = propsData?.data || [];
  // Build set of property IDs already in other auctions
  const propertiesInOtherAuctions = new Set();
  allAuctions.forEach((a: any) => {
    if (editData?._id && a._id === editData._id) return;
    // Only exclude properties from live or scheduled auctions (not completed/cancelled)
    if (a.status === "completed" || a.status === "cancelled") return;
    a.properties?.forEach((p: any) => {
      const id = typeof p === "object" ? p._id?.toString() : p?.toString();
      if (id) propertiesInOtherAuctions.add(id);
    });
  });

  // Filter out properties already in other auctions
  const availableProperties = allProperties.filter(
    (p: any) => !propertiesInOtherAuctions.has(p._id?.toString()),
  );
  const { useCreateAuction } = useAuctionApi();
  const createAuction = useCreateAuction();
  const { useUpdateAuction } = useAuctionApi();
  const updateAuction = useUpdateAuction();

  const [formData, setFormData] = useState({
    auctionTitle: editData?.auctionTitle || "",
    auctionType: editData?.auctionType || "online",
    selectedProperties:
      editData?.properties?.map((p: any) =>
        typeof p === "object" ? p._id?.toString() : p?.toString(),
      ) || [],
    startDateTime: formatForDateTimeLocal(editData?.startDateTime) || "",
    endDateTime: formatForDateTimeLocal(editData?.endDateTime) || "",
    description: editData?.description || "",
    status: editData?.status || "scheduled",
    auctionImage: editData?.auctionImage || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [propertySearch, setPropertySearch] = useState("");

  const filteredProperties = propertySearch
    ? availableProperties.filter(
        (p: any) =>
          p.propertyTitle
            ?.toLowerCase()
            .includes(propertySearch.toLowerCase()) ||
          p.location?.city
            ?.toLowerCase()
            .includes(propertySearch.toLowerCase()),
      )
    : availableProperties;

  const toggleProperty = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedProperties: prev.selectedProperties.includes(id)
        ? prev.selectedProperties.filter((p: string) => p !== id)
        : [...prev.selectedProperties, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.selectedProperties.length === 0) {
      setError("Please select at least one property");
      return;
    }

    setLoading(true);
    setError("");

    const data = {
      auctionTitle: formData.auctionTitle,
      auctionType: formData.auctionType,
      properties: formData.selectedProperties,
      startDateTime: new Date(formData.startDateTime).toISOString(),
      endDateTime: new Date(formData.endDateTime).toISOString(),
      description: formData.description,
      status: formData.status,
      auctionImage: formData.auctionImage || undefined,
      enableAutoBidding: false,
      sendEmailNotifications: false,
    };

    try {
      let result;
      if (editData?._id) {
        // Update existing
        result = await updateAuction.mutateAsync({ id: editData._id, data });
      } else {
        // Create new
        result = await createAuction.mutateAsync(data);
      }

      if (result.success) {
        showSuccess(editData ? "Auction saved! ✅" : "Auction created! 🔨");
        if (onSave) onSave(result.data);
        onClose();
      } else {
        setError(result.message || "Failed to save auction");
        showError("Save failed", result.message || "Failed to save auction");
      }
    } catch (err: any) {
      setError(err.message || "Error saving auction");
      showError("Error", err.message || "Error saving auction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div
                    className={`bg-gradient-to-r ${theme.primary} p-4 sm:p-6 flex items-center justify-between text-white sticky top-0 z-10 rounded-t-2xl sm:rounded-t-3xl`}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="size-10 sm:size-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
              <Gavel className="size-5 sm:size-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black">{editData ? "Edit" : "Create"} Auction</h2>
              <p className="text-xs sm:text-sm text-white/80 font-medium hidden sm:block">Set up your auction details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-xl transition-all"
          >
            <X className="size-6 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Auction Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-900">
              Auction Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Auction Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.auctionTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, auctionTitle: e.target.value })
                  }
                  placeholder="e.g., Premium Properties - March 2026"
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Auction Type *
                </label>
                <select
                  required
                  value={formData.auctionType}
                  onChange={(e) =>
                    setFormData({ ...formData, auctionType: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="online">
                    🖥️ Online Auction (bidding on website)
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Property Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-900">
              Select Properties ({formData.selectedProperties.length} selected)
            </h3>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or city..."
                value={propertySearch}
                onChange={(e) => setPropertySearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Selected badges */}
            {formData.selectedProperties.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.selectedProperties.map((id: string) => {
                  const prop = allProperties.find((p: any) => p._id === id);
                  return prop ? (
                    <span
                      key={id}
                      className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-2"
                    >
                      {prop.propertyTitle?.slice(0, 25)}
                      {prop.propertyTitle?.length > 25 ? "..." : ""}
                      <button
                        type="button"
                        onClick={() => toggleProperty(id)}
                        className="hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            )}

            {/* Property grid - 2 columns, scrollable, max 30 initially */}
            <div className="border-2 border-slate-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto p-3">
                {filteredProperties.length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-8 col-span-2">
                    No properties found.
                  </p>
                )}
                {filteredProperties.map((prop: any) => (
                  <label
                    key={prop._id}
                    className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all border-2 ${
                      formData.selectedProperties.includes(prop._id)
                        ? "bg-blue-50 border-blue-500"
                        : "bg-slate-50 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedProperties.includes(prop._id)}
                      onChange={() => toggleProperty(prop._id)}
                      className="size-4 rounded accent-blue-600 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {prop.propertyTitle}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {prop.location?.city || "N/A"} • £
                        {prop.pricing?.startingAuctionPrice?.toLocaleString()}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Load More button */}
              {allProperties.length >= 30 &&
                filteredProperties.length === allProperties.length && (
                  <div className="border-t-2 border-slate-100 p-2 text-center">
                    <button
                      type="button"
                      className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Showing all {allProperties.length} properties
                    </button>
                  </div>
                )}
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-900">Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  min={new Date().toISOString().slice(0, 16)}
                  value={formData.startDateTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startDateTime: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  min={
                    formData.startDateTime ||
                    new Date().toISOString().slice(0, 16)
                  }
                  value={formData.endDateTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endDateTime: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Banner Image */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-900">
              Auction Banner Image (Optional)
            </h3>
            <input
              type="text"
              value={formData.auctionImage}
              onChange={(e) =>
                setFormData({ ...formData, auctionImage: e.target.value })
              }
              placeholder="Paste image URL (or first property's image will be used)"
              className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-900">Description</h3>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe the auction event..."
              rows={4}
              className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t-2 border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-6 py-3 bg-gradient-to-r ${theme.secondary} text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2`}
            >
              <Save className="size-5" />
              {loading ? "Creating..." : editData ? "Update" : "Create"} Auction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
