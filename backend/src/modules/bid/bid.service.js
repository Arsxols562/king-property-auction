import Bid from "./bid.model.js";
import Auction from "../auction/auction.model.js";
import Property from "../property/property.model.js";
import notificationService, { NotificationEvents } from '../notifications/trigger.service.js';
import { emitBidUpdate } from '../../socket.js';
import cache from '../../utils/cache.js';

// ─── Place Bid (Manual + Auto) ───
export const placeBid = async (data, userId) => {
  if (!data.amount || !isFinite(data.amount) || data.amount <= 0) {
    throw new Error("Invalid bid amount");
  }
  if (data.amount > 100_000_000) {
    throw new Error("Bid amount cannot exceed £100,000,000");
  }

  // Check user permissions
  const User = (await import("../user/user.model.js")).default;
  const bidder = await User.findById(userId).select("permissions role").lean();
  if (!bidder) throw new Error("User not found");
  if (bidder.role === "admin") {
    throw new Error("Administrators cannot place bids");
  }
  if (bidder.permissions?.canBid === false) {
    throw new Error(
      "You do not have bidding permissions. Apply to become a buyer from your dashboard."
    );
  }

  // 1. Check auction exists and is live
  const auction = await Auction.findById(data.auction);
  if (!auction) throw new Error("Auction not found");
  if (auction.status !== "live") throw new Error("Auction is not live");

  // 2. Check property exists and belongs to this auction
  const property = await Property.findById(data.property);
  if (!property) throw new Error("Property not found");
  if (!auction.properties.includes(property._id)) {
    throw new Error("Property does not belong to this auction");
  }

  // Check not bidding on own property
  if (property.createdBy?.toString() === userId.toString()) {
    throw new Error("You cannot bid on your own property");
  }

  // 3. Check property listing type
  if (property.listingType !== "auction") {
    throw new Error("This property is not available for auction bidding");
  }

  // 4. Check property has auto-bid enabled (if this is an auto-bid)
  if (data.isAutoBid && !property.auctionDetails?.autoBidEnabled) {
    throw new Error("Auto-bidding is not enabled for this property");
  }

  // 5. Check bid is higher than property's current bid
  if (data.amount <= property.currentBid) {
    throw new Error(
      `⚠️ Bid must be higher than £${property.currentBid.toLocaleString()}`,
    );
  }

  // 6. Check bid increment
  const bidIncrement =
    property.pricing?.minimumBidIncrement || auction.bidIncrement || 1000;
  if (data.amount < property.currentBid + bidIncrement) {
    throw new Error(
      `⚠️ Bid must be at least £${(property.currentBid + bidIncrement).toLocaleString()}`,
    );
  }

  // 7. Mark all previous bids for THIS PROPERTY as outbid
  await Bid.updateMany(
    { auction: data.auction, property: data.property, status: "winning" },
    { status: "outbid" },
  );

  // 8. Create new bid
  const bid = await Bid.create({
    ...data,
    bidder: userId,
    status: "winning",
  });

    // Emit bid confirmation event
  notificationService.emit(NotificationEvents.BID_PLACED, {
    userId,
    propertyId: data.property,
    auctionId: data.auction,
    amount: data.amount,
  }).catch(e => console.error('Bid confirmation event failed:', e.message));

  // Notify previous winners they've been outbid
  const outbidders = await Bid.find({
    auction: data.auction,
    property: data.property,
    status: 'outbid',
    bidder: { $ne: userId },
  }).populate("bidder", "name email address")

  const notifiedBidders = new Set();
  for (const oldBid of outbidders) {
    const bidderId = oldBid.bidder?._id?.toString();
    if (bidderId && !notifiedBidders.has(bidderId)) {
      notifiedBidders.add(bidderId);
      notificationService.emit(NotificationEvents.BID_OUTBID, {
        userId: bidderId,
        propertyId: data.property,
        auctionId: data.auction,
        newAmount: data.amount,
        previousAmount: oldBid.amount,
      }).catch(e => console.error('Outbid event failed:', e.message));
    }
  }

  // 9. Update property's current bid
  await Property.findByIdAndUpdate(data.property, {
    currentBid: data.amount,
    $inc: { totalBids: 1 },
    winningBidder: userId,
  });

  await cache.delPattern('properties:*');
  await cache.delPattern('auctions:*');

  // 10. Update auction counters
  const allAuctionBids = await Bid.countDocuments({
    auction: data.auction,
    status: { $ne: "retracted" },
  });

  const allAuctionBidders = await Bid.distinct("bidder", {
    auction: data.auction,
    status: { $ne: "retracted" },
  });

  await Auction.findByIdAndUpdate(data.auction, {
    totalBids: allAuctionBids,
    totalBidders: allAuctionBidders.length,
  });

  // Get fresh property data for the emit
  const updatedProperty = await Property.findById(data.property)
    .select('currentBid pricing totalBids');

  emitBidUpdate(data.auction.toString(), {
    propertyId: data.property.toString(),
    auctionId: data.auction.toString(),
    newBid: data.amount,
    currentBid: data.amount,
    totalBids: (updatedProperty?.totalBids || 0),
    reservePrice: updatedProperty?.pricing?.reservePrice || 0,
    reserveMet: data.amount >= (updatedProperty?.pricing?.reservePrice || 0),
    auctionStatus: auction.status,
    isAutoBid: data.isAutoBid || false,
  });

  // 11. Process auto-bids AFTER placing this bid
  await processAutoBids(data.auction, data.property, data.amount);

  return bid.populate(["bidder", "auction", "property"]);
};

// ─── Auto-Bid Processing Engine ───
const processAutoBids = async (auctionId, propertyId, currentBidAmount) => {
  const property = await Property.findById(propertyId);
  if (!property) return;

  // Only process if auto-bidding is enabled for this property
  if (!property.auctionDetails?.autoBidEnabled) return;

  const bidIncrement = property.pricing?.minimumBidIncrement || 1000;

  // Find ALL auto-bids for this property (not just outbid ones)
  // We need to find any bidder who has an auto-bid with a max higher than current
  const allBidders = await Bid.distinct("bidder", {
    auction: auctionId,
    property: propertyId,
    status: { $ne: "retracted" },
  });

  let newCurrentBid = currentBidAmount;
  let processedBidder = null;

  // Find the auto-bidder with the highest max bid who is NOT currently winning
  for (const bidderId of allBidders) {
    // Skip the current winner (they just bid or won via auto-bid)
    const winningBid = await Bid.findOne({
      auction: auctionId,
      property: propertyId,
      status: "winning",
    });
    if (winningBid && winningBid.bidder.toString() === bidderId.toString())
      continue;

    // Find this bidder's highest auto-bid max
    const autoBidConfig = await Bid.findOne({
      auction: auctionId,
      property: propertyId,
      bidder: bidderId,
      isAutoBid: true,
      status: { $ne: "retracted" },
    }).sort({ maxBid: -1 });

    if (!autoBidConfig || !autoBidConfig.maxBid) continue;

    // Check if their max is higher than current bid
    if (autoBidConfig.maxBid > newCurrentBid) {
      // Calculate what they should bid
      const nextBid = newCurrentBid + bidIncrement;
      if (nextBid <= autoBidConfig.maxBid && nextBid > newCurrentBid) {
        // Find previous winner before outbidding them
        const previousWinner = await Bid.findOne({
          auction: auctionId,
          property: propertyId,
          status: "winning",
        }).populate("bidder", "name email address")

        // Place auto-bid on their behalf
        await Bid.updateMany(
          { auction: auctionId, property: propertyId, status: "winning" },
          { status: "outbid" },
        );

        const autoBid = await Bid.create({
          auction: auctionId,
          property: propertyId,
          bidder: bidderId,
          amount: nextBid,
          maxBid: autoBidConfig.maxBid,
          isAutoBid: true,
          status: "winning",
        });

        // Emit bid confirmation for the auto-bidder
        notificationService.emit(NotificationEvents.BID_PLACED, {
          userId: bidderId,
          propertyId,
          auctionId,
          amount: nextBid,
          isAutoBid: true,
        }).catch(e => console.error('Auto-bid confirmation event failed:', e.message));

        // Emit outbid notification for the previous winner
        if (previousWinner && previousWinner.bidder) {
          const prevBidderId = previousWinner.bidder._id?.toString() || previousWinner.bidder.toString();
          if (prevBidderId !== bidderId.toString()) {
            notificationService.emit(NotificationEvents.BID_OUTBID, {
              userId: prevBidderId,
              propertyId,
              auctionId,
              newAmount: nextBid,
              previousAmount: previousWinner.amount,
            }).catch(e => console.error('Auto-bid outbid event failed:', e.message));
          }
        }

        // Update property
        await Property.findByIdAndUpdate(propertyId, {
          currentBid: nextBid,
          $inc: { totalBids: 1 },
          winningBidder: bidderId,
        });

        await cache.delPattern('properties:*');
        await cache.delPattern('auctions:*');

        // Notify clients of the auto-bid
        const autoBidProperty = await Property.findById(propertyId)
          .select('currentBid pricing totalBids');

        emitBidUpdate(auctionId.toString(), {
          propertyId: propertyId.toString(),
          auctionId: auctionId.toString(),
          newBid: nextBid,
          currentBid: nextBid,
          totalBids: (autoBidProperty?.totalBids || 0),
          reservePrice: autoBidProperty?.pricing?.reservePrice || 0,
          reserveMet: nextBid >= (autoBidProperty?.pricing?.reservePrice || 0),
          isAutoBid: true,
        });

        newCurrentBid = nextBid;
        processedBidder = bidderId;
      }
    }
  }

  // Recursively process - if we auto-bid, other auto-bidders might need to respond
  if (processedBidder) {
    // Allow a small delay to prevent infinite loops
    await new Promise((resolve) => setTimeout(resolve, 100));
    await processAutoBids(auctionId, propertyId, newCurrentBid);
  }
};

// ─── Get Bid History ───
export const getBidHistory = async (auctionId, propertyId) => {
  const filter = { auction: auctionId };
  if (propertyId) filter.property = propertyId;

  const bids = await Bid.find(filter)
    .populate("bidder", "name email address")
    .populate("property", "propertyTitle currentBid")
    .sort("-amount");

  const currentHighBid = bids.length > 0 ? bids[0].amount : 0;
  const uniqueBidders = new Set(bids.map((b) => b.bidder._id.toString())).size;

  return {
    bids,
    currentHighBid,
    totalBids: bids.length,
    uniqueBidders,
  };
};

// ─── Get My Bids ───
export const getMyBids = async (userId) => {
  return Bid.find({ bidder: userId })
    .populate("auction", "auctionTitle slug status startDateTime endDateTime currentBid totalBids auctionType reservePrice")
    .populate("property", "propertyTitle slug media pricing location currentBid totalBids propertyStatus")
    .sort("-createdAt");
};

// ─── Get Current High Bid ───
export const getCurrentHighBid = async (auctionId, propertyId) => {
  return Bid.findOne({
    auction: auctionId,
    property: propertyId,
    status: { $ne: "retracted" },
  })
    .sort("-amount")
    .populate("bidder", "name");
};

// ─── Retract Bid ───
export const retractBid = async (bidId, userId) => {
  const bid = await Bid.findById(bidId);
  if (!bid) throw new Error("Bid not found");
  if (bid.bidder.toString() !== userId.toString())
    throw new Error("Not your bid");

  // Check time limit (5 minutes)
  const bidAge = Date.now() - bid.createdAt.getTime();
  if (bidAge > 5 * 60 * 1000)
    throw new Error("Bids can only be retracted within 5 minutes");

  bid.status = "retracted";
  await bid.save();

  // Find new winning bid
  const nextBid = await Bid.findOne({
    auction: bid.auction,
    property: bid.property,
    status: { $ne: "retracted" },
    _id: { $ne: bidId },
  }).sort("-amount");

  if (nextBid) {
    nextBid.status = "winning";
    await nextBid.save();
    await Property.findByIdAndUpdate(bid.property, {
      currentBid: nextBid.amount,
      winningBidder: nextBid.bidder,
    });
  }

  return bid;
};

// ─── Get Bidding Stats ───
export const getBiddingStats = async (auctionId, propertyId) => {
  const property = await Property.findById(propertyId);
  if (!property) throw new Error("Property not found");

  const bids = await Bid.find({
    auction: auctionId,
    property: propertyId,
    status: { $ne: "retracted" },
  });

  const totalBids = bids.length;
  const uniqueBidders = new Set(bids.map((b) => b.bidder.toString())).size;

  return {
    totalBids,
    uniqueBidders,
    currentHighBid: property.currentBid,
    startingBid: property.pricing?.startingAuctionPrice || 0,
    averageBid:
      totalBids > 0
        ? Math.round(bids.reduce((sum, b) => sum + b.amount, 0) / totalBids)
        : 0,
  };
};

// ─── ADMIN: Get All Bids (Paginated, Filtered) ───
export const getAllBids = async (query = {}) => {
  const {
    page = 1,
    limit = 20,
    auctionId,
    propertyId,
    bidderId,
    status,
    sortBy = "-createdAt",
    search,
  } = query;

  const filter = {};
  if (auctionId) filter.auction = auctionId;
  if (propertyId) filter.property = propertyId;
  if (bidderId) filter.bidder = bidderId;
  if (status) filter.status = status;

  if (search) {
    const User = (await import('../user/user.model.js')).default;
    const searchRegex = new RegExp(search, 'i');
    const [matchingUsers, matchingProperties] = await Promise.all([
      User.find({ $or: [{ name: searchRegex }, { email: searchRegex }] }).select('_id').lean(),
      Property.find({ propertyTitle: searchRegex }).select('_id').lean(),
    ]);
    filter.$or = [
      { bidder: { $in: matchingUsers.map(u => u._id) } },
      { property: { $in: matchingProperties.map(p => p._id) } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [bids, total] = await Promise.all([
    Bid.find(filter)
      .populate("bidder", "name email address phone bankDetails")
      .populate("auction", "auctionTitle slug status")
      .populate("property", "propertyTitle slug currentBid")
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit)),
    Bid.countDocuments(filter),
  ]);

  return {
    bids,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
};

// ─── ADMIN: Get Bids Stats ───
export const getBidsStats = async () => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [totalBids, todayBids, totalBidders, winningBids, outbidBids, wonBids] =
    await Promise.all([
      Bid.countDocuments(),
      Bid.countDocuments({ createdAt: { $gte: todayStart } }),
      Bid.distinct("bidder").then((ids) => ids.length),
      Bid.countDocuments({ status: "winning" }),
      Bid.countDocuments({ status: "outbid" }),
      Bid.countDocuments({ status: "won" }), // ADD THIS
    ]);

  return {
    totalBids,
    todayBids,
    totalBidders,
    winningBids,
    outbidBids,
    wonBids,
  };
};
