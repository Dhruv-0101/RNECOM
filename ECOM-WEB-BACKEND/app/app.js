import dotenv from "dotenv";
import cors from "cors";
import Stripe from "stripe";
dotenv.config();
import express from "express";
import path from "path";
import dbConnect from "../config/dbConnect.js";
import { globalErrhandler, notFound } from "../middlewares/globalErrHandler.js";
import brandsRouter from "../routes/brandsRouter.js";
import categoriesRouter from "../routes/categoriesRouter.js";
import colorRouter from "../routes/colorRouter.js";
import orderRouter from "../routes/ordersRouter.js";
import productsRouter from "../routes/productsRoute.js";
import reviewRouter from "../routes/reviewRouter.js";
import userRoutes from "../routes/usersRoute.js";
import Order from "../model/Order.js";
import couponsRouter from "../routes/couponsRouter.js";
import { sendNotificationToUser } from "../services/notificationService.js";
import wishlistRouter from "../routes/wishlistRouter.js";

//db connect
dbConnect();
const app = express();
//cors
// CORS setup - allow requests only from the frontend URL
const corsOptions = {
  origin: "https://ecommerce-frontend-three-theta.vercel.app", // replace with your actual frontend URL
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
};

app.use(cors(corsOptions)); //Stripe webhook
//stripe instance
const stripe = new Stripe(process.env.STRIPE_KEY);

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret =
  "whsec_84541105eba75c99a3a1438b2613b17ccf830121791fad595954dde7dbd9a831";

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (request, response) => {
    const sig = request.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
      console.log("event");
    } catch (err) {
      console.log("err", err.message);
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
    if (event.type === "checkout.session.completed") {
      //update the order
      const session = event.data.object;
      const { orderId } = session.metadata;
      const paymentStatus = session.payment_status;
      const paymentMethod = session.payment_method_types[0];
      const totalAmount = session.amount_total;
      const currency = session.currency;
      //find the order
      const order = await Order.findByIdAndUpdate(
        JSON.parse(orderId),
        {
          totalPrice: totalAmount / 100,
          currency,
          paymentMethod,
          paymentStatus,
        },
        {
          new: true,
        }
      );
      console.log(order);

      // Send pending order status notification when payment succeeds
      if (order && (paymentStatus === "paid" || paymentStatus === "Paid") && !order.notifiedStatuses.includes("pending")) {
        try {
          await sendNotificationToUser(order.user, {
            title: "Order Placed 📦",
            body: "Your order has been placed successfully.",
            data: {
              type: "ORDER_STATUS",
              orderId: order._id.toString(),
            },
          });
          order.notifiedStatuses.push("pending");
          await order.save();
        } catch (err) {
          console.log("Error sending payment success notification in webhook:", err.message);
        }
      }
    } else {
      return;
    }
    // // Handle the event
    // switch (event.type) {
    //   case "payment_intent.succeeded":
    //     const paymentIntent = event.data.object;
    //     // Then define and call a function to handle the event payment_intent.succeeded
    //     break;
    //   // ... handle other event types
    //   default:
    //     console.log(`Unhandled event type ${event.type}`);
    // }
    // Return a 200 response to acknowledge receipt of the event
    response.send();
  }
);

//pass incoming data
app.use(express.json());
//url encoded
app.use(express.urlencoded({ extended: true }));

//server static files
app.use(express.static("public"));
//routes
//Home route
app.get("/", (req, res) => {
  res.sendFile(path.join("public", "index.html"));
});

app.get("/success", async (req, res) => {
  const { session_id } = req.query;
  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (session.payment_status === "paid") {
        const { orderId } = session.metadata;
        const order = await Order.findById(JSON.parse(orderId));
        if (order && order.paymentStatus !== "Paid") {
          order.paymentStatus = "Paid";
          order.paymentMethod = session.payment_method_types[0] || "card";
          order.totalPrice = session.amount_total / 100;
          await order.save();
          console.log(`Order ${order._id} marked as Paid via success URL verification.`);
        }

        // Send pending order status notification when payment succeeds (success URL fallback)
        if (order && !order.notifiedStatuses.includes("pending")) {
          try {
            await sendNotificationToUser(order.user, {
              title: "Order Placed 📦",
              body: "Your order has been placed successfully.",
              data: {
                type: "ORDER_STATUS",
                orderId: order._id.toString(),
              },
            });
            order.notifiedStatuses.push("pending");
            await order.save();
          } catch (err) {
            console.log("Error sending payment success notification in success URL:", err.message);
          }
        }
      }
    } catch (err) {
      console.log("Error verifying checkout session on success:", err.message);
    }
  }
  res.send(`
    <html>
      <head>
        <title>Payment Successful</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, sans-serif; text-align: center; padding: 50px 20px; background-color: #f8fafc; color: #0f172a; }
          .card { background: white; padding: 30px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto; }
          h1 { color: #10b981; }
          p { color: #64748b; font-size: 16px; line-height: 24px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>✓ Payment Successful</h1>
          <p>Your payment has been processed. You can now close this window to return to the app.</p>
        </div>
      </body>
    </html>
  `);
});

app.get("/cancel", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Payment Cancelled</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, sans-serif; text-align: center; padding: 50px 20px; background-color: #f8fafc; color: #0f172a; }
          .card { background: white; padding: 30px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto; }
          h1 { color: #ef4444; }
          p { color: #64748b; font-size: 16px; line-height: 24px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>✗ Payment Cancelled</h1>
          <p>The checkout process was cancelled. You can now close this window to return to the app.</p>
        </div>
      </body>
    </html>
  `);
});
app.use("/api/v1/users/", userRoutes);
app.use("/api/v1/products/", productsRouter);
app.use("/api/v1/categories/", categoriesRouter);
app.use("/api/v1/brands/", brandsRouter);
app.use("/api/v1/colors/", colorRouter);
app.use("/api/v1/reviews/", reviewRouter);
app.use("/api/v1/orders/", orderRouter);
app.use("/api/v1/coupons/", couponsRouter);
app.use("/api/v1/wishlist/", wishlistRouter);
//err middleware
app.use(notFound);
app.use(globalErrhandler);

export default app;
