import asyncHandler from "express-async-handler";
import Brand from "../model/Brand.js";
import Category from "../model/Category.js";
import Product from "../model/Product.js";
import { buildPagination } from "../utils/pagination.js";
import cloudinaryPackage from "cloudinary";
const cloudinary = cloudinaryPackage.v2;

// @desc    Create new product
// @route   POST /api/v1/products
// @access  Private/Admin
export const createProductCtrl = asyncHandler(async (req, res) => {
  console.log(req.body);
  const { name, description, category, sizes, colors, price, totalQty, brand } =
    req.body;
  const convertedImgs = req.files.map((file) => file?.path);
  //Product exists
  const productExists = await Product.findOne({ name });
  if (productExists) {
    throw new Error("Product Already Exists");
  }
  //find the brand
  const brandFound = await Brand.findOne({
    name: brand.toLowerCase(),
  });

  if (!brandFound) {
    throw new Error(
      "Brand not found, please create brand first or check brand name"
    );
  }
  //find the category
  const categoryFound = await Category.findOne({
    name: category.toLowerCase(),
  });
  if (!categoryFound) {
    throw new Error(
      "Category not found, please create category first or check category name"
    );
  }
  //create the product
  const product = await Product.create({
    name,
    description,
    category,
    sizes,
    colors,
    user: req.userAuthId,
    price,
    totalQty,
    brand,
    images: convertedImgs,
  });
  //push the product into category
  categoryFound.products.push(product._id);
  //resave
  await categoryFound.save();
  //push the product into brand
  brandFound.products.push(product._id);
  //resave
  await brandFound.save();
  //send response
  res.json({
    status: "success",
    message: "Product created successfully",
    product,
  });
});

// @desc    Get all products
// @route   GET /api/v1/products
// @access  Public

export const getProductsCtrl = asyncHandler(async (req, res) => {
  //console.log(req.query);
  /*--------MOST IMPORTANT--------*/
  /*
  let productQuery = Product.find();
  console.log(productQuery) {bunch of objects this called as Query}

  --we can go ahead and perform some operations on the query before awaiting it and return back to user.

  //we have to await the query
  const products = await productQuery;
  console.log(products) {we have all products}
*/

  //query
  let query = {};

  //search by name
  if (req.query.name) {
    query.name = { $regex: req.query.name, $options: "i" };
  }

  //filter by brand
  if (req.query.brand) {
    query.brand = { $regex: req.query.brand, $options: "i" };
  }

  //filter by category
  if (req.query.category) {
    query.category = { $regex: req.query.category, $options: "i" };
  }

  //filter by color
  if (req.query.color) {
    query.colors = { $regex: req.query.color, $options: "i" };
  }

  //filter by size
  if (req.query.size) {
    query.sizes = { $regex: req.query.size, $options: "i" };
  }

  //filter by price range
  if (req.query.price) {
    const priceRange = req.query.price.split("-");
    //gte: greater or equal
    //lte: less than or equal to
    query.price = { $gte: priceRange[0], $lte: priceRange[1] };
  }

  let productQuery = Product.find(query);

  //pagination
  //page
  const page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
  //limit
  const limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 10;
  //startIdx
  const startIndex = (page - 1) * limit;
  //total
  const total = await Product.countDocuments(query);

  productQuery = productQuery.skip(startIndex).limit(limit);

  //await the query
  const products = await productQuery.populate({ path: "reviews", select: "rating" });
  res.json({
    status: "success",
    total,
    results: products.length,
    pagination: buildPagination(page, limit, total),
    message: "Products fetched successfully",
    products,
    data: products,
  });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public

export const getProductCtrl = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate({
    path: "reviews",
    populate: {
      path: "user",
      select: "fullname",
    },
  });
  if (!product) {
    throw new Error("Prouduct not found");
  }
  res.json({
    status: "success",
    message: "Product fetched successfully",
    product,
  });
});

// Helper to extract Cloudinary public ID from URL
const extractPublicId = (url) => {
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    const pathAfterUpload = parts[1];
    // Remove version segment if present, e.g. v1570975203/
    const versionMatch = pathAfterUpload.match(/^v\d+\/(.+)$/);
    const cleanPath = versionMatch ? versionMatch[1] : pathAfterUpload;
    // Strip extension
    const lastDotIndex = cleanPath.lastIndexOf('.');
    if (lastDotIndex === -1) return cleanPath;
    return cleanPath.substring(0, lastDotIndex);
  } catch (error) {
    console.error("Error extracting public ID from Cloudinary URL:", error);
    return null;
  }
};

export const updateProductCtrl = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    category,
    sizes,
    colors,
    user,
    price,
    totalQty,
    brand,
    images,
    deletedImages,
  } = req.body;

  // Normalize images and deletedImages
  let existingImages = [];
  if (images) {
    if (Array.isArray(images)) {
      existingImages = images;
    } else {
      existingImages = [images];
    }
  }

  let toDelete = [];
  if (deletedImages) {
    if (Array.isArray(deletedImages)) {
      toDelete = deletedImages;
    } else {
      toDelete = [deletedImages];
    }
  }

  // Delete removed images from Cloudinary
  for (const imgUrl of toDelete) {
    const publicId = extractPublicId(imgUrl);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error(`Failed to delete image ${publicId} from Cloudinary:`, err);
      }
    }
  }

  // Add new files
  const newImgs = req.files ? req.files.map((file) => file?.path) : [];
  const finalImages = [...existingImages, ...newImgs];

  //validation

  //update
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name,
      description,
      category,
      sizes,
      colors,
      user,
      price,
      totalQty,
      brand,
      images: finalImages,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.json({
    status: "success",
    message: "Product updated successfully",
    product,
  });
});

// @desc    delete  product
// @route   DELETE /api/products/:id/delete
// @access  Private/Admin
export const deleteProductCtrl = asyncHandler(async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({
    status: "success",
    message: "Product deleted successfully",
  });
});
