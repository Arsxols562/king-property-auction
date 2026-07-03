import { mediaUrl } from "@/lib/mediaUrl";
import {
  MapPin,
  Bed,
  Bath,
  Calendar,
  Heart,
  Share2,
  CheckCircle,
  Home,
  Car,
  AlertCircle,
  FileText,
  Sparkles,
  Info,
  ExternalLink,
  Building2,
  TreePine,
  Building,
  Factory,
  Sofa,
  Layers,
  DoorOpen,
  Armchair,
  MessageSquare,
} from "lucide-react";
import AuctionTimer from "@/features/shared/components/AuctionTimer";
import { formatUKDateTime } from "@/features/shared/utils/dateUtils";
import BidHistorySection from "@/features/property/components/BidHistorySection";

interface PropertyInfoProps {
  property: any;
  matchingAuction: any;
  isLiveNow: boolean;
  isCompleted: boolean;
  isAuctionType: boolean;
  isInLiveAuction: boolean;
  isDirectSale: boolean;
  currentBid: number;
  startingPrice: number;
  bidIncrement: number;
  nextMinBid: number;
  buyNowPrice: number;
  features: string[];
  isFavorite: boolean;
  onShare?: () => void;
  onToggleFavorite: () => void;
  formatPrice: (val: number) => string;
  showBidHistory: boolean;
  bidHistory: any;
  loadingHistory: boolean;
  onToggleBidHistory: () => void;
  onEnquire?: () => void;
}

export default function PropertyInfo({
  property,
  matchingAuction,
  isLiveNow,
  isCompleted,
  isAuctionType,
  isInLiveAuction,
  isDirectSale,
  currentBid,
  startingPrice,
  bidIncrement,
  nextMinBid,
  buyNowPrice,
  features,
  isFavorite,
  onShare,
  onToggleFavorite,
  formatPrice,
  showBidHistory,
  bidHistory,
  loadingHistory,
  onToggleBidHistory,
  onEnquire,
}: PropertyInfoProps) {
  return (
    <div className="lg:col-span-2 space-y-6">
      {/* Property Title + Specs */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border-2 border-white/60">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              {isLiveNow ? (
                <span className="px-4 py-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full font-bold text-sm flex items-center gap-1.5">
                  <span className="size-2 bg-white rounded-full animate-pulse" />{" "}
                  Live Auction
                </span>
              ) : isCompleted ? (
                <span className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full font-bold text-sm">
                  Completed
                </span>
              ) : isAuctionType ? (
                <span className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full font-bold text-sm">
                  Upcoming Auction
                </span>
              ) : (
                <span className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full font-bold text-sm">
                  For Sale
                </span>
              )}
              <span className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full font-bold text-sm">
                {property.legalInfo?.ownershipType || "Freehold"}
              </span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 mb-3">
              {property.propertyTitle}
            </h1>
            <div className="flex items-center gap-2 text-lg text-slate-600 font-medium">
              <MapPin className="size-5 text-blue-600" />
              {property.location?.streetAddress ||
                property.location?.city}, {property.location?.area}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onToggleFavorite}
              className={`size-12 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isFavorite
                  ? "bg-gradient-to-br from-red-500 to-pink-500"
                  : "bg-white/90"
              }`}
            >
              <Heart
                className={`size-5 ${
                  isFavorite ? "text-white fill-white" : "text-slate-600"
                }`}
              />
            </button>
            <button
              onClick={onShare}
              className="size-12 bg-white/90 rounded-full flex items-center justify-center transition-all shadow-lg hover:bg-blue-50 hover:scale-110"
            >
              <Share2 className="size-5 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 pb-6 border-b-2 border-slate-100">
          {[
            {
              icon: Bed,
              gradient: "from-blue-500 to-indigo-600",
              value: property.specifications?.bedrooms || 0,
              label: "Bedrooms",
            },
            {
              icon: Bath,
              gradient: "from-purple-500 to-pink-600",
              value: property.specifications?.bathrooms || 0,
              label: "Bathrooms",
            },
            ...(property.specifications?.parkingSpaces > 0 ? [{
              icon: Armchair,
              gradient: "from-amber-500 to-orange-600",
              value: property.specifications.parkingSpaces,
              label: "Lounge",
            }] : []),
            {
              icon:
                property.propertyType === "house" ? Home :
                property.propertyType === "apartment" ? Building2 :
                property.propertyType === "land" ? TreePine :
                property.propertyType === "commercial" ? Building :
                property.propertyType === "farmhouse" ? Home :
                property.propertyType === "villa" ? Building2 :
                property.propertyCategory === "residential" ? Building2 :
                property.propertyCategory === "industrial" ? Factory :
                Layers,
              gradient:
                property.propertyType === "house" ? "from-blue-500 to-indigo-600" :
                property.propertyType === "apartment" ? "from-purple-500 to-pink-600" :
                property.propertyType === "land" ? "from-green-500 to-emerald-600" :
                property.propertyType === "commercial" ? "from-amber-500 to-yellow-600" :
                property.propertyType === "farmhouse" ? "from-orange-500 to-red-600" :
                property.propertyType === "villa" ? "from-rose-500 to-pink-600" :
                property.propertyCategory === "residential" ? "from-indigo-500 to-blue-600" :
                property.propertyCategory === "industrial" ? "from-slate-500 to-slate-700" :
                "from-purple-500 to-pink-600",
              value: "",
              label: "Type",
              isBadge: true,
              badgeText: property.propertyType
                ? property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)
                : "N/A",
            },
            {
              icon: DoorOpen,
              gradient: "from-slate-500 to-slate-700",
              value: "",
              label: "Occupation",
              isBadge: true,
              badgeText: property.propertyStatus === "sold" ? "Occupied" : "Unoccupied",
            },
          ].map((stat, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div
                className={`size-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center`}
              >
                <stat.icon className="size-6 text-white" />
              </div>
              <div>
                {(stat as any).isBadge ? (
                  <span className="inline-block px-2 py-0.5 bg-slate-100 rounded-lg text-sm font-bold text-slate-700">
                    {(stat as any).badgeText}
                  </span>
                ) : (
                  <div className="text-2xl font-black text-slate-900">
                    {stat.value}
                  </div>
                )}
                <div className="text-xs font-semibold text-slate-500">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Opening Price - always shown */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
            <div className="text-sm font-bold text-blue-900 mb-2">
              {isDirectSale ? "Asking Price" : "Guide Price"}
            </div>
            <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {formatPrice(startingPrice)}
            </div>
          </div>

          {/* Current Bid - only shown when bids exist */}
          {property.totalBids > 0 && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border-2 border-emerald-200">
              <div className="text-sm font-bold text-emerald-900 mb-2">
                Current Bid
              </div>
              <div className="text-4xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {formatPrice(currentBid)}
              </div>
            </div>
          )}

          {/* Buy Now Price - only for direct sale with no bids */}
          {isDirectSale && property.totalBids === 0 && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border-2 border-emerald-200">
              <div className="text-sm font-bold text-emerald-900 mb-2">
                Buy Now Price
              </div>
              <div className="text-4xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {formatPrice(buyNowPrice || startingPrice)}
              </div>
            </div>
          )}
        </div>

        {isAuctionType && (
          <div className="mt-6 space-y-4">
            {matchingAuction && matchingAuction.status === "scheduled" && (
              <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-200">
                <p className="text-xs font-bold text-amber-700 mb-1">
                  Auction Starts
                </p>
                <p className="text-sm font-bold text-slate-900 mb-2">
                  {formatUKDateTime(matchingAuction.startDateTime)}
                </p>
                <AuctionTimer
                  startDateTime={matchingAuction.startDateTime}
                  endDateTime={matchingAuction.endDateTime}
                  status={matchingAuction.status}
                  className="mt-1"
                />
              </div>
            )}
            {matchingAuction && matchingAuction.status === "live" && (
              <div className="bg-red-50 rounded-xl p-4 border-2 border-red-200">
                <p className="text-xs font-bold text-red-700 mb-1">
                  Auction Ends
                </p>
                <p className="text-sm font-bold text-slate-900 mb-2">
                  {formatUKDateTime(matchingAuction.endDateTime)}
                </p>
                <AuctionTimer
                  startDateTime={matchingAuction.startDateTime}
                  endDateTime={matchingAuction.endDateTime}
                  status={matchingAuction.status}
                  className="mt-1"
                />
              </div>
            )}
            {matchingAuction && matchingAuction.status === "completed" && (
              <div className="bg-slate-50 rounded-xl p-4 border-2 border-slate-200">
                <AuctionTimer
                  startDateTime={matchingAuction.startDateTime}
                  endDateTime={matchingAuction.endDateTime}
                  status={matchingAuction.status}
                />
              </div>
            )}

            {/* Bidding Details */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200 space-y-2">
              {!matchingAuction ? (
                <>
                  <p className="text-sm font-bold text-purple-700">
                    Bidding not yet open
                  </p>
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-slate-600">Status</span>
                    <span className="font-bold text-amber-600">
                      🟡 Not in live auction
                    </span>
                  </div>
                </>
              ) : matchingAuction.status === "scheduled" ? (
                <>
                  <p className="text-sm font-bold text-purple-700">
                    Bidding not yet open
                  </p>
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-slate-600">Status</span>
                    <span className="font-bold text-amber-600">
                      🟡 Auction Scheduled
                    </span>
                  </div>
                </>
              ) : matchingAuction.status === "live" &&
                property.totalBids === 0 ? (
                <>
                  <p className="text-sm font-bold text-purple-700">
                    No bids placed yet
                  </p>
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-slate-600">Status</span>
                    <span className="font-bold text-red-600">
                      🔴 In Live Auction
                    </span>
                  </div>
                </>
              ) : matchingAuction.status === "live" ? (
                <>
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-slate-600">Next Min Bid</span>
                    <span className="text-slate-900 font-bold">
                      {formatPrice(nextMinBid)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-slate-600">Bid Increment</span>
                    <span className="text-slate-900 font-bold">
                      {formatPrice(bidIncrement)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-slate-600">Total Bids</span>
                    <span className="text-slate-900 font-bold">
                      {property.totalBids || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-slate-600">Status</span>
                    <span className="font-bold text-red-600">
                      🔴 In Live Auction
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-slate-600">Status</span>
                    <span className="font-bold text-slate-600">
                      ✅ Completed
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>


      {/* Description */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border-2 border-white/60">
        <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
          <FileText className="size-6 text-blue-600" />
          Property Description
        </h2>
        <p className="text-slate-700 leading-relaxed text-lg">
          {property.propertyDescription || "No description available."}
        </p>
      </div>

      {/* Key Features */}
      {features.length > 0 && (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border-2 border-white/60">
          <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
            <Sparkles className="size-6 text-purple-600" />
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature: string, idx: number) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl"
              >
                <CheckCircle className="size-5 text-blue-600 flex-shrink-0" />
                <span className="font-semibold text-slate-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Special Terms of Sale */}
      {property.legalInfo?.specialTerms && (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border-2 border-white/60">
          <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
            <FileText className="size-6 text-red-600" />
            Special Terms of Sale
          </h2>
          <pre className="text-slate-700 leading-relaxed text-lg font-sans whitespace-pre-wrap">
            {property.legalInfo.specialTerms}
          </pre>
          <p className="text-xs text-slate-400 mt-4 italic">
            * These special conditions supersede the general terms of sale.
          </p>
        </div>
      )}

      {/* Property Videos */}
      {(property?.media?.propertyVideos?.length > 0 ||
        property?.media?.propertyVideo) && (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border-2 border-white/60">
          <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
            <FileText className="size-6 text-blue-600" />
            Property Videos
          </h2>
          <div className="space-y-4">
            {(
              property.media?.propertyVideos ||
              (property.media?.propertyVideo
                ? [property.media.propertyVideo]
                : [])
            ).map((vid: string, i: number) => (
              <div
                key={i}
                className="relative w-full rounded-2xl overflow-hidden border-2 border-slate-200"
              >
                {/* Video player */}
                <video src={mediaUrl(vid)} controls className="w-full" />

                {/* Watermark overlay - bottom right */}
                {/* Pointer events none so video controls work */}
                <div className="absolute bottom-12 right-4 pointer-events-none select-none z-10">
                  <div
                    className="flex flex-col items-end"
                    style={{ opacity: 0.75 }}
                  >
                    {/* Main text with dark shadow for readability */}
                    <span
                      style={{
                        fontFamily: "'Arial Black', Arial, sans-serif",
                        fontWeight: 900,
                        fontSize: "clamp(10px, 1.8vw, 18px)",
                        color: "rgba(255,255,255,0.90)",
                        letterSpacing: "2px",
                        textShadow:
                          "1px 1px 3px rgba(0,0,0,0.8), " +
                          "-1px -1px 3px rgba(0,0,0,0.8), " +
                          "1px -1px 3px rgba(0,0,0,0.8), " +
                          "-1px 1px 3px rgba(0,0,0,0.8)",
                        lineHeight: 1.2,
                      }}
                    >
                      ♛ KING PROPERTY AUCTION
                    </span>
                    {/* Website URL below */}
                    <span
                      style={{
                        fontFamily: "Arial, sans-serif",
                        fontWeight: 700,
                        fontSize: "clamp(8px, 1.2vw, 13px)",
                        color: "rgba(255,215,0,0.90)",
                        letterSpacing: "1px",
                        textShadow:
                          "1px 1px 2px rgba(0,0,0,0.8), " +
                          "-1px -1px 2px rgba(0,0,0,0.8)",
                        lineHeight: 1.2,
                      }}
                    >
                      kingpropertyauction.com
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floor Plans */}
      {(property?.media?.floorPlans?.length > 0 ||
        property?.media?.floorPlan) && (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border-2 border-white/60">
          <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
            <FileText className="size-6 text-green-600" />
            Floor Plans
          </h2>
          <div className="space-y-4">
            {(
              property.media?.floorPlans ||
              (property.media?.floorPlan ? [property.media.floorPlan] : [])
            ).map((fp: string, i: number) =>
              fp.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img
                  key={i}
                  src={mediaUrl(fp)}
                  alt={`Floor Plan ${i + 1}`}
                  className="w-full rounded-2xl border-2 border-slate-200"
                />
              ) : (
                <a
                  key={i}
                  href={mediaUrl(fp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-6 py-4 bg-green-50 border-2 border-green-200 rounded-2xl text-green-700 font-bold hover:bg-green-100 transition-colors w-fit"
                >
                  <FileText className="size-5" /> Floor Plan {i + 1}
                </a>
              ),
            )}
          </div>
        </div>
      )}

      {/* Legal Documents */}
      {property?.media?.legalDocuments?.length > 0 && (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border-2 border-white/60">
          <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
            <FileText className="size-6 text-purple-600" />
            Legal Documents
          </h2>
          <p className="text-slate-600 font-medium mb-4">
            Review the legal documents before bidding.
          </p>
          <div className="space-y-3">
            {(Array.isArray(property.media.legalDocuments)
              ? property.media.legalDocuments
              : property.media.legalDocuments
                ? [property.media.legalDocuments]
                : []
            ).map((doc: string, i: number) => (
              <a
                key={i}
                href={mediaUrl(doc)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-6 py-4 bg-purple-50 border-2 border-purple-200 rounded-2xl text-purple-700 font-bold hover:bg-purple-100 transition-colors"
              >
                <FileText className="size-5 flex-shrink-0" />
                <span className="truncate">
                  Document {i + 1} — {doc.split("/").pop()}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Bid History */}
      {isInLiveAuction && (
        <BidHistorySection
          isLive={isLiveNow}
          show={showBidHistory}
          history={bidHistory}
          loading={loadingHistory}
          onToggle={onToggleBidHistory}
        />
      )}

      {/* Map & Location */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border-2 border-white/60">
        <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
          <MapPin className="size-6 text-red-500" />
          Map & Location
        </h2>
        <p className="text-slate-600 font-medium mb-2">
          {property.location?.streetAddress}, {property.location?.city},{" "}
          {property.location?.area}, {property.location?.postalCode}
        </p>
        <div className="flex flex-wrap gap-3 mt-4">
          {/* Map View */}
          <a
            href={
              property.location?.latitude && property.location?.longitude
                ? `https://www.google.com/maps?q=${property.location.latitude},${property.location.longitude}&z=16`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    [
                      property.location?.streetAddress,
                      property.location?.city,
                      property.location?.postalCode,
                      "UK",
                    ]
                      .filter(Boolean)
                      .join(", "),
                  )}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all flex items-center gap-2"
          >
            <MapPin className="size-4" /> Map
          </a>

          {/* Street View */}
          <a
            href={
              property.location?.latitude && property.location?.longitude
                ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${property.location.latitude},${property.location.longitude}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    [
                      property.location?.streetAddress,
                      property.location?.city,
                      property.location?.postalCode,
                      "UK",
                    ]
                      .filter(Boolean)
                      .join(", "),
                  )}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all flex items-center gap-2"
          >
            🚶 Street View
          </a>

          {/* Satellite View */}
          <a
            href={
              property.location?.latitude && property.location?.longitude
                ? `https://www.google.com/maps/@${property.location.latitude},${property.location.longitude},19z/data=!3m1!1e3`
                : `https://maps.google.com/maps?q=${encodeURIComponent(
                    [
                      property.location?.streetAddress,
                      property.location?.city,
                      property.location?.postalCode,
                      "UK",
                    ]
                      .filter(Boolean)
                      .join(", "),
                  )}&t=k&z=19`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all flex items-center gap-2"
          >
            🛰️ Satellite
          </a>
        </div>
      </div>

      
      {/* Enquire + Council Tax */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border-2 border-white/60">
        <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
          <MessageSquare className="size-5 text-emerald-600" />
          Enquire & Info
        </h2>
        <div className="flex items-stretch gap-3">
          {/* Enquire Button */}
          <button
            onClick={onEnquire || (() => {})}
            className="flex-1 flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border-2 border-emerald-200 rounded-xl transition-all"
          >
            <div className="size-10 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageSquare className="size-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-black text-slate-900 text-xs">
                Enquire About This Property
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Get more details from the agent
              </p>
            </div>
          </button>

          {/* Council Tax */}
          <a
            href={`https://www.saa.gov.uk/search/?SEARCHED=1&SEARCH_TABLE=council_tax&SEARCH_TERM=${encodeURIComponent(property.location?.postalCode || "")}#results`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center gap-3 p-3 bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 rounded-xl transition-all"
          >
            <div className="size-10 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="size-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-black text-slate-900 text-xs">
                Council Tax
              </p>
              <p className="text-[11px] text-blue-600 font-medium flex items-center gap-1">
                Search <ExternalLink className="size-3" />
              </p>
            </div>
          </a>
        </div>
      </div>

    </div>
  );
}
