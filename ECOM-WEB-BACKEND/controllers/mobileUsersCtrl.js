import User from "../model/User.js";
import RefreshToken from "../model/RefreshToken.js";
import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Helper helper to throw custom status code errors
const throwError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
};

// Helper to generate access and refresh tokens for mobile
const generateMobileTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_KEY,
    { expiresIn: "30s" } // Access token expires in 15 minutes
  );

  const jti = crypto.randomBytes(16).toString("hex");
  const refreshToken = jwt.sign(
    { id: userId, jti },
    process.env.JWT_KEY,
    { expiresIn: "7d" } // Refresh token expires in 7 days
  );

  return { accessToken, refreshToken };
};

// @desc    Mobile Login
// @route   POST /api/v1/users/mobile/login
// @access  Public
export const mobileLoginUserCtrl = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return throwError("Email and password are required", 400);
  }

  const userFound = await User.findOne({ email });

  if (userFound && (await bcrypt.compare(password, userFound.password))) {
    const { accessToken, refreshToken } = generateMobileTokens(userFound._id);

    // Save refresh token to DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await RefreshToken.create({
      user: userFound._id,
      token: refreshToken,
      expiresAt,
    });

    res.json({
      status: "success",
      message: "Mobile user logged in successfully",
      accessToken,
      refreshToken,
      userFound,
    });
  } else {
    return throwError("Invalid login credentials", 401);
  }
});

// @desc    Mobile Rotate Refresh Token
// @route   POST /api/v1/users/mobile/refresh
// @access  Public
export const mobileRefreshTokenCtrl = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return throwError("Refresh token is required", 400);
  }

  // 1. Verify Refresh Token JWT signature and base expiration
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_KEY);
  } catch (err) {
    return throwError("Invalid or expired refresh token", 401);
  }

  // 2. Fetch Refresh Token from DB
  const tokenRecord = await RefreshToken.findOne({ token: refreshToken });

  // 3. If token record not found at all, return 401
  if (!tokenRecord) {
    return throwError("Refresh token not recognized", 401);
  }

  // 4. Breach Detection: If token is already used or revoked
  if (tokenRecord.isUsed || tokenRecord.isRevoked) {
    // Revoke ALL active refresh tokens for this user for security reasons (compromise detected)
    await RefreshToken.deleteMany({ user: tokenRecord.user });
    return throwError("Refresh token has already been used. Compromise detected, all sessions revoked.", 403);
  }

  // 5. Check DB-level expiration
  if (tokenRecord.expiresAt < new Date()) {
    await RefreshToken.deleteOne({ _id: tokenRecord._id });
    return throwError("Refresh token has expired, please log in again", 401);
  }

  // 6. Token is valid and unused -> Rotate!
  // Mark current token as used
  tokenRecord.isUsed = true;

  const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateMobileTokens(tokenRecord.user);

  // Save the new refresh token to DB
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await RefreshToken.create({
    user: tokenRecord.user,
    token: newRefreshToken,
    expiresAt,
  });

  // Link the old token to the replacement
  tokenRecord.replacedBy = newRefreshToken;
  await tokenRecord.save();

  res.json({
    status: "success",
    message: "Tokens rotated successfully",
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
});

// @desc    Mobile Logout
// @route   POST /api/v1/users/mobile/logout
// @access  Public
export const mobileLogoutUserCtrl = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    // Revoke/Delete this single refresh token from DB
    await RefreshToken.deleteOne({ token: refreshToken });
  }

  res.json({
    status: "success",
    message: "Mobile user logged out successfully",
  });
});
