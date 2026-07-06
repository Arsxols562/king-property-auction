import { useState } from "react";
import {
  FileText,
  BarChart3,
  X,
  Calendar,
  PoundSterling,
  Gavel,
  Users,
  Building2,
  CreditCard,
  TrendingUp,
  Send,
  Download,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import RevenueChart from "../components/analytics/RevenueChart";
import PropertyDistributionChart from "../components/analytics/PropertyDistributionChart";
import BiddingActivityChart from "../components/analytics/BiddingActivityChart";
import UserGrowthChart from "../components/analytics/UserGrowthChart";
import KpiCards from "../components/analytics/KpiCards";
import { useTheme } from "../../../app/hooks/useTheme";
import { apiClient } from "@/lib/apiClient";
import LeadsChart from "../components/analytics/LeadsChart";
import CampaignPerformanceChart from "../components/analytics/CampaignPerformanceChart";

export default function Analytics() {
  const theme = useTheme();
  const [showGenerateReportModal, setShowGenerateReportModal] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  };

  return (
    <AdminLayout activeTab="analytics" onTabChange={() => {}}>
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-green-500 text-white px-6 py-4 rounded-2xl shadow-2xl font-bold animate-in slide-in-from-right">
          {toastMsg}
        </div>
      )}

      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1 sm:mb-2">
              Analytics & Reports
            </h2>
            <p className="text-slate-600 font-medium">
              Performance metrics and business insights
            </p>
          </div>
          <button
            onClick={() => setShowGenerateReportModal(true)}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 w-fit"
          >
            <FileText className="size-4" />
            Generate Report
          </button>
        </div>

        {/* KPI Cards */}
        <div className="mb-6">
          <KpiCards />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <RevenueChart />
          <PropertyDistributionChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <BiddingActivityChart />
          <LeadsChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
          <UserGrowthChart />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <CampaignPerformanceChart />
        </div>
      </div>

      {/* Generate Report Modal */}
      {showGenerateReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border-2 border-white/60">
            {/* Modal Header */}
                        <div className={`sticky top-0 bg-gradient-to-r ${theme.primary} px-4 sm:px-8 py-4 sm:py-6 rounded-t-2xl sm:rounded-t-3xl border-b-2 border-white/20`}>
              <div className="flex items-center justify-between">
                <div><h2 className="text-xl sm:text-3xl font-black text-white mb-1 sm:mb-2">Generate Report</h2><p className="text-sm text-white/90 font-medium">Create custom analytics and performance reports</p></div>
                <button
                  onClick={() => setShowGenerateReportModal(false)}
                  className="size-10 rounded-xl bg-white/20 backdrop-blur-md hover:bg-white/30 flex items-center justify-center transition-all border border-white/30 hover:scale-110"
                >
                  <X className="size-5 text-white" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form className="p-8 space-y-6" id="report-form">
              {/* Report Type */}
              <div className="space-y-4">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <BarChart3 className="size-6 text-green-600" />
                  Report Type
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    {
                      value: "property",
                      label: "Property Listings",
                      icon: Building2,
                    },
                    {
                      value: "auction",
                      label: "Auction Performance",
                      icon: Gavel,
                    },
                    { value: "user", label: "User Activity", icon: Users },
                    {
                      value: "leads",
                      label: "Lead Analytics",
                      icon: TrendingUp,
                    },
                    {
                      value: "campaigns",
                      label: "Campaign Performance",
                      icon: Send,
                    },
                    {
                      value: "financial",
                      label: "Financial Summary",
                      icon: CreditCard,
                    },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors border-2 border-transparent hover:border-green-300"
                    >
                      <input
                        type="radio"
                        name="reportType"
                        value={opt.value}
                        className="size-5 accent-green-600"
                        defaultChecked={opt.value === "property"}
                      />
                      <opt.icon className="size-5 text-green-600" />
                      <span className="text-sm font-bold text-slate-700">
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-4">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Calendar className="size-6 text-blue-600" />
                  Date Range
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-6 border-t-2 border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGenerateReportModal(false)}
                  className="flex-1 px-4 py-4 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const f = document.querySelector(
                      "#report-form",
                    ) as HTMLFormElement;
                    if (!f) return;
                    const fd = new FormData(f);
                    const type = fd.get("reportType") as string;
                    const startDate = fd.get("startDate") as string;
                    const endDate = fd.get("endDate") as string;

                    if (!type) {
                      showToast("Please select a report type");
                      return;
                    }
                    setShowGenerateReportModal(false);

                    try {
                      const params = new URLSearchParams();
                      params.set("type", type);
                      if (startDate) params.set("startDate", startDate);
                      if (endDate) params.set("endDate", endDate);
                      const result = await apiClient.fetch(
                        `/analytics/export?${params}`,
                      );
                      if (!result.success || !result.data) {
                        showToast("No data available");
                        return;
                      }

                      const filename = `${type}-report-${new Date().toISOString().slice(0, 10)}`;
                      let headers: string[] = [],
                        rows: any[][] = [];
                      if (result.data.data?.length > 0) {
                        headers = Object.keys(result.data.data[0]);
                        rows = result.data.data.map((r: any) =>
                          headers.map((h) =>
                            String(r[h] ?? "—").substring(0, 100),
                          ),
                        );
                      } else if (type === "financial") {
                        headers = ["Metric", "Value"];
                        const rev = result.data.revenue || {};
                        const kpi = result.data.kpi || {};
                        rows = [
                          [
                            "Total Revenue",
                            `£${(rev.reduce((s: number, m: any) => s + (m.revenue || 0), 0) || 0).toLocaleString()}`,
                          ],
                          [
                            "Avg Property Value",
                            `£${(kpi.avgPropertyValue || 0).toLocaleString()}`,
                          ],
                          ["Sell-through Rate", `${kpi.sellThroughRate || 0}%`],
                          [
                            "Avg Time to Sale",
                            `${kpi.avgTimeToSale || 0} days`,
                          ],
                          [
                            "Active Bidders This Month",
                            kpi.activeBiddersThisMonth || 0,
                          ],
                          ["Revenue Change", `${kpi.revenueChange || 0}%`],
                          ["Avg Bids Per Auction", kpi.avgBidsPerAuction || 0],
                        ];
                      } else {
                        showToast("No records found");
                        return;
                      }

                      let csv = headers.join(",") + "\n";
                      rows.forEach((r: any[]) => {
                        csv +=
                          r
                            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                            .join(",") + "\n";
                      });
                      const blob = new Blob([csv], {
                        type: "text/csv;charset=utf-8;",
                      });
                      const a = document.createElement("a");
                      a.href = URL.createObjectURL(blob);
                      a.download = `${filename}.csv`;
                      a.click();
                      showToast(`✅ CSV Downloaded! ${rows.length} records`);
                    } catch (err: any) {
                      showToast("Error: " + err.message);
                    }
                  }}
                  className="flex-1 px-4 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <FileText className="size-4" /> CSV
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const f = document.querySelector(
                      "#report-form",
                    ) as HTMLFormElement;
                    if (!f) return;
                    const fd = new FormData(f);
                    const type = fd.get("reportType") as string;
                    const startDate = fd.get("startDate") as string;
                    const endDate = fd.get("endDate") as string;

                    if (!type) {
                      showToast("Please select a report type");
                      return;
                    }
                    setShowGenerateReportModal(false);

                    try {
                      const params = new URLSearchParams();
                      params.set("type", type);
                      if (startDate) params.set("startDate", startDate);
                      if (endDate) params.set("endDate", endDate);
                      const result = await apiClient.fetch(
                        `/analytics/export?${params}`,
                      );
                      if (!result.success || !result.data) {
                        showToast("No data available");
                        return;
                      }

                      const filename = `${type}-report-${new Date().toISOString().slice(0, 10)}`;
                      let headers: string[] = [],
                        rows: any[][] = [];
                      if (result.data.data?.length > 0) {
                        headers = Object.keys(result.data.data[0]);
                        rows = result.data.data.map((r: any) =>
                          headers.map((h) =>
                            String(r[h] ?? "—").substring(0, 100),
                          ),
                        );
                      } else if (type === "financial") {
                        headers = ["Metric", "Value"];
                        const rev = result.data.revenue || {};
                        const kpi = result.data.kpi || {};
                        rows = [
                          [
                            "Total Revenue",
                            `£${(rev.reduce((s: number, m: any) => s + (m.revenue || 0), 0) || 0).toLocaleString()}`,
                          ],
                          [
                            "Avg Property Value",
                            `£${(kpi.avgPropertyValue || 0).toLocaleString()}`,
                          ],
                          ["Sell-through Rate", `${kpi.sellThroughRate || 0}%`],
                          [
                            "Avg Time to Sale",
                            `${kpi.avgTimeToSale || 0} days`,
                          ],
                          [
                            "Active Bidders This Month",
                            kpi.activeBiddersThisMonth || 0,
                          ],
                          ["Revenue Change", `${kpi.revenueChange || 0}%`],
                          ["Avg Bids Per Auction", kpi.avgBidsPerAuction || 0],
                        ];
                      } else {
                        showToast("No records found");
                        return;
                      }

                      const { jsPDF } = await import("jspdf");
                      const { default: autoTable } =
                        await import("jspdf-autotable");
                      const doc = new jsPDF();
                      doc.setFontSize(16);
                      doc.text(`${result.data.type || type} Report`, 14, 20);
                      doc.setFontSize(10);
                      doc.text(
                        `Generated: ${new Date().toLocaleString()}`,
                        14,
                        28,
                      );
                      if (startDate)
                        doc.text(
                          `Period: ${startDate} — ${endDate || "Today"}`,
                          14,
                          34,
                        );
                      autoTable(doc, {
                        head: [headers],
                        body: rows,
                        startY: startDate ? 42 : 34,
                        styles: { fontSize: 8, cellPadding: 3 },
                        headStyles: { fillColor: [37, 99, 235] },
                        margin: { horizontal: 10 },
                      });
                      doc.save(`${filename}.pdf`);
                      showToast(`✅ PDF Downloaded! ${rows.length} records`);
                    } catch (err: any) {
                      showToast("Error: " + err.message);
                    }
                  }}
                  className="flex-1 px-4 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="size-4" /> PDF
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
