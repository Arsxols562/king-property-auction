import { mediaUrl } from "@/lib/mediaUrl";
import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import type { Property, Auction, Bid } from "@/types";
import { useAuctionSocket } from "@/hooks/useAuctionSocket";
import ShareModal from "@/features/website/components/ShareModal";
import OfferFormModal from "@/features/property/components/OfferFormModal";
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  X,
  MapPin,
  MessageSquare,
  Home,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ImageWithFallback } from "@/features/shared/figma/ImageWithFallback";
import PublicLayout from "@/features/shared/layout/PublicLayout";
import { apiClient } from "@/lib/apiClient";
import { showSuccess, showError } from "@/lib/toast";
import { usePropertyApi } from "@/features/property/api/usePropertyApi";
import { useAuctionApi } from "@/features/auction/api/useAuctionApi";
import { useBiddingApi } from "@/features/bid/api/useBiddingApi";
import { useAuthStore } from "@/stores/authStore";
import { useAuthApi } from "@/features/auth/api/useAuthApi";
import { useQueryClient } from "@tanstack/react-query";
import AuthModal from "@/features/shared/components/AuthModal";
import BidModal from "@/features/shared/components/BidModal";
import PropertyImageGallery from "@/features/property/components/PropertyImageGallery";
import PropertyInfo from "@/features/property/components/PropertyInfo";
import PropertyActionCard from "@/features/property/components/PropertyActionCard";

export default function PropertyDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const openOfferFromUrl = searchParams.get("offer") === "true";
  const offerIdFromUrl = searchParams.get("offerId") || "";
  const suggestedPriceFromUrl = searchParams.get("price") || "";
  const [prefillData, setPrefillData] = useState<any>(null);

  useEffect(() => {
    if (openOfferFromUrl) {
      // Fetch existing offer data if offerId provided
      if (offerIdFromUrl) {
        apiClient.fetch(`/offers/${offerIdFromUrl}`).then(res => {
          if (res.success) {
            setPrefillData({
              name: res.data.name || "",
              email: res.data.email || "",
              phone: res.data.phone || "",
              address: res.data.address || "",
              city: res.data.city || "",
              postcode: res.data.postcode || "",
              offerAmount: suggestedPriceFromUrl || res.data.offerAmount?.toString() || "",
              solicitorDetails: res.data.solicitorDetails || "",
            });
          }
        }).catch(() => {});
      }
      setShowOfferModal(true);
    }
  }, [openOfferFromUrl]);
  const { slug } = useParams();
  const queryId = searchParams.get("id");
  const propertyId = queryId || slug || "1";
  const queryClient = useQueryClient();
  const { isAuthenticated, user, login } = useAuthStore();
  const authApi = useAuthApi();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidSuccess, setBidSuccess] = useState(false);
  const [useAutoBid, setUseAutoBid] = useState(false);
  const [maxBidAmount, setMaxBidAmount] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [togglingWatchlist, setTogglingWatchlist] = useState(false);
  const [showBidHistory, setShowBidHistory] = useState(false);
  const [bidHistory, setBidHistory] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleShare = () => setShowShareModal(true);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/properties/${property?.slug || property?._id}`;
    navigator.clipboard.writeText(url);
    showNotification("Property link copied to clipboard!", "success");
  };
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authFormData, setAuthFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    name: (user as any)?.name || "",
    email: (user as any)?.email || "",
    phone: "",
    message: "",
  });
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const showNotification = (msg: string, type: "success" | "error") => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleInquirySubmit = async () => {
    if (!inquiryForm.name || !inquiryForm.email || !inquiryForm.message) {
      showNotification("Please fill all required fields", "error");
      return;
    }
    setInquiryLoading(true);
    try {
      const result = await apiClient.fetch("/leads", {
        method: "POST",
        body: JSON.stringify({
          name: inquiryForm.name,
          email: inquiryForm.email,
          phone: inquiryForm.phone,
          subject: `Property Enquiry: ${property?.propertyTitle}`,
          message: inquiryForm.message,
          leadType: "property_inquiry",
          property: property?._id,
        }),
      });
      if (result.success) {
        setInquirySuccess(true);
        showSuccess("Enquiry sent!", "We'll get back to you shortly.");
        setTimeout(() => {
          setShowInquiryModal(false);
          setInquirySuccess(false);
        }, 3000);
      }
    } catch (e) {
      showNotification("Failed to send enquiry. Please try again.", "error");
      showError("Enquiry failed", "Failed to send enquiry. Please try again.");
    } finally {
      setInquiryLoading(false);
    }
  };

  const { useGetPropertyById } = usePropertyApi();
  const { data: apiProperty, isLoading: loading } =
    useGetPropertyById(propertyId);
  const { useGetAuctions } = useAuctionApi();
  const { data: auctionsData } = useGetAuctions({});
  const allAuctions = (auctionsData?.data || []) as Auction[];
  const { usePlaceBid } = useBiddingApi();
  const placeBidMutation = usePlaceBid();

  const property = (apiProperty || null) as Property | null;

  useEffect(() => {
    if (property && user) {
      const userId = user.id || (user as any)._id;
      const savedBy: string[] = (property as any).savedBy || [];
      setIsFavorite(
        savedBy.some((id: any) => id?.toString() === userId?.toString()),
      );
    }
  }, [property, user]);

  const matchingAuction =
    allAuctions.find((a) =>
      (a.properties as any[])?.some(
        (p) => (typeof p === "string" ? p : p._id) === property?._id,
      ),
    ) || null;

  const isAuctionType = property?.listingType === "auction";
  const isInLiveAuction = matchingAuction !== null;
  const isLiveNow = matchingAuction?.status === "live";
  const isCompleted = matchingAuction?.status === "completed";
  const isDirectSale = property?.listingType === "direct_sale";

  const currentBid =
    property?.currentBid || property?.pricing?.startingAuctionPrice || 0;
  const startingPrice = property?.pricing?.startingAuctionPrice || 0;
  const bidIncrement =
    property?.pricing?.minimumBidIncrement ||
    matchingAuction?.bidIncrement ||
    1000;
  const nextMinBid = currentBid + bidIncrement;
  const buyNowPrice = property?.pricing?.buyNowPrice || 0;

  const images =
    property?.media?.propertyImages?.length > 0
      ? property.media.propertyImages.map((img: string) => mediaUrl(img))
      : ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200"];

  const features =
    property?.features && typeof property.features === "object"
      ? Object.entries(property.features)
          .filter(([, v]) => v)
          .map(([k]) =>
            k
              .replace(/([A-Z])/g, " $1")
              .trim()
              .split(" ")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" "),
          )
      : [];

  const formatPrice = (val: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: property?.pricing?.currency || "GBP",
      maximumFractionDigits: 0,
    }).format(val);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authFormData.email)) {
      setAuthError("Please enter a valid email address");
      return;
    }
    if (authFormData.password.length < 8) {
      setAuthError("Password must be at least 8 characters");
      return;
    }
    if (!isLogin) {
      if (
        authFormData.firstName.trim().length < 2 ||
        authFormData.lastName.trim().length < 2
      ) {
        setAuthError("First and last name must each be at least 2 characters");
        return;
      }
      if (
        authFormData.phone &&
        authFormData.phone.replace(/[\s\-\+\(\)]/g, "").length < 10
      ) {
        setAuthError("Please enter a valid phone number");
        return;
      }
    }
    setAuthLoading(true);
    try {
      if (isLogin) {
        const result = await authApi.login({
          email: authFormData.email,
          password: authFormData.password,
        });
        if (result.success && result.data) {
          login(result.data.token, {
            id: result.data.user.id,
            name: result.data.user.fullName,
            email: result.data.user.email,
            role: result.data.user.role,
          });
          setShowAuthModal(false);
          showSuccess("Welcome back! 👋", "You are now logged in.");
          showNotification("Logged in!", "success");
        } else setAuthError(result.error || "Login failed");
      } else {
        if (authFormData.password !== authFormData.confirmPassword) {
          setAuthError("Passwords do not match");
          setAuthLoading(false);
          return;
        }
        const result = await authApi.register({
          firstName: authFormData.firstName,
          lastName: authFormData.lastName,
          email: authFormData.email,
          password: authFormData.password,
          phoneNumber: authFormData.phone,
          userType: "buyer",
          termsAccepted: true,
        });
        if (result.success && result.data) {
          login(result.data.token, {
            id: result.data.user.id,
            name: result.data.user.fullName,
            email: result.data.user.email,
            role: result.data.user.role,
          });
          setShowAuthModal(false);
          showSuccess("Account created! 🎉", "Please wait for admin approval.");
          showNotification("Account created!", "success");
        } else setAuthError(result.error || "Registration failed");
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePlaceBidClick = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    const userPermissions = (user as any)?.permissions;
    const userCanBid =
      user?.role !== "admin" && userPermissions?.canBid === true;
    if (!userCanBid) {
      showNotification(
        user?.role === "admin"
          ? "Administrators cannot place bids."
          : "You don't have bidding permissions. Apply to become a buyer from your dashboard.",
        "error",
      );
      return;
    }
    const propertyOwnerId =
      typeof property?.createdBy === "object"
        ? (property.createdBy as any)._id ||
          (property.createdBy as any).toString()
        : property?.createdBy;
    const currentUserId = user?.id || (user as any)?._id;
    if (
      propertyOwnerId &&
      currentUserId &&
      propertyOwnerId.toString() === currentUserId.toString()
    ) {
      showNotification("You cannot bid on your own property.", "error");
      return;
    }
    setBidAmount("");
    setBidSuccess(false);
    setShowBidModal(true);
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bidAmount || !property || !matchingAuction) return;
    const amount = parseFloat(bidAmount);
    if (amount < nextMinBid) {
      showNotification(` Bid must be at least ${formatPrice(nextMinBid)}`, "error");
      return;
    }

    // Optimistic update
    const propertyKey = ["properties", propertyId];
    const previousProperty = queryClient.getQueryData(propertyKey);
    queryClient.setQueryData(propertyKey, (old: any) =>
      old ? { ...old, currentBid: amount } : old,
    );

    try {
      await placeBidMutation.mutateAsync({
        auction: matchingAuction._id,
        property: property._id,
        amount,
        isAutoBid: useAutoBid,
        maxBid: useAutoBid ? parseFloat(maxBidAmount) : null,
      });
      setBidSuccess(true);
      showSuccess(
        "Bid placed! 🎉",
        "Your bid has been submitted successfully.",
      );
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
      setBidHistory(null);
      setShowBidHistory(false);
      setTimeout(() => {
        setShowBidModal(false);
        setBidSuccess(false);
        setUseAutoBid(false);
        setMaxBidAmount("");
      }, 2000);
    } catch (err: any) {
      queryClient.setQueryData(propertyKey, previousProperty);
      showError("Bid failed", err.message);
    }
  };

  const loadBidHistory = async () => {
    if (showBidHistory) {
      setShowBidHistory(false);
      return;
    }
    if (bidHistory) {
      setShowBidHistory(true);
      return;
    }
    setLoadingHistory(true);
    try {
      const res = await fetch(
        `/api/bids/auction/${matchingAuction._id}/property/${property._id}`,
      );
      const data = await res.json();
      if (data.success) {
        setBidHistory(data.data);
        setShowBidHistory(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useAuctionSocket({
    propertyId: property?._id?.toString(),
    onBidUpdate: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({
        queryKey: ["properties", property?.slug],
      });
    },
  });

  const nextImage = () =>
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  const prevImage = () =>
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));

  if (loading || !property) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="size-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xl font-bold text-slate-600">
              Loading property...
            </p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // Only show available properties to public
  const isAvailable = property?.propertyStatus === "available";
  const isAdmin = user?.role === "admin";

  if (!isAvailable && !isAdmin) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-6 py-20 text-center">
          <div className="max-w-lg mx-auto bg-white/80 backdrop-blur-xl rounded-3xl p-12 shadow-xl border-2 border-white/60">
            <div className="size-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Home className="size-10 text-slate-400" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3">
              Property Unavailable
            </h2>
            <p className="text-slate-600 font-medium mb-8">
              This property is no longer available for viewing.
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold hover:shadow-lg transition-all"
            >
              Browse Available Properties
            </button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            className="fixed top-6 left-1/2 z-[100] pointer-events-none"
          >
            <div
              className={`px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border-2 flex items-center gap-3 ${notification.type === "success" ? "bg-green-500/95 border-green-400 text-white" : "bg-red-500/95 border-red-400 text-white"}`}
            >
              {notification.type === "success" ? (
                <CheckCircle className="size-5" />
              ) : (
                <AlertCircle className="size-5" />
              )}
              <span className="font-bold text-sm">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal
        show={showAuthModal}
        intent="bid"
        onClose={() => setShowAuthModal(false)}
        isLogin={isLogin}
        onToggleLogin={() => {
          setIsLogin(!isLogin);
          setAuthError("");
        }}
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword(!showPassword)}
        authError={authError}
        authLoading={authLoading}
        formData={authFormData}
        onFormChange={(field, value) =>
          setAuthFormData((prev) => ({ ...prev, [field]: value }))
        }
        onSubmit={handleAuthSubmit}
      />

      <div className="container mx-auto px-6 py-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-xl rounded-xl border-2 border-white/60 shadow-lg hover:shadow-xl transition-all font-bold text-slate-700 hover:text-blue-600"
        >
          <ArrowLeft className="size-5" /> Back to Listings
        </button>
      </div>

      <PropertyImageGallery
        images={images}
        currentIndex={currentImageIndex}
        onPrev={prevImage}
        onNext={nextImage}
        onOpenModal={() => setShowImageModal(true)}
        onSetIndex={setCurrentImageIndex}
        propertyTitle={property.propertyTitle}
        propertyId={
          property?.propertyID || `LOT-${(property?._id || "").slice(-3)}`
        }
      />

      <div className="container mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <PropertyInfo
            property={property}
            matchingAuction={matchingAuction}
            isLiveNow={isLiveNow}
            isCompleted={isCompleted}
            isAuctionType={isAuctionType}
            isInLiveAuction={isInLiveAuction}
            isDirectSale={isDirectSale}
            currentBid={currentBid}
            startingPrice={startingPrice}
            bidIncrement={bidIncrement}
            nextMinBid={nextMinBid}
            buyNowPrice={buyNowPrice}
            features={features}
            isFavorite={isFavorite}
            onShare={handleShare}
            onToggleFavorite={async () => {
              if (!isAuthenticated) {
                setShowAuthModal(true);
                return;
              }
              if (togglingWatchlist || !property?._id) return;
              setTogglingWatchlist(true);
              try {
                const result = await apiClient.fetch(
                  `/properties/${property._id}/watchlist`,
                  { method: "POST" },
                );
                if (result.success) {
                  const saved = result.data?.saved ?? !isFavorite;
                  setIsFavorite(saved);
                  showSuccess(
                    saved ? "Added to watchlist" : "Removed from watchlist",
                  );
                  queryClient.invalidateQueries({ queryKey: ["my-watchlist"] });
                }
              } catch {
                showError("Failed to update watchlist");
              } finally {
                setTogglingWatchlist(false);
              }
            }}
            formatPrice={formatPrice}
            showBidHistory={showBidHistory}
            bidHistory={bidHistory}
            loadingHistory={loadingHistory}
            onToggleBidHistory={loadBidHistory}
          />

          <PropertyActionCard
            isAuthenticated={isAuthenticated}
            property={property}
            user={user}
            matchingAuction={matchingAuction}
            isLiveNow={isLiveNow}
            isCompleted={isCompleted}
            isAuctionType={isAuctionType}
            isInLiveAuction={isInLiveAuction}
            isDirectSale={isDirectSale}
            currentBid={currentBid}
            startingPrice={startingPrice}
            buyNowPrice={buyNowPrice}
            formatPrice={formatPrice}
            onPlaceBid={handlePlaceBidClick}
            onNavigate={navigate}
            onEnquire={() => setShowInquiryModal(true)}
            onOfferNow={() => setShowOfferModal(true)}
            isOwnProperty={
              !!(
                property?.createdBy &&
                (user?.id || (user as any)?._id) &&
                (typeof property.createdBy === "object"
                  ? (property.createdBy as any)._id ||
                    (property.createdBy as any).toString()
                  : property.createdBy) ===
                  (user?.id || (user as any)?._id)?.toString()
              )
            }
          />
        </div>
      </div>

      {/* Inquiry Modal */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            {inquirySuccess ? (
              <div className="text-center py-8">
                <CheckCircle className="size-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  Enquiry Sent!
                </h3>
                <p className="text-slate-600">We'll get back to you shortly.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-slate-900">
                    Property Enquiry
                  </h3>
                  <button onClick={() => setShowInquiryModal(false)}>
                    <X className="size-5 text-slate-400" />
                  </button>
                </div>
                <p className="text-sm text-slate-500 mb-4 font-medium">
                  Enquiring about:{" "}
                  <span className="font-bold text-slate-900">
                    {property?.propertyTitle}
                  </span>
                </p>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Your Name *"
                    value={inquiryForm.name}
                    onChange={(e) =>
                      setInquiryForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="email"
                    placeholder="Email Address *"
                    value={inquiryForm.email}
                    onChange={(e) =>
                      setInquiryForm((f) => ({ ...f, email: e.target.value }))
                    }
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number (optional)"
                    value={inquiryForm.phone}
                    onChange={(e) =>
                      setInquiryForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    placeholder="Your message - What would you like to know? *"
                    value={inquiryForm.message}
                    onChange={(e) =>
                      setInquiryForm((f) => ({ ...f, message: e.target.value }))
                    }
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <button
                  onClick={handleInquirySubmit}
                  disabled={inquiryLoading}
                  className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold hover:scale-105 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {inquiryLoading ? (
                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <MessageSquare className="size-4" />
                  )}
                  Send Enquiry
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bid Modal */}
      <BidModal
        show={showBidModal}
        onClose={() => setShowBidModal(false)}
        property={property}
        currentBid={currentBid}
        nextMinBid={nextMinBid}
        bidIncrement={bidIncrement}
        bidAmount={bidAmount}
        onBidAmountChange={setBidAmount}
        autoBidEnabled={property?.auctionDetails?.autoBidEnabled}
        useAutoBid={useAutoBid}
        onAutoBidToggle={setUseAutoBid}
        maxBidAmount={maxBidAmount}
        onMaxBidChange={setMaxBidAmount}
        bidSuccess={bidSuccess}
        isPending={placeBidMutation.isPending}
        onSubmit={handleSubmitBid}
        formatPrice={formatPrice}
        getPropertyImage={(p) =>
          p?.media?.propertyImages?.[0]
            ? mediaUrl(p.media.propertyImages[0])
            : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600"
        }
      />

      {/* Offer Form Modal */}
      <OfferFormModal
        show={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        property={property}
        user={user || {}}
        prefillData={prefillData}
      />

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6">
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-6 right-6 size-12 bg-white/20 rounded-full flex items-center justify-center"
          >
            <X className="size-6 text-white" />
          </button>
          <div className="max-w-6xl w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {images.map((img: string, idx: number) => (
                <div
                  key={idx}
                  className="relative h-80 rounded-2xl overflow-hidden"
                >
                  <ImageWithFallback
                    src={img}
                    alt={`View ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl overflow-hidden max-w-6xl w-full shadow-2xl relative">
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white">
                    Property Location
                  </h3>
                  <p className="text-white/90">
                    {property.location?.streetAddress},{" "}
                    {property.location?.city}
                  </p>
                </div>
                <button
                  onClick={() => setShowMapModal(false)}
                  className="size-12 bg-white/20 rounded-full flex items-center justify-center"
                >
                  <X className="size-6 text-white" />
                </button>
              </div>
            </div>
            <div className="relative h-[500px] bg-slate-200">
              {property.location?.latitude && property.location?.longitude ? (
                <>
                  <iframe
                    src={`https://maps.google.com/maps?q=${property.location.latitude},${property.location.longitude}&z=17&ie=UTF8&iwloc=B&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Property Location"
                  />
                  <a
                    href={`https://www.google.com/maps/@${property.location.latitude},${property.location.longitude},97m/data=!3m1!1e3?entry=ttu`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-4 right-4 px-4 py-2 bg-white rounded-xl shadow-lg text-sm font-bold text-slate-700 hover:bg-slate-100 transition-all flex items-center gap-2 z-10"
                  >
                    <MapPin className="size-4 text-emerald-600" /> View Larger
                    Map
                  </a>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MapPin className="size-20 text-red-500 mx-auto animate-bounce" />
                    <p className="text-xl font-bold text-slate-700 mt-4">
                      {property.location?.streetAddress}
                    </p>
                    <p className="text-slate-500">
                      {property.location?.city}, {property.location?.area}
                    </p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.location?.streetAddress + " " + property.location?.city)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold"
                    >
                      Open in Google Maps
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <ShareModal
        show={showShareModal}
        property={property}
        onClose={() => setShowShareModal(false)}
        onCopyLink={handleCopyLink}
      />
    </PublicLayout>
  );
}
