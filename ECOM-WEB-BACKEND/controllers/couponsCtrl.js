import asyncHandler from "express-async-handler";
import Coupon from "../model/Coupon.js";
import { buildPagination } from "../utils/pagination.js";
import { sendNotificationToAllUsers } from "../services/notificationService.js";
// @desc    Create new Coupon
// @route   POST /api/v1/coupons
// @access  Private/Admin

export const createCouponCtrl = asyncHandler(async (req, res) => {
  const { code, startDate, endDate, discount } = req.body;
  console.log(req.body);
  //check if admin
  //check if coupon already exists
  const couponsExists = await Coupon.findOne({
    code,
  });
  if (couponsExists) {
    throw new Error("Coupon already exists");
  }
  //check if discount is a number
  if (isNaN(discount)) {
    throw new Error("Discount value must be a number");
  }
  //create coupon
  const coupon = await Coupon.create({
    code: code,
    startDate,
    endDate,
    discount,
    user: req.userAuthId,
  });

  // Trigger push notification to all users
  try {
    const formattedExpiry = endDate ? new Date(endDate).toLocaleDateString() : "N/A";
    await sendNotificationToAllUsers({
      title: "New Coupon Alert! 🌟",
      body: `Use coupon code "${coupon.code.toUpperCase()}" to get ${coupon.discount}% off! Expires on ${formattedExpiry}.`,
      data: {
        type: "NEW_COUPON",
        couponCode: coupon.code,
      },
    });
  } catch (error) {
    console.error("Failed to send new coupon notification:", error);
  }

  //send the response
  res.status(201).json({
    status: "success",
    message: "Coupon created successfully",
    coupon,
  });
});

// @desc    Get all coupons
// @route   GET /api/v1/coupons

export const getAllCouponsCtrl = asyncHandler(async (req, res) => {
  // pagination
  const page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
  const limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 10;
  const startIndex = (page - 1) * limit;

  const query = {};
  if (req.query.code) {
    query.code = { $regex: req.query.code, $options: "i" };
  }

  const total = await Coupon.countDocuments(query);

  const coupons = await Coupon.find(query).skip(startIndex).limit(limit);

  res.status(200).json({
    status: "success",
    message: "All coupons",
    total,
    results: coupons.length,
    pagination: buildPagination(page, limit, total),
    coupons,
    data: coupons,
  });
});
// @desc    Get single coupon
// @route   GET /api/v1/coupons/:id
// @access  Private/Admin

export const getCouponCtrl = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findOne({ code: req.query.code });
  //check if is not found
  if (coupon === null) {
    throw new Error("Coupon not found");
  }
  //check if expired
  if (coupon.isExpired) {
    throw new Error("Coupon Expired");
  }
  res.json({
    status: "success",
    message: "Coupon fetched",
    coupon,
  });
});

export const updateCouponCtrl = asyncHandler(async (req, res) => {
  const { code, startDate, endDate, discount } = req.body;
  const coupon = await Coupon.findByIdAndUpdate(
    req.params.id,
    {
      code: code?.toUpperCase(),
      discount,
      startDate,
      endDate,
    },
    {
      new: true,
    },
  );
  res.json({
    status: "success",
    message: "Coupon updated successfully",
    coupon,
  });
});

export const deleteCouponCtrl = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  res.json({
    status: "success",
    message: "Coupon deleted successfully",
    coupon,
  });
});
