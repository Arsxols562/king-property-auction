import { useState, useMemo } from "react";
import {
  X,
  Mail,
  Send,
  Users,
  Calendar,
  Eye,
  PlayCircle,
  Save,
  Copy,
  Heading,
  Type,
  Link,
  Undo,
} from "lucide-react";
import { useCampaignApi, CampaignFormData } from "../../api/useCampaignApi";
import { useTheme } from "../../../../app/hooks/useTheme";
import { useAuthStore } from "@/stores/authStore";

interface CampaignFormModalProps {
  onClose: () => void;
  onSaved: () => void;
  editData?: any;
}

// ─── Marketing Template Presets with Default Content ────────────
const presetDefaults: Record<string, { subject: string; content: string }> = {
  modern: {
    subject: "Latest Properties & Auction Updates",
    content: `<h1 style="color:#1e293b;font-size:24px;font-weight:bold;margin:0 0 12px;">Hello {user_name},</h1>
<p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">We're excited to share our latest property listings and upcoming auction events with you.</p>
<h2 style="color:#2563eb;font-size:18px;font-weight:bold;margin:20px 0 8px;">🔥 Featured Properties</h2>
<p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px;">Browse our selection of premium properties available now at {site_url}.</p>
<div style="text-align:center;margin:24px 0;"><a href="{site_url}" style="background:linear-gradient(135deg,#2563eb,#7c3aed);color:white;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">View All Properties</a></div>
<p style="color:#64748b;font-size:13px;margin:16px 0 0;">Thank you for being part of King Property Auction.</p>`,
  },
  classic: {
    subject: "King Property Auction Newsletter",
    content: `<h1 style="color:#1a1a2e;font-size:22px;font-weight:bold;margin:0 0 12px;">Dear {user_name},</h1>
<p style="color:#333;font-size:14px;line-height:1.8;margin:0 0 16px;">Welcome to the latest edition of our property newsletter. We have some exceptional opportunities this month.</p>
<h2 style="color:#c9a84c;font-size:16px;font-weight:bold;margin:20px 0 8px;">This Month's Highlights</h2>
<p style="color:#333;font-size:14px;line-height:1.8;margin:0 0 16px;">Visit {site_url} to explore our complete catalogue.</p>
<p style="text-align:center;margin:20px 0;"><a href="{site_url}" style="color:#c9a84c;text-decoration:underline;font-weight:bold;">Browse Catalogue →</a></p>
<p style="color:#666;font-size:12px;margin:16px 0 0;">Yours sincerely,<br/>King Property Auction Team</p>`,
  },
  minimal: {
    subject: "Property Updates",
    content: `<h2 style="color:#111827;font-size:20px;font-weight:600;margin:0 0 8px;">Hi {user_name},</h2>
<p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0 0 12px;">New properties have been added to our platform.</p>
<p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0 0 16px;">Check them out at <a href="{site_url}" style="color:#2563eb;">{site_url}</a></p>
<p style="color:#9ca3af;font-size:12px;">— King Property Auction</p>`,
  },
  bold: {
    subject: "🔥 HOT PROPERTIES - Limited Time",
    content: `<h1 style="color:#fff;font-size:28px;font-weight:900;margin:0;text-transform:uppercase;">Don't Miss Out!</h1>
<p style="color:#fca5a5;font-size:16px;margin:12px 0;">Exclusive properties available now at {site_url}</p>
<p style="color:#e5e7eb;font-size:14px;line-height:1.7;margin:0 0 20px;">Limited time offers on premium properties. Act fast before they're gone.</p>
<div style="text-align:center;margin:24px 0;"><a href="{site_url}" style="background:#dc2626;color:white;padding:16px 40px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;text-transform:uppercase;">View Now →</a></div>`,
  },
  elegant: {
    subject: "A Curated Selection of Fine Properties",
    content: `<h1 style="color:#1e3a5f;font-size:20px;font-weight:400;text-align:center;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">Exclusive Offerings</h1>
<p style="color:#4a4a4a;font-size:14px;line-height:2;text-align:center;margin:0 0 16px;">Dear {user_name},<br/>We are pleased to present a curated selection of exceptional properties.</p>
<p style="color:#4a4a4a;font-size:14px;line-height:2;text-align:center;margin:0 0 20px;">Visit <a href="{site_url}" style="color:#2d5a27;">{site_url}</a> for full details.</p>
<p style="color:#8a9bb5;font-size:11px;text-align:center;letter-spacing:1px;">KING PROPERTY AUCTION</p>`,
  },
  custom: {
    subject: "",
    content: "",
  },
};

const presetNames: Record<string, string> = {
  modern: "Modern Professional",
  classic: "Classic Newsletter",
  minimal: "Minimal Clean",
  bold: "Bold Promotional",
  elegant: "Elegant Luxury",
  custom: "Custom HTML",
};

const availableVariables = [
  "user_name",
  "user_email",
  "campaign_name",
  "site_url",
  "property_title",
  "auction_name",
  "auction_date",
  "property_price",
];

// ─── Helper: extract simple fields from HTML ────────────────────
function extractSimpleFields(
  html: string,
): { label: string; value: string; index: number }[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const elements = Array.from(doc.querySelectorAll("h1,h2,h3,h4,p")).filter(
      (el) => el.textContent !== null && el.textContent !== undefined,
    );
    return elements.map((el, i) => ({
      label: el.tagName.toUpperCase(),
      value: el.innerHTML || "",
      index: i,
    }));
  } catch {
    return [];
  }
}

function updateFieldInHtml(
  html: string,
  fieldIndex: number,
  newValue: string,
): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const elements = Array.from(doc.querySelectorAll("h1,h2,h3,h4,p")).filter(
      (el) => el.textContent !== null,
    );
    if (elements[fieldIndex]) {
      elements[fieldIndex].innerHTML = newValue;
      return doc.body.innerHTML;
    }
  } catch {}
  return html;
}

function insertBeforeClose(html: string, newContent: string): string {
  const closeDivIndex = html.lastIndexOf("</div>");
  if (closeDivIndex !== -1) {
    return (
      html.slice(0, closeDivIndex) + newContent + html.slice(closeDivIndex)
    );
  }
  return html + newContent;
}

// ─── Main Component ─────────────────────────────────────────────
export default function CampaignFormModal({
  onClose,
  onSaved,
  editData,
}: CampaignFormModalProps) {
  const theme = useTheme();
  const { user } = useAuthStore();
  const { useCreateCampaign, useUpdateCampaign, useSendTestEmail } =
    useCampaignApi();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const sendTestEmail = useSendTestEmail();
  const { useGetProperties, useGetAuctions } = useCampaignApi();

  const [formData, setFormData] = useState({
    name: editData?.name || "",
    type: editData?.type || "newsletter",
    subject: editData?.subject || presetDefaults.modern.subject,
    content: editData?.content || presetDefaults.modern.content,
    templatePreset: editData?.templatePreset || "modern",
    targetAll: editData?.targetAll ?? true,
    targetRoles: editData?.targetRoles || [],
    scheduledAt: editData?.scheduledAt ? editData.scheduledAt.slice(0, 16) : "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [testEmail, setTestEmail] = useState(user?.email || "");
  const [testSending, setTestSending] = useState(false);

  // Editor modes: simple | html | preview
  const [editorMode, setEditorMode] = useState<"simple" | "html" | "preview">(
    "simple",
  );
  const [focusedFieldIndex, setFocusedFieldIndex] = useState<number | null>(
    null,
  );
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkStyle, setLinkStyle] = useState<"text" | "button">("button");

  const simpleFields = useMemo(
    () => extractSimpleFields(formData.content),
    [formData.content],
  );

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const updateSimpleField = (fieldIndex: number, newValue: string) => {
    const newHtml = updateFieldInHtml(formData.content, fieldIndex, newValue);
    setFormData({ ...formData, content: newHtml });
  };

  const handlePresetChange = (preset: string) => {
    const defaults = presetDefaults[preset];
    setFormData({
      ...formData,
      templatePreset: preset,
      subject: defaults?.subject || formData.subject,
      content: defaults?.content || formData.content,
    });
  };

  const handleReset = () => {
    const defaults = presetDefaults[formData.templatePreset];
    if (defaults) {
      setFormData({
        ...formData,
        subject: defaults.subject,
        content: defaults.content,
      });
      showMessage("Reset to default content");
    }
  };

  const toggleRole = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter((r) => r !== role)
        : [...prev.targetRoles, role],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!formData.name || !formData.subject) {
      setError("Name and subject are required");
      return;
    }
    setLoading(true);
    try {
      const data: CampaignFormData = {
        name: formData.name,
        type: formData.type,
        subject: formData.subject,
        content: formData.content,
        templatePreset: formData.templatePreset,
        targetAll: formData.targetAll,
        targetRoles: formData.targetAll ? [] : formData.targetRoles,
        scheduledAt: formData.scheduledAt || undefined,
        status: formData.scheduledAt ? "scheduled" : "draft",
      };
      if (editData?._id) {
        await updateCampaign.mutateAsync({ id: editData._id, data });
      } else {
        await createCampaign.mutateAsync(data);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail || !editData?._id) return;
    setTestSending(true);
    try {
      await sendTestEmail.mutateAsync({ id: editData._id, email: testEmail });
      showMessage(`Test sent to ${testEmail}`);
    } catch (err: any) {
      showMessage(err.message || "Failed");
    } finally {
      setTestSending(false);
    }
  };

  const roles = [
    { value: "user", label: "All Users" },
    { value: "agent", label: "Agents" },
  ];

  const typeLabels: Record<string, string> = {
    newsletter: "Newsletter",
    property_alert: "Property Alert",
    auction_reminder: "Auction Reminder",
    promotional: "Promotional",
    announcement: "Announcement",
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div
          className={`bg-gradient-to-r ${theme.primary} p-4 sm:p-6 flex items-center justify-between text-white sticky top-0 z-10 rounded-t-2xl sm:rounded-t-3xl`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <Mail className="size-6" />
            <h2 className="text-xl font-black">
              {editData ? "Edit" : "Create"} Campaign
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {editData?._id && (
              <button
                type="button"
                onClick={handleSendTest}
                disabled={testSending}
                className="px-3 py-2 bg-white/20 rounded-xl text-sm font-bold hover:bg-white/30 flex items-center gap-1"
              >
                <PlayCircle className="size-4" />
                {testSending ? "..." : "Test"}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 bg-white/20 rounded-xl hover:bg-white/30"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Test email bar */}
        {editData?._id && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-3">
            <span className="text-sm font-bold text-blue-700">Test:</span>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="px-3 py-1.5 border border-blue-200 rounded-lg text-sm w-64"
            />
            <button
              onClick={handleSendTest}
              disabled={testSending}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
            >
              {testSending ? "..." : "Send Test"}
            </button>
          </div>
        )}

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Row 1: Name, Type, Preset */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Campaign Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(typeLabels).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Design Template
              </label>
              <select
                value={formData.templatePreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(presetNames).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Subject Line *
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Variable Chips */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Available Variables — Click to insert
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                {
                  key: "user_name",
                  label: "User Name",
                  desc: "Recipient's name",
                },
                {
                  key: "user_email",
                  label: "User Email",
                  desc: "Recipient's email",
                },
                {
                  key: "campaign_name",
                  label: "Campaign Name",
                  desc: "This campaign's name",
                },
                { key: "site_url", label: "Site URL", desc: "Website link" },
              ].map((v) => (
                <span
                  key={v.key}
                  onClick={() => {
                    const ins = `{${v.key}}`;
                    if (focusedFieldIndex !== null) {
                      updateSimpleField(
                        focusedFieldIndex,
                        (simpleFields.find((f) => f.index === focusedFieldIndex)
                          ?.value || "") + ins,
                      );
                    } else {
                      setFormData({
                        ...formData,
                        content: formData.content + " " + ins,
                      });
                    }
                    showMessage(`Inserted ${ins}`);
                  }}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-mono cursor-pointer hover:bg-blue-200 select-none"
                  title={v.desc}
                >{`{${v.key}}`}</span>
              ))}
            </div>

            {/* Property & Auction Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <PropertySelector
                onSelect={(title: string) => {
                  if (focusedFieldIndex !== null) {
                    updateSimpleField(
                      focusedFieldIndex,
                      (simpleFields.find((f) => f.index === focusedFieldIndex)
                        ?.value || "") +
                        " " +
                        title,
                    );
                  } else {
                    setFormData({
                      ...formData,
                      content: formData.content + " " + title,
                    });
                  }
                  showMessage(`Inserted: ${title}`);
                }}
              />
              <AuctionSelector
                onSelect={(title: string) => {
                  if (focusedFieldIndex !== null) {
                    updateSimpleField(
                      focusedFieldIndex,
                      (simpleFields.find((f) => f.index === focusedFieldIndex)
                        ?.value || "") +
                        " " +
                        title,
                    );
                  } else {
                    setFormData({
                      ...formData,
                      content: formData.content + " " + title,
                    });
                  }
                  showMessage(`Inserted: ${title}`);
                }}
              />
            </div>
          </div>

          {/* Editor Tabs + Reset */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setEditorMode("simple")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold ${editorMode === "simple" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}
              >
                ✏️ Simple
              </button>
              <button
                onClick={() => setEditorMode("html")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold ${editorMode === "html" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}
              >
                {"</>"} HTML
              </button>
              <button
                onClick={() => setEditorMode("preview")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold ${editorMode === "preview" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}
              >
                👁️ Preview
              </button>
            </div>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 flex items-center gap-1"
            >
              <Undo className="size-3" /> Reset to Default
            </button>
          </div>

          {message && (
            <div className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
              {message}
            </div>
          )}

          {/* Editor Area */}
          <div>
            {editorMode === "preview" ? (
              <div className="bg-slate-100 rounded-xl overflow-hidden">
                <div className="px-3 py-1.5 text-xs text-slate-500 bg-slate-200 text-center font-medium">
                  📧 Email Preview
                </div>
                <iframe
                  srcDoc={formData.content}
                  className="w-full border-0"
                  style={{ minHeight: "400px" }}
                  title="Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            ) : editorMode === "simple" ? (
              <div className="space-y-3">
                {simpleFields.length === 0 && (
                  <p className="text-xs text-slate-400 italic">
                    No editable fields. Use HTML mode.
                  </p>
                )}
                {simpleFields.map((field) => (
                  <div key={field.index}>
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      {field.label}
                    </label>
                    {field.value.length > 80 ? (
                      <textarea
                        value={field.value}
                        onChange={(e) =>
                          updateSimpleField(field.index, e.target.value)
                        }
                        onFocus={() => setFocusedFieldIndex(field.index)}
                        rows={3}
                        className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none font-medium mt-1"
                      />
                    ) : (
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) =>
                          updateSimpleField(field.index, e.target.value)
                        }
                        onFocus={() => setFocusedFieldIndex(field.index)}
                        className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-medium mt-1"
                      />
                    )}
                  </div>
                ))}
                {/* Add Content Buttons */}
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">
                    Add Content
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const newHtml = insertBeforeClose(
                          formData.content,
                          '<h3 style="color:#1e293b;font-size:18px;font-weight:bold;margin:12px 0;">New Heading</h3>',
                        );
                        setFormData({ ...formData, content: newHtml });
                      }}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-100 border border-blue-200 flex items-center gap-1"
                    >
                      <Heading className="size-3" /> + Heading
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newHtml = insertBeforeClose(
                          formData.content,
                          '<p style="color:#374151;font-size:14px;margin:8px 0;">New paragraph text here.</p>',
                        );
                        setFormData({ ...formData, content: newHtml });
                      }}
                      className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-lg hover:bg-green-100 border border-green-200 flex items-center gap-1"
                    >
                      <Type className="size-3" /> + Paragraph
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLinkInput(!showLinkInput)}
                      className="px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-100 flex items-center gap-1"
                    >
                      <Link className="size-3" /> + Link / Button
                    </button>
                  </div>
                  {showLinkInput && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <input
                        type="text"
                        placeholder="Link Text"
                        value={linkText}
                        onChange={(e) => setLinkText(e.target.value)}
                        className="w-full px-3 py-2 bg-white border rounded-lg text-xs"
                      />
                      <input
                        type="url"
                        placeholder="URL"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-white border rounded-lg text-xs"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setLinkStyle("button")}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${linkStyle === "button" ? "bg-purple-600 text-white" : "bg-white border"}`}
                        >
                          🔲 Button
                        </button>
                        <button
                          type="button"
                          onClick={() => setLinkStyle("text")}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${linkStyle === "text" ? "bg-purple-600 text-white" : "bg-white border"}`}
                        >
                          🔗 Text Link
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!linkText || !linkUrl) return;
                          const linkHtml =
                            linkStyle === "button"
                              ? `<div style="text-align:center;margin:16px 0;"><a href="${linkUrl}" style="background:linear-gradient(135deg,#f97316,#d97706);color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;font-size:14px;">${linkText}</a></div>`
                              : `<p style="text-align:center;margin:8px 0;"><a href="${linkUrl}" style="color:#2563eb;text-decoration:underline;font-weight:bold;font-size:14px;">${linkText}</a></p>`;
                          setFormData({
                            ...formData,
                            content: insertBeforeClose(
                              formData.content,
                              linkHtml,
                            ),
                          });
                          setLinkText("");
                          setLinkUrl("");
                          setShowLinkInput(false);
                        }}
                        className="w-full py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold"
                      >
                        Add to Email
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                className="w-full p-4 border-2 border-slate-200 rounded-xl font-mono text-sm focus:outline-none focus:border-blue-500 resize-none"
                style={{ minHeight: "300px" }}
              />
            )}
          </div>

          {/* Targeting */}
          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Users className="size-4" /> Target Audience
            </label>
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.targetAll}
                onChange={(e) =>
                  setFormData({ ...formData, targetAll: e.target.checked })
                }
                className="size-4 rounded accent-blue-600"
              />
              <span className="text-sm font-medium">
                Send to all active users
              </span>
            </label>
            {!formData.targetAll && (
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => toggleRole(role.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${formData.targetRoles.includes(role.value) ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Schedule */}
          <div>
            <label className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
              <Calendar className="size-4" /> Schedule (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) =>
                setFormData({ ...formData, scheduledAt: e.target.value })
              }
              className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t-2 border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              onClick={handleSubmit}
              className={`flex-1 py-3 bg-gradient-to-r ${theme.secondary} text-white rounded-xl font-bold hover:scale-105 transition-all flex items-center justify-center gap-2`}
            >
              <Send className="size-4" />
              {loading
                ? "Saving..."
                : editData
                  ? "Update Campaign"
                  : "Save Campaign"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Property Selector (Dropdown with search) ──────────────────
function PropertySelector({ onSelect }: { onSelect: (title: string) => void }) {
  const { useGetProperties } = useCampaignApi();
  const { data: properties } = useGetProperties();
  const [search, setSearch] = useState("");
  const [show, setShow] = useState(false);

  const filtered = (properties || [])
    .filter(
      (p: any) =>
        !search ||
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        (p.city || "").toLowerCase().includes(search.toLowerCase()),
    )
    .slice(0, 10);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-left hover:border-blue-300 flex items-center justify-between"
      >
        🏠 Insert Property Name
        <span className="text-slate-400">{show ? "▲" : "▼"}</span>
      </button>
      {show && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-slate-200 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search properties..."
            className="w-full px-3 py-2 border-b text-xs focus:outline-none sticky top-0 bg-white"
          />
          {filtered.map((p: any) => (
            <button
              key={p._id}
              type="button"
              onClick={() => {
                const linkHtml = `<a href="{site_url}/properties/${p.slug || p._id}" style="color:#2563eb;font-weight:bold;">${p.title}</a>`;
                onSelect(linkHtml);
                setShow(false);
                setSearch("");
              }}
              className="w-full px-3 py-2 text-xs text-left hover:bg-blue-50 font-medium border-b border-slate-100 last:border-0"
            >
              🏠 {p.title}{" "}
              <span className="text-slate-400">
                • {p.city || "UK"} • £{(p.price || 0).toLocaleString()}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-2 text-xs text-slate-400 italic">
              {search ? "No matches" : "No properties available"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Auction Selector (Dropdown with search) ───────────────────
function AuctionSelector({ onSelect }: { onSelect: (title: string) => void }) {
  const { useGetAuctions } = useCampaignApi();
  const { data: auctions } = useGetAuctions();
  const [search, setSearch] = useState("");
  const [show, setShow] = useState(false);

  const filtered = (auctions || [])
    .filter(
      (a: any) =>
        !search ||
        a.title?.toLowerCase().includes(search.toLowerCase()) ||
        (a.city || "").toLowerCase().includes(search.toLowerCase()),
    )
    .slice(0, 10);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-left hover:border-purple-300 flex items-center justify-between"
      >
        🔨 Insert Auction Name
        <span className="text-slate-400">{show ? "▲" : "▼"}</span>
      </button>
      {show && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-slate-200 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search auctions..."
            className="w-full px-3 py-2 border-b text-xs focus:outline-none sticky top-0 bg-white"
          />
          {filtered.map((a: any) => (
            <button
              key={a._id}
              type="button"
              onClick={() => {
                const linkHtml = `<a href="{site_url}/auctions/${a.slug || a._id}" style="color:#7c3aed;font-weight:bold;">${a.title}</a>`;
                onSelect(linkHtml);
                setShow(false);
                setSearch("");
              }}
              className="w-full px-3 py-2 text-xs text-left hover:bg-purple-50 font-medium border-b border-slate-100 last:border-0"
            >
              🔨 {a.title}{" "}
              <span className="text-slate-400">
                • {a.city || a.type || "UK"} •{" "}
                {a.date ? new Date(a.date).toLocaleDateString() : ""}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-2 text-xs text-slate-400 italic">
              {search ? "No matches" : "No auctions available"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
