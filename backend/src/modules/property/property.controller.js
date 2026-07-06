import {
  createPropertySchema,
  updatePropertySchema,
} from "./property.validation.js";
import * as propertyService from "./property.service.js";
import Property from "./property.model.js";
import Auction from "../auction/auction.model.js";
import notificationService, {
  NotificationEvents,
} from "../notifications/trigger.service.js";
import cache from "../../utils/cache.js";

export const create = async (req, res) => {
  console.log(
    "📸 Images received:",
    req.body.media?.propertyImages || req.body.propertyImages || "NONE",
  );

  // Use frontend coordinates if provided (from Google Places), otherwise geocode
  if (
    req.body.location?.streetAddress &&
    !req.body.location?.latitude &&
    !req.body.location?.longitude
  ) {
    try {
      const addr = [
        req.body.location.streetAddress,
        req.body.location.city,
        req.body.location.postalCode,
        "UK",
      ]
        .filter(Boolean)
        .join(", ");
      const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`;
      const geoRes = await fetch(geoUrl, {
        headers: { "User-Agent": "KingPropertyAuction/1.0" },
      });
      const geoData = await geoRes.json();
      if (geoData && geoData.length > 0) {
        req.body.location.latitude = parseFloat(geoData[0].lat);
        req.body.location.longitude = parseFloat(geoData[0].lon);
      }
    } catch (e) {
      console.warn("Geocoding failed:", e.message);
    }
  }
  try {
    // Map flat frontend data to nested backend structure
    const isAgentOrSeller =
      req.user.role === "agent" || req.user.role === "seller";
    const body = {
      propertyTitle: req.body.propertyTitle,
      propertyDescription: req.body.propertyDescription,
      propertyType: req.body.propertyType,
      propertyCategory: req.body.propertyCategory,
      listingType: req.body.listingType,
      propertyID: req.body.propertyID || undefined,
      propertyStatus: req.body.propertyStatus,

      location: {
        country: req.body.country || "United Kingdom",
        state: req.body.state,
        city: req.body.city,
        area: req.body.area,
        streetAddress: req.body.streetAddress,
        postalCode: req.body.postalCode,
      },

      specifications: {
        bedrooms: Number(req.body.bedrooms) || 0,
        bathrooms: Number(req.body.bathrooms) || 0,
        floors: Number(req.body.floors) || undefined,
        yearBuilt: Number(req.body.yearBuilt) || undefined,
        parkingSpaces: Number(req.body.parkingSpaces) || undefined,
        furnishedStatus: req.body.furnishedStatus || "unfurnished",
      },

      pricing: {
        currency: req.body.currency || "GBP",
        startingAuctionPrice: Number(req.body.startingAuctionPrice) || 0,
        reservePrice: Number(req.body.reservePrice) || 0,
        buyNowPrice: Number(req.body.buyNowPrice) || undefined,
        minimumBidIncrement: Number(req.body.minimumBidIncrement) || 0,
        estimatedMarketValue:
          Number(req.body.estimatedMarketValue) || undefined,
      },

      auctionDetails: {
        auctionStatus: req.body.auctionStatus || "upcoming",
        bidDepositAmount: Number(req.body.bidDepositAmount) || undefined,
        autoBidEnabled: req.body.autoBidEnabled || false,
        maximumBidLimit: Number(req.body.maximumBidLimit) || undefined,
      },

      features: req.body.features || {},

      legalInfo: {
        ownershipType:
          req.body.legalInfo?.ownershipType ||
          req.body.ownershipType ||
          "freehold",
        titleDeedNumber:
          req.body.legalInfo?.titleDeedNumber || req.body.titleDeedNumber,
        solicitorDetails: req.body.legalInfo?.solicitorDetails || {},
        privateDocuments: req.body.legalInfo?.privateDocuments || [],
      },

      sellerInfo: {
        agentName: isAgentOrSeller
          ? req.user.name
          : req.body.sellerInfo?.agentName || req.body.agentName || "",
        agentContact: isAgentOrSeller
          ? req.user.phone || req.user.email || ""
          : req.body.sellerInfo?.agentContact || req.body.agentContact || "",
        agentId: isAgentOrSeller
          ? req.user._id
          : req.body.sellerInfo?.agentId || req.body.agentId || null,
      },

      approvalStatus: req.body.approvalStatus || "pending",
      media: {
        propertyImages:
          req.body.media?.propertyImages || req.body.propertyImages || [],
        propertyVideos:
          req.body.media?.propertyVideos ||
          (req.body.media?.propertyVideo
            ? [req.body.media.propertyVideo]
            : req.body.propertyVideos ||
              (req.body.propertyVideo ? [req.body.propertyVideo] : [])),
        virtualTour:
          req.body.media?.virtualTour || req.body.virtualTour || undefined,
        floorPlans:
          req.body.media?.floorPlans ||
          (req.body.media?.floorPlan
            ? [req.body.media.floorPlan]
            : req.body.floorPlans ||
              (req.body.floorPlan ? [req.body.floorPlan] : [])),
        legalDocuments:
          req.body.media?.legalDocuments || req.body.legalDocuments || [],
      },
    };

    const { error, value } = createPropertySchema.validate(body, {
      allowUnknown: true,
    });
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const property = await propertyService.createProperty(value, req.user._id);

    if (req.user.role === "admin") {
      await propertyService.approveProperty(
        property._id,
        "approved",
        req.user._id,
      );
      property.approvalStatus = "approved";
      console.log(
        "[Property] Auto-approved for admin:",
        property.propertyTitle,
      );
    }

        // Submit to Zoopla if enabled
    if (req.body.listOnZoopla) {
      try {
        const zooplaService = await import("../zoopla/zoopla.service.js");
        const zooplaResult = await zooplaService.createListing({
          ...req.body,
          media: req.body.media || {},
        });
        
        if (zooplaResult.success) {
          await Property.findByIdAndUpdate(property._id, {
            "zoopla.listingId": zooplaResult.zooplaId,
            "zoopla.status": "active",
            "zoopla.lastSync": new Date(),
          });
          console.log(`[Zoopla] Property listed: ${zooplaResult.zooplaId}`);
        } else {
          await Property.findByIdAndUpdate(property._id, {
            "zoopla.status": "failed",
            "zoopla.errorMessage": zooplaResult.error,
            "zoopla.lastSync": new Date(),
          });
          console.warn(`[Zoopla] Failed to list property: ${zooplaResult.error}`);
        }
      } catch (e) {
        console.error("[Zoopla] Error submitting to Zoopla:", e.message);
      }
    }

    res.status(201).json({
      success: true,
      data: property,
      message: "Property created successfully",
    });
  } catch (error) {
    console.error("[Property] create error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const result = await propertyService.getProperties(req.query);

    res.status(200).json({
      success: true,
      data: result.properties,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("[Property] getAll error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getById = async (req, res) => {
  try {
    const { id } = req.params; // ← Changed from slug to id
    let property = await Property.findById(id)
      .populate("createdBy", "name email phone address")
      .catch(() => null);
    if (!property) {
      property = await Property.findOne({ slug: id });
    }
    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    const propertyObj = property.toObject();

    // Strip private docs unless caller is admin or property owner
    const isAdmin =
      req.user?.role === "admin" || req.user?.role === "superadmin";
    const ownerId =
      property.createdBy?._id?.toString() || property.createdBy?.toString();
    const userId = req.user?._id?.toString() || req.user?.id?.toString();
    const isOwner = ownerId && userId && ownerId === userId;

    if (!isAdmin && !isOwner && propertyObj.legalInfo) {
      delete propertyObj.legalInfo.privateDocuments;
    }

    res.status(200).json({ success: true, data: propertyObj });
  } catch (error) {
    console.error("[Property] getById error:", error.message);
    res.status(404).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    // Geocode address if location changed
    if (req.body.location?.streetAddress) {
      try {
        const addr = [
          req.body.location.streetAddress,
          req.body.location.city,
          req.body.location.postalCode,
          "UK",
        ]
          .filter(Boolean)
          .join(", ");
        const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`;
        const geoRes = await fetch(geoUrl, {
          headers: { "User-Agent": "KingPropertyAuction/1.0" },
        });
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          req.body.location.latitude = parseFloat(geoData[0].lat);
          req.body.location.longitude = parseFloat(geoData[0].lon);
        }
      } catch (e) {
        console.warn("Geocoding failed:", e.message);
      }
    }
      const { error, value } = updatePropertySchema.validate(req.body, {
        allowUnknown: true,
        abortEarly: false,
      });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details.map((d) => d.message).join("; "),
      });
    }

    // Preserve privateDocuments — Joi strips unknown keys, ensure these pass through
    if (req.body.legalInfo?.privateDocuments !== undefined) {
      if (!value.legalInfo) value.legalInfo = {};
      value.legalInfo.privateDocuments = req.body.legalInfo.privateDocuments;
    }
    if (req.body.legalInfo?.solicitorDetails !== undefined) {
      if (!value.legalInfo) value.legalInfo = {};
      value.legalInfo.solicitorDetails = req.body.legalInfo.solicitorDetails;
    }

    const property = await propertyService.updateProperty(req.params.id, value);

    res.status(200).json({
      success: true,
      data: property,
      message: "Property updated successfully",
    });
  } catch (error) {
    console.error("[Property] update error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const remove = async (req, res) => {
  try {
    await propertyService.deleteProperty(req.params.id);

    res.status(200).json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error) {
    console.error("[Property] remove error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyProperties = async (req, res) => {
  try {
    const properties = await Property.find({ createdBy: req.user._id })
      .select(
        "propertyTitle slug propertyType propertyStatus approvalStatus location pricing media currentBid totalBids createdAt",
      )
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: properties });
  } catch (error) {
    console.error("[Property] getMyProperties error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleWatchlist = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    const userId = req.user._id;
    const isSaved = property.savedBy?.some(
      (id) => id.toString() === userId.toString(),
    );

    if (isSaved) {
      await Property.findByIdAndUpdate(req.params.id, {
        $pull: { savedBy: userId },
      });
    } else {
      await Property.findByIdAndUpdate(req.params.id, {
        $addToSet: { savedBy: userId },
      });
    }

    res.json({
      success: true,
      data: { saved: !isSaved },
      message: isSaved ? "Removed from watchlist" : "Added to watchlist",
    });
  } catch (error) {
    console.error("[Property] toggleWatchlist error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getWatchlist = async (req, res) => {
  try {
    const properties = await Property.find({ savedBy: req.user._id })
      .select(
        "propertyTitle slug propertyType location pricing media currentBid totalBids propertyStatus approvalStatus createdAt",
      )
      .sort({ createdAt: -1 });
    res.json({ success: true, data: properties });
  } catch (error) {
    console.error("[Property] getWatchlist error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyPropertyAuctionStats = async (req, res) => {
  try {
    const myProperties = await Property.find({
      createdBy: req.user._id,
    }).select("_id propertyTitle approvalStatus");
    const propertyIds = myProperties.map((p) => p._id);

    const auctions = await Auction.find({ properties: { $in: propertyIds } })
      .select(
        "auctionTitle slug status currentBid totalBids startDateTime endDateTime properties",
      )
      .sort({ createdAt: -1 });

    const totalProperties = myProperties.length;
    const approvedProperties = myProperties.filter(
      (p) => p.approvalStatus === "approved",
    ).length;
    const pendingProperties = myProperties.filter(
      (p) => p.approvalStatus === "pending",
    ).length;
    const liveAuctions = auctions.filter((a) => a.status === "live").length;
    const completedAuctions = auctions.filter(
      (a) => a.status === "completed",
    ).length;
    const totalRevenue = auctions
      .filter((a) => a.status === "completed")
      .reduce((sum, a) => sum + (a.currentBid || 0), 0);

    const BidModel = (await import("../bid/bid.model.js")).default;
    const totalBidsReceived = await BidModel.countDocuments({
      property: { $in: propertyIds },
      status: { $ne: "retracted" },
    });

    const enrichedAuctions = await Promise.all(
      auctions.slice(0, 5).map(async (auction) => {
        const Bid = (await import("../bid/bid.model.js")).default;
        const auctionObj = auction.toObject ? auction.toObject() : auction;

        // Bid stats per property (exclude retracted)
        const propertyBids = await Bid.aggregate([
          {
            $match: {
              auction: auction._id,
              property: { $in: propertyIds },
              status: { $ne: "retracted" },
            },
          },
          {
            $group: {
              _id: "$property",
              totalBids: { $sum: 1 },
              highestBid: { $max: "$amount" },
            },
          },
        ]);

        // Seller's own properties in this specific auction
        const sellerPropsInAuction = myProperties.filter((p) =>
          auctionObj.properties?.some(
            (ap) => ap.toString() === p._id.toString(),
          ),
        );

        // Fetch full details only for this seller's properties
        const propertyDetails = await Property.find({
          _id: { $in: sellerPropsInAuction.map((p) => p._id) },
        })
          .select(
            "_id propertyTitle pricing currentBid totalBids media location propertyStatus",
          )
          .lean();

        // Merge bid stats into property details
        auctionObj.propertyBreakdown = propertyDetails.map((prop) => {
          const bidStats = propertyBids.find(
            (b) => b._id.toString() === prop._id.toString(),
          );
          return {
            _id: prop._id,
            propertyTitle: prop.propertyTitle,
            location: prop.location,
            startingPrice: prop.pricing?.startingAuctionPrice || 0,
            reservePrice: prop.pricing?.reservePrice || 0,
            currentBid: prop.currentBid || 0,
            totalBids: bidStats?.totalBids || 0,
            highestBid: bidStats?.highestBid || 0,
            auctionStatus: auction.status,
            isSoldInThisAuction:
              auction.status === "completed" &&
              (bidStats?.highestBid || 0) > 0 &&
              (bidStats?.highestBid || 0) >= (prop.pricing?.reservePrice || 0),
            image: prop.media?.propertyImages?.[0] || null,
            reserveMet:
              (bidStats?.highestBid || 0) > 0 &&
              (bidStats?.highestBid || 0) >= (prop.pricing?.reservePrice || 0),
          };
        });

        return auctionObj;
      }),
    );

    res.status(200).json({
      success: true,
      data: {
        totalProperties,
        approvedProperties,
        pendingProperties,
        liveAuctions,
        completedAuctions,
        totalRevenue,
        totalBidsReceived,
        recentAuctions: enrichedAuctions,
      },
    });
  } catch (error) {
    console.error("[Property] getMyPropertyAuctionStats error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getByIds = async (req, res) => {
  try {
    const { ids } = req.body;
    const properties = await Property.find({ _id: { $in: ids } });
    res.status(200).json({ success: true, data: properties });
  } catch (error) {
    console.error("[Property] getByIds error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyPropertyBidders = async (req, res) => {
  try {
    const myProperties = await Property.find({
      createdBy: req.user._id,
    })
      .select("_id propertyTitle media pricing currentBid")
      .lean();

    const propertyIds = myProperties.map((p) => p._id);

    const Bid = (await import("../bid/bid.model.js")).default;
    const bids = await Bid.find({
      property: { $in: propertyIds },
      status: { $ne: "retracted" },
    })
      .populate("bidder", "name email")
      .populate("property", "propertyTitle media currentBid pricing")
      .populate("auction", "auctionTitle slug status")
      .sort("-amount")
      .lean();

    const byProperty = {};
    for (const bid of bids) {
      const pid = bid.property?._id?.toString();
      if (!pid) continue;
      if (!byProperty[pid]) {
        byProperty[pid] = {
          property: bid.property,
          bids: [],
          highestBid: 0,
          totalBids: 0,
          uniqueBidders: new Set(),
        };
      }
      byProperty[pid].bids.push({
        _id: bid._id,
        amount: bid.amount,
        status: bid.status,
        bidder: {
          name: bid.bidder?.name || "Anonymous",
          email: bid.bidder?.email || "",
          initial: (bid.bidder?.name || "A").charAt(0).toUpperCase(),
        },
        auction: bid.auction,
        createdAt: bid.createdAt,
      });
      byProperty[pid].totalBids++;
      byProperty[pid].uniqueBidders.add(bid.bidder?._id?.toString());
      if (bid.amount > byProperty[pid].highestBid) {
        byProperty[pid].highestBid = bid.amount;
      }
    }

    const result = Object.values(byProperty).map((item) => ({
      property: item.property,
      bids: item.bids.slice(0, 5),
      highestBid: item.highestBid,
      totalBids: item.totalBids,
      uniqueBidders: item.uniqueBidders.size,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("[Property] getMyPropertyBidders error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePrivateDocument = async (req, res) => {
  try {
    const { propertyId, docIndex } = req.params;
    const property = await Property.findById(propertyId);
    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    const isAdmin =
      req.user?.role === "admin" || req.user?.role === "superadmin";
    const isOwner =
      property.createdBy?.toString() === req.user?._id?.toString();
    if (!isAdmin && !isOwner) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const docs = property.legalInfo?.privateDocuments || [];
    const idx = parseInt(docIndex);
    const docToDelete = docs[idx];
    if (!docToDelete) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }

    try {
      const { default: fs } = await import("fs");
      const { default: path } = await import("path");
      const filePath = path.join(process.cwd(), docToDelete.url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) {
      console.warn("File delete failed:", e.message);
    }

    docs.splice(idx, 1);
    property.legalInfo.privateDocuments = docs;
    await property.save();

    await cache.del(`property:${propertyId}`);

    res.json({ success: true, message: "Document deleted", data: docs });
  } catch (error) {
    console.error("[Property] deletePrivateDocument error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approve = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Use: pending, approved, or rejected",
      });
    }

    const property = await propertyService.approveProperty(
      req.params.id,
      status,
    );

    await cache.delPattern("properties:*");
    await cache.del(`property:${req.params.id}`);

    res.status(200).json({
      success: true,
      data: property,
      message: `Property ${status}`,
    });

    // Send notification
    if (status === "approved") {
      notificationService
        .emit(NotificationEvents.PROPERTY_APPROVED, {
          propertyId: req.params.id,
        })
        .catch((e) =>
          console.error("Property approved event failed:", e.message),
        );
    } else if (status === "rejected") {
      notificationService
        .emit(NotificationEvents.PROPERTY_REJECTED, {
          propertyId: req.params.id,
          reason: req.body.reason || "Not specified",
        })
        .catch((e) =>
          console.error("Property rejected event failed:", e.message),
        );
    }
  } catch (error) {
    console.error("[Property] approve error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
