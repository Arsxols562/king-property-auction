import { Plus } from "lucide-react";
import AuctionStats from "@/features/auction/components/AuctionStats";
import AuctionCards from "@/features/auction/components/AuctionCards";

interface AuctionsTabProps {
  theme: { secondary: string };
  onCreateAuction: () => void;
}

export default function AuctionsTab({ theme, onCreateAuction }: AuctionsTabProps) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1 sm:mb-2">Auction Management</h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium">Create and manage live auctions</p>
        </div>
        <button onClick={onCreateAuction} className={`px-5 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r ${theme.secondary} text-white rounded-xl text-sm font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2 w-fit`}>
          <Plus className="size-4 sm:size-5" /> Create Auction
        </button>
      </div>

      <AuctionStats />
      <AuctionCards />
    </div>
  );
}
