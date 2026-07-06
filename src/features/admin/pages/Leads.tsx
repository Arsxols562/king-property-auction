import { useState, useEffect } from "react";
import {
  Mail,
  Phone,
  Search,
  Eye,
  X,
  MessageCircle,
  UserCheck,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Download,
  Send,
  Trash2,
  MapPin,
  Calendar,
  MessageSquare,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { showSuccess, showError } from "@/lib/toast";

export default function Leads() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [noteText, setNoteText] = useState("");
  const [page, setPage] = useState(1);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replySubject, setReplySubject] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyResult, setReplyResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (selectedLead) {
      setShowReplyBox(false);
      setReplyMessage("");
      setReplySubject(
        "Re: " +
          (selectedLead.subject || "Your Enquiry at King Property Auction"),
      );
      setReplyResult(null);
    }
  }, [selectedLead?._id]);

  // Fetch leads
  const { data: leadsData, isLoading } = useQuery({
    queryKey: ["leads", filter, search, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("type", filter);
      if (search) params.set("search", search);
      params.set("page", String(page));
      const result = await apiClient.fetch(`/leads?${params}`);
      return result;
    },
  });

  const leads = leadsData?.data || [];
  const pagination = leadsData?.pagination || {};

  // Stats
  const { data: stats } = useQuery({
    queryKey: ["leads", "stats"],
    queryFn: async () => {
      const result = await apiClient.fetch("/leads/stats");
      if (!result.success) return null;
      return result.data;
    },
  });

  // Fetch lead detail
  const fetchLeadDetail = async (id: string) => {
    const result = await apiClient.fetch(`/leads/${id}`);
    if (result.success) setSelectedLead(result.data);
  };

  // Update status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiClient.fetch(`/leads/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      if (selectedLead) fetchLeadDetail(selectedLead._id);
    },
  });

  // Add note
  const addNote = useMutation({
    mutationFn: async () => {
      await apiClient.fetch(`/leads/${selectedLead._id}/notes`, {
        method: "POST",
        body: JSON.stringify({ text: noteText }),
      });
    },
    onSuccess: () => {
      setNoteText("");
      fetchLeadDetail(selectedLead._id);
    },
  });

  // Delete lead
  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.fetch(`/leads/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setSelectedLead(null);
      setShowReplyBox(false);
      setReplyMessage("");
      setReplySubject("");
      setReplyResult(null);
    },
  });

  const sendReply = async () => {
    if (!replyMessage.trim() || !selectedLead) return;
    setIsSendingReply(true);
    setReplyResult(null);
    try {
      const result = await apiClient.fetch(`/leads/${selectedLead._id}/reply`, {
        method: "POST",
        body: JSON.stringify({
          subject: replySubject,
          message: replyMessage,
        }),
      });
      if (result.success) {
        showSuccess("Reply sent! ✅", "Customer has been notified.");
        setReplyResult({
          success: true,
          message: "Email sent successfully to " + selectedLead.email,
        });
        setReplyMessage("");
        setShowReplyBox(false);
        fetchLeadDetail(selectedLead._id);
      } else {
        showError(
          "Failed to send reply",
          result.message || "Failed to send email",
        );
        setReplyResult({
          success: false,
          message: result.message || "Failed to send email",
        });
      }
    } catch (e: any) {
      showError("Failed to send reply", e.message);
      setReplyResult({ success: false, message: e.message });
    }
    setIsSendingReply(false);
  };

  const typeColors: Record<string, string> = {
    contact: "bg-blue-100 text-blue-700",
    valuation: "bg-green-100 text-green-700",
    finance: "bg-purple-100 text-purple-700",
    catalogue: "bg-orange-100 text-orange-700",
    referral: "bg-pink-100 text-pink-700",
    general: "bg-slate-100 text-slate-700",
    faq: "bg-cyan-100 text-cyan-700",
    legal: "bg-indigo-100 text-indigo-700",
    newsletter: "bg-teal-100 text-teal-700",
    chat: "bg-violet-100 text-violet-700",
    alert: "bg-yellow-100 text-yellow-700",
    solicitor: "bg-rose-100 text-rose-700",
    "home-report": "bg-emerald-100 text-emerald-700",
    buying: "bg-sky-100 text-sky-700",
    selling: "bg-fuchsia-100 text-fuchsia-700",
    property_inquiry: "bg-blue-100 text-blue-700",
    property_offer: "bg-purple-100 text-purple-700",
  };

  const typeLabels: Record<string, string> = {
    contact: "Contact",
    valuation: "Valuation",
    finance: "Finance",
    catalogue: "Catalogue",
    referral: "Referral",
    general: "General",
    faq: "FAQ Support",
    legal: "Legal Enquiry",
    newsletter: "Newsletter",
    chat: "Chat",
    alert: "Register Alert",
    solicitor: "Solicitor",
    "home-report": "Home Report",
    buying: "Buying Enquiry",
    selling: "Selling Enquiry",
    property_inquiry: "Property Enquiry",
    property_offer: "Property Offer",
  };

  const statusColors: Record<string, string> = {
    new: "bg-red-100 text-red-700",
    contacted: "bg-yellow-100 text-yellow-700",
    qualified: "bg-blue-100 text-blue-700",
    converted: "bg-green-100 text-green-700",
    closed: "bg-slate-100 text-slate-500",
  };

  const statsCards = [
    {
      label: "Total Leads",
      value: stats?.total || 0,
      color: "from-blue-500 to-indigo-600",
      icon: Users,
    },
    {
      label: "New",
      value: stats?.newLeads || 0,
      color: "from-red-500 to-rose-600",
      icon: Clock,
    },
    {
      label: "Contacted",
      value: stats?.contacted || 0,
      color: "from-yellow-500 to-amber-600",
      icon: MessageCircle,
    },
    {
      label: "Qualified",
      value: stats?.qualified || 0,
      color: "from-blue-500 to-cyan-600",
      icon: UserCheck,
    },
    {
      label: "Converted",
      value: stats?.converted || 0,
      color: "from-green-500 to-emerald-600",
      icon: CheckCircle,
    },
    {
      label: "Closed",
      value: stats?.closed || 0,
      color: "from-slate-500 to-gray-600",
      icon: X,
    },
  ];

  const exportCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Type",
      "Status",
      "Message",
      "Date",
    ];
    const rows = leads.map((l: any) => [
      l.name,
      l.email,
      l.phone || "",
      l.leadType,
      l.status,
      (l.message || "").replace(/,/g, " ").substring(0, 100),
      new Date(l.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <AdminLayout activeTab="leads" onTabChange={() => {}}>
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1 sm:mb-2">
              Leads Management
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              CRM-style lead tracking and management
            </p>
          </div>
          <button
            onClick={exportCSV}
            className="px-5 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:shadow-xl transition-all flex items-center gap-2 w-fit"
          >
            <Download className="size-4" /> Export CSV
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {statsCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border-2 border-white/60 shadow-lg"
              >
                <div
                  className={`size-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-2`}
                >
                  <Icon className="size-4 text-white" />
                </div>
                <p className="text-xs font-medium text-slate-500">
                  {stat.label}
                </p>
                <p className="text-xl font-black text-slate-900">
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
            <input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold"
          >
            <option value="all">All Types</option>
            <option value="contact">Contact</option>
            <option value="valuation">Valuation</option>
            <option value="catalogue">Catalogue</option>
            <option value="general">General</option>
            <option value="chat">Chat</option>
            <option value="alert">Register Alert</option>
            <option value="solicitor">Solicitor</option>
            <option value="referral">Referral</option>
            <option value="buying">Buying Enquiry</option>
            <option value="finance">Finance</option>
            <option value="home-report">Home Report</option>
            <option value="selling">Selling Enquiry</option>
            <option value="legal">Legal Enquiry</option>
            <option value="faq">FAQ Support</option>
            <option value="newsletter">Newsletter</option>
            <option value="property_inquiry">Property Enquiry</option>
            <option value="property_offer">Property Offer</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border-2 border-white/60 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600">
                <tr>
                  {["Name", "Email", "Phone", "Type", "Status", "Date", ""].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-6 py-4 text-left text-xs font-black text-white uppercase"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-12 text-slate-500"
                    >
                      Loading leads...
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-12 text-slate-500"
                    >
                      No leads found.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead: any) => (
                    <tr
                      key={lead._id}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => fetchLeadDetail(lead._id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                            {lead.name?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">
                              {lead.name}
                            </p>
                            {lead.property && (
                              <p className="text-xs text-slate-500">
                                {lead.property.propertyTitle}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm flex items-center gap-1 text-slate-600">
                        <Mail className="size-3" />
                        {lead.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {lead.phone || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${typeColors[lead.leadType] || "bg-slate-100 text-slate-700"}`}
                        >
                          {typeLabels[lead.leadType] || lead.leadType}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={lead.status}
                          onChange={(e) =>
                            updateStatus.mutate({
                              id: lead._id,
                              status: e.target.value,
                            })
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer border-0 ${statusColors[lead.status] || "bg-slate-100"}`}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="qualified">Qualified</option>
                          <option value="converted">Converted</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2">
                          <button
                            title="View Lead"
                            onClick={() => fetchLeadDetail(lead._id)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                          >
                            <Eye className="size-4" />
                          </button>
                          <button
                            title="Delete Lead"
                            onClick={() => {
                              if (confirm("Delete this lead?"))
                                deleteLead.mutate(lead._id);
                            }}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
              <p className="text-sm text-slate-600">
                Page {pagination.page} of {pagination.pages} ({pagination.total}{" "}
                leads)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border rounded-lg text-sm font-bold disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(pagination.pages, p + 1))
                  }
                  disabled={page === pagination.pages}
                  className="px-4 py-2 bg-white border rounded-lg text-sm font-bold disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Lead Detail Modal */}
        {selectedLead && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setSelectedLead(null);
              setShowReplyBox(false);
              setReplyMessage("");
              setReplySubject("");
              setReplyResult(null);
            }}
          >
            <div
              className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 sm:p-6 text-white rounded-t-2xl sm:rounded-t-3xl sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="size-12 sm:size-14 rounded-2xl bg-white/20 flex items-center justify-center text-xl sm:text-2xl font-black flex-shrink-0">
                      {selectedLead.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-2xl font-black">
                        {selectedLead.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${typeColors[selectedLead.leadType] || "bg-slate-100 text-slate-700"}`}
                        >
                          {typeLabels[selectedLead.leadType] ||
                            selectedLead.leadType}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColors[selectedLead.status]}`}
                        >
                          {selectedLead.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    title="Close"
                    onClick={() => {
                      setSelectedLead(null);
                      setShowReplyBox(false);
                      setReplyMessage("");
                      setReplySubject("");
                      setReplyResult(null);
                    }}
                    className="size-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl hover:bg-blue-100 transition-all"
                  >
                    <Mail className="size-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="font-bold text-sm text-blue-700">
                        {selectedLead.email}
                      </p>
                    </div>
                  </a>
                  {selectedLead.phone && (
                    <a
                      href={`tel:${selectedLead.phone}`}
                      className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl hover:bg-green-100 transition-all"
                    >
                      <Phone className="size-5 text-green-600" />
                      <div>
                        <p className="text-xs text-slate-500">Phone</p>
                        <p className="font-bold text-sm text-green-700">
                          {selectedLead.phone}
                        </p>
                      </div>
                    </a>
                  )}
                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-2xl">
                    <Calendar className="size-5 text-purple-600" />
                    <div>
                      <p className="text-xs text-slate-500">Received</p>
                      <p className="font-bold text-sm text-purple-700">
                        {new Date(selectedLead.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="bg-slate-50 rounded-2xl p-5">
                  {selectedLead.subject && (
                    <div className="flex items-start gap-2 mb-4 pb-4 border-b border-slate-200">
                      <MessageSquare className="size-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                          Subject
                        </p>
                        <p className="font-bold text-slate-800 text-sm">
                          {selectedLead.subject}
                        </p>
                      </div>
                    </div>
                  )}
                  <h4 className="font-black text-slate-900 mb-3">📝 Message</h4>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selectedLead.message || "No message provided."}
                  </p>
                </div>

                {/* Status Update */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-700">
                      Status:
                    </span>
                    <select
                      value={selectedLead.status}
                      onChange={(e) =>
                        updateStatus.mutate({
                          id: selectedLead._id,
                          status: e.target.value,
                        })
                      }
                      className={`px-3 py-2 rounded-xl text-sm font-bold cursor-pointer ${statusColors[selectedLead.status]}`}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="converted">Converted</option>
                      <option value="closed">Closed</option>
                    </select>
                    <button
                      onClick={() => {
                        setShowReplyBox(!showReplyBox);
                        setReplyResult(null);
                      }}
                      className="ml-auto px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:shadow-lg transition-all"
                    >
                      <Send className="size-4" />
                      {showReplyBox ? "Cancel Reply" : "Reply via Email"}
                    </button>
                  </div>

                  {replyResult && (
                    <div
                      className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
                        replyResult.success
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {replyResult.success ? (
                        <CheckCircle className="size-4 flex-shrink-0" />
                      ) : (
                        <X className="size-4 flex-shrink-0" />
                      )}
                      {replyResult.message}
                    </div>
                  )}

                  {showReplyBox && (
                    <div className="border-2 border-blue-200 rounded-2xl overflow-hidden bg-blue-50/30">
                      <div className="p-4 border-b border-blue-100 bg-white">
                        <div className="flex items-center gap-2 mb-3">
                          <Mail className="size-4 text-blue-600" />
                          <span className="text-sm font-black text-slate-900">
                            Email Reply
                          </span>
                          <span className="text-xs text-slate-400">
                            → {selectedLead.email}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={replySubject}
                          onChange={(e) => setReplySubject(e.target.value)}
                          placeholder="Subject..."
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="p-4">
                        <textarea
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder={`Type your reply to ${selectedLead.name}...`}
                          rows={5}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 resize-none"
                        />
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-xs text-slate-400">
                            Email will be sent from your configured SMTP server
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setShowReplyBox(false);
                                setReplyMessage("");
                                setReplyResult(null);
                              }}
                              className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={sendReply}
                              disabled={!replyMessage.trim() || isSendingReply}
                              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSendingReply ? (
                                <>
                                  <div className="size-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Send className="size-4" />
                                  Send Email
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <h4 className="font-black text-slate-900 mb-3">
                    📝 Internal Notes
                  </h4>
                  <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                    {selectedLead.notes?.length > 0 ? (
                      selectedLead.notes.map((note: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 bg-amber-50 rounded-xl border border-amber-200"
                        >
                          <p className="text-sm text-slate-700">{note.text}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(note.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No notes yet.</p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add a note..."
                      className="flex-1 px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                    />
                    <button
                      onClick={() => addNote.mutate()}
                      disabled={!noteText.trim()}
                      className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-sm disabled:opacity-50"
                    >
                      Add Note
                    </button>
                  </div>
                </div>

                {/* Delete */}
                <div className="pt-4 border-t border-slate-200">
                  <button
                    onClick={() => {
                      if (confirm("Permanently delete this lead?"))
                        deleteLead.mutate(selectedLead._id);
                    }}
                    className="px-5 py-2.5 bg-red-100 text-red-700 rounded-xl font-bold text-sm hover:bg-red-200 flex items-center gap-2"
                  >
                    <Trash2 className="size-4" /> Delete Lead
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
