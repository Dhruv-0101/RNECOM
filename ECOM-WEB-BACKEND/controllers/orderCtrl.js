import asyncHandler from "express-async-handler";
import dotenv from "dotenv";
import { buildPagination } from "../utils/pagination.js";
dotenv.config();
import Stripe from "stripe";
import Order from "../model/Order.js";
import Product from "../model/Product.js";
import User from "../model/User.js";
import Coupon from "../model/Coupon.js";

//-------------------------MOST IMPORTANT---------------------------//

//1.Find the user
//2.Get the payload (customer,orderItems,shippingAddress,TotalPrice)
//3.Check if order is not empty
//4.Create order ----and save into Database
//5.Update the product quantity
//6.Make payment(Stripe)
//7.Payment WebHook
//8.Update the user order

//-------------------------------------------------------------------//

//@desc create orders
//@route POST /api/v1/orders
//@access private

//stripe instance
const stripe = new Stripe(process.env.STRIPE_KEY);

export const createOrderCtrl = asyncHandler(async (req, res) => {
  // Get the payload (orderItems, shippingAddress, totalPrice, optional coupon)
  const { orderItems, shippingAddress, totalPrice, coupon } = req.body;
  console.log(req.body);

  // Parse and validate coupon details if provided
  let discount = 0;
  let couponFound = null;
  if (coupon) {
    couponFound = await Coupon.findOne({
      code: coupon.toUpperCase(),
    });
    if (!couponFound) {
      throw new Error("Coupon not found");
    }
    if (couponFound.isExpired) {
      throw new Error("Coupon has expired");
    }
    discount = couponFound.discount; // Percentage e.g. 15 for 15%
  }

  // Find the user
  const user = await User.findById(req.userAuthId);
  // Check if shipping address is provided in the payload
  if (!shippingAddress) {
    throw new Error("Please provide shipping address");
  }
  // Check if order is not empty
  if (orderItems?.length <= 0) {
    throw new Error("No Order Items");
  }

  const discountedPrice = couponFound
    ? totalPrice - totalPrice * (discount / 100)
    : totalPrice;

  // Place/create order - save into DB
  const order = await Order.create({
    user: user?._id,
    orderItems,
    shippingAddress,
    totalPrice: Number(discountedPrice.toFixed(2)),
  });

  // Update the product qty
  const products = await Product.find({ _id: { $in: orderItems.map(item => item._id) } });

  for (const item of orderItems) {
    const product = products.find(
      (p) => p._id.toString() === item._id.toString()
    );
    if (product) {
      product.totalSold += item.qty;
    }
  }

  // Save all modified unique products
  await Promise.all(products.map((product) => product.save()));
  // push order into user
  user.orders.push(order?._id);
  await user.save();

  // make payment (stripe)
  // convert order items to have same structure that stripe needs and apply coupon discounts
  const convertedOrders = orderItems.map((item) => {
    const unitAmount = couponFound
      ? Math.round(item?.price * (1 - discount / 100) * 100)
      : item?.price * 100;
    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: item?.name,
          description: item?.description,
        },
        unit_amount: unitAmount,
      },
      quantity: item?.qty,
    };
  });

  // Calculate dynamic URLs pointing to the backend server rather than static frontend URL
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const session = await stripe.checkout.sessions.create({
    line_items: convertedOrders,
    metadata: {
      orderId: JSON.stringify(order?._id),
    },
    mode: "payment",
    success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/cancel`,
  });
  res.send({ url: session.url, orderId: order?._id });
});

//@desc get all orders
//@route GET /api/v1/orders
//@access private

export const getAllordersCtrl = asyncHandler(async (req, res) => {
  // pagination
  const page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
  const limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  // Retrieve user to check if regular user or admin
  const currentUser = await User.findById(req.userAuthId);
  const query = {};

  if (!currentUser?.isAdmin) {
    query.user = req.userAuthId;
  }

  if (req.query.search) {
    const searchVal = req.query.search.trim();
    const orderNumberQuery = { orderNumber: { $regex: searchVal, $options: "i" } };
    
    if (!currentUser?.isAdmin) {
      // Non-admins can only search within their own orders
      query.$or = [orderNumberQuery];
    } else {
      // Admins can search by order number or user details
      const matchedUsers = await User.find({
        $or: [
          { fullname: { $regex: searchVal, $options: "i" } },
          { email: { $regex: searchVal, $options: "i" } }
        ]
      }).select("_id");
      
      const userIds = matchedUsers.map(u => u._id);
      
      query.$or = [
        orderNumberQuery,
        { user: { $in: userIds } }
      ];
    }
  }

  const total = await Order.countDocuments(query);

  const orders = await Order.find(query)
    .populate("user")
    .skip(startIndex)
    .limit(limit);

  res.json({
    success: true,
    status: "success",
    total,
    results: orders.length,
    pagination: buildPagination(page, limit, total),
    message: "All orders",
    orders,
    data: orders,
  });
});

//@desc get single order
//@route GET /api/v1/orders/:id
//@access private/admin

export const getSingleOrderCtrl = asyncHandler(async (req, res) => {
  //get the id from params
  const id = req.params.id;
  const order = await Order.findById(id);
  //send response
  res.status(200).json({
    success: true,
    message: "Single order",
    order,
  });
});

//@desc update order to delivered
//@route PUT /api/v1/orders/update/:id
//@access private/admin

export const updateOrderCtrl = asyncHandler(async (req, res) => {
  //get the id from params
  const id = req.params.id;
  //update
  const updatedOrder = await Order.findByIdAndUpdate(
    id,
    {
      status: req.body.status,
    },
    {
      new: true,
    }
  );
  res.status(200).json({
    success: true,
    message: "Order updated",
    updatedOrder,
  });
});

//@desc get sales sum of orders
//@route GET /api/v1/orders/sales/sum
//@access private/admin

export const getOrderStatsCtrl = asyncHandler(async (req, res) => {
  //get order stats
  const orders = await Order.aggregate([
    {
      $group: {
        _id: null,
        minimumSale: {
          $min: "$totalPrice",
        },
        totalSales: {
          $sum: "$totalPrice",
        },
        maxSale: {
          $max: "$totalPrice",
        },
        avgSale: {
          $avg: "$totalPrice",
        },
      },
    },
  ]);
  //get the date
  const date = new Date();
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const saleToday = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: today,
        },
      },
    },
    {
      $group: {
        _id: null,
        totalSales: {
          $sum: "$totalPrice",
        },
      },
    },
  ]);
  //send response
  res.status(200).json({
    success: true,
    message: "Sum of orders",
    orders,
    saleToday,
  });
});
