import express from "express";
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  refreshMobile,
  mobileGoogleAuth,
  mobileGoogleTokenAuth,
} from "./auth.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import passport, {
  ensureGoogleStrategy,
  ensureGitHubStrategy,
  ensureFacebookStrategy,
} from "./passport.js";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// ─── Google OAuth ──────────────────────────────────────────────────────────
router.get("/google", async (req, res, next) => {
  await ensureGoogleStrategy();
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })(req, res, next);
});

router.get("/google/callback", async (req, res, next) => {
  await ensureGoogleStrategy();
  passport.authenticate(
    "google",
    { session: false, failureRedirect: "/login" },
    (err, user, info) => {
      if (err || !user) {
        return res.redirect(
          `${process.env.CLIENT_URL}/login?error=oauth_failed`,
        );
      }
      const accessToken = jwt.sign(
        { id: user._id },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRE || "2h" },
      );
      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" },
      );

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.redirect(
        `${process.env.CLIENT_URL}/oauth-callback?token=${accessToken}&user=${JSON.stringify({ id: user._id, name: user.name, email: user.email, role: user.role, permissions: user.permissions })}`,
      );
    },
  )(req, res, next);
});

// ─── GitHub OAuth ──────────────────────────────────────────────────────────
router.get("/github", async (req, res, next) => {
  await ensureGitHubStrategy();
  passport.authenticate("github", { scope: ["user:email"], session: false })(
    req,
    res,
    next,
  );
});

router.get("/github/callback", async (req, res, next) => {
  await ensureGitHubStrategy();
  passport.authenticate(
    "github",
    { session: false, failureRedirect: "/login" },
    (err, user, info) => {
      if (err || !user) {
        return res.redirect(
          `${process.env.CLIENT_URL}/login?error=oauth_failed`,
        );
      }
      const accessToken = jwt.sign(
        { id: user._id },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRE || "2h" },
      );
      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" },
      );

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.redirect(
        `${process.env.CLIENT_URL}/oauth-callback?token=${accessToken}&user=${JSON.stringify({ id: user._id, name: user.name, email: user.email, role: user.role, permissions: user.permissions })}`,
      );
    },
  )(req, res, next);
});

// ─── Facebook OAuth ────────────────────────────────────────────────────────
router.get("/facebook", async (req, res, next) => {
  await ensureFacebookStrategy();
  passport.authenticate("facebook", { scope: ["email"], session: false })(
    req,
    res,
    next,
  );
});

router.get("/facebook/callback", async (req, res, next) => {
  await ensureFacebookStrategy();
  passport.authenticate(
    "facebook",
    { session: false, failureRedirect: "/login" },
    (err, user, info) => {
      if (err || !user) {
        return res.redirect(
          `${process.env.CLIENT_URL}/login?error=oauth_failed`,
        );
      }
      const accessToken = jwt.sign(
        { id: user._id },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRE || "2h" },
      );
      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" },
      );

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.redirect(
        `${process.env.CLIENT_URL}/oauth-callback?token=${accessToken}&user=${JSON.stringify({ id: user._id, name: user.name, email: user.email, role: user.role, permissions: user.permissions })}`,
      );
    },
  )(req, res, next);
});

// ─── Mobile OAuth Endpoints (JSON Response) ──────────────────────────────

// Google OAuth - Mobile
router.get("/google/mobile", async (req, res, next) => {
  await ensureGoogleStrategy();
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })(req, res, next);
});

router.get("/google/mobile/callback", async (req, res, next) => {
  await ensureGoogleStrategy();
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({
        success: false,
        message: err?.message || "Google authentication failed",
      });
    }
    const accessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRE || "2h" },
    );
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      data: {
        token: accessToken,
        refreshToken: refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
        },
      },
    });
  })(req, res, next);
});

// GitHub OAuth - Mobile
router.get("/github/mobile", async (req, res, next) => {
  await ensureGitHubStrategy();
  passport.authenticate("github", { scope: ["user:email"], session: false })(
    req,
    res,
    next,
  );
});

router.get("/github/mobile/callback", async (req, res, next) => {
  await ensureGitHubStrategy();
  passport.authenticate("github", { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({
        success: false,
        message: err?.message || "GitHub authentication failed",
      });
    }
    const accessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRE || "2h" },
    );
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      data: {
        token: accessToken,
        refreshToken: refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
        },
      },
    });
  })(req, res, next);
});

// Facebook OAuth - Mobile
router.get("/facebook/mobile", async (req, res, next) => {
  await ensureFacebookStrategy();
  passport.authenticate("facebook", { scope: ["email"], session: false })(
    req,
    res,
    next,
  );
});

router.get("/facebook/mobile/callback", async (req, res, next) => {
  await ensureFacebookStrategy();
  passport.authenticate("facebook", { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({
        success: false,
        message: err?.message || "Facebook authentication failed",
      });
    }
    const accessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRE || "2h" },
    );
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      data: {
        token: accessToken,
        refreshToken: refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
        },
      },
    });
  })(req, res, next);
});

// ─── Mobile Auth (Native) ──────────────────────────────────────────────────
router.post("/mobile/refresh", refreshMobile);
router.post("/mobile/google", mobileGoogleAuth);
router.post("/google/mobile-token", mobileGoogleTokenAuth);

export default router;
