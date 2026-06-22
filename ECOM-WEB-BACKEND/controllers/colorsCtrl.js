import asyncHandler from "express-async-handler";
import Brand from "../model/Brand.js";
import Color from "../model/Color.js";
import { buildPagination } from "../utils/pagination.js";

// @desc    Create new Color
// @route   POST /api/v1/colors
// @access  Private/Admin

export const createColorCtrl = asyncHandler(async (req, res) => {
  const { name } = req.body;
  //color exists
  const colorFound = await Color.findOne({ name });
  if (colorFound) {
    throw new Error("color already exists");
  }
  //create
  const color = await Color.create({
    name: name.toLowerCase(),
    user: req.userAuthId,
  });

  res.json({
    status: "success",
    message: "color created successfully",
    color,
  });
});

// @desc    Get all colors
// @route   GET /api/colors
// @access  Public

export const getAllColorsCtrl = asyncHandler(async (req, res) => {
  // pagination
  const page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
  const limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 10;
  const startIndex = (page - 1) * limit;

  const query = {};
  if (req.query.name) {
    query.name = { $regex: req.query.name, $options: "i" };
  }

  const total = await Color.countDocuments(query);

  const colors = await Color.find(query)
    .skip(startIndex)
    .limit(limit);

  res.json({
    status: "success",
    message: "colors fetched successfully",
    total,
    results: colors.length,
    pagination: buildPagination(page, limit, total),
    colors,
    data: colors,
  });
});

// @desc    Get single color
// @route   GET /api/colors/:id
// @access  Public
export const getSingleColorCtrl = asyncHandler(async (req, res) => {
  const color = await Color.findById(req.params.id);
  res.json({
    status: "success",
    message: "color fetched successfully",
    color,
  });
});

// @desc    Update color
// @route   PUT /api/colors/:id
// @access  Private/Admin
export const updateColorCtrl = asyncHandler(async (req, res) => {
  const { name } = req.body;

  //update
  const color = await Color.findByIdAndUpdate(
    req.params.id,
    {
      name,
    },
    {
      new: true,
    }
  );
  res.json({
    status: "success",
    message: "color updated successfully",
    color,
  });
});

// @desc    delete color
// @route   DELETE /api/colors/:id
// @access  Private/Admin
export const deleteColorCtrl = asyncHandler(async (req, res) => {
  await Color.findByIdAndDelete(req.params.id);
  res.json({
    status: "success",
    message: "color deleted successfully",
  });
});
