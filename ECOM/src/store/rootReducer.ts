import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "@/src/features/auth/store/authSlice";
import cartReducer from "@/src/features/cart/store/cartSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
});

export default rootReducer;
