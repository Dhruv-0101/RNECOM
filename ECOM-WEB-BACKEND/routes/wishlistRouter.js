import express from "express";
import {
  toggleWishlistCtrl,
  getWishlistCtrl,
  mergeWishlistCtrl,
} from "../controllers/wishlistCtrl.js";
import { isLoggedIn } from "../middlewares/isLoggedIn.js";

const wishlistRouter = express.Router();

wishlistRouter.post("/toggle", isLoggedIn, toggleWishlistCtrl);
wishlistRouter.get("/", isLoggedIn, getWishlistCtrl);
wishlistRouter.post("/merge", isLoggedIn, mergeWishlistCtrl);

export default wishlistRouter;
