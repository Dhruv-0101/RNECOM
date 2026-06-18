import User from "../model/User.js";
import asyncHandler from "express-async-handler";

// @desc    Toggle product in wishlist
// @route   POST /api/v1/wishlist/toggle
// @access  Private
export const toggleWishlistCtrl = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    res.status(400);
    throw new Error("Product ID is required");
  }

  const user = await User.findById(req.userAuthId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const isAlreadyWishlisted = user.wishLists.includes(productId);

  if (isAlreadyWishlisted) {
    // Remove it
    user.wishLists = user.wishLists.filter((id) => id.toString() !== productId.toString());
  } else {
    // Add it
    user.wishLists.push(productId);
  }

  await user.save();

  // Return the populated wishlist items
  const updatedUser = await User.findById(req.userAuthId).populate("wishLists");

  res.json({
    status: "success",
    message: isAlreadyWishlisted ? "Product removed from wishlist" : "Product added to wishlist",
    wishlist: updatedUser.wishLists,
  });
});

// @desc    Get user wishlist
// @route   GET /api/v1/wishlist
// @access  Private
export const getWishlistCtrl = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userAuthId).populate("wishLists");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json({
    status: "success",
    message: "Wishlist fetched successfully",
    wishlist: user.wishLists,
  });
});

// @desc    Merge local wishlist
// @route   POST /api/v1/wishlist/merge
// @access  Private
export const mergeWishlistCtrl = asyncHandler(async (req, res) => {
  const { productIds } = req.body; // Array of product IDs

  if (!Array.isArray(productIds)) {
    res.status(400);
    throw new Error("productIds must be an array");
  }

  const user = await User.findById(req.userAuthId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Merge local IDs with existing wishlist, removing duplicates
  const existingIds = user.wishLists.map((id) => id.toString());
  const newIds = productIds.filter((id) => !existingIds.includes(id.toString()));

  if (newIds.length > 0) {
    user.wishLists.push(...newIds);
    await user.save();
  }

  const updatedUser = await User.findById(req.userAuthId).populate("wishLists");

  res.json({
    status: "success",
    message: "Wishlist merged successfully",
    wishlist: updatedUser.wishLists,
  });
});
