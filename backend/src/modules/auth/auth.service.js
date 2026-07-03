import jwt from "jsonwebtoken";
import User from "../user/user.model.js";
import fs from "fs";
import path from "path";
import notificationService, {
  NotificationEvents,
} from "../notifications/trigger.service.js";

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRE || "15m",
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
  });
};

export const registerUser = async (userData) => {
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new Error("User already exists with this email");
  }
  // Auto-approve sellers and agents, buyers still need admin approval
  const isActive =
    userData.isActive !== undefined
      ? userData.isActive
      : userData.role === "seller" || userData.role === "agent"
        ? true
        : false;
  // Auto-set permissions based on role
  const permissions = {
    canBid: !["admin", "agent", "seller"].includes(userData.role),
    canListProperties: ["admin", "agent", "seller"].includes(userData.role),
  };
  // Handle ID documents (base64 files from registration)
  let idDocuments = [];
  if (userData.idDocuments && userData.idDocuments.length > 0) {
    const dir = "uploads/id-documents";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    for (const doc of userData.idDocuments) {
      if (doc.fileData) {
        const base64Data = doc.fileData.replace(/^data:.*;base64,/, "");
        const ext = doc.originalName?.split(".").pop() || "jpg";
        const fileName = `id-doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        fs.writeFileSync(`${dir}/${fileName}`, base64Data, "base64");

        idDocuments.push({
          docType: doc.docType || "other_id",
          fileUrl: `/uploads/id-documents/${fileName}`,
          fileName: fileName,
          originalName: doc.originalName,
          mimeType: doc.mimeType || "application/octet-stream",
          fileSize: doc.fileSize || 0,
          verificationStatus: "pending",
        });
      }
    }
  }

  // Remove fileData before creating user
  const { idDocuments: _docs, ...cleanUserData } = userData;

  const user = await User.create({ ...cleanUserData, isActive, permissions });

  // Save ID documents to the right place
  if (idDocuments.length > 0) {
    if (userData.role === "agent") {
      user.agentDetails = { ...user.agentDetails, idDocuments };
    } else if (userData.role === "seller") {
      user.ownerDocuments = idDocuments;
      if (!user.agentDetails) user.agentDetails = {};
      user.agentDetails.idDocuments = idDocuments;
    }
    await user.save();
  }
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Fire-and-forget: Emit event (non-blocking)
  notificationService
    .emit(NotificationEvents.USER_REGISTERED, { userId: user._id })
    .catch((e) => console.error("Notification event failed:", e.message));

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin || false,
      phone: user.phone,
      isActive: user.isActive,
      activeView: user.activeView,
      permissions: user.permissions,
      roleRequest: user.roleRequest,
      agentDetails: user.agentDetails,
      ownerDocuments: user.ownerDocuments,
      bankDetails: user.bankDetails,
      notificationSettings: user.notificationSettings,
      createdAt: user.createdAt,
    },
    accessToken,
    refreshToken,
  };
};

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    throw new Error(
      "Your account is pending approval. An admin will review and activate your account shortly.",
    );
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const correctActiveView =
    (user.role === "seller" || user.role === "agent") &&
    user.activeView === "buyer" &&
    !user.permissions?.canBid
      ? "seller"
      : user.activeView ||
        (user.role === "seller" || user.role === "agent" ? "seller" : "buyer");

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin || false,
      phone: user.phone,
      isActive: user.isActive,
      activeView: correctActiveView,
      permissions: user.permissions,
      roleRequest: user.roleRequest,
      agentDetails: user.agentDetails,
      ownerDocuments: user.ownerDocuments,
      bankDetails: user.bankDetails,
      notificationSettings: user.notificationSettings,
      createdAt: user.createdAt,
    },
    accessToken,
    refreshToken,
  };
};

export const refreshAccessToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || user.refreshToken !== token) {
      throw new Error("Invalid refresh token");
    }

    const accessToken = generateAccessToken(user._id);
    return { accessToken };
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
};

export const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

export const mobileGoogleLogin = async (idToken) => {
  // Get Google client ID from settings
  const { getOAuthConfig } = await import("../settings/settings.service.js");
  const oauthConfig = await getOAuthConfig();
  const googleClientId = oauthConfig?.google?.clientId;

  if (!googleClientId) throw new Error("Google OAuth is not configured");

  // Verify the Google ID token
  const { OAuth2Client } = await import("google-auth-library");
  const client = new OAuth2Client();

  const ticket = await client.verifyIdToken({
    idToken,
    audience: [googleClientId, oauthConfig?.google?.androidClientId].filter(
      Boolean,
    ),
  });

  const payload = ticket.getPayload();
  const email = payload.email;
  const name = payload.name;

  if (!email) throw new Error("No email from Google");

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name,
      email,
      password: "oauth-" + Math.random().toString(36).slice(2),
      role: "buyer",
      isActive: true,
      permissions: { canBid: true, canListProperties: false },
    });
  } else {
    const needsUpdate =
      !user.isActive || (user.role === "buyer" && !user.permissions?.canBid);
    if (needsUpdate) {
      user = await User.findByIdAndUpdate(
        user._id,
        { isActive: true, "permissions.canBid": true },
        { new: true },
      );
    }
  }

  const accessToken = jwt.sign(
    { id: user._id },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRE || "2h",
    },
  );
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    },
  );

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    },
    accessToken,
    refreshToken,
  };
};

export const mobileGoogleTokenLogin = async (accessToken, email) => {
  // Get Google client ID from settings
  const { getOAuthConfig } = await import("../settings/settings.service.js");
  const oauthConfig = await getOAuthConfig();
  const googleClientId = oauthConfig?.google?.clientId;

  if (!googleClientId) throw new Error("Google OAuth is not configured");

  // Verify the access token with Google's API
  const response = await fetch(
    `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`,
  );
  const tokenInfo = await response.json();

  if (tokenInfo.error) {
    throw new Error("Invalid Google access token");
  }

  // Verify audience matches - supports both Web and Android client IDs
  const validClientIds = [googleClientId, oauthConfig?.google?.androidClientId].filter(Boolean);
  if (!validClientIds.includes(tokenInfo.aud)) {
    throw new Error('Token was not issued for this application');
  }

  // Use email from Google if provided, else from request
  const verifiedEmail = tokenInfo.email || email;
  if (!verifiedEmail) throw new Error("No email from Google");

  let user = await User.findOne({ email: verifiedEmail });
  if (!user) {
    user = await User.create({
      name: email ? email.split("@")[0] : "User",
      email: verifiedEmail,
      password: "oauth-" + Math.random().toString(36).slice(2),
      role: "buyer",
      isActive: true,
      permissions: { canBid: true, canListProperties: false },
    });
  } else {
    const needsUpdate =
      !user.isActive || (user.role === "buyer" && !user.permissions?.canBid);
    if (needsUpdate) {
      user = await User.findByIdAndUpdate(
        user._id,
        { isActive: true, "permissions.canBid": true },
        { new: true },
      );
    }
  }

  const jwtAccessToken = jwt.sign(
    { id: user._id },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRE || "2h",
    },
  );
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    },
  );

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    },
    accessToken: jwtAccessToken,
    refreshToken,
  };
};

export const mobileFacebookLogin = async (accessToken) => {
  // Get Facebook App config from settings
  const { getOAuthConfig } = await import("../settings/settings.service.js");
  const oauthConfig = await getOAuthConfig();
  const facebookConfig = oauthConfig?.facebook;

  if (!facebookConfig?.enabled) throw new Error("Facebook login is disabled");
  if (!facebookConfig?.clientId) throw new Error("Facebook OAuth is not configured");

  // Verify token with Facebook Graph API
  const fbRes = await fetch(
    `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email`
  );
  const fbUser = await fbRes.json();

  if (fbUser.error || !fbUser.id) {
    throw new Error("Invalid Facebook access token");
  }

  const email = fbUser.email;
  const name = fbUser.name;
  const facebookId = fbUser.id;

  if (!email) throw new Error("Facebook account has no email. Please use a different login method.");

  let user = await User.findOne({
    $or: [{ email }, { facebookId }],
  });

  if (!user) {
    user = await User.create({
      name: name || "Facebook User",
      email,
      password: "oauth-" + Math.random().toString(36).slice(2),
      role: "buyer",
      isActive: true,
      facebookId,
      oauthProvider: "facebook",
      permissions: { canBid: true, canListProperties: false },
    });
  } else {
    // Update facebookId if not set
    const updates = {};
    if (!user.facebookId) updates.facebookId = facebookId;
    if (!user.oauthProvider) updates.oauthProvider = "facebook";
    
    const needsUpdate = !user.isActive || (user.role === "buyer" && !user.permissions?.canBid);
    if (needsUpdate) {
      updates.isActive = true;
      updates["permissions.canBid"] = true;
    }

    if (Object.keys(updates).length > 0) {
      user = await User.findByIdAndUpdate(user._id, updates, { new: true });
    }
  }

  const jwtAccessToken = jwt.sign(
    { id: user._id },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRE || "2h" }
  );
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    },
    accessToken: jwtAccessToken,
    refreshToken,
  };
};


export const mobileGithubCodeLogin = async (code) => {
  const { getOAuthConfig } = await import("../settings/settings.service.js");
  const oauthConfig = await getOAuthConfig();
  const githubConfig = oauthConfig?.github;

  if (!githubConfig?.enabled) throw new Error("GitHub login is disabled");
  if (!githubConfig?.clientId || !githubConfig?.clientSecret) {
    throw new Error("GitHub OAuth is not configured");
  }

  // Exchange code for access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      client_id: githubConfig.clientId,
      client_secret: githubConfig.clientSecret,
      code,
    }),
  });
  const tokenData = await tokenRes.json();

  if (tokenData.error || !tokenData.access_token) {
    throw new Error("Invalid GitHub authorization code");
  }

  const accessToken = tokenData.access_token;

  // Get user info
  const ghRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `token ${accessToken}`,
      "User-Agent": "King-Property-Auction",
    },
  });
  const ghUser = await ghRes.json();

  if (ghUser.message || !ghUser.id) {
    throw new Error("Failed to fetch GitHub user");
  }

  // Get primary email
  const emailRes = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `token ${accessToken}`,
      "User-Agent": "King-Property-Auction",
    },
  });
  const emails = await emailRes.json();
  const primaryEmail = Array.isArray(emails)
    ? emails.find((e) => e.primary && e.verified)?.email
    : null;

  const email = primaryEmail || `${ghUser.login}@github.user`;
  const name = ghUser.name || ghUser.login;
  const githubId = ghUser.id.toString();

  let user = await User.findOne({ $or: [{ email }, { githubId }] });

  if (!user) {
    user = await User.create({
      name,
      email,
      password: "oauth-" + Math.random().toString(36).slice(2),
      role: "buyer",
      isActive: true,
      githubId,
      oauthProvider: "github",
      permissions: { canBid: true, canListProperties: false },
    });
  } else {
    const updates = {};
    if (!user.githubId) updates.githubId = githubId;
    if (!user.oauthProvider) updates.oauthProvider = "github";
    const needsUpdate = !user.isActive || (user.role === "buyer" && !user.permissions?.canBid);
    if (needsUpdate) {
      updates.isActive = true;
      updates["permissions.canBid"] = true;
    }
    if (Object.keys(updates).length > 0) {
      user = await User.findByIdAndUpdate(user._id, updates, { new: true });
    }
  }

  const jwtAccessToken = jwt.sign({ id: user._id }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRE || "2h" });
  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return {
    user: { id: user._id, name: user.name, email: user.email, role: user.role, permissions: user.permissions },
    accessToken: jwtAccessToken,
    refreshToken,
  };
};