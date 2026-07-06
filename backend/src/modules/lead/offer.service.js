import PropertyOffer from "./offer.model.js";
import Lead from "./lead.model.js";
import Property from "../property/property.model.js";
import User from "../user/user.model.js";
import Notification from "../notifications/notification.model.js";
import { sendEmail } from "../notifications/email.service.js";
import { isNotificationEnabled } from "../settings/settings.service.js";
import { emitToAdmins, emitToUser } from "../../socket.js";

export const submitOffer = async (data, userId = null) => {
  // 1. Validate property exists
  const property = await Property.findById(data.property).lean();
  if (!property) throw new Error("Property not found");
  
    // Prevent owner from offering on their own property
  if (userId && property.createdBy?.toString() === userId.toString()) {
    throw new Error("You cannot submit an offer on your own property");
  }

  // 2. Check if user already has a pending offer for this property - update it instead
  let offer = await PropertyOffer.findOne({
    property: data.property,
    email: data.email,
    status: "pending",
  });

  // Mark ALL previous pending offers from this person for this property as "updated"
  await PropertyOffer.updateMany(
    { 
      property: data.property, 
      email: data.email, 
      status: "pending"
    },
    { status: "updated" }
  );

  // Always create a new offer (maintains negotiation history)
  offer = await PropertyOffer.create({
    ...data,
    submittedBy: userId || null,
    status: "pending",
  });

  // 3. Populate property details for emails
  const populatedOffer = await PropertyOffer.findById(offer._id)
    .populate("property", "propertyTitle slug propertyID")
    .lean();

  const propertyTitle = populatedOffer.property?.propertyTitle || "Property";
  const siteUrl = process.env.CLIENT_URL || "http://localhost:5173";

  // 4. Create a Lead for admin tracking + inbox
  const lead = await Lead.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    subject: `Property Offer: ${propertyTitle}`,
    message: [
      `OFFER DETAILS:`,
      `Offer Amount: £${data.offerAmount.toLocaleString()}`,
      `Amount in Words: ${data.offerAmountInWords}`,
      `Address: ${data.address}, ${data.city}, ${data.postcode}`,
      `Solicitor: ${data.solicitorDetails}`,
      `Terms Accepted: Yes`,
      ``,
      `PROPERTY:`,
      `Property: ${propertyTitle}`,
      `Property ID: ${property.propertyID || property._id}`,
      `Property URL: ${siteUrl}/properties/${property.slug || property._id}`,
    ].join("\n"),
    leadType: "property_offer",
    status: "new",
    property: data.property,
    approvalStatus: "pending",
  });

  // Link offer to lead
  await PropertyOffer.findByIdAndUpdate(offer._id, { lead: lead._id });

  // 5. Create inbox conversation from lead (same as other leads)
  import("../message/message.service.js")
    .then(async ({ createConversationFromLead }) => {
      await createConversationFromLead(lead._id);
    })
    .catch((e) =>
      console.error("[Offer] Conversation creation failed:", e.message),
    );

  // 6. Email to the offeror (confirmation)
  const confirmEnabled = await isNotificationEnabled("offerConfirmation");
  if (confirmEnabled) {
    await sendEmail({
      to: data.email,
      subject: `✅ Offer Received - ${propertyTitle}`,
      templateKey: "offerConfirmation",
      variables: {
        offeror_name: data.name,
        property_title: propertyTitle,
        offer_amount: `£${data.offerAmount.toLocaleString()}`,
        property_url: `${siteUrl}/properties/${property.slug || property._id}`,
        site_url: siteUrl,
      },
    }).catch((e) =>
      console.warn("Offer confirmation email failed:", e.message),
    );
  }

  // 7. Email to all admins
  const adminEnabled = await isNotificationEnabled("offerNotification");
  if (adminEnabled) {
    const admins = await User.find({ role: "admin", isActive: true })
      .select("email name")
      .lean();
    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: `📩 New Property Offer: ${data.name} - ${propertyTitle}`,
        templateKey: "offerNotification",
        variables: {
          bidder_name: admin.name,
          property_title: propertyTitle,
          your_bid: `£${data.offerAmount.toLocaleString()}`,
          property_url: `${siteUrl}/properties/${property.slug || property._id}`,
          custom_message: `${data.name} has submitted an offer of £${data.offerAmount.toLocaleString()} for ${propertyTitle}.`,
          site_url: siteUrl,
        },
      }).catch(() => {});
    }
  }

  // 8. Admin notification (bell)
  await Notification.create({
    type: "offer",
    icon: "file-text",
    message: `📩 New property offer from ${data.name}: £${data.offerAmount.toLocaleString()} for ${propertyTitle}`,
    link: "/admin/leads",
    color: "purple",
    targetUser: null,
  }).catch((e) => console.warn("Admin offer notification failed:", e.message));

  // 8. Notify property owner via bell + email
  try {
    const owner = await User.findById(property.createdBy)
      .select("email name role")
      .lean();
    if (owner && owner.role !== "admin") {
      // Bell notification
      await Notification.create({
        type: "offer",
        icon: "file-text",
        message: `📩 New offer on your property "${propertyTitle}": £${data.offerAmount.toLocaleString()} from ${data.name}`,
        link: "/dashboard/my-properties",
        color: "purple",
        targetUser: owner._id,
      }).catch(() => {});

      emitToUser(owner._id.toString(), "new_notification", {
        type: "offer",
        message: `New offer on "${propertyTitle}"`,
        link: "/dashboard/my-properties",
      });

      // Email to owner
      if (adminEnabled) {
        await sendEmail({
          to: owner.email,
          subject: `📩 New Offer on Your Property - ${propertyTitle}`,
          templateKey: "offerNotification",
          variables: {
            bidder_name: owner.name,
            property_title: propertyTitle,
            your_bid: `£${data.offerAmount.toLocaleString()}`,
            property_url: `${siteUrl}/properties/${property.slug || property._id}`,
            custom_message: `${data.name} has submitted an offer of £${data.offerAmount.toLocaleString()} for your property "${propertyTitle}". Contact: ${data.email} | ${data.phone}`,
            site_url: siteUrl,
          },
        }).catch(() => {});
      }
    }
  } catch (e) {
    console.warn("Owner notification for offer failed:", e.message);
  }

  return { offer: populatedOffer, lead };
};

// Get all offers (admin)
export const getOffers = async (query = {}) => {
  const { page = 1, limit = 20, status, propertyId } = query;
  const filter = {};
  if (status) filter.status = status;
  if (propertyId) filter.property = propertyId;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [offers, total] = await Promise.all([
    PropertyOffer.find(filter)
      .sort("-createdAt")
      .skip(skip)
      .limit(parseInt(limit))
      .populate("property", "propertyTitle slug media pricing location")
      .populate("submittedBy", "name email")
      .populate("lead", "status")
      .lean(),
    PropertyOffer.countDocuments(filter),
  ]);

  return {
    offers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
};

// Get single offer
export const getOfferById = async (id) => {
  return PropertyOffer.findById(id)
    .populate("property", "propertyTitle slug media pricing location")
    .populate("submittedBy", "name email")
    .populate("lead", "status")
    .populate("reviewedBy", "name email")
    .lean();
};

// Update offer status
export const updateOffer = async (id, data, adminId) => {
  const updateData = { ...data };
  if (data.status && data.status !== "pending") {
    updateData.reviewedBy = adminId;
    updateData.reviewedAt = new Date();
  }
  return PropertyOffer.findByIdAndUpdate(id, updateData, { new: true })
    .populate("property", "propertyTitle slug")
    .lean();
};

// Get offers stats
export const getOffersStats = async () => {
  const [total, pending, reviewed, accepted, declined] = await Promise.all([
    PropertyOffer.countDocuments(),
    PropertyOffer.countDocuments({ status: "pending" }),
    PropertyOffer.countDocuments({ status: "reviewed" }),
    PropertyOffer.countDocuments({ status: "accepted" }),
    PropertyOffer.countDocuments({ status: "declined" }),
  ]);

  return { total, pending, reviewed, accepted, declined };
};

export const respondToOffer = async (offerId, status, message, adminId) => {
  const offer = await PropertyOffer.findById(offerId)
    .populate("property", "propertyTitle slug")
    .lean();
  if (!offer) throw new Error("Offer not found");

  const updated = await PropertyOffer.findByIdAndUpdate(
    offerId,
    { status, reviewedBy: adminId, reviewedAt: new Date(), adminNotes: message || "" },
    { new: true }
  );

  // If accepted, mark property as sold and auto-generate invoice
  if (status === "accepted") {
    try {
      const Property = (await import("../property/property.model.js")).default;

      // Find buyer by email if not already linked to a user account
      let buyerId = offer.submittedBy || null;
      if (!buyerId && offer.email) {
        const User = (await import("../user/user.model.js")).default;
        const buyer = await User.findOne({ email: offer.email }).select("_id").lean();
        buyerId = buyer?._id || null;
      }

      // Mark property as sold
      await Property.findByIdAndUpdate(offer.property, {
        propertyStatus: "sold",
        soldPrice: offer.offerAmount,
        currentBid: offer.offerAmount,
        soldTo: buyerId,
        winningBidder: buyerId,
      });

      // Get property owner for seller reference
      const property = await Property.findById(offer.property).select('createdBy').lean();

      // Generate invoice with buyer details from offer
      const { generateInvoice } = await import("../invoice/invoice.service.js");
      const invoice = await generateInvoice({
        propertyId: offer.property,
        buyerId: offer.submittedBy || null,
        buyerName: offer.name,
        buyerEmail: offer.email,
        buyerAddress: {
          street: offer.address,
          city: offer.city,
          postcode: offer.postcode,
        },
        sellerId: property?.createdBy || null,
        salePrice: offer.offerAmount,
        invoiceType: "offer_accept",
        notes: `Offer accepted. Offeror: ${offer.name}`,
      }, adminId);

      console.log(`[Offer] Invoice ${invoice?.invoiceNumber} generated for ${offer.name}`);
    } catch (e) {
      console.warn("[Offer] Failed:", e.message);
    }
  }

  // Send email to offeror
  const templateKey = status === "accepted" ? "offerAccepted" : "offerDeclined";
  const siteUrl = process.env.CLIENT_URL || "http://localhost:5173";
  
  await sendEmail({
    to: offer.email,
    subject: status === "accepted" 
      ? `✅ Your offer has been accepted - ${offer.property?.propertyTitle || "Property"}`
      : `Update on your offer - ${offer.property?.propertyTitle || "Property"}`,
    templateKey,
    variables: {
      offeror_name: offer.name,
      property_title: offer.property?.propertyTitle || "Property",
      offer_amount: `£${offer.offerAmount.toLocaleString()}`,
      response_message: message || (status === "accepted" ? "Congratulations! Your offer has been accepted. Our team will contact you shortly to complete the purchase." : "Unfortunately, your offer was not accepted at this time. Please feel free to submit another offer or contact us for more details."),
      site_url: siteUrl,
    },
  }).catch(e => console.warn("Offer response email failed:", e.message));

  // Notify property owner/agent
  try {
    const Property = (await import("../property/property.model.js")).default;
    const User = (await import("../user/user.model.js")).default;
    const property = await Property.findById(offer.property).select("createdBy propertyTitle").lean();
    if (property?.createdBy) {
      const owner = await User.findById(property.createdBy).select("_id name").lean();
      if (owner) {
        const statusLabel = status === "accepted" ? "accepted" : "declined";
        await Notification.create({
          type: "offer",
          icon: status === "accepted" ? "check-circle" : "x-circle",
          message: `Offer ${statusLabel}: £${offer.offerAmount.toLocaleString()} for "${property.propertyTitle}"`,
          link: "/dashboard/property-offers",
          color: status === "accepted" ? "green" : "red",
          targetUser: owner._id,
        }).catch(() => {});

        const { emitToUser } = await import("../../socket.js");
        emitToUser(owner._id.toString(), "new_notification", {
          type: "offer",
          message: `Offer ${statusLabel} on "${property.propertyTitle}"`,
          link: "/dashboard/property-offers",
        });
      }
    }
  } catch (e) {
    console.warn("Owner offer notification failed:", e.message);
  }

  return updated;
};

export const getAgentOffers = async (agentId) => {
  // Find properties created by this agent
  const Property = (await import("../property/property.model.js")).default;
  const agentProperties = await Property.find({ createdBy: agentId }).select("_id").lean();
  const propertyIds = agentProperties.map(p => p._id);

  return PropertyOffer.find({ property: { $in: propertyIds } })
    .populate("property", "propertyTitle slug media pricing")
    .sort("-createdAt")
    .lean();
};

export const requestPriceChange = async (offerId, message, suggestedPrice, adminId) => {
  const offer = await PropertyOffer.findById(offerId)
    .populate("property", "propertyTitle slug")
    .lean();
  if (!offer) throw new Error("Offer not found");

  const siteUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const propertyUrl = `${siteUrl}/properties/${offer.property?.slug || offer.property?._id}?offer=true&offerId=${offerId}&price=${suggestedPrice || ""}`;

  // Update offer with admin notes
  await PropertyOffer.findByIdAndUpdate(offerId, {
    adminNotes: message || "",
    reviewedBy: adminId,
    reviewedAt: new Date(),
  });

  // Send email to offeror
  const { sendEmail } = await import("../notifications/email.service.js");
  const { isNotificationEnabled } = await import("../settings/settings.service.js");
  
  const enabled = await isNotificationEnabled("offerReply");
  if (enabled) {
    await sendEmail({
      to: offer.email,
      subject: `📩 Price Change Request - ${offer.property?.propertyTitle || "Property"}`,
      templateKey: "offerPriceRequest",
      variables: {
        offeror_name: offer.name,
        property_title: offer.property?.propertyTitle || "Property",
        offer_amount: `£${offer.offerAmount.toLocaleString()}`,
        suggested_price: suggestedPrice ? `£${suggestedPrice.toLocaleString()}` : "Not specified",
        admin_message: message || "The agent has requested you to submit a new offer price.",
        property_url: propertyUrl,
        site_url: siteUrl,
      },
    }).catch(e => console.warn("Price request email failed:", e.message));
  }

  return { success: true };
};


export const getBuyerOffers = async (userId) => {
  return PropertyOffer.find({ submittedBy: userId })
    .populate("property", "propertyTitle slug location media pricing")
    .sort("-createdAt")
    .lean();
};