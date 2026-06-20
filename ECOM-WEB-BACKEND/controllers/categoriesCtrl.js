import asyncHandler from "express-async-handler";
import Category from "../model/Category.js";
// @desc    Create new category
// @route   POST /api/v1/categories
// @access  Private/Admin

export const createCategoryCtrl = asyncHandler(async (req, res) => {
  const { name } = req.body;
  //category exists
  const categoryFound = await Category.findOne({ name });
  if (categoryFound) {
    throw new Error("Category already exists");
  }
  //create
  const category = await Category.create({
    name: name?.toLowerCase(),
    user: req.userAuthId,
    image: req?.file?.path,
  });

  res.json({
    status: "success",
    message: "Category created successfully",
    category,
  });
});

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public

export const getAllCategoriesCtrl = asyncHandler(async (req, res) => {
  // pagination
  const page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
  const limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Category.countDocuments();

  const categories = await Category.find()
    .skip(startIndex)
    .limit(limit);

  const pagination = {};
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.json({
    status: "success",
    total,
    results: categories.length,
    pagination,
    message: "Categories fetched successfully",
    categories,
  });
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
export const getSingleCategoryCtrl = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  res.json({
    status: "success",
    message: "Category fetched successfully",
    category,
  });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategoryCtrl = asyncHandler(async (req, res) => {
  const { name } = req.body;

  // Build update object; include image if a new file was uploaded
  const updateData = { name };
  if (req?.file?.path) {
    updateData.image = req.file.path;
  }

  //update
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
    }
  );
  res.json({
    status: "success",
    message: "category updated successfully",
    category,
  });
});

// @desc    delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategoryCtrl = asyncHandler(async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({
    status: "success",
    message: "Category deleted successfully",
  });
});
