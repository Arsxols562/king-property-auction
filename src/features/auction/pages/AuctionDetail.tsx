import { mediaUrl } from "@/lib/mediaUrl";
import { showSuccess, showError } from "@/lib/toast";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import type { Auction, Property, Bid } from "@/types";
import {
  ArrowLeft,
  Gavel,
  CheckCircle,
  AlertCircle,
  Building2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import PublicLayout from "@/features/shared/layout/PublicLayout";
import { useAuctionApi } from "@/features/auction/api/useAuctionApi";
import { useBiddingApi } from "@/features/bid/api/useBiddingApi";
import { useAuthStore } from "@/stores/authStore";
import { useAuthApi } from "@/features/auth/api/useAuthApi";
import { useQueryClient } from "@tanstack/react-query";
import AuthModal from "@/features/shared/components/AuthModal";
import BidModal from "@/features/shared/components/BidModal";
import { useAuctionSocket } from "@/hooks/useAuctionSocket";
import AuctionHeader from "@/features/auction/components/AuctionHeader";
import AuctionSidebar from "@/features/auction/components/AuctionSidebar";
import LotCard from "@/features/auction/components/LotCard";

// ─── Countdown Timer Component ───
function AuctionCountdown({
  endTime,
  onEnded,
}: {
  endTime: Date;
  onEnded?: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState("");
  const endRef = useRef(endTime);
  endRef.current = endTime;
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const hasTriggered = useRef(false);

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const end = endRef.current.getTime();
      const distance = end - now;
      if (distance <= 0) {
        setTimeLeft("ENDED");
        if (!hasTriggered.current && onEndedRef.current) {
          hasTriggered.current = true;
          onEndedRef.current();
        }
        return;
      }
      const d = Math.floor(distance / (1000 * 60 * 60 * 24));
      const h = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  if (timeLeft === "ENDED") {
    return <span className="font-bold text-slate-500">Auction Completed</span>;
  }

  return (
    <span className="font-bold text-red-600 animate-pulse">
      {timeLeft || "Calculating..."}
    </span>
  );
}

export default function AuctionDetail() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const { isAuthenticated, user, login } = useAuthStore();
  const authApi = useAuthApi();

  // ─── API Hooks ───
  const { useGetAuctions, useGetAuctionById } = useAuctionApi();
  const { usePlaceBid } = useBiddingApi();
  const placeBidMutation = usePlaceBid();

  // First find the auction ID from the slug
  const { data: auctionsData } = useGetAuctions({});
  const auctions = (auctionsData?.data || []) as Auction[];
  const auctionFromList = auctions.find((a) => a.slug === slug);
  const auctionId = auctionFromList?._id;

  // Then fetch the full auction with populated properties by ID
  const { data: auction, isLoading } = useGetAuctionById(auctionId || "") as {
    data: Auction | undefined;
    isLoading: boolean;
  };

  // Auto-refresh when params change or bid is placed
  useEffect(() => {
    if (auctionId) {
      queryClient.invalidateQueries({ queryKey: ["auctions", auctionId] });
    }
  }, [slug, auctionId]);

  // Real-time auction status updates
  useAuctionSocket({
    auctionId: auctionId,
    onAuctionUpdate: (data) => {
      if (data.auctionId === auction?._id) {
        queryClient.invalidateQueries({ queryKey: ["auctions", auctionId] });
        queryClient.invalidateQueries({ queryKey: ["auctions"] });
      }
    },
    onBidUpdate: () => {
      queryClient.invalidateQueries({ queryKey: ["auctions", auctionId] });
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });

  // ─── State ───
  const [selectedLot, setSelectedLot] = useState<Property | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidSuccess, setBidSuccess] = useState(false);
  const [useAutoBid, setUseAutoBid] = useState(false);
  const [maxBidAmount, setMaxBidAmount] = useState("");
  const [expandedLot, setExpandedLot] = useState<string | null>(null);
  const [lotHistories, setLotHistories] = useState<Record<string, any>>({});
  const [loadingHistory, setLoadingHistory] = useState<Record<string, boolean>>(
    {},
  );

  // ─── Auth Modal State ───
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

  // ─── Notification ───
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ─── Derived Data ───
  const propertyDetails =
    auction?.properties
      ?.map((p: any) => {
        // If already populated with full data
        if (typeof p === "object" && p.propertyTitle && p.specifications)
          return p;

        // If it's just an ID, try to find full data from auction list
        const propId = typeof p === "string" ? p : p?._id?.toString();
        if (propId && auctionFromList?.properties) {
          const found = auctionFromList.properties.find((ap: any) => {
            const apId =
              typeof ap === "object" ? ap._id?.toString() : ap?.toString();
            return (
              apId === propId && typeof ap === "object" && ap.propertyTitle
            );
          });
          if (found) return found;
        }

        // If only partial data, return what we have
        if (typeof p === "object" && p.propertyTitle) return p;

        return null;
      })
      .filter(Boolean) || [];

  // ─── Auth Handlers ───
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
          });
          setShowAuthModal(false);
          showNotification("Account created!", "success");
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

  // ─── Bid Handler ───
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
    setSelectedLot(property);
    setBidAmount("");
    setBidSuccess(false);
  };

  const handleSubmitBid = async () => {
    if (!bidAmount || !selectedLot || !auction) return;
    const currentBid =
      selectedLot.currentBid || selectedLot.pricing?.startingAuctionPrice || 0;
    const bidIncrement =
      selectedLot.pricing?.minimumBidIncrement || auction.bidIncrement || 1000;
    const nextMinBid = currentBid + bidIncrement;
    const amount = parseFloat(bidAmount);
    if (amount < nextMinBid) {
      showNotification(
        `Bid must be at least £${nextMinBid.toLocaleString()}`,
        "error",
      );
      return;
    }

    // Optimistic update
    const previousData = queryClient.getQueryData(["auctions", auctionId]);
    queryClient.setQueryData(["auctions", auctionId], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        properties: old.properties?.map((p: any) =>
          p._id === selectedLot._id ? { ...p, currentBid: amount } : p,
        ),
      };
    });

    try {
      await placeBidMutation.mutateAsync({
        auction: auction._id,
        property: selectedLot._id,
        amount,
        isAutoBid: useAutoBid,
        maxBid: useAutoBid ? parseFloat(maxBidAmount) : null,
      });
      setBidSuccess(true);
      showSuccess(
        "Bid placed! 🎉",
        "Your bid has been submitted successfully.",
      );
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      setLotHistories((prev) => ({ ...prev, [selectedLot._id]: null }));
      setExpandedLot(null);
      setTimeout(() => {
        setSelectedLot(null);
        setBidSuccess(false);
        setUseAutoBid(false);
        setMaxBidAmount("");
      }, 2000);
    } catch (err: any) {
      queryClient.setQueryData(["auctions", auctionId], previousData);
      showError("Bid failed", err.message || "Bid failed");
    }
  };

  // ─── Load Bid History for a Lot ───
  const loadBidHistory = async (propertyId: string) => {
    // If already expanded, just close it
    if (expandedLot === propertyId) {
      setExpandedLot(null);
      return;
    }

    // If we already have the history, just show it
    if (lotHistories[propertyId]) {
      setExpandedLot(propertyId);
      return;
    }

    // Fetch fresh data
    setLoadingHistory((prev) => ({ ...prev, [propertyId]: true }));
    try {
      const res = await fetch(
        `/api/bids/auction/${auction._id}/property/${propertyId}`,
      );
      const data = await res.json();
      if (data.success) {
        setLotHistories((prev) => ({ ...prev, [propertyId]: data.data }));
        setExpandedLot(propertyId);
      }
    } catch (err) {
      console.error("Failed to load bid history:", err);
    } finally {
      setLoadingHistory((prev) => ({ ...prev, [propertyId]: false }));
    }
  };

  // ─── Loading State ───
  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-6 py-20 text-center">
          <div className="animate-spin size-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6" />
          <p className="text-xl font-bold text-slate-600">
            Loading auction details...
          </p>
        </div>
      </PublicLayout>
    );
  }

  if (!auction) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-6 py-20 text-center">
          <Gavel className="size-20 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-900 mb-2">
            Auction Not Found
          </h2>
          <p className="text-slate-600 mb-6">
            The auction you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate("/auctions")}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold"
          >
            Browse Auctions
          </button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {/* ─── NOTIFICATION TOAST ─── */}
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
                <CheckCircle className="size-5" />
              ) : (
                <AlertCircle className="size-5" />
              )}
              <span className="font-bold text-sm">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── AUTH MODAL ─── */}
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

      {/* Back Button */}
      <div className="container mx-auto px-6 pt-6">
        <button
          onClick={() => navigate("/auctions")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-all shadow-sm"
        >
          <ArrowLeft className="size-4" /> Back to Auctions
        </button>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ─── LEFT: Auction Header + Lot Cards ─── */}
          <div className="lg:col-span-2 space-y-8">
            <AuctionHeader
              auction={auction}
              propertyCount={propertyDetails.length}
            />

            {/* ─── LOT CARDS (One per Property) ─── */}
            {propertyDetails.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border-2 border-white/60 shadow-xl text-center">
                <Building2 className="size-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-600">
                  No properties in this auction yet
                </h3>
              </div>
            ) : (
              propertyDetails.map((property: any, idx: number) => (
                <LotCard
                  key={property._id}
                  property={property}
                  auction={auction}
                  lotIndex={idx}
                  onPlaceBid={handlePlaceBid}
                  bidHistory={lotHistories[property._id]}
                  onLoadHistory={loadBidHistory}
                  isExpanded={expandedLot === property._id}
                  isLoadingHistory={loadingHistory[property._id] || false}
                />
              ))
            )}
          </div>

          {/* ─── RIGHT SIDEBAR: Auction Info ─── */}
          <AuctionSidebar
            auction={auction}
            propertyCount={propertyDetails.length}
          />
        </div>
      </div>

      {/* ─── BID MODAL ─── */}
      <BidModal
        show={!!selectedLot}
        onClose={() => setSelectedLot(null)}
        property={selectedLot}
        currentBid={
          selectedLot?.currentBid ||
          selectedLot?.pricing?.startingAuctionPrice ||
          0
        }
        nextMinBid={
          (selectedLot?.currentBid ||
            selectedLot?.pricing?.startingAuctionPrice ||
            0) +
          (selectedLot?.pricing?.minimumBidIncrement ||
            auction?.bidIncrement ||
            1000)
        }
        bidIncrement={
          selectedLot?.pricing?.minimumBidIncrement ||
          auction?.bidIncrement ||
          1000
        }
        bidAmount={bidAmount}
        onBidAmountChange={setBidAmount}
        autoBidEnabled={selectedLot?.auctionDetails?.autoBidEnabled}
        useAutoBid={useAutoBid}
        onAutoBidToggle={setUseAutoBid}
        maxBidAmount={maxBidAmount}
        onMaxBidChange={setMaxBidAmount}
        bidSuccess={bidSuccess}
        isPending={placeBidMutation.isPending}
        onSubmit={() => handleSubmitBid()}
        formatPrice={(val) => `£${val.toLocaleString()}`}
        getPropertyImage={(p) =>
          p?.media?.propertyImages?.[0]
            ? mediaUrl(p.media.propertyImages[0])
            : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600"
        }
      />
    </PublicLayout>
  );
}
