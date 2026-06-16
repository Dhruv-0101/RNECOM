import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "@/src/features/auth/store/authSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  // We can add other reducers (like cart, admin, wishlist) here as we build them
});

export default rootReducer;
