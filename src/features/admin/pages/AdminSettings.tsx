import { useState, useEffect, useRef } from "react";
import {
  Save,
  CheckCircle,
  XCircle,
  Mail,
  Bell,
  FileText,
  Shield,
  Zap,
  Brain,
  Settings2,
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import AdminLayout from "../components/AdminLayout";
import EmailConfigTab from "../components/settings/EmailConfigTab";
import NotificationRulesTab from "../components/settings/NotificationRulesTab";
import EmailTemplatesTab from "../components/settings/EmailTemplatesTab";
import OAuthTab from "../components/settings/OAuthTab";
import KnowledgeTab from "../components/settings/KnowledgeTab";
import ApiIntegrationsTab from "../components/settings/ApiIntegrationsTab";

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("email");
  const [testEmail, setTestEmail] = useState("");
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const [testingZoopla, setTestingZoopla] = useState(false);
  const [zooplaTestResult, setZooplaTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [emailForm, setEmailForm] = useState({
    mailer: "smtp",
    host: "",
    port: "465",
    encryption: "SSL",
    username: "",
    password: "",
    sendgridApiKey: "",
    mailgunApiKey: "",
    mailgunDomain: "",
    mailchimpApiKey: "",
    senderName: "King Property Auction",
    senderEmail: "",
    replyTo: "",
  });

  const [oauthForm, setOAuthForm] = useState({
    google: { enabled: false, clientId: "", clientSecret: "", androidClientId: "" },
    github: { enabled: false, clientId: "", clientSecret: "" },
    facebook: { enabled: false, clientId: "", clientSecret: "" },
  });
  const [rules, setRules] = useState<Record<string, boolean>>({});
  const [templates, setTemplates] = useState<Record<string, any>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editHtml, setEditHtml] = useState("");
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateFilter, setTemplateFilter] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [templateMessage, setTemplateMessage] = useState("");
  const [simpleMode, setSimpleMode] = useState(true);
  const [simpleFields, setSimpleFields] = useState<
    { label: string; value: string; index: number }[]
  >([]);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkStyle, setLinkStyle] = useState<"text" | "button">("button");
  const [focusedFieldIndex, setFocusedFieldIndex] = useState<number | null>(
    null,
  );
  const loadedRef = useRef(false);
  const [integrationsForm, setIntegrationsForm] = useState({
    groqApiKey: "",
    geminiApiKey: "",
    googlePlacesApiKey: "",
    openaiApiKey: "",
    activeAiProvider: "groq",
    zooplaEnabled: false,
    zooplaApiKey: "",
    zooplaApiSecret: "",
    zooplaBranchId: "",
    zooplaAgentId: "",
    zooplaTestMode: true,
  });

  const [generalForm, setGeneralForm] = useState({
    defaultCommissionRate: 5,
    paymentDueHours: 48,
    invoiceBuyersFeePercent: 3,
    invoiceBuyersFeeMin: 3250,
    invoiceDepositPercent: 10,
    invoiceDepositMin: 3000,
    invoiceVatPercent: 20,
    invoiceAdditionalFees: 0,
    invoicePrefix: "INV-KPA-",
    defaultTermsOfSale: "",
  });
  const [knowledgeEntries, setKnowledgeEntries] = useState<any[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("custom");
  const [knowledgeSaving, setKnowledgeSaving] = useState(false);
  const [knowledgeMsg, setKnowledgeMsg] = useState("");

  useEffect(() => {
    if (activeTab !== "templates") return;
    apiClient
      .fetch("/notifications/templates")
      .then((r) => {
        if (r.success && r.data) setTemplates(r.data);
      })
      .catch(() => {});
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "knowledge") return;
    apiClient
      .fetch("/knowledge")
      .then((r) => {
        if (r.success && r.data) setKnowledgeEntries(r.data);
      })
      .catch(() => {});
  }, [activeTab]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || loadedRef.current) return;
    loadedRef.current = true;

    const loadData = async () => {
      try {
        const settingsResult = await apiClient.fetch("/settings/email");
        if (settingsResult.success && settingsResult.data) {
          setEmailForm((prev) => ({
            ...prev,
            ...settingsResult.data,
            password: "",
          }));
        }
        const rulesResult = await apiClient.fetch("/settings/rules");
        if (rulesResult.success && rulesResult.data) {
          setRules(rulesResult.data);
        }
        const oauthResult = await apiClient.fetch("/settings/oauth");
        if (oauthResult.success && oauthResult.data) {
          setOAuthForm((prev) => ({ ...prev, ...oauthResult.data }));
        }
        const integrationsResult = await apiClient.fetch(
          "/settings/integrations",
        );
        if (integrationsResult.success && integrationsResult.data) {
          setIntegrationsForm((prev) => ({
            ...prev,
            ...integrationsResult.data,
          }));
        }
        const generalResult = await apiClient.fetch("/settings/general");
        if (generalResult.success && generalResult.data) {
          setGeneralForm((prev) => ({ ...prev, ...generalResult.data }));
        }
      } catch (e) {
        console.error("Failed to load settings:", e);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await apiClient.fetch("/settings/email", {
        method: "PUT",
        body: JSON.stringify(emailForm),
      });
      setSaveMessage(
        result.success
          ? "Settings saved successfully!"
          : "Error: " + result.message,
      );
    } catch (e: any) {
      setSaveMessage("Error: " + e.message);
    }
    setIsSaving(false);
    setTimeout(() => setSaveMessage(""), 4000);
  };

  const handleTest = async () => {
    if (!testEmail) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await apiClient.fetch("/settings/test", {
        method: "POST",
        body: JSON.stringify({ testEmail }),
      });
      setTestResult(result);
    } catch (e: any) {
      setTestResult({ success: false, message: e.message });
    }
    setIsTesting(false);
  };

  const handleGeneralSave = async () => {
    setIsSaving(true);
    try {
      const result = await apiClient.fetch("/settings/general", {
        method: "PUT",
        body: JSON.stringify(generalForm),
      });
      setSaveMessage(
        result.success ? "General settings saved!" : "Error: " + result.message,
      );
    } catch (e: any) {
      setSaveMessage("Error: " + e.message);
    }
    setIsSaving(false);
    setTimeout(() => setSaveMessage(""), 4000);
  };

  const handleIntegrationsSave = async () => {
    setIsSaving(true);
    try {
      const result = await apiClient.fetch("/settings/integrations", {
        method: "PUT",
        body: JSON.stringify(integrationsForm),
      });
      setSaveMessage(
        result.success ? "API integrations saved!" : "Error: " + result.message,
      );
    } catch (e: any) {
      setSaveMessage("Error: " + e.message);
    }
    setIsSaving(false);
    setTimeout(() => setSaveMessage(""), 4000);
  };

  const handleTestZoopla = async () => {
    setTestingZoopla(true);
    setZooplaTestResult(null);
    try {
      const result = await apiClient.fetch("/zoopla/test", { method: "POST" });
      setZooplaTestResult({
        success: result.success,
        message: result.message || "Connection successful",
      });
    } catch (e: any) {
      setZooplaTestResult({ success: false, message: e.message });
    } finally {
      setTestingZoopla(false);
    }
  };

  const handleOAuthSave = async () => {
    setIsSaving(true);
    try {
      const result = await apiClient.fetch("/settings/oauth", {
        method: "PUT",
        body: JSON.stringify(oauthForm),
      });
      setSaveMessage(
        result.success ? "OAuth settings saved!" : "Error: " + result.message,
      );
    } catch (e: any) {
      setSaveMessage("Error: " + e.message);
    }
    setIsSaving(false);
    setTimeout(() => setSaveMessage(""), 4000);
  };

  const handleRuleToggle = async (key: string) => {
    const updated = { ...rules, [key]: !rules[key] };
    setRules(updated);
    try {
      await apiClient.fetch("/settings/rules", {
        method: "PUT",
        body: JSON.stringify(updated),
      });
    } catch (e) {}
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;
    setTemplateSaving(true);
    try {
      const result = await apiClient.fetch(
        `/notifications/templates/${selectedTemplate}`,
        {
          method: "PUT",
          body: JSON.stringify({ subject: editSubject, html: editHtml }),
        },
      );
      if (result.success) {
        setTemplates((prev) => ({
          ...prev,
          [selectedTemplate]: {
            ...prev[selectedTemplate],
            subject: editSubject,
            html: editHtml,
          },
        }));
        setTemplateMessage("Template saved!");
      } else {
        setTemplateMessage("Error: " + result.message);
      }
    } catch (e: any) {
      setTemplateMessage("Error: " + e.message);
    }
    setTemplateSaving(false);
    setTimeout(() => setTemplateMessage(""), 4000);
  };

  const handleResetTemplate = async () => {
    if (!selectedTemplate || !confirm("Reset this template to default?"))
      return;
    try {
      const result = await apiClient.fetch(
        `/notifications/templates/${selectedTemplate}/reset`,
        { method: "POST" },
      );
      console.log("[Reset] API response:", JSON.stringify(result));
      if (result.success && result.data) {
        const newHtml = result.data.html;
        const newSubject = result.data.subject;
        setEditHtml(newHtml);
        setEditSubject(newSubject);
        setSimpleMode(true);
        setSimpleFields(extractSimpleFields(newHtml));
        setShowPreview(false);
        setTemplates((prev) => ({
          ...prev,
          [selectedTemplate]: {
            ...prev[selectedTemplate],
            html: newHtml,
            subject: newSubject,
          },
        }));
        setTemplateMessage("Template reset to default!");
        setTimeout(() => setTemplateMessage(""), 3000);
      }
    } catch (e) {
      setTemplateMessage("Error resetting template");
    }
  };

  const handleSelectEntry = (entry: any) => {
    setSelectedEntry(entry);
    setEditTitle(entry.title);
    setEditContent(entry.content);
    setEditCategory(entry.category || "custom");
    setKnowledgeMsg("");
  };

  const handleSaveEntry = async () => {
    if (!selectedEntry) return;
    setKnowledgeSaving(true);
    try {
      const isNew = selectedEntry._id === "new";
      const payload = {
        title: editTitle,
        content: editContent,
        category: editCategory,
        ...(isNew
          ? {
              key:
                editTitle
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "_")
                  .replace(/(^_|_$)/g, "") +
                "_" +
                Date.now(),
            }
          : {}),
      };
      const result = isNew
        ? await apiClient.fetch("/knowledge", {
            method: "POST",
            body: JSON.stringify(payload),
          })
        : await apiClient.fetch(`/knowledge/${selectedEntry._id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
      if (result.success) {
        if (isNew && result.data) {
          setKnowledgeEntries((prev) => [...prev, result.data]);
          setSelectedEntry(result.data);
        } else {
          setKnowledgeEntries((prev) =>
            prev.map((e) =>
              e._id === selectedEntry._id ? { ...e, ...payload } : e,
            ),
          );
          setSelectedEntry((prev: any) => ({ ...prev, ...payload }));
        }
        setKnowledgeMsg("Saved!");
      } else {
        setKnowledgeMsg("Error: " + result.message);
      }
    } catch (e: any) {
      setKnowledgeMsg("Error: " + e.message);
    }
    setKnowledgeSaving(false);
    setTimeout(() => setKnowledgeMsg(""), 3000);
  };

  const handleKnowledgeToggle = async (entry: any) => {
    try {
      const result = await apiClient.fetch(`/knowledge/${entry._id}/toggle`, {
        method: "PATCH",
      });
      if (result.success) {
        setKnowledgeEntries((prev) =>
          prev.map((e) =>
            e._id === entry._id ? { ...e, isActive: !e.isActive } : e,
          ),
        );
        if (selectedEntry?._id === entry._id) {
          setSelectedEntry((prev: any) => ({
            ...prev,
            isActive: !prev.isActive,
          }));
        }
      }
    } catch (e) {}
  };

  const handleDeleteEntry = async (entry: any) => {
    try {
      const result = await apiClient.fetch(`/knowledge/${entry._id}`, {
        method: "DELETE",
      });
      if (result.success) {
        setKnowledgeEntries((prev) => prev.filter((e) => e._id !== entry._id));
        if (selectedEntry?._id === entry._id) {
          setSelectedEntry(null);
          setEditTitle("");
          setEditContent("");
        }
      }
    } catch (e) {}
  };

  const extractSimpleFields = (html: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const fields: { label: string; value: string; index: number }[] = [];
      let idx = 0;
      doc.querySelectorAll("h1, h2, h3, h4, p").forEach((el) => {
        const text = el.textContent?.trim();
        if (text !== undefined && text !== null) {
          const tag = el.tagName.toLowerCase();
          const isHeading = ["h1", "h2", "h3", "h4"].includes(tag);
          fields.push({
            label: isHeading
              ? `Heading: ${text.substring(0, 30)}`
              : `Text: ${text.substring(0, 30)}...`,
            value: text,
            index: idx++,
          });
        }
      });
      return fields;
    } catch (e) {
      return [];
    }
  };

  const updateSimpleField = (fieldIndex: number, newValue: string) => {
    const updated = simpleFields.map((f) =>
      f.index === fieldIndex ? { ...f, value: newValue } : f,
    );
    setSimpleFields(updated);
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(editHtml, "text/html");
      const elements = Array.from(
        doc.querySelectorAll("h1, h2, h3, h4, p"),
      ).filter((el) => el.textContent !== null && el.textContent !== undefined);
      updated.forEach((field) => {
        if (elements[field.index]) {
          elements[field.index].textContent = field.value || "";
        }
      });
      setEditHtml(doc.body.innerHTML);
    } catch (e) {}
  };

  useEffect(() => {
    if (editHtml) {
      setSimpleFields(extractSimpleFields(editHtml));
    }
  }, [selectedTemplate, editHtml]);

  const insertBeforeClose = (html: string, newContent: string) => {
    // Find the last <a ...> tag (the CTA button) and insert after its closing </div>
    const lastAnchorEnd = html.lastIndexOf("</a>");
    if (lastAnchorEnd !== -1) {
      const insertPoint = html.indexOf("</div>", lastAnchorEnd);
      if (insertPoint !== -1) {
        return (
          html.slice(0, insertPoint) + newContent + html.slice(insertPoint)
        );
      }
    }
    // Fallback: insert before last </div></div>
    const lastIndex = html.lastIndexOf("</div></div>");
    if (lastIndex === -1) return html + newContent;
    return html.slice(0, lastIndex) + newContent + html.slice(lastIndex);
  };

  const tabs = [
    {
      id: "general",
      label: "General",
      icon: Settings2,
      description: "Commission rates, payment due hours, invoice defaults",
    },
    {
      id: "email",
      label: "Email Configuration",
      icon: Mail,
      description: "SMTP settings, test emails, mailer preferences",
    },
    {
      id: "rules",
      label: "Notification Rules",
      icon: Bell,
      description: "Toggle automatic email notifications",
    },
    {
      id: "templates",
      label: "Email Templates",
      icon: FileText,
      description: "Customize email content and design",
    },
    {
      id: "oauth",
      label: "OAuth Providers",
      icon: Shield,
      description: "Google, GitHub, Facebook login",
    },
    {
      id: "knowledge",
      label: "AI Knowledge",
      icon: Brain,
      description: "Manage AI assistant knowledge base",
    },
    {
      id: "integrations",
      label: "API Integrations",
      icon: Zap,
      description: "Groq, Gemini, Google Places, OpenAI keys",
    },
  ];

  const mailerOptions = [
    { value: "smtp", label: "SMTP (Hostinger, cPanel, Custom)" },
    { value: "sendgrid", label: "SendGrid" },
    { value: "mailgun", label: "Mailgun" },
    { value: "mailchimp", label: "Mailchimp Transactional" },
  ];

  const templateLabels: Record<
    string,
    { label: string; icon: string; category: string }
  > = {
    welcome: { label: "Welcome Email", icon: "👋", category: "Auth" },
    accountApproved: {
      label: "Account Approved",
      icon: "✅",
      category: "Auth",
    },
    accountRejected: {
      label: "Account Rejected",
      icon: "❌",
      category: "Auth",
    },
    passwordReset: { label: "Password Reset", icon: "🔑", category: "Auth" },
    bidConfirmation: {
      label: "Bid Confirmation",
      icon: "🔨",
      category: "Bidding",
    },
    outbidAlert: { label: "Outbid Alert", icon: "⚠️", category: "Bidding" },
    auctionWon: { label: "Auction Won", icon: "🎉", category: "Bidding" },
    auctionLost: { label: "Auction Lost", icon: "😢", category: "Bidding" },
    auctionStartingSoon: {
      label: "Auction Starting Soon",
      icon: "⏰",
      category: "Auction",
    },
    auctionStarted: {
      label: "Auction Started (Buyer)",
      icon: "🔴",
      category: "Auction",
    },
    auctionStartedSeller: {
      label: "Auction Started (Seller/Owner)",
      icon: "🎯",
      category: "Auction",
    },
    auctionEnded: { label: "Auction Ended", icon: "🏁", category: "Auction" },
    propertySubmitted: {
      label: "Property Submitted",
      icon: "📋",
      category: "Property",
    },
    propertyApproved: {
      label: "Property Approved",
      icon: "✅",
      category: "Property",
    },
    propertyRejected: {
      label: "Property Rejected",
      icon: "❌",
      category: "Property",
    },
    propertySold: { label: "Property Sold", icon: "🏠", category: "Property" },
    propertyUnsold: {
      label: "Property Unsold",
      icon: "📉",
      category: "Property",
    },
    contactForm: { label: "Contact Form", icon: "📧", category: "Leads" },
    valuationRequest: {
      label: "Valuation Request",
      icon: "💰",
      category: "Leads",
    },
    adminLeadAlert: {
      label: "Admin Lead Alert",
      icon: "📋",
      category: "Leads",
    },
    catalogueRequest: {
      label: "Catalogue Request",
      icon: "📚",
      category: "Leads",
    },
    adminReply: { label: "Admin Reply", icon: "💬", category: "Leads" },
    faqsupport: { label: "FAQ Support", icon: "💬", category: "Leads" },
    legalenquiry: { label: "Legal Enquiry", icon: "⚖️", category: "Leads" },
    newsletterwelcome: {
      label: "Newsletter Welcome",
      icon: "📰",
      category: "Leads",
    },
    paymentDue: {
      label: "Payment Due (Buyer)",
      icon: "💳",
      category: "Payment",
    },
    paymentOverdue: {
      label: "Payment Overdue (Buyer)",
      icon: "⚠️",
      category: "Payment",
    },
    paymentWithdrawn: {
      label: "Payment Withdrawn (Buyer)",
      icon: "❌",
      category: "Payment",
    },
    commissionEarned: {
      label: "Commission Earned (Owner)",
      icon: "💰",
      category: "Commission",
    },
    withdrawalRequested: {
      label: "Withdrawal Requested (Owner)",
      icon: "✅",
      category: "Commission",
    },
    fundsTransferred: {
      label: "Funds Transferred (Owner)",
      icon: "🎉",
      category: "Commission",
    },
    propertyAvailableAgain: {
      label: "Property Available Again (Next Bidders)",
      icon: "🏠",
      category: "Payment",
    },
  };

  const ruleLabels: Record<string, string> = {
    welcome: "Welcome Email",
    accountApproved: "Account Approved",
    accountRejected: "Account Rejected",
    passwordReset: "Password Reset",
    bidConfirmation: "Bid Confirmation",
    outbidAlert: "Outbid Alert",
    auctionWon: "Auction Won",
    auctionLost: "Auction Lost",
    auctionStartingSoon: "Auction Starting Soon",
    auctionStarted: "Auction Started (Buyer)",
    auctionStartedSeller: "Auction Started (Seller/Owner)",
    auctionEnded: "Auction Ended",
    propertySubmitted: "Property Submitted (Admin Alert)",
    propertyApproved: "Property Approved",
    propertyRejected: "Property Rejected",
    propertySold: "Property Sold",
    propertyUnsold: "Property Unsold",
    contactForm: "Contact Form",
    valuationRequest: "Valuation Request",
    catalogueRequest: "Catalogue Request",
    adminReply: "Admin Reply to Lead",
    newSupportTicket: "New Support Ticket (Admin Alert)",
    supportReply: "Support Reply to Customer",
    roleRequestAdmin: "Role Request (Admin Alert)",
    roleRequestApproved: "Role Request Decision (User Email)",
    adminLeadAlert: "Admin Lead Alert",
    registerAlert: "Register for Property Alerts",
    solicitorEnquiry: "Solicitor Enquiry (auto-reply)",
    homeReport: "Home Report Request (auto-reply)",
    referralFee: "Referral Fee Enquiry (auto-reply)",
    buyingEnquiry: "Buying Enquiry (auto-reply)",
    sellingEnquiry: "Selling Enquiry (auto-reply)",
    chatEnquiry: "Chat Enquiry (AI Widget)",
    faqSupport: "FAQ Support (auto-reply)",
    legalEnquiry: "Legal Enquiry (auto-reply)",
    newsletterSignup: "Newsletter Signup (welcome email)",
    propertyInquiry: "Property Enquiry (to owner + buyer confirmation)",
    propertyInquiryReply: "Property Enquiry Reply (to inquirer)",
    propertyInquiryConfirmation: "Property Enquiry Confirmation (to buyer)",
    buyerToOwnerMessage: "Buyer Message to Owner",
    ownerToBuyerReply: "Owner Reply to Buyer",
    adminInquiryCC: "Admin CC - Property Enquiry Messages",
    propertyAddedToAuction: "Property Added to Auction (owner email)",
    offerNotification: "Property Offer Notification (to next bidder)",
    paymentDue: "Payment Due (Buyer)",
    paymentOverdue: "Payment Overdue (Buyer)",
    paymentWithdrawn: "Payment Withdrawn (Buyer)",
    commissionEarned: "Commission Earned (Owner)",
    withdrawalRequested: "Withdrawal Requested (Owner)",
    fundsTransferred: "Funds Transferred (Owner)",
    propertyAvailableAgain: "Property Available Again (Next Bidders)",
  };

  if (isLoading) {
    return (
      <AdminLayout activeTab="settings" onTabChange={() => {}}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="size-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Loading settings...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const activeTabData = tabs.find((t) => t.id === activeTab);

  return (
    <AdminLayout activeTab="settings" onTabChange={() => {}}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-black text-slate-900">Settings</h2>
          <p className="text-slate-600 font-medium mt-1">
            Manage email configuration, notifications, and templates
          </p>
        </div>

        {/* Tab Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative p-5 rounded-2xl text-left transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 scale-[1.02]"
                    : "bg-white/80 backdrop-blur-xl border-2 border-white/60 shadow-lg hover:shadow-xl hover:scale-[1.01]"
                }`}
              >
                <div
                  className={`size-10 rounded-xl flex items-center justify-center mb-3 ${
                    isActive
                      ? "bg-white/20"
                      : "bg-gradient-to-br from-blue-500 to-indigo-600"
                  }`}
                >
                  <Icon
                    className={`size-5 ${isActive ? "text-white" : "text-white"}`}
                  />
                </div>
                <h3
                  className={`font-black text-sm mb-1 ${isActive ? "text-white" : "text-slate-900"}`}
                >
                  {tab.label}
                </h3>
                <p
                  className={`text-xs font-medium ${isActive ? "text-white/70" : "text-slate-500"}`}
                >
                  {tab.description}
                </p>
                {isActive && (
                  <div className="absolute top-4 right-4 size-2 bg-white rounded-full animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Active Tab Content */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-white/60 shadow-xl overflow-hidden">
          {/* Tab Header */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200 px-8 py-5">
            <div className="flex items-center gap-3">
              {activeTabData && (
                <>
                  <div className="size-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <activeTabData.icon className="size-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      {activeTabData.label}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {activeTabData.description}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="p-8">
            {activeTab === "general" && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="font-black text-slate-900 text-lg mb-1">
                    General Settings
                  </h3>
                  <p className="text-sm text-slate-500">
                    Platform-wide defaults for payments and commissions.
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Default Commission Rate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={generalForm.defaultCommissionRate}
                      onChange={(e) =>
                        setGeneralForm((f) => ({
                          ...f,
                          defaultCommissionRate:
                            parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Used when an agent/owner has no individual commission rate
                      set.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Payment Due Hours
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={generalForm.paymentDueHours}
                      onChange={(e) =>
                        setGeneralForm((f) => ({
                          ...f,
                          paymentDueHours: parseInt(e.target.value) || 48,
                        }))
                      }
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Hours after auction end before a payment is considered
                      overdue (default: 48).
                    </p>
                  </div>
                </div>

                {/* Invoice Settings */}
                <div className="border-t border-slate-200 pt-6 mt-6">
                  <h4 className="font-black text-slate-800 text-sm mb-3">
                    Invoice Defaults
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Buyer's Fee (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={generalForm.invoiceBuyersFeePercent}
                        onChange={(e) =>
                          setGeneralForm({
                            ...generalForm,
                            invoiceBuyersFeePercent:
                              parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        % of sale price
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Buyer's Fee Min (£)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={generalForm.invoiceBuyersFeeMin}
                        onChange={(e) =>
                          setGeneralForm({
                            ...generalForm,
                            invoiceBuyersFeeMin: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Deposit (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={generalForm.invoiceDepositPercent}
                        onChange={(e) =>
                          setGeneralForm({
                            ...generalForm,
                            invoiceDepositPercent:
                              parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        % of sale price
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Min Deposit (£)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={generalForm.invoiceDepositMin}
                        onChange={(e) =>
                          setGeneralForm({
                            ...generalForm,
                            invoiceDepositMin: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        VAT (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={generalForm.invoiceVatPercent}
                        onChange={(e) =>
                          setGeneralForm({
                            ...generalForm,
                            invoiceVatPercent: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Invoice Prefix
                      </label>
                      <input
                        type="text"
                        value={generalForm.invoicePrefix}
                        onChange={(e) =>
                          setGeneralForm({
                            ...generalForm,
                            invoicePrefix: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Additional Fees (£)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={generalForm.invoiceAdditionalFees || 0}
                        onChange={(e) =>
                          setGeneralForm({
                            ...generalForm,
                            invoiceAdditionalFees:
                              parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Extra fees added to all invoices
                      </p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Default Terms of Sale Text
                      </label>
                      <textarea
                        value={generalForm.defaultTermsOfSale || ""}
                        onChange={(e) =>
                          setGeneralForm({
                            ...generalForm,
                            defaultTermsOfSale: e.target.value,
                          })
                        }
                        rows={10}
                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm"
                        placeholder="Enter default terms of sale..."
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Used as fallback when property has no custom terms
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleGeneralSave}
                    disabled={isSaving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    Save General Settings
                  </button>
                </div>
              </div>
            )}

            {activeTab === "email" && (
              <EmailConfigTab
                emailForm={emailForm}
                setEmailForm={setEmailForm}
                isSaving={isSaving}
                isTesting={isTesting}
                testEmail={testEmail}
                setTestEmail={setTestEmail}
                onSave={handleSave}
                onTest={handleTest}
                mailerOptions={mailerOptions}
              />
            )}

            {activeTab === "rules" && (
              <NotificationRulesTab
                rules={rules}
                ruleLabels={ruleLabels}
                onRuleToggle={handleRuleToggle}
              />
            )}

            {activeTab === "templates" && (
              <EmailTemplatesTab
                templates={templates}
                templateLabels={templateLabels}
                selectedTemplate={selectedTemplate}
                editSubject={editSubject}
                editHtml={editHtml}
                templateSaving={templateSaving}
                templateFilter={templateFilter}
                showPreview={showPreview}
                templateMessage={templateMessage}
                simpleMode={simpleMode}
                simpleFields={simpleFields}
                showLinkInput={showLinkInput}
                linkText={linkText}
                linkUrl={linkUrl}
                linkStyle={linkStyle}
                focusedFieldIndex={focusedFieldIndex}
                onSelectTemplate={(key, tpl) => {
                  setSelectedTemplate(key);
                  setEditSubject(tpl.subject);
                  setEditHtml(tpl.html);
                  setSimpleMode(true);
                  setSimpleFields(extractSimpleFields(tpl.html));
                  setTemplateMessage("");
                  setShowPreview(false);
                }}
                setEditSubject={setEditSubject}
                setEditHtml={setEditHtml}
                setTemplateFilter={setTemplateFilter}
                setSimpleMode={setSimpleMode}
                setShowPreview={setShowPreview}
                setShowLinkInput={setShowLinkInput}
                setLinkText={setLinkText}
                setLinkUrl={setLinkUrl}
                setLinkStyle={setLinkStyle}
                setFocusedFieldIndex={setFocusedFieldIndex}
                onSave={handleSaveTemplate}
                onReset={handleResetTemplate}
                extractSimpleFields={extractSimpleFields}
                updateSimpleField={updateSimpleField}
                insertBeforeClose={insertBeforeClose}
                setTemplateMessage={setTemplateMessage}
                setSimpleFields={setSimpleFields}
              />
            )}

            {activeTab === "oauth" && (
              <OAuthTab
                oauthForm={oauthForm}
                setOAuthForm={setOAuthForm}
                isSaving={isSaving}
                onSave={handleOAuthSave}
              />
            )}

            {activeTab === "knowledge" && (
              <KnowledgeTab
                knowledgeEntries={knowledgeEntries}
                selectedEntry={selectedEntry}
                editTitle={editTitle}
                editContent={editContent}
                editCategory={editCategory}
                knowledgeSaving={knowledgeSaving}
                knowledgeMsg={knowledgeMsg}
                onSelectEntry={handleSelectEntry}
                onNew={() => {
                  setSelectedEntry({
                    _id: "new",
                    title: "",
                    content: "",
                    category: "custom",
                    isActive: true,
                  });
                  setEditTitle("");
                  setEditContent("");
                  setEditCategory("custom");
                  setKnowledgeMsg("");
                }}
                setEditTitle={setEditTitle}
                setEditContent={setEditContent}
                setEditCategory={setEditCategory}
                onSave={handleSaveEntry}
                onToggle={handleKnowledgeToggle}
                onDelete={handleDeleteEntry}
              />
            )}

            {activeTab === "integrations" && (
              <ApiIntegrationsTab
                integrationsForm={integrationsForm}
                setIntegrationsForm={setIntegrationsForm}
                isSaving={isSaving}
                onSave={handleIntegrationsSave}
                onTestZoopla={handleTestZoopla}
                zooplaTestResult={zooplaTestResult}
                testingZoopla={testingZoopla}
              />
            )}
          </div>
        </div>

        {/* Toast Notifications */}
        {saveMessage && (
          <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right duration-300">
            <div
              className={`px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border-2 flex items-center gap-3 ${
                saveMessage.includes("Error")
                  ? "bg-red-500/95 border-red-400 text-white"
                  : "bg-green-500/95 border-green-400 text-white"
              }`}
            >
              {saveMessage.includes("Error") ? (
                <XCircle className="size-5 flex-shrink-0" />
              ) : (
                <CheckCircle className="size-5 flex-shrink-0" />
              )}
              <span className="font-bold text-sm">{saveMessage}</span>
              <button
                onClick={() => setSaveMessage("")}
                className="ml-2 opacity-70 hover:opacity-100"
              >
                <XCircle className="size-4" />
              </button>
            </div>
          </div>
        )}

        {testResult && (
          <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right duration-300">
            <div
              className={`px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border-2 flex items-center gap-3 ${
                testResult.success
                  ? "bg-green-500/95 border-green-400 text-white"
                  : "bg-red-500/95 border-red-400 text-white"
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="size-5 flex-shrink-0" />
              ) : (
                <XCircle className="size-5 flex-shrink-0" />
              )}
              <div>
                <p className="font-bold text-sm">
                  {testResult.success ? "Test Email Sent!" : "Test Failed"}
                </p>
                <p className="text-xs opacity-90">
                  {testResult.success
                    ? "Check your inbox to verify delivery."
                    : testResult.message}
                </p>
              </div>
              <button
                onClick={() => setTestResult(null)}
                className="ml-2 opacity-70 hover:opacity-100"
              >
                <XCircle className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
