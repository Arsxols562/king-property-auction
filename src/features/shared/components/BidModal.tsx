import { motion } from "motion/react";
import { X, Gavel, CheckCircle, AlertCircle } from "lucide-react";
import { ImageWithFallback } from "@/features/shared/figma/ImageWithFallback";

interface BidModalProps {
  show: boolean;
  onClose: () => void;
  property: any;
  currentBid: number;
  nextMinBid: number;
  bidIncrement: number;
  bidAmount: string;
  onBidAmountChange: (val: string) => void;
  autoBidEnabled?: boolean;
  useAutoBid?: boolean;
  onAutoBidToggle?: (val: boolean) => void;
  maxBidAmount?: string;
  onMaxBidChange?: (val: string) => void;
  bidSuccess: boolean;
  isPending: boolean;
  onSubmit: (e?: React.FormEvent) => void;
  formatPrice: (val: number) => string;
  getPropertyImage: (property: any) => string;
}

export default function BidModal({
  show,
  onClose,
  property,
  currentBid,
  nextMinBid,
  bidIncrement,
  bidAmount,
  onBidAmountChange,
  autoBidEnabled,
  useAutoBid,
  onAutoBidToggle,
  maxBidAmount,
  onMaxBidChange,
  bidSuccess,
  isPending,
  onSubmit,
  formatPrice,
  getPropertyImage,
}: BidModalProps) {
  if (!show || !property) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 to-orange-500" />
        <button
          className="absolute top-6 right-6 size-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center"
          onClick={onClose}
        >
          <X className="size-5 text-slate-600" />
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full mb-4">
            <Gavel className="size-4" />
            <span className="text-sm font-bold">Place Bid</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            {property.propertyTitle}
          </h3>
        </div>

        <div className="mb-6 rounded-2xl overflow-hidden">
          <ImageWithFallback
            src={getPropertyImage(property)}
            alt={property.propertyTitle}
            className="w-full h-48 object-cover"
          />
        </div>

        {/* Bid Info */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-5 mb-6 space-y-3">
          <div className="flex justify-between">
            <span className="text-sm font-bold text-slate-600">
              {property.totalBids > 0 ? "Current Bid" : "Guide Price"}
            </span>
            <span className="text-xl font-black text-green-600">
              {formatPrice(currentBid)}
            </span>
          </div>
          
        </div>

        {bidSuccess ? (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-6 border-2 border-green-200">
            <div className="flex items-center gap-3">
              <div className="size-12 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="size-7 text-white" />
              </div>
              <div>
                <p className="font-bold text-green-900 text-lg">
                  Bid Placed! 🎉
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Your Bid Amount (£)
              </label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">
                  £
                </span>
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => onBidAmountChange(e.target.value)}
                  min={nextMinBid}
                  step="1"
                  onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault(); }}
                  className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-2xl"
                  placeholder="0"
                />
              </div>
              {/* {bidAmount && Number(bidAmount) < nextMinBid ? (
                <p className="text-xs text-red-600 font-bold mt-1">⚠️ Bid must be at least {formatPrice(nextMinBid)}</p>
              ) : (
                <p className="text-xs text-slate-500 mt-2">
                  💡 Bid must be at least {formatPrice(nextMinBid)}
                </p>
              )} */}
            </div>

            {/* Auto-Bid Toggle */}
            {autoBidEnabled && (
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border-2 border-amber-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useAutoBid}
                    onChange={(e) => onAutoBidToggle?.(e.target.checked)}
                    className="size-5 rounded accent-amber-600"
                  />
                  <div>
                    <span className="text-sm font-bold text-amber-900">
                      Enable Auto-Bidding 🤖
                    </span>
                    <p className="text-xs text-amber-700">
                      System will automatically bid for you up to your max
                    </p>
                  </div>
                </label>
                {useAutoBid && (
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      Maximum Bid Limit (£)
                    </label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-slate-400">
                        £
                      </span>
                      <input
                        type="number"
                        value={maxBidAmount}
                        onChange={(e) => onMaxBidChange?.(e.target.value)}
                        min={nextMinBid}
                        step="1"
                        onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault(); }}
                        className="w-full pl-12 pr-6 py-3 bg-white border-2 border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-bold text-lg"
                        placeholder="Your absolute maximum"
                      />
                    </div>
                    <p className="text-xs text-amber-600 mt-1">
                      💡 You'll only pay what's needed to win
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-200 flex items-start gap-3">
              <AlertCircle className="size-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-bold mb-1">Important</p>
                <p>Bids are legally binding.</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
            onClick={onClose}
          >
            Cancel
          </button>
          {!bidSuccess && (
            <button
              onClick={(e) => onSubmit(e)}
              disabled={!bidAmount || isPending}
              className="flex-1 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-bold hover:shadow-2xl transition-all disabled:opacity-50"
            >
              {isPending ? "Placing..." : "Place Bid"}
            </button>
          )}
        </div>
        <p className="text-xs text-center text-slate-500 mt-4">
          🔒 By placing a bid, you agree to our terms
        </p>
      </motion.div>
    </motion.div>
  );
}
