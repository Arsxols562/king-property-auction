import { mediaUrl } from "@/lib/mediaUrl";
import {
  AlertCircle,
  Gavel,
  Eye,
  ChevronDown,
  Building,
  Armchair,
  MapPin,
  Bed,
  Bath,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ImageWithFallback } from "@/features/shared/figma/ImageWithFallback";
import { useAuthStore } from "@/stores/authStore";
import { getAnonymousBidder, resetBidderCounter } from "@/features/shared/utils/anonymizeBidder";
import { useEffect } from "react";

interface LotCardProps {
  property: any;
  auction: any;
  lotIndex: number;
  onPlaceBid: (property: any) => void;
  bidHistory: any;
  onLoadHistory: (propertyId: string) => void;
  isExpanded: boolean;
  isLoadingHistory: boolean;
}

function getPropertyImage(property: any) {
  if (property?.media?.propertyImages?.length > 0) {
    return mediaUrl(property.media.propertyImages[0]);
  }
  return "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600";
}

export default function LotCard({
  property,
  auction,
  lotIndex,
  onPlaceBid,
  bidHistory,
  onLoadHistory,
  isExpanded,
  isLoadingHistory,
}: LotCardProps) {
  const { user } = useAuthStore();
    useEffect(() => {
    resetBidderCounter();
  }, []);
  const isOwnProperty = !!(
    property?.createdBy &&
    (user?.id || (user as any)?._id) &&
    (property.createdBy._id || property.createdBy)?.toString() ===
      (user?.id || (user as any)?._id)?.toString()
  );

  const currentBid =
    property.currentBid || property.pricing?.startingAuctionPrice || 0;
  const bidIncrement =
    property.pricing?.minimumBidIncrement || auction.bidIncrement || 1000;
  const nextMinBid = currentBid + bidIncrement;
  const imageUrl = getPropertyImage(property);

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-white/60 shadow-xl overflow-hidden">
      {/* Property Image */}
      <div className="relative h-64">
        <ImageWithFallback
          src={imageUrl}
          alt={property.propertyTitle}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md text-white text-xs font-bold rounded-full">
            LOT {lotIndex + 1}
          </span>
        </div>
      </div>

      {/* Property Details */}
      <div className="p-6">
        <h3 className="text-xl font-black text-slate-900 mb-2">
          {property.propertyTitle}
        </h3>
        <div className="flex items-center gap-2 text-slate-600 mb-4">
          <MapPin className="size-4 text-blue-600" />
          <span className="text-sm font-medium">
            {property.location?.city}, {property.location?.area}
          </span>
        </div>

        {/* Specs */}
        <div className="flex items-center flex-wrap gap-4 mb-6 pb-6 border-b-2 border-slate-100">
          <div className="flex items-center gap-2">
            <Bed className="size-4 text-blue-600" />
            <span className="text-sm font-bold">
              {property.specifications?.bedrooms ?? "-"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Bath className="size-4 text-purple-600" />
            <span className="text-sm font-bold">
              {property.specifications?.bathrooms ?? "-"}
            </span>
          </div>
          {(property.specifications?.parkingSpaces ?? 0) > 0 && (
            <div className="flex items-center gap-2">
              <Armchair className="size-4 text-amber-600" />
              <span className="text-sm font-bold">
                {property.specifications.parkingSpaces} Lounge
              </span>
            </div>
          )}
        </div>

        {/* Bidding Section */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase">
                {property.totalBids > 0 ? "Current Bid" : "Guide Price"}
              </p>
              <p className="text-2xl font-black text-green-600">
                £{currentBid.toLocaleString()}
              </p>
            </div>
          </div>

          
          <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
            <span>{property.totalBids > 0 ? `${property.totalBids} bid${property.totalBids !== 1 ? 's' : ''}` : 'No bids placed yet'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {auction.status === "live" ? (
            isOwnProperty ? (
              <div className="flex-1 py-3.5 bg-slate-100 border-2 border-slate-200 rounded-xl text-center">
                <p className="text-slate-600 font-bold text-sm">
                  🏠 Your Property
                </p>
                <p className="text-slate-400 text-xs">
                  Cannot bid on own listing
                </p>
              </div>
            ) : (
              <button
                onClick={() => onPlaceBid(property)}
                className="flex-1 py-3.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <Gavel className="size-5" /> Place Bid
              </button>
            )
          ) : (
            <div className="flex-1 py-3.5 bg-slate-100 text-slate-500 rounded-xl font-bold text-center">
              {auction.status === "completed" ? "Auction Ended" : "Not Started"}
            </div>
          )}
          {auction.status === "live" && (
            <button
              onClick={() => onLoadHistory(property._id)}
              className={`px-4 py-3.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
                isExpanded
                  ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Eye className="size-4" />
              {isExpanded ? "Hide History" : "Bid History"}
              <ChevronDown className={`size-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>

        {/* Expandable Bid History */}
        <AnimatePresence>
          {auction.status === "live" && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t-2 border-slate-100">
                {isLoadingHistory ? (
                  <div className="text-center py-4">
                    <div className="animate-spin size-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
                  </div>
                ) : bidHistory?.bids?.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {bidHistory.bids.map((bid: any, i: number) => (
                      <div
                        key={bid._id || i}
                        className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100"
                      >
                        {(() => {
                          const anon = getAnonymousBidder(bid.bidder?._id || bid.bidder, bid.bidder?.address?.city);
                          return (
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                {anon.avatar}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">
                                  {anon.name} {anon.city && `(${anon.city})`}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {new Date(bid.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                        <div className="text-right">
                          <p className="text-lg font-black text-green-600">
                            £{bid.amount?.toLocaleString()}
                          </p>
                          <span
                            className={`text-xs font-bold ${bid.status === "winning" ? "text-green-600" : "text-slate-500"}`}
                          >
                            {bid.status === "winning"
                              ? "🏆 Winning"
                              : bid.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-sm text-slate-500 py-4">
                    No bids yet for this lot.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
