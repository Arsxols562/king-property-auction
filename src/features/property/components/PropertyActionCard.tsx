import {
  CheckCircle,
  Clock,
  Tag,
  Gavel,
  Phone,
  MessageSquare,
  User,
  FileText,
} from "lucide-react";

interface PropertyActionCardProps {
  property: any;
  matchingAuction: any;
  isLiveNow: boolean;
  isCompleted: boolean;
  isAuctionType: boolean;
  isInLiveAuction: boolean;
  isDirectSale: boolean;
  currentBid: number;
  startingPrice: number;
  buyNowPrice: number;
  formatPrice: (val: number) => string;
  onPlaceBid: () => void;
  onNavigate: (path: string) => void;
  isAuthenticated?: boolean;
  onEnquire: () => void;
  onOfferNow?: () => void;
  isOwnProperty?: boolean;
}

// Helper: Load image from URL as base64 for PDF
const loadImageAsBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas failed"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = reject;
    img.src = url;
  });
};

export default function PropertyActionCard({
  property,
  matchingAuction,
  isLiveNow,
  isCompleted,
  isAuctionType,
  isInLiveAuction,
  isDirectSale,
  currentBid,
  startingPrice,
  buyNowPrice,
  formatPrice,
  onPlaceBid,
  onNavigate,
  onEnquire,
  isAuthenticated,
  onOfferNow,
  isOwnProperty = false,
}: PropertyActionCardProps) {
  const handleDownloadBrochure = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    let y = 15;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const m = 18;
    const cw = pageWidth - m * 2;
    const maxY = pageHeight - m;

    const np = (h = 20) => {
      if (y + h > maxY) {
        doc.addPage();
        y = m;
      }
    };
    const ln = (t: string, s = 9, b = false, c = "#334155") => {
      np(12);
      doc.setFontSize(s);
      doc.setFont("helvetica", b ? "bold" : "normal");
      doc.setTextColor(c);
      const l = doc.splitTextToSize(t || "N/A", cw);
      doc.text(l, m, y);
      y += l.length * s * 0.4 + 3;
    };
    const dv = () => {
      np(8);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(m, y, pageWidth - m, y);
      y += 5;
    };
    const st = (t: string) => {
      if (y + 30 > maxY) {
        doc.addPage();
        y = m;
      }
      y += 2;
      doc.setFillColor(30, 64, 175);
      doc.roundedRect(m, y, cw, 7, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(t, m + 5, y + 5);
      doc.setTextColor(51, 65, 85);
      y += 14;
    };
    const clickableLine = (label: string, url: string, s = 8) => {
      np(10);
      doc.setFontSize(s);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(37, 99, 235);
      doc.textWithLink(label, m, y, { url });
      y += s * 0.5 + 3;
    };

    // Load images
    const imgs = property?.media?.propertyImages || [];
    const loaded: string[] = [];
    for (const img of imgs.slice(0, 6)) {
      try {
        const url = img.startsWith("http")
          ? img
          : `${window.location.origin}${img}`;
        loaded.push(await loadImageAsBase64(url));
      } catch {}
    }

    // ─── HEADER BAR ────────────────────────────
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, pageWidth, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("KING PROPERTY AUCTION", m, 22);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Property Brochure", m, 32);
    y = 48;

    // ─── TITLE + STATUS ────────────────────────
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    const tl = doc.splitTextToSize(property?.propertyTitle || "Property", cw);
    doc.text(tl, m, y);
    y += tl.length * 9 + 6;

    const sc =
      property?.propertyStatus === "sold"
        ? [5, 150, 105]
        : property?.propertyStatus === "unsold"
          ? [220, 38, 38]
          : [37, 99, 235];
    doc.setFillColor(sc[0], sc[1], sc[2]);
    const stx = (property?.propertyStatus || "available").toUpperCase();
    doc.roundedRect(m, y, doc.getTextWidth(stx) + 10, 6, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(stx, m + 5, y + 4.5);
    y += 14;

    // ─── IMAGE GALLERY ─────────────────────────
    if (loaded.length > 0) {
      st("PROPERTY IMAGES");
      const iw = (cw - 6) / 3;
      const ih = 55;
      let col = 0;
      let ry = y;
      for (let i = 0; i < loaded.length; i++) {
        if (col === 0) np(ih + 10);
        doc.addImage(
          loaded[i],
          "JPEG",
          m + col * (iw + 3),
          ry,
          iw,
          ih,
          undefined,
          "FAST",
        );
        col++;
        if (col === 3) {
          col = 0;
          ry += ih + 3;
        }
      }
      y = ry + (col > 0 ? ih + 3 : 0) + 6;
      dv();
    }

    // ─── PRICE CARD ────────────────────────────
    const price =
      property?.soldPrice ||
      property?.currentBid ||
      property?.pricing?.startingAuctionPrice ||
      0;
    const pl = property?.soldPrice
      ? "SOLD PRICE"
      : property?.currentBid > 0
        ? "CURRENT BID"
        : "STARTING PRICE";
    np(30);
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(m, y, cw, 26, 3, 3, "F");
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(0.8);
    doc.roundedRect(m, y, cw, 26, 3, 3, "D");
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(pl, m + 7, y + 9);
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text(`GBP ${price.toLocaleString()}`, m + 7, y + 22);
    y += 34;

    // ─── KEY DETAILS ───────────────────────────
    st("KEY DETAILS");
    const kd: [string, string][] = [
      [
        "Location",
        `${property?.location?.city || "-"}, ${property?.location?.state || ""}`,
      ],
      ["Type", property?.propertyType || "-"],
      ["Bedrooms", String(property?.specifications?.bedrooms || "-")],
      ["Bathrooms", String(property?.specifications?.bathrooms || "-")],
      ["Year Built", String(property?.specifications?.yearBuilt || "-")],
      ["Furnished", property?.specifications?.furnishedStatus || "-"],
    ];
    const kw = cw / 2;
    kd.forEach(([l, v], i) => {
      const cx = m + (i % 2) * kw,
        cy = y + Math.floor(i / 2) * 14;
      np(14);
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.text(l, cx, cy);
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text(v, cx, cy + 5);
    });
    y += Math.ceil(kd.length / 2) * 14 + 4;
    dv();

    // ─── DESCRIPTION ───────────────────────────
    if (property?.propertyDescription) {
      st("DESCRIPTION");
      ln(property.propertyDescription, 9, false, "#475569");
      dv();
    }

    // ─── FEATURES ──────────────────────────────
    const feats = property?.features || {};
    const fk = Object.keys(feats).filter((k: string) => feats[k]);
    if (fk.length > 0) {
      st("FEATURES AND AMENITIES");
      const fw = cw / 2;
      fk.forEach((k, i) => {
        const cx = m + (i % 2) * fw,
          cy = y + Math.floor(i / 2) * 7;
        np(7);
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.setFont("helvetica", "normal");
        const label = k
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (s: string) => s.toUpperCase());
        doc.text(`- ${label}`, cx, cy);
      });
      y += Math.ceil(fk.length / 2) * 7 + 4;
      dv();
    }

    // ─── PRICING ───────────────────────────────
    st("PRICING DETAILS");
    const pr = property?.pricing || {};
    const prs: [string, string][] = [
      [
        "Starting Price",
        `GBP ${(pr.startingAuctionPrice || 0).toLocaleString()}`,
      ],
    ];
    if (pr.buyNowPrice)
      prs.push(["Buy Now", `GBP ${pr.buyNowPrice.toLocaleString()}`]);
    if (pr.minimumBidIncrement)
      prs.push([
        "Bid Increment",
        `GBP ${pr.minimumBidIncrement.toLocaleString()}`,
      ]);
    prs.forEach(([l, v]) => {
      np(9);
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.text(l, m, y);
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text(v, m + cw - doc.getTextWidth(v), y);
      y += 7;
    });
    y += 2;
    dv();

    // ─── CONTACT ───────────────────────────────
    const si = property?.sellerInfo || {};
    if (si.agentName || si.agentContact) {
      st("CONTACT");
      if (si.agentName) ln(`Agent: ${si.agentName}`, 9, true);
      if (si.agentContact) ln(`Phone: ${si.agentContact}`, 9, false, "#2563eb");
      if (si.sellerEmail) ln(`Email: ${si.sellerEmail}`, 9, false, "#2563eb");
      dv();
    }

    // ─── MEDIA (Floor Plan, Video, Virtual Tour) ──
    const media = property?.media || {};

    // Floor Plan - check both singular and plural
    const floorPlan =
      media.floorPlan || (media.floorPlans && media.floorPlans[0]);
    if (floorPlan) {
      st("FLOOR PLAN");
      const fpUrl = floorPlan.startsWith("http")
        ? floorPlan
        : `${window.location.origin}${floorPlan}`;
      clickableLine(
        `View Floor Plan: ${floorPlan.split("/").pop() || "floor-plan"}`,
        fpUrl,
        8,
      );
      y += 2;
      dv();
    }

    // Video Tour - check both singular and plural
    const video =
      media.propertyVideo || (media.propertyVideos && media.propertyVideos[0]);
    if (video) {
      st("VIDEO TOUR");
      const vidUrl = video.startsWith("http")
        ? video
        : `${window.location.origin}${video}`;
      clickableLine(
        `Watch Video: ${video.split("/").pop() || "property-video"}`,
        vidUrl,
        8,
      );
      y += 2;
      dv();
    }

    // Virtual Tour
    if (media.virtualTour) {
      st("VIRTUAL TOUR");
      clickableLine("View Virtual Tour", media.virtualTour, 8);
      y += 2;
      dv();
    }

    // ─── LEGAL DOCUMENTS ───────────────────────
    const docs = media.legalDocuments
      ? Array.isArray(media.legalDocuments)
        ? media.legalDocuments
        : [media.legalDocuments]
      : [];
    if (docs.length > 0) {
      st("LEGAL DOCUMENTS");
      docs.forEach((d: string, i: number) => {
        const docUrl = d.startsWith("http")
          ? d
          : `${window.location.origin}${d}`;
        clickableLine(
          `Document ${i + 1}: ${d.split("/").pop() || `doc-${i + 1}`}`,
          docUrl,
          7,
        );
      });
      y += 2;
      dv();
    }

    // ─── FOOTER ────────────────────────────────
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Page ${i}/${pages} | King Property Auction | ${new Date().toLocaleDateString("en-GB")}`,
        m,
        pageHeight - 6,
      );
    }

    doc.save(
      `${(property?.propertyTitle || "property").replace(/\s+/g, "-").toLowerCase()}-brochure.pdf`,
    );
  };
  return (
    <div className="lg:col-span-1 space-y-6">
      {/* Gradient Action Card */}
      <div
        className={`rounded-3xl p-8 shadow-2xl ${
          isLiveNow
            ? "bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600"
            : isCompleted
              ? "bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600"
              : isAuctionType
                ? "bg-gradient-to-br from-amber-500 via-orange-500 to-red-500"
                : "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900"
        }`}
      >
        <div className="text-center mb-6">
          {isLiveNow ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-lg rounded-full mb-4">
              <span className="size-2 bg-white rounded-full animate-pulse" />
              <span className="text-sm font-bold text-white">Live Auction</span>
            </div>
          ) : isCompleted ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-lg rounded-full mb-4">
              <CheckCircle className="size-5 text-white" />
              <span className="text-sm font-bold text-white">
                Auction Completed
              </span>
            </div>
          ) : isAuctionType ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-lg rounded-full mb-4">
              <Clock className="size-5 text-yellow-300" />
              <span className="text-sm font-bold text-white">
                Upcoming Auction
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-lg rounded-full mb-4">
              <Tag className="size-5 text-white" />
              <span className="text-sm font-bold text-white">For Sale</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/20 rounded-xl p-3 text-center border-2 border-white/30">
            <div className="text-2xl font-black text-white">0</div>
            <div className="text-xs font-semibold text-white/80">Views</div>
          </div>
          <div className="bg-white/20 rounded-xl p-3 text-center border-2 border-white/30">
            <div className="text-2xl font-black text-white">0</div>
            <div className="text-xs font-semibold text-white/80">Saved</div>
          </div>
          <div className="bg-white/20 rounded-xl p-3 text-center border-2 border-white/30">
            <div className="text-2xl font-black text-white">
              {property.totalBids || 0}
            </div>
            <div className="text-xs font-semibold text-white/80">Bids</div>
          </div>
        </div>

        <div className="space-y-3">
          {isLiveNow ? (
            <>
              {isOwnProperty ? (
                <div className="w-full py-4 bg-white/10 border-2 border-white/30 rounded-xl text-center">
                  <p className="text-white/80 font-bold text-sm">
                    🏠 This is your property
                  </p>
                  <p className="text-white/60 text-xs mt-1">
                    You cannot bid on your own listing
                  </p>
                </div>
              ) : (
                <button
                  onClick={onPlaceBid}
                  className="w-full py-4 bg-white text-blue-600 rounded-xl font-black shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 text-lg"
                >
                  <Gavel className="size-6" />
                  Place Bid
                </button>
              )}
            </>
          ) : isCompleted ? (
            <>
              {property.propertyStatus === "sold" ? (
                <div className="bg-white/20 rounded-2xl p-4 text-center text-white border-2 border-white/30">
                  <p className="text-sm text-white/80 mb-1">🎉 SOLD</p>
                  <p className="text-4xl font-black">
                    £
                    {(
                      property.soldPrice ||
                      property.currentBid ||
                      0
                    ).toLocaleString()}
                  </p>
                  {property.soldTo && (
                    <p className="text-xs text-white/70 mt-2">
                      Winner ID:{" "}
                      {typeof property.soldTo === "object"
                        ? property.soldTo.name
                        : property.soldTo.toString().slice(-6)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-white/20 rounded-2xl p-4 text-center text-white border-2 border-white/30">
                  <p className="text-sm text-white/80 mb-1">❌ UNSOLD</p>
                  <p className="text-xs text-white/70 mt-2">
                    Highest Bid: £{(property.currentBid || 0).toLocaleString()}
                  </p>
                </div>
              )}
              <button
                onClick={() => onNavigate(`/auctions/${matchingAuction.slug}`)}
                className="w-full py-4 bg-white/20 text-white border-2 border-white/40 rounded-xl font-bold hover:bg-white/30 transition-all"
              >
                View Auction Results
              </button>
            </>
          ) : isAuctionType ? (
            <>
              <p className="text-white/80 text-sm text-center py-2">
                This property is not currently in a live auction.
              </p>
              <button
                onClick={() => onNavigate("/auctions")}
                className="w-full py-4 bg-white/20 text-white border-2 border-white/40 rounded-xl font-bold hover:bg-white/30 transition-all"
              >
                View Live Auctions
              </button>
            </>
          ) : (
            <>
              <div className="bg-white/20 rounded-2xl p-4 text-center text-white">
                <p className="text-3xl font-black">
                  {formatPrice(startingPrice)}
                </p>
                <p className="text-sm text-white/80">Asking Price</p>
              </div>
              {buyNowPrice > 0 && (
                <div className="bg-white/20 rounded-2xl p-4 text-center text-white">
                  <p className="text-3xl font-black">
                    {formatPrice(buyNowPrice)}
                  </p>
                  <p className="text-sm text-white/80">Buy Now Price</p>
                </div>
              )}
            </>
          )}
          <button
            onClick={handleDownloadBrochure}
            className="w-full py-4 bg-white/20 text-white border-2 border-white/40 rounded-xl font-bold hover:bg-white/30 transition-all flex items-center justify-center gap-2"
          >
            Download Brochure
          </button>
        </div>
      </div>

      {/* Log In / Register to Bid - only for NOT logged in AND auction is live/scheduled */}
      {!isAuthenticated && (isLiveNow || isAuctionType) && !isCompleted && (
        <a
          href="/register?reason=buyer"
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2 text-center"
        >
          <User className="size-5" /> Log In / Register to Bid
        </a>
      )}

      {((isLiveNow || isAuctionType || isDirectSale) && !isCompleted && !isOwnProperty) && (
        <button
          onClick={onOfferNow}
          className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-black text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2 text-center"
        >
          <FileText className="size-5" /> Submit Offer Now
        </button>
      )}


      {/* Property Information Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border-2 border-white/60">
        <h3 className="text-xl font-black text-slate-900 mb-4">
          Property Information
        </h3>
        <div className="space-y-3">
          {[
            {
              label: "Tenure",
              value: property.legalInfo?.ownershipType || "N/A",
            },
            {
              label: "Property Type",
              value:
                property.propertyType?.charAt(0).toUpperCase() +
                  property.propertyType?.slice(1) || "N/A",
            },
            {
              label: "Category",
              value:
                property.propertyCategory?.charAt(0).toUpperCase() +
                  property.propertyCategory?.slice(1) || "N/A",
            },
            // {
            //   label: "Year Built",
            //   value: property.specifications?.yearBuilt || "N/A",
            // },
            {
              label: "Floors",
              value: property.specifications?.floors || "N/A",
            },
            {
              label: "Furnished",
              value: property.specifications?.furnishedStatus || "N/A",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0"
            >
              <span className="text-slate-600 font-semibold">{item.label}</span>
              <span className="font-bold text-slate-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
