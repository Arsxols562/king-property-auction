import Property from "./property.model.js";
import notificationService, {
  NotificationEvents,
} from "../notifications/trigger.service.js";
import Auction from "../auction/auction.model.js";
import cache from "../../utils/cache.js";
import User from "../user/user.model.js";

export const createProperty = async (propertyData, userId) => {
  const property = await Property.create({
    ...propertyData,
    createdBy: userId,
    currentBid: propertyData.pricing?.startingAuctionPrice || 0, // Initialize currentBid
  });
  // Notify admin
  notificationService
    .emit(NotificationEvents.PROPERTY_SUBMITTED, {
      propertyId: property._id,
      userId,
    })
    .catch((e) => console.error("Property submitted event failed:", e.message));

  await cache.delPattern("properties:*");
  return property;
};

export const getProperties = async (query = {}) => {
  const cacheKey = `properties:${JSON.stringify(query)}`;
  // Don't cache search queries - results change too frequently
  if (!query.noCache && !query.search) {
    const cached = await cache.get(cacheKey);
    if (cached) return cached;
  }

  const {
    page = 1,
    limit = 10,
    status,
    type,
    category,
    listingType,
    city,
    auctionStatus,
    sortBy = "-createdAt",
    minPrice,
    maxPrice,
    minBeds,
    maxBeds,
  } = query;

  const filter = {};

  if (status)
    filter.propertyStatus = status.includes(",")
      ? { $in: status.split(",").map((s) => s.trim()) }
      : status;
  if (type) filter.propertyType = type;

  // If approvalStatus is 'all', don't add filter → shows all statuses
  if (query.approvalStatus && query.approvalStatus !== "all") {
    filter.approvalStatus = query.approvalStatus;
  } else if (!query.approvalStatus || query.approvalStatus === "") {
    filter.approvalStatus = "approved";
  }
  if (category) filter.propertyCategory = category;
  if (listingType) filter.listingType = listingType;
  if (city) filter["location.city"] = city;

  // Search filter - searches across ALL columns
  if (query.search) {
    const term = query.search.trim();
    const isLotSearch = /^[a-f0-9]{2,24}$/i.test(term);

    if (!isLotSearch) {
      const searchRegex = new RegExp(
        term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );
      const numericSearch = !isNaN(Number(term)) ? Number(term) : null;

      // Search for matching users first (for owner name/email search)
      const matchingUsers = await User.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
        ],
      }).select("_id");
      const matchingUserIds = matchingUsers.map((u) => u._id);

      filter.$or = [
        // Property fields
        { propertyTitle: searchRegex },
        { propertyDescription: searchRegex },
        { propertyType: searchRegex },
        { propertyStatus: searchRegex },
        { approvalStatus: searchRegex },
        { listingType: searchRegex },
        { propertyCategory: searchRegex },
        { propertyID: searchRegex },
        // Location fields
        { "location.city": searchRegex },
        { "location.area": searchRegex },
        { "location.state": searchRegex },
        { "location.streetAddress": searchRegex },
        { "location.postalCode": searchRegex },
        { "location.country": searchRegex },
        // Specifications
        { "specifications.furnishedStatus": searchRegex },
        // Legal
        { "legalInfo.ownershipType": searchRegex },
        { "legalInfo.solicitorDetails.name": searchRegex },
        { "legalInfo.solicitorDetails.firmName": searchRegex },
        { "legalInfo.solicitorDetails.email": searchRegex },
        // Seller/Agent info
        { "sellerInfo.agentName": searchRegex },
        { "sellerInfo.agentContact": searchRegex },
        // Owner (createdBy)
        ...(matchingUserIds.length > 0
          ? [{ createdBy: { $in: matchingUserIds } }]
          : []),
      ];

      // Numeric search for price fields
      if (numericSearch !== null) {
        filter.$or.push(
          { "pricing.startingAuctionPrice": numericSearch },
          { "pricing.reservePrice": numericSearch },
          { "pricing.buyNowPrice": numericSearch },
          { "pricing.estimatedMarketValue": numericSearch },
          { currentBid: numericSearch },
          { soldPrice: numericSearch },
        );
      }
    } else {
      // Lot # search - fetch all and filter by _id ending
      filter._isLotSearch = term.toLowerCase();
    }
  }

  if (query.location) {
    filter["location.city"] = new RegExp(query.location, "i");
  }
  if (auctionStatus) filter["auctionDetails.auctionStatus"] = auctionStatus;
  if (query.excludeSold === "true") {
    filter.propertyStatus = { $ne: "sold" };
  }

  // Price filter - use currentBid only (not starting price)
  if (minPrice || maxPrice) {
    filter.currentBid = {};
    if (minPrice) filter.currentBid.$gte = parseInt(minPrice);
    if (maxPrice) filter.currentBid.$lte = parseInt(maxPrice);
  }

  // Beds filter
  if (minBeds || maxBeds) {
    filter["specifications.bedrooms"] = {};
    if (minBeds) filter["specifications.bedrooms"].$gte = parseInt(minBeds);
    if (maxBeds) filter["specifications.bedrooms"].$lte = parseInt(maxBeds);
  }

  if (query.auctionSlug) {
    // Find the auction by slug, then filter properties by its property IDs
    const Auction = (await import("../auction/auction.model.js")).default;
    const auction = await Auction.findOne({ slug: query.auctionSlug });
    if (auction) {
      filter._id = { $in: auction.properties };
    }
  }

  const skip = (page - 1) * limit;

  // Remove custom filter keys before querying
  const cleanFilter = { ...filter };
  const isLotSearch = cleanFilter._isLotSearch;
  delete cleanFilter._searchTerm;
  delete cleanFilter._isLotSearch;

  const [properties, total] = await Promise.all([
    Property.find(cleanFilter)
      .select(
        "propertyTitle slug propertyType listingType propertyStatus approvalStatus location pricing specifications media auctionDetails currentBid totalBids featured soldPrice soldTo createdBy winningBidder createdAt updatedAt legalInfo propertyID propertyDescription termsOfSale sellerInfo",
      )
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name email phone agentDetails")
      .populate("winningBidder", "name email"),
    Property.countDocuments(cleanFilter),
  ]);

  // Post-filter for Lot # search (since _id substring matching is limited in MongoDB $or)
  let filteredProperties = properties;
  if (isLotSearch) {
    filteredProperties = properties.filter((p) => {
      const lotNo = (
        p.propertyID ||
        p._id?.toString()?.slice(-6) ||
        ""
      ).toLowerCase();
      return lotNo.includes(isLotSearch);
    });
  }

  const result = {
    properties: filteredProperties,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };

  // Cache for 10 seconds (skip for search queries)
  if (!query.search) {
    await cache.set(cacheKey, result, 10);
  }

  return result;
};

export const getPropertyById = async (id) => {
  const cacheKey = `property:${id}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const property = await Property.findById(id).populate(
    "createdBy",
    "name email phone address",
  );
  if (!property) throw new Error("Property not found");

  await cache.set(cacheKey, property, 10);
  return property;
};

export const updateProperty = async (id, updateData) => {
  // If starting price changed and no bids yet, sync currentBid
  if (updateData.pricing?.startingAuctionPrice) {
    const existing = await Property.findById(id);
    if (existing && (!existing.totalBids || existing.totalBids === 0)) {
      updateData.currentBid = Number(updateData.pricing.startingAuctionPrice);
    }
  }

  const property = await Property.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!property) throw new Error("Property not found");
  if (!property) throw new Error("Property not found");
  await cache.delPattern("properties:*");
  await cache.del(`property:${id}`);
  return property;
};

export const deleteProperty = async (id) => {
  const property = await Property.findByIdAndDelete(id);
  if (!property) throw new Error("Property not found");

  // Remove this property from all auctions that reference it
  await Auction.updateMany({ properties: id }, { $pull: { properties: id } });

  await cache.delPattern("properties:*");
  await cache.del(`property:${id}`);

  return property;
};

export const approveProperty = async (id, status) => {
  const property = await Property.findByIdAndUpdate(
    id,
    { approvalStatus: status },
    { new: true },
  );
  if (!property) throw new Error("Property not found");
  return property;
};
