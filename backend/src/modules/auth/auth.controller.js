import { registerSchema, loginSchema } from "../user/user.validation.js";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  mobileGoogleLogin,
  mobileGoogleTokenLogin,
  mobileFacebookLogin,
  mobileGithubCodeLogin,
} from "./auth.service.js";
import User from "../user/user.model.js";
import crypto from "crypto";
import { sendEmail } from "../notifications/email.service.js";
import { isNotificationEnabled } from "../settings/settings.service.js";

// Cookie options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

export const register = async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const result = await registerUser(value);

    res.cookie("refreshToken", result.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const result = await loginUser(value.email, value.password);

    res.cookie("refreshToken", result.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

export const refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No refresh token provided",
      });
    }

    const result = await refreshAccessToken(token);

    res.status(200).json({
      success: true,
      accessToken: result.accessToken,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    await logoutUser(req.user.id);
    res.clearCookie("refreshToken");
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const userObj = user.toObject();
    const correctActiveView =
      (userObj.role === "seller" || userObj.role === "agent") &&
      userObj.activeView === "buyer" &&
      !userObj.permissions?.canBid
        ? "seller"
        : userObj.activeView;
    userObj.activeView = correctActiveView;
    res.status(200).json({
      success: true,
      user: userObj,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("+password");

    // Update name, email and phone
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.phone !== undefined) user.phone = req.body.phone;

    // Update company details for agents and sellers
    if (req.body.agentDetails && (user.role === "agent" || user.role === "seller")) {
      user.agentDetails = user.agentDetails || {};
      if (req.body.agentDetails.companyName !== undefined)
        user.agentDetails.companyName = req.body.agentDetails.companyName;
      if (req.body.agentDetails.licenseNumber !== undefined)
        user.agentDetails.licenseNumber = req.body.agentDetails.licenseNumber;
      if (req.body.agentDetails.companyAddress !== undefined)
        user.agentDetails.companyAddress = req.body.agentDetails.companyAddress;
      user.markModified("agentDetails");
    }

    // Update bank details
    if (req.body.bankDetails) {
      user.bankDetails = user.bankDetails || {};
      const bd = req.body.bankDetails;
      if (bd.accountHolderName !== undefined) user.bankDetails.accountHolderName = bd.accountHolderName;
      if (bd.bankName !== undefined) user.bankDetails.bankName = bd.bankName;
      if (bd.accountNumber !== undefined) user.bankDetails.accountNumber = bd.accountNumber;
      if (bd.sortCode !== undefined) user.bankDetails.sortCode = bd.sortCode;
      if (bd.iban !== undefined) user.bankDetails.iban = bd.iban;
      if (bd.bankAddress !== undefined) user.bankDetails.bankAddress = bd.bankAddress;
      user.markModified("bankDetails");
    }

    // Update notification settings
    if (req.body.notificationSettings) {
      user.notificationSettings = { ...user.notificationSettings, ...req.body.notificationSettings };
      user.markModified("notificationSettings");
    }

    // Update password if provided
    if (req.body.currentPassword && req.body.newPassword) {
      const isMatch = await user.comparePassword(req.body.currentPassword);
      if (!isMatch) {
        return res
          .status(400)
          .json({ success: false, message: "Current password is incorrect" });
      }
      user.password = req.body.newPassword;
    }

    await user.save();

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          isActive: user.isActive,
          activeView: user.activeView,
          permissions: user.permissions,
          roleRequest: user.roleRequest,
          agentDetails: user.agentDetails,
          bankDetails: user.bankDetails,
          notificationSettings: user.notificationSettings,
          createdAt: user.createdAt,
        },
      },
      message: "Profile updated successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new password required",
      });
    }
    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Forgot Password ───
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Generate crypto-random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token before storing (never store plain text)
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    // Send email
    const resetEnabled = await isNotificationEnabled("passwordReset");
    if (resetEnabled) {
      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
      try {
        await sendEmail({
          to: user.email,
          subject: "Reset Your Password",
          templateKey: "passwordReset",
          variables: {
            user_name: user.name,
            reset_link: resetUrl,
          },
        });
      } catch (e) {
        console.error("Password reset email failed:", e.message);
        // Rollback token if email fails
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return res
          .status(500)
          .json({
            success: false,
            message: "Email could not be sent. Please try again.",
          });
      }
    }

    res.json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Reset Password ───
export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Password must be at least 6 characters",
        });
    }

    // Hash the token from URL to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid or expired reset token. Please request a new one.",
        });
    }

    // Update password
    user.password = password;
    // Clear reset token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    // Invalidate all existing sessions (security best practice)
    user.refreshToken = null;
    await user.save();

    res.json({
      success: true,
      message:
        "Password reset successful. You can now login with your new password.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Mobile Auth ───

export const refreshMobile = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "No refresh token provided" });
    }
    const result = await refreshAccessToken(refreshToken);
    res.json({ success: true, accessToken: result.accessToken });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

export const mobileGoogleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: "Google ID token required" });
    }
    const result = await mobileGoogleLogin(idToken);
    res.json({ success: true, user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

export const mobileGoogleTokenAuth = async (req, res) => {
  try {
    const { accessToken, email } = req.body;
    if (!accessToken) {
      return res.status(400).json({ success: false, message: "Google access token required" });
    }
    const result = await mobileGoogleTokenLogin(accessToken, email);
    res.json({ 
      success: true, 
      data: {
        token: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

export const mobileFacebookAuth = async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ success: false, message: "Facebook access token required" });
    }
    const result = await mobileFacebookLogin(accessToken);
    res.json({
      success: true,
      data: {
        token: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      },
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

export const mobileGithubCodeAuth = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: "GitHub authorization code required" });
    }
    const result = await mobileGithubCodeLogin(code);
    res.json({
      success: true,
      data: {
        token: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      },
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};