import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "@/src/features/auth/store/authSlice";
import cartReducer from "@/src/features/cart/store/cartSlice";
import wishlistReducer from "@/src/features/wishlist/store/wishlistSlice";
import searchReducer from "@/src/features/search/store/searchSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  wishlist: wishlistReducer,
  search: searchReducer,
});

export default rootReducer;
