import exppress from "express";
import {
  registerUserCtrl,
  loginUserCtrl,
  getUserProfileCtrl,
  updateShippingAddresctrl,
  getAllUsersCtrl,
} from "../controllers/usersCtrl.js";
import {
  mobileLoginUserCtrl,
  mobileRefreshTokenCtrl,
  mobileLogoutUserCtrl,
} from "../controllers/mobileUsersCtrl.js";
import { isLoggedIn } from "../middlewares/isLoggedIn.js";
import isAdmin from "../middlewares/isAdmin.js";

const userRoutes = exppress.Router();

userRoutes.get("/", isLoggedIn, isAdmin, getAllUsersCtrl);
userRoutes.post("/register", registerUserCtrl);
userRoutes.post("/login", loginUserCtrl);
userRoutes.get("/profile", isLoggedIn, getUserProfileCtrl);
userRoutes.put("/update/shipping", isLoggedIn, updateShippingAddresctrl);

// Mobile RTR Routes
userRoutes.post("/mobile/login", mobileLoginUserCtrl);
userRoutes.post("/mobile/refresh", mobileRefreshTokenCtrl);
userRoutes.post("/mobile/logout", mobileLogoutUserCtrl);

export default userRoutes;
