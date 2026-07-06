import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuthStore } from "@/stores/authStore";
import {
  Save,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Loader2,
  Building2,
  MapPin,
  Home,
  PoundSterling,
  Gavel,
  Star,
  Scale,
  UserCheck,
  Camera,
  FileText,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { usePropertyApi } from "@/features/property/api/usePropertyApi";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { showSuccess, showError } from "@/lib/toast";

import StepBasic from "../components/edit-property/StepBasic";
import StepLocation from "../components/edit-property/StepLocation";
import StepSpecifications from "../components/edit-property/StepSpecifications";
import StepPricing from "../components/edit-property/StepPricing";
import StepAuction from "../components/edit-property/StepAuction";
import StepFeatures from "../components/edit-property/StepFeatures";
import StepLegal from "../components/edit-property/StepLegal";
import StepSeller from "../components/edit-property/StepSeller";
import StepMedia from "../components/edit-property/StepMedia";

const STEPS = [
  { number: 1, title: "Basic", icon: Building2 },
  { number: 2, title: "Location", icon: MapPin },
  { number: 3, title: "Specs", icon: Home },
  { number: 4, title: "Pricing", icon: PoundSterling },
  { number: 5, title: "Auction", icon: Gavel },
  { number: 6, title: "Features", icon: Star },
  { number: 7, title: "Legal", icon: Scale },
  { number: 8, title: "Terms", icon: FileText },
  { number: 9, title: "Owner", icon: UserCheck },
  { number: 10, title: "Media", icon: Camera },
];

export default function EditProperty() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const { useGetPropertyById, useUploadPropertyImages } = usePropertyApi();
  const { data: property, isLoading } = useGetPropertyById(id || "");
  const { mutateAsync: uploadImages } = useUploadPropertyImages();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [floorPlanFiles, setFloorPlanFiles] = useState<File[]>([]);
  const [existingVideos, setExistingVideos] = useState<string[]>([]);
  const [existingFloorPlans, setExistingFloorPlans] = useState<string[]>([]);
  const [existingLegalDocs, setExistingLegalDocs] = useState<string[]>([]);
  const [legalDocFiles, setLegalDocFiles] = useState<File[]>([]);

  const [defaultTerms, setDefaultTerms] = useState<any>({});

  const [uploadProgress, setUploadProgress] = useState({
    step: "",
    percent: 0,
  });
  const [uploadStatus, setUploadStatus] = useState("");

  const defaultForm = {
    propertyTitle: "",
    propertyDescription: "",
    propertyType: "house",
    propertyCategory: "residential",
    listingType: "auction",
    propertyStatus: "available",
    approvalStatus: "pending",
    country: "",
    state: "",
    city: "",
    area: "",
    streetAddress: "",
    postalCode: "",
    bedrooms: "",
    bathrooms: "",
    floors: "",
    yearBuilt: "",
    parkingSpaces: "",
    furnishedStatus: "unfurnished",
    currency: "GBP",
    startingAuctionPrice: "",
    reservePrice: "",
    buyNowPrice: "",
    minimumBidIncrement: "",
    estimatedMarketValue: "",
    auctionStatus: "upcoming",
    bidDepositAmount: "",
    autoBidEnabled: false,
    maximumBidLimit: "",
    features: {},
    ownershipType: "",
    titleDeedNumber: "",
    solicitorDetails: {},
    newPrivateDocs: [],
    agentName: "",
    agentContact: "",
    specialTerms: "",
    buyersFeePercent: "",
    buyersFeeMin: "",
    depositPercent: "",
    depositMin: "",
    vatPercent: "",
    additionalFees: "",
    existingImages: [],
    existingPrivateDocs: [],
  };

  useEffect(() => {
    apiClient
      .fetch("/settings/general")
      .then((res) => {
        if (res.success) setDefaultTerms(res.data || {});
      })
      .catch(() => {});
  }, []);

  const [form, setForm] = useState<any>(defaultForm);

  useEffect(() => {
    if (property) {
      console.log("Property legalInfo:", property?.legalInfo);
      console.log("Private docs:", property?.legalInfo?.privateDocuments);
      setForm({
        propertyTitle: property.propertyTitle || "",
        propertyDescription: property.propertyDescription || "",
        propertyType: property.propertyType || "house",
        propertyCategory: property.propertyCategory || "residential",
        listingType: property.listingType || "auction",
        propertyStatus: property.propertyStatus || "available",
        approvalStatus: property.approvalStatus || "pending",
        country: property.location?.country || "United Kingdom",
        state: property.location?.state || "",
        city: property.location?.city || "",
        area: property.location?.area || "",
        streetAddress: property.location?.streetAddress || "",
        postalCode: property.location?.postalCode || "",
        bedrooms: property.specifications?.bedrooms || "",
        bathrooms: property.specifications?.bathrooms || "",
        floors: property.specifications?.floors || "",
        yearBuilt: property.specifications?.yearBuilt || "",
        parkingSpaces: property.specifications?.parkingSpaces || "",
        furnishedStatus:
          property.specifications?.furnishedStatus || "unfurnished",
        currency: property.pricing?.currency || "GBP",
        startingAuctionPrice: property.pricing?.startingAuctionPrice || "",
        reservePrice: property.pricing?.reservePrice || "",
        buyNowPrice: property.pricing?.buyNowPrice || "",
        minimumBidIncrement: property.pricing?.minimumBidIncrement || "",
        estimatedMarketValue: property.pricing?.estimatedMarketValue || "",
        auctionStatus: property.auctionDetails?.auctionStatus || "upcoming",
        bidDepositAmount: property.auctionDetails?.bidDepositAmount || "",
        autoBidEnabled: property.auctionDetails?.autoBidEnabled || false,
        maximumBidLimit: property.auctionDetails?.maximumBidLimit || "",
        features: property.features || {},
        ownershipType: property.legalInfo?.ownershipType || "",
        titleDeedNumber: property.legalInfo?.titleDeedNumber || "",
        solicitorDetails: property.legalInfo?.solicitorDetails || {},
        specialTerms: property.legalInfo?.specialTerms || "",
        buyersFeePercent: property.termsOfSale?.buyersFeePercent || "",
        buyersFeeMin: property.termsOfSale?.buyersFeeMin || "",
        depositPercent: property.termsOfSale?.depositPercent || "",
        depositMin: property.termsOfSale?.depositMin || "",
        vatPercent: property.termsOfSale?.vatPercent || "",
        additionalFees: property.termsOfSale?.additionalFees || "",
        newPrivateDocs: [],
        agentName: property.sellerInfo?.agentName || "",
        agentContact: property.sellerInfo?.agentContact || "",
        existingImages: property.media?.propertyImages || [],
        existingPrivateDocs: property.legalInfo?.privateDocuments || [],
      });
      setExistingVideos(
        property.media?.propertyVideos ||
          (property.media?.propertyVideo ? [property.media.propertyVideo] : []),
      );
      setExistingFloorPlans(
        property.media?.floorPlans ||
          (property.media?.floorPlan ? [property.media.floorPlan] : []),
      );
      const docs = property.media?.legalDocuments;
      setExistingLegalDocs(docs ? (Array.isArray(docs) ? docs : [docs]) : []);
    }
  }, [property]);

  const updateField = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewImages((prev) => [...prev, ...files]);
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () =>
          setImagePreviews((prev) => [...prev, reader.result as string]);
        reader.readAsDataURL(file);
      });
    }
  };

  const removeExistingImage = (index: number) => {
    const updated = [...(form.existingImages || [])];
    updated.splice(index, 1);
    updateField("existingImages", updated);
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingLegalDoc = (index: number) => {
    setExistingLegalDocs((prev) => prev.filter((_, i) => i !== index));
  };
  const removeNewLegalDoc = (index: number) => {
    setLegalDocFiles((prev) => prev.filter((_, i) => i !== index));
  };
  const handleLegalDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files)
      setLegalDocFiles((prev) => [...prev, ...Array.from(e.target.files)]);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setUploadProgress({ step: "", percent: 0 });
    setUploadStatus("");
    const token = localStorage.getItem("token") || "";

    try {
      let uploadedUrls: string[] = [];
      if (newImages.length > 0) {
        setUploading(true);
        setUploadStatus("Uploading images...");
        setUploadProgress({ step: "images", percent: 0 });
        const uploadResult = await uploadImages(newImages);
        if (uploadResult?.success && uploadResult.data) {
          uploadedUrls = uploadResult.data.map((f: any) => f.fileUrl);
        }
        setUploadProgress({ step: "images", percent: 100 });
        setUploading(false);
      }
      const allImages = [...(form.existingImages || []), ...uploadedUrls];

      let videoUrls: string[] = [...existingVideos];
      if (videoFiles.length > 0) {
        setUploadStatus("Uploading videos...");
        setUploadProgress({ step: "video", percent: 0 });
        for (const vid of videoFiles) {
          try {
            const vfd = new FormData();
            vfd.append("propertyVideos", vid);
            const vd = await fetch("/api/upload/video", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: vfd,
            });
            const vdData = await vd.json();
            if (vdData?.success && vdData.data) {
              const urls = Array.isArray(vdData.data)
                ? vdData.data.map((f: any) => f.fileUrl)
                : [vdData.data.fileUrl];
              videoUrls = [...videoUrls, ...urls];
            }
          } catch (e) {
            console.error("Video upload failed:", e);
          }
        }
        setUploadProgress({ step: "video", percent: 100 });
      }

      let floorPlanUrls: string[] = [...existingFloorPlans];
      if (floorPlanFiles.length > 0) {
        setUploadStatus("Uploading floor plans...");
        setUploadProgress({ step: "floorplans", percent: 0 });
        for (const fp of floorPlanFiles) {
          try {
            const ffd = new FormData();
            ffd.append("floorPlans", fp);
            const fpRes = await fetch("/api/upload/floorplan", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: ffd,
            });
            const fdData = await fpRes.json();
            if (fdData?.success && fdData.data) {
              const urls = Array.isArray(fdData.data)
                ? fdData.data.map((f: any) => f.fileUrl)
                : [fdData.data.fileUrl];
              floorPlanUrls = [...floorPlanUrls, ...urls];
            }
          } catch (e) {
            console.error("Floor plan upload failed:", e);
          }
        }
        setUploadProgress({ step: "floorplans", percent: 100 });
      }

      // Upload legal documents
      let legalDocUrls: string[] = [...existingLegalDocs];
      if (legalDocFiles.length > 0) {
        setUploadStatus("Uploading documents...");
        setUploadProgress({ step: "documents", percent: 0 });
        const lfd = new FormData();
        legalDocFiles.forEach((doc) => lfd.append("legalDocuments", doc));
        try {
          const lr = await fetch("/api/upload/documents", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: lfd,
          });
          const ld = await lr.json();
          if (ld.success)
            legalDocUrls = [
              ...legalDocUrls,
              ...(ld.data?.map((d: any) => d.fileUrl) || []),
            ];
        } catch {}
        setUploadProgress({ step: "documents", percent: 100 });
      }

      // Upload private documents (newPrivateDocs)
      let privateDocUrls: any[] = [...(form.existingPrivateDocs || [])];
      if (form.newPrivateDocs?.length > 0) {
        for (let i = 0; i < form.newPrivateDocs.length; i++) {
          const doc = form.newPrivateDocs[i];
          if (!doc.file) continue;
          try {
            setUploadStatus(
              `Uploading document ${i + 1} of ${form.newPrivateDocs.length}...`,
            );
            const pfd = new FormData();
            pfd.append("privateDocuments", doc.file);
            pfd.append("docType", doc.docType || "other");
            if (doc.customLabel) pfd.append("customLabel", doc.customLabel);
            const pr = await fetch("/api/upload/private-documents", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: pfd,
            });
            const prData = await pr.json();
            if (prData?.success)
              privateDocUrls = [...privateDocUrls, ...prData.data];
          } catch (e) {
            console.error("Private doc upload failed:", e);
          }
        }
      }

      setUploadStatus("Saving property...");
      setUploadProgress({ step: "saving", percent: 90 });

      const body: any = {
        propertyTitle: form.propertyTitle,
        propertyDescription: form.propertyDescription,
        propertyType: form.propertyType,
        propertyCategory: form.propertyCategory,
        listingType: form.listingType,
        propertyStatus: form.propertyStatus,
        approvalStatus: form.approvalStatus,
        location: {
          country: form.country,
          state: form.state,
          city: form.city,
          area: form.area,
          streetAddress: form.streetAddress,
          postalCode: form.postalCode,
        },
        specifications: {
          bedrooms: Number(form.bedrooms) || 0,
          bathrooms: Number(form.bathrooms) || 0,
          floors: Number(form.floors) || undefined,
          yearBuilt: Number(form.yearBuilt) || undefined,
          parkingSpaces: Number(form.parkingSpaces) || undefined,
          furnishedStatus: form.furnishedStatus || "unfurnished",
        },
        pricing: {
          currency: form.currency || "GBP",
          startingAuctionPrice: Number(form.startingAuctionPrice) || 0,
          reservePrice: Number(form.reservePrice) || 0,
          buyNowPrice: Number(form.buyNowPrice) || undefined,
          minimumBidIncrement: Number(form.minimumBidIncrement) || 0,
          estimatedMarketValue: Number(form.estimatedMarketValue) || undefined,
        },
        auctionDetails: {
          auctionStatus: form.auctionStatus || "upcoming",
          bidDepositAmount: Number(form.bidDepositAmount) || undefined,
          autoBidEnabled: form.autoBidEnabled || false,
          maximumBidLimit: Number(form.maximumBidLimit) || undefined,
        },
        features: form.features || {},
        legalInfo: {
          ownershipType: form.ownershipType || "",
          titleDeedNumber: form.titleDeedNumber || "",
          solicitorDetails: form.solicitorDetails || {},
          privateDocuments: privateDocUrls,
          specialTerms: form.specialTerms,
        },
        termsOfSale: {
          text: form.specialTerms || "",
          buyersFeePercent: form.buyersFeePercent
            ? Number(form.buyersFeePercent)
            : undefined,
          buyersFeeMin: form.buyersFeeMin
            ? Number(form.buyersFeeMin)
            : undefined,
          depositPercent: form.depositPercent
            ? Number(form.depositPercent)
            : undefined,
          depositMin: form.depositMin ? Number(form.depositMin) : undefined,
          vatPercent: form.vatPercent ? Number(form.vatPercent) : undefined,
          additionalFees: form.additionalFees ? Number(form.additionalFees) : undefined,
        },
        sellerInfo: {
          agentName: form.agentName || "",
          agentContact: form.agentContact || "",
        },
        media: {
          propertyImages: allImages,
          propertyVideos: videoUrls,
          floorPlans: floorPlanUrls,
          legalDocuments: legalDocUrls,
        },
      };
      const result = await apiClient.fetch(`/properties/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      if (result.success) {
        setVideoFiles([]);
        setFloorPlanFiles([]);
        setLegalDocFiles([]);
        setNewImages([]);
        setImagePreviews([]);
        setExistingVideos(videoUrls);
        setExistingFloorPlans(floorPlanUrls);
        setExistingLegalDocs(legalDocUrls);
        updateField("existingImages", allImages);
        updateField("newPrivateDocs", []);
        updateField("existingPrivateDocs", privateDocUrls);
        queryClient.invalidateQueries({ queryKey: ["properties"] });
        setSaved(true);
        showSuccess("Property saved!", "All changes have been saved.");
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(result.message || "Save failed");
        showError("Save failed", result.message || "Please try again.");
        setTimeout(() => setError(""), 5000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving");
      showError(
        "Save failed",
        err instanceof Error ? err.message : "Error saving",
      );
      setTimeout(() => setError(""), 5000);
    } finally {
      setSaving(false);
      setUploadStatus("");
      setUploadProgress({ step: "", percent: 0 });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout activeTab="properties" onTabChange={() => {}}>
        <div className="flex items-center justify-center h-96">
          <div className="size-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeTab="properties" onTabChange={() => {}}>
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/properties")}
              className="p-2 hover:bg-white/80 rounded-xl"
            >
              <ArrowLeft className="size-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                Edit Property
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                {form.propertyTitle}
              </p>
            </div>
          </div>
          {saved && (
            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-bold">
              ✅ All Changes Saved!
            </span>
          )}
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border-2 border-white/60 mb-4">
          <div className="flex items-center gap-1 flex-wrap overflow-x-auto pb-2">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isActive = step === s.number;
              const isDone = step > s.number;
              return (
                <button
                  key={s.number}
                  onClick={() => setStep(s.number)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${isActive ? "bg-blue-600 text-white shadow-lg" : isDone ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                >
                  {isDone ? (
                    <CheckCircle className="size-3.5" />
                  ) : (
                    <Icon className="size-3.5" />
                  )}
                  {s.title}
                </button>
              );
            })}
          </div>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
            {error}
          </div>
        )}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border-2 border-white/60 shadow-xl">
          {step === 1 && <StepBasic form={form} updateField={updateField} />}
          {step === 2 && <StepLocation form={form} updateField={updateField} />}
          {step === 3 && (
            <StepSpecifications form={form} updateField={updateField} />
          )}
          {step === 4 && <StepPricing form={form} updateField={updateField} />}
          {step === 5 && <StepAuction form={form} updateField={updateField} />}
          {step === 6 && <StepFeatures form={form} updateField={updateField} />}
          {step === 7 && (
            <StepLegal
              form={form}
              updateField={updateField}
              propertyId={id}
              createdBy={property?.createdBy}
            />
          )}
          {step === 8 && user?.role === "admin" && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border-2 border-white/60">
              <h2 className="text-2xl font-black text-slate-900 mb-4">
                Special Terms of Sale
              </h2>
              <p className="text-slate-500 text-sm mb-4">
                Only admin can edit. Leave blank if no special conditions.
              </p>
              <textarea
                value={form.specialTerms || ""}
                onChange={(e) => updateField("specialTerms", e.target.value)}
                rows={8}
                placeholder="10% Deposit (Minimum £3,000)&#10;Buyers Fee = 3% of Sale Price (Minimum £3,250 + vat)&#10;4 Weeks Completion&#10;Contribution to Sellers Costs £2,750"
                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Buyer's Fee (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={form.buyersFeePercent || ""}
                    onChange={(e) =>
                      updateField("buyersFeePercent", e.target.value)
                    }
                    placeholder={`Default: ${defaultTerms.invoiceBuyersFeePercent || 3}`}
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm"
                  />
                  <p className="text-xs text-slate-400 mt-1">% of sale price</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Min Buyer's Fee (£)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.buyersFeeMin || ""}
                    onChange={(e) =>
                      updateField("buyersFeeMin", e.target.value)
                    }
                    placeholder={`Default: ${(defaultTerms.invoiceBuyersFeeMin || 3250).toLocaleString()}`}
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
                    value={form.depositPercent || ""}
                    onChange={(e) =>
                      updateField("depositPercent", e.target.value)
                    }
                    placeholder={`Default: ${defaultTerms.invoiceDepositPercent || 10}`}
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm"
                  />
                  <p className="text-xs text-slate-400 mt-1">% of sale price</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Min Deposit (£)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.depositMin || ""}
                    onChange={(e) => updateField("depositMin", e.target.value)}
                    placeholder={`Default: ${(defaultTerms.invoiceDepositMin || 3000).toLocaleString()}`}
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
                    value={form.vatPercent || ""}
                    onChange={(e) => updateField("vatPercent", e.target.value)}
                    placeholder={`Default: ${defaultTerms.invoiceVatPercent || 20}`}
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
                    value={form.additionalFees || ""}
                    onChange={(e) =>
                      updateField("additionalFees", e.target.value)
                    }
                    placeholder={`Default: ${defaultTerms.invoiceAdditionalFees || 0}`}
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3">
                Leave empty to use platform defaults from Admin Settings
              </p>
            </div>
          )}
          {step === 9 && <StepSeller form={form} updateField={updateField} />}
          {step === 10 && (
            <StepMedia
              form={form}
              updateField={updateField}
              newImages={newImages}
              imagePreviews={imagePreviews}
              handleImageUpload={handleImageUpload}
              removeExistingImage={removeExistingImage}
              removeNewImage={removeNewImage}
              property={property}
              videoFiles={videoFiles}
              setVideoFiles={setVideoFiles}
              floorPlanFiles={floorPlanFiles}
              setFloorPlanFiles={setFloorPlanFiles}
              existingVideos={existingVideos}
              setExistingVideos={setExistingVideos}
              existingFloorPlans={existingFloorPlans}
              setExistingFloorPlans={setExistingFloorPlans}
              existingLegalDocs={existingLegalDocs}
              removeExistingLegalDoc={removeExistingLegalDoc}
              legalDocFiles={legalDocFiles}
              removeNewLegalDoc={removeNewLegalDoc}
              handleLegalDocUpload={handleLegalDocUpload}
            />
          )}
          <div className="flex items-center justify-between pt-6 mt-6 border-t-2 border-slate-100">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="px-5 py-2.5 bg-slate-200 text-slate-700 rounded-xl font-bold disabled:opacity-50 flex items-center gap-1"
            >
              <ChevronLeft className="size-4" /> Previous
            </button>
            <span className="text-sm font-bold text-slate-500">
              Step {step} of 9
            </span>
            <div className="flex items-center gap-2">
              {(saving || uploading) && (
                <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-xl border border-blue-200">
                  <svg
                    className="animate-spin size-5 text-blue-600"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-bold text-blue-700">
                      {uploadStatus || "Processing..."}
                    </p>
                    {uploadProgress.percent > 0 &&
                      uploadProgress.percent < 100 && (
                        <div className="w-32 h-2 bg-blue-200 rounded-full mt-1">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress.percent}%` }}
                          />
                        </div>
                      )}
                  </div>
                </div>
              )}
              {step < 9 && (
                <button
                  onClick={() => setStep(Math.min(9, step + 1))}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-1"
                >
                  Next <ChevronRight className="size-4" />
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-3 shadow-lg"
              >
                {saving || uploading ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    {uploadStatus || "Saving..."}
                  </>
                ) : (
                  <>
                    <Save className="size-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
