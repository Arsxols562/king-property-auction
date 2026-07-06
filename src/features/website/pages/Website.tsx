import { mediaUrl } from "@/lib/mediaUrl";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { showSuccess, showError } from "@/lib/toast";
import { CheckCircle, AlertCircle, Search, Video, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import PublicLayout from "@/features/shared/layout/PublicLayout";
import { useAuctionSocket } from "@/hooks/useAuctionSocket";
import { usePropertyApi } from "@/features/property/api/usePropertyApi";
import { useAuctionApi } from "@/features/auction/api/useAuctionApi";
import { useBiddingApi } from "@/features/bid/api/useBiddingApi";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { useAuthApi } from "@/features/auth/api/useAuthApi";
import AuthModal from "@/features/shared/components/AuthModal";
import HeroSlider from "../components/HeroSlider";
import PropertyFilters from "../components/PropertyFilters";
import ShareModal from "../components/ShareModal";
import PropertyGrid from "../components/PropertyGrid";
import BidModalWrapper from "../components/BidModalWrapper";
import UniversalSearch from "../components/UniversalSearch";
import { apiClient } from "@/lib/apiClient";

export default function Website() {
  const navigate = useNavigate();
  const { isAuthenticated, user, login } = useAuthStore();
  const authApi = useAuthApi();
  const [activeTab, setActiveTab] = useState("all");
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidSuccess, setBidSuccess] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [videoTourOpen, setVideoTourOpen] = useState(false);
  const [wishlistedProperties, setWishlistedProperties] = useState<string[]>(
    [],
  );
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [propertyToShare, setPropertyToShare] = useState<any>(null);
  const [filters, setFilters] = useState({
    propertyType: "",
    minPrice: "",
    maxPrice: "",
    location: "",
    minBeds: "",
    maxBeds: "",
    minBaths: "",
    searchQuery: "",
  });

  const [showAuthModal, setShowAuthModal] = useState(false);
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

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const [propertyPage, setPropertyPage] = useState(1);
  const [allProperties, setAllProperties] = useState<any[]>([]);

  const { useGetProperties } = usePropertyApi();
  const { data: propertiesData, isLoading: propertiesLoading } =
  useGetProperties({ page: propertyPage, pageSize: 12, excludeSold: "true" });
  const properties = propertiesData?.data || [];
  const totalPropertiesCount = propertiesData?.total || 0;
  const hasMore = allProperties.length < totalPropertiesCount;

  useEffect(() => {
    if (properties.length > 0) {
      setAllProperties((prev) => {
        const existingIds = new Set(prev.map((p: any) => p._id));
        const newOnes = properties.filter((p: any) => !existingIds.has(p._id));
        return [...prev, ...newOnes];
      });
    }
  }, [properties]);

  const handleLoadMore = () => setPropertyPage((prev) => prev + 1);

  const { useGetAuctions } = useAuctionApi();
  const { data: auctionsData } = useGetAuctions({});
  const allAuctions = auctionsData?.data || [];
  const onlineAuctions = allAuctions;
  const liveAuctions = onlineAuctions.filter((a: any) => a.status === "live");

  const { usePlaceBid } = useBiddingApi();
  const placeBidMutation = usePlaceBid();
  const queryClient = useQueryClient();

  useAuctionSocket();

  const totalProperties = properties.length || 0;
  const totalUsers =
    onlineAuctions.reduce(
      (sum: number, a: any) => sum + (a.totalBidders || 0),
      0,
    ) || 0;
  const totalBids =
    onlineAuctions.reduce(
      (sum: number, a: any) => sum + (a.totalBids || 0),
      0,
    ) || 0;
  const liveAuctionCount = liveAuctions.length || 0;
  const totalAuctionValue = liveAuctions.reduce(
    (sum: number, auction: any) => sum + (auction.startingBid || 0),
    0,
  );

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
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
            permissions: result.data.user.permissions,
          });
          setShowAuthModal(false);
          showNotification("Logged in successfully!", "success");
          setAuthFormData({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: "",
          });
        } else {
          setAuthError(result.error || "Login failed");
        }
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
            permissions: result.data.user.permissions,
          });
          setShowAuthModal(false);
          showNotification("Account created successfully!", "success");
          setAuthFormData({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: "",
          });
        } else {
          setAuthError(result.error || "Registration failed");
        }
      }
    } catch (err: any) {
      setAuthError(err.message || "Something went wrong");
    } finally {
      setAuthLoading(false);
    }
  };

  // Load wishlist on mount
  useEffect(() => {
    if (isAuthenticated) {
      apiClient
        .fetch("/properties/watchlist")
        .then((res) => {
          if (res.success && res.data) {
            const ids = Array.isArray(res.data)
              ? res.data.map((p: any) => p._id || p)
              : [];
            setWishlistedProperties(ids);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const handlePlaceBid = (property: any) => {
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
    const propertyOwnerId = property?.createdBy?._id || property?.createdBy;
    const currentUserId = user?.id || (user as any)?._id;
    if (
      propertyOwnerId &&
      currentUserId &&
      propertyOwnerId.toString() === currentUserId.toString()
    ) {
      showNotification("You cannot bid on your own property.", "error");
      return;
    }
    setSelectedProperty(property);
    setBidModalOpen(true);
    setBidSuccess(false);
    setBidAmount("");
  };

  const handleSubmitBid = async () => {
    if (!bidAmount || !selectedProperty) return;

    const bidIncrement = selectedProperty.pricing?.minimumBidIncrement || 1000;
    const currentBid =
      selectedProperty.currentBid ||
      selectedProperty.pricing?.startingAuctionPrice ||
      0;
    const nextMinBid = currentBid + bidIncrement;
    const newBidValue = parseFloat(bidAmount);

    if (!isFinite(newBidValue) || newBidValue <= 0) {
      showNotification("Please enter a valid bid amount.", "error");
      return;
    }

    if (newBidValue < nextMinBid) {
      showNotification(
        ` Bid must be at least £${nextMinBid.toLocaleString()}`,
        "error",
      );
      return;
    }

    const matchingAuction = allAuctions.find((auction: any) =>
      auction.properties?.some(
        (p: any) =>
          (typeof p === "string" ? p : p._id) === selectedProperty._id,
      ),
    );

    if (!matchingAuction) {
      showNotification(
        "This property is not currently part of any live auction.",
        "error",
      );
      return;
    }

    try {
      await placeBidMutation.mutateAsync({
        auction: matchingAuction._id,
        property: selectedProperty._id,
        amount: newBidValue,
      });
      setBidSuccess(true);
      showSuccess(
        "Bid placed! 🎉",
        "Your bid has been submitted successfully.",
      );
      showNotification("Bid placed successfully! 🎉", "success");
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
      setTimeout(() => {
        setBidModalOpen(false);
        setBidSuccess(false);
        setBidAmount("");
      }, 2000);
    } catch (error: any) {
      showError("Bid failed", error.message || "Failed to place bid.");
      showNotification(error.message || "Failed to place bid.", "error");
    }
  };

  const handleOpenVideoTour = (property: any) => {
    setSelectedProperty(property);
    setVideoTourOpen(true);
  };

  const roomImages: Record<string, string> = {
    living:
      "https://images.unsplash.com/photo-1600210492493-0946911123ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBsaXZpbmclMjByb29tfGVufDF8fHx8MTc0MDAwMDAwMHww&ixlib=rb-4.1.0&q=80&w=1080",
    kitchen:
      "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBraXRjaGVufGVufDF8fHx8MTc0MDAwMDAwMHww&ixlib=rb-4.1.0&q=80&w=1080",
    bedroom:
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBiZWRyb29tfGVufDF8fHx8MTc0MDAwMDAwMHww&ixlib=rb-4.1.0&q=80&w=1080",
    bathroom:
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBiYXRocm9vbXxlbnwxfHx8fDE3NDAwMDAwMDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    exterior:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3VzZSUyMGV4dGVyaW9yfGVufDF8fHx8MTc0MDAwMDAwMHww&ixlib=rb-4.1.0&q=80&w=1080",
  };

  const handleToggleWishlist = async (
    e: React.MouseEvent,
    propertyId: string,
  ) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    try {
      const result = await apiClient.fetch(
        `/properties/${propertyId}/watchlist`,
        { method: "POST" },
      );
      if (result.success) {
        const isAdding = !wishlistedProperties.includes(propertyId);
        setWishlistedProperties((prev) =>
          prev.includes(propertyId)
            ? prev.filter((id) => id !== propertyId)
            : [...prev, propertyId],
        );
        setNotification({
          message: isAdding ? "Added to wishlist! ❤️" : "Removed from wishlist",
          type: "success",
        });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err) {
      console.error("Wishlist toggle failed:", err);
    }
  };

  const handleShareProperty = (e: React.MouseEvent, property: any) => {
    e.stopPropagation();
    setPropertyToShare(property);
    setShareModalOpen(true);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/properties/${propertyToShare.slug || propertyToShare._id}`;
    navigator.clipboard.writeText(link);
    showNotification("Property link copied!", "success");
  };

  const getPropertyImage = (property: any) => {
    if (property.media?.propertyImages?.length > 0) {
      return mediaUrl(property.media.propertyImages[0]);
    }
    return "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600";
  };

  const getPropertyThumb = (property: any) => {
    if (property.media?.propertyThumbnails?.length > 0) {
      const thumb = property.media.propertyThumbnails[0];

      return thumb.startsWith("/uploads")
        ? thumb
        : `/uploads/properties/${thumb}`;
    }
    return undefined;
  };

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
              className={`px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border-2 flex items-center gap-3 ${
                notification.type === "success"
                  ? "bg-green-500/95 border-green-400 text-white"
                  : "bg-red-500/95 border-red-400 text-white"
              }`}
            >
              {notification.type === "success" ? (
                <CheckCircle className="size-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="size-5 flex-shrink-0" />
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

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 size-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 left-1/4 size-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 right-1/3 size-72 bg-gradient-to-br from-emerald-400/15 to-teal-400/15 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <UniversalSearch />

      <HeroSlider
        totalProperties={totalProperties}
        liveAuctionCount={liveAuctionCount}
        totalAuctionValue={totalAuctionValue}
        totalBids={totalBids}
        totalBidders={totalUsers}
      />

      <PropertyFilters
        filters={filters}
        setFilters={setFilters}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
      />

      <div id="property-grid">
        <PropertyGrid
          properties={allProperties.length > 0 ? allProperties : properties}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          isLoadingMore={propertiesLoading && propertyPage > 1}
          allAuctions={allAuctions}
          filters={filters}
          setFilters={setFilters}
          isLoading={propertiesLoading}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          wishlisted={wishlistedProperties}
          onBid={handlePlaceBid}
          onWishlist={handleToggleWishlist}
          onShare={handleShareProperty}
          onTour={handleOpenVideoTour}
          onNavigate={(path) => navigate(path)}
          onAuctionEnded={() =>
            queryClient.invalidateQueries({ queryKey: ["auctions"] })
          }
        />
      </div>

      <BidModalWrapper
        show={bidModalOpen}
        property={selectedProperty}
        bidAmount={bidAmount}
        bidSuccess={bidSuccess}
        isPending={placeBidMutation.isPending}
        onClose={() => setBidModalOpen(false)}
        onBidChange={setBidAmount}
        onSubmit={handleSubmitBid}
      />

      {/* Video Tour Modal */}
      {videoTourOpen && selectedProperty && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6"
          onClick={() => setVideoTourOpen(false)}
        >
          <div
            className="bg-white rounded-3xl overflow-hidden max-w-4xl w-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-red-600 to-orange-600 p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="size-5 text-white" />
                <h3 className="text-xl font-black text-white">Video Tour</h3>
              </div>
              <button
                onClick={() => setVideoTourOpen(false)}
                className="size-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30"
              >
                <X className="size-5 text-white" />
              </button>
            </div>
            <div className="aspect-video bg-black relative">
              <video
                src={mediaUrl(
                  selectedProperty.media?.propertyVideos?.[0] ||
                    selectedProperty.media?.propertyVideo,
                )}
                controls
                autoPlay
                className="w-full h-full"
              />
              {/* Watermark overlay */}
              <div className="absolute bottom-12 right-4 pointer-events-none select-none z-10">
                <div
                  className="flex flex-col items-end"
                  style={{ opacity: 0.75 }}
                >
                  <span
                    style={{
                      fontFamily: "'Arial Black', Arial, sans-serif",
                      fontWeight: 900,
                      fontSize: "clamp(10px, 1.8vw, 18px)",
                      color: "rgba(255,255,255,0.90)",
                      letterSpacing: "2px",
                      textShadow:
                        "1px 1px 3px rgba(0,0,0,0.8), -1px -1px 3px rgba(0,0,0,0.8), 1px -1px 3px rgba(0,0,0,0.8), -1px 1px 3px rgba(0,0,0,0.8)",
                      lineHeight: 1.2,
                    }}
                  >
                    ♛ KING PROPERTY AUCTION
                  </span>
                  <span
                    style={{
                      fontFamily: "Arial, sans-serif",
                      fontWeight: 700,
                      fontSize: "clamp(8px, 1.2vw, 13px)",
                      color: "rgba(255,215,0,0.90)",
                      letterSpacing: "1px",
                      textShadow:
                        "1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)",
                      lineHeight: 1.2,
                    }}
                  >
                    kingpropertyauction.com
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ShareModal
        show={shareModalOpen}
        property={propertyToShare}
        onClose={() => setShareModalOpen(false)}
        onCopyLink={handleCopyLink}
      />
    </PublicLayout>
  );
}
