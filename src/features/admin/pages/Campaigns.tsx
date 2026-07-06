import { useState } from "react";
import {
  Plus,
  Send,
  Edit,
  Trash2,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Copy,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import CampaignStats from "../components/campaign/CampaignStats";
import CampaignFormModal from "../components/campaign/CampaignFormModal";
import { useCampaignApi } from "../api/useCampaignApi";
import { useTheme } from "../../../app/hooks/useTheme";

export default function Campaigns() {
  const theme = useTheme();
  const {
    useGetCampaigns,
    useDeleteCampaign,
    useSendCampaign,
    useDuplicateCampaign,
  } = useCampaignApi();
  const deleteCampaign = useDeleteCampaign();
  const sendCampaign = useSendCampaign();
  const duplicateCampaign = useDuplicateCampaign();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: campaignsData, isLoading } = useGetCampaigns({
    page,
    limit: 10,
    status: statusFilter,
    type: typeFilter,
  });
  const campaigns = campaignsData?.data || [];
  const pagination = campaignsData?.pagination || {};

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({
    show: false,
    title: "",
    message: "",
    action: () => {},
  });

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 4000);
  };

  const handleEdit = (campaign: any) => {
    setEditingCampaign(campaign);
    setShowFormModal(true);
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      show: true,
      title: "Delete Campaign",
      message:
        "Are you sure you want to delete this campaign? This action cannot be undone.",
      action: async () => {
        try {
          await deleteCampaign.mutateAsync(id);
          showToast("Campaign deleted");
        } catch (err: any) {
          showToast(err.message || "Failed to delete", "error");
        }
        setConfirmModal({
          show: false,
          title: "",
          message: "",
          action: () => {},
        });
      },
    });
  };

  const handleSend = (id: string, name: string) => {
    setConfirmModal({
      show: true,
      title: "Send Campaign",
      message: `Are you sure you want to send "${name}" to all targeted users? This cannot be undone.`,
      action: async () => {
        try {
          const result = await sendCampaign.mutateAsync(id);
          showToast(
            `Campaign sent! ${result.data?.sent || 0} emails delivered.`,
          );
        } catch (err: any) {
          showToast(err.message || "Failed to send", "error");
        }
        setConfirmModal({
          show: false,
          title: "",
          message: "",
          action: () => {},
        });
      },
    });
  };

  const typeLabels: Record<string, string> = {
    newsletter: "Newsletter",
    property_alert: "Property Alert",
    auction_reminder: "Auction Reminder",
    promotional: "Promotional",
    announcement: "Announcement",
  };

  const statusIcons: Record<string, any> = {
    draft: Clock,
    scheduled: Clock,
    sending: Send,
    sent: CheckCircle,
    failed: AlertCircle,
  };
  const statusColors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700",
    scheduled: "bg-blue-100 text-blue-700",
    sending: "bg-yellow-100 text-yellow-700",
    sent: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <AdminLayout activeTab="marketing" onTabChange={() => {}}>
      {/* Toast */}
      {toastMsg && (
        <div
          className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl font-bold flex items-center gap-3 animate-in slide-in-from-right ${
            toastType === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {toastType === "success" ? (
            <CheckCircle className="size-5" />
          ) : (
            <AlertCircle className="size-5" />
          )}
          {toastMsg}
          <button
            onClick={() => setToastMsg("")}
            className="ml-2 hover:opacity-80"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-2xl bg-orange-100 flex items-center justify-center">
                <AlertCircle className="size-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                {confirmModal.title}
              </h3>
            </div>
            <p className="text-slate-600 font-medium mb-6">
              {confirmModal.message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setConfirmModal({
                    show: false,
                    title: "",
                    message: "",
                    action: () => {},
                  })
                }
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.action}
                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:scale-105 transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1 sm:mb-2">
              Marketing Campaigns
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              Create and manage email campaigns
            </p>
          </div>
          <button
            onClick={() => {
              setEditingCampaign(null);
              setShowFormModal(true);
            }}
            className={`px-5 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r ${theme.secondary} text-white rounded-xl text-sm font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2 w-fit`}
          >
            <Plus className="size-5" /> New Campaign
          </button>
        </div>

        {/* Stats */}
        <CampaignStats />

        {/* Filters + Search */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border-2 border-white/60 shadow-lg mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search campaigns..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="sent">Sent</option>
            <option value="sending">Sending</option>
            <option value="failed">Failed</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold"
          >
            <option value="">All Types</option>
            {Object.entries(typeLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>

        {/* Campaigns Table */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border-2 border-white/60 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600">
                <tr>
                  {[
                    "Campaign",
                    "Type",
                    "Status",
                    "Target",
                    "Sent",
                    "Opened",
                    "Clicked",
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
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-12 text-slate-500"
                    >
                      Loading campaigns...
                    </td>
                  </tr>
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-12 text-slate-500"
                    >
                      <Mail className="size-12 text-slate-300 mx-auto mb-3" />
                      <p className="font-bold">No campaigns found</p>
                      <p className="text-sm">
                        Create your first marketing campaign
                      </p>
                    </td>
                  </tr>
                ) : (
                  campaigns
                    .filter(
                      (c: any) =>
                        !searchTerm ||
                        c.name
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        c.subject
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase()),
                    )
                    .map((campaign: any) => {
                      const StatusIcon = statusIcons[campaign.status] || Clock;
                      return (
                        <tr
                          key={campaign._id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900 text-sm">
                              {campaign.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate max-w-[200px]">
                              {campaign.subject}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">
                              {typeLabels[campaign.type] || campaign.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${statusColors[campaign.status] || ""}`}
                            >
                              <StatusIcon className="size-3" />
                              {campaign.status?.charAt(0).toUpperCase() +
                                campaign.status?.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600">
                            {campaign.targetAll ? (
                              <span className="flex items-center gap-1">
                                <Users className="size-3" /> All Users
                              </span>
                            ) : (
                              <span>
                                {campaign.targetRoles?.join(", ") || "None"}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-700">
                            {campaign.totalSent?.toLocaleString() || 0}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-700">
                            {campaign.totalOpened?.toLocaleString() || 0}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-700">
                            {campaign.totalClicked?.toLocaleString() || 0}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              {(campaign.status === "draft" ||
                                campaign.status === "scheduled") && (
                                <button
                                  onClick={() =>
                                    handleSend(campaign._id, campaign.name)
                                  }
                                  className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                                  title="Send Now"
                                >
                                  <Send className="size-4" />
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  try {
                                    await duplicateCampaign.mutateAsync(
                                      campaign._id,
                                    );
                                    showToast("Campaign duplicated");
                                  } catch (err: any) {
                                    showToast(err.message, "error");
                                  }
                                }}
                                className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200"
                                title="Duplicate"
                              >
                                <Copy className="size-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(campaign)}
                                className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                                title="Edit"
                              >
                                <Edit className="size-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(campaign._id)}
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                title="Delete"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
              <p className="text-sm text-slate-600 font-medium">
                Showing {(pagination.page - 1) * 10 + 1}-
                {Math.min(pagination.page * 10, pagination.total)} of{" "}
                {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 bg-white border-2 border-slate-200 rounded-xl disabled:opacity-50 hover:bg-slate-100"
                >
                  <ChevronLeft className="size-4" />
                </button>
                {Array.from(
                  { length: Math.min(pagination.pages, 5) },
                  (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={`size-9 rounded-xl text-sm font-bold ${page === i + 1 ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white" : "bg-white border-2 border-slate-200"}`}
                    >
                      {i + 1}
                    </button>
                  ),
                )}
                <button
                  onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                  disabled={page === pagination.pages}
                  className="p-2 bg-white border-2 border-slate-200 rounded-xl disabled:opacity-50 hover:bg-slate-100"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Campaign Form Modal */}
      {showFormModal && (
        <CampaignFormModal
          editData={editingCampaign}
          onClose={() => {
            setShowFormModal(false);
            setEditingCampaign(null);
          }}
          onSaved={() =>
            showToast(editingCampaign ? "Campaign updated" : "Campaign created")
          }
        />
      )}
    </AdminLayout>
  );
}
