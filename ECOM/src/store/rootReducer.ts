import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "@/src/features/auth/store/authSlice";
import cartReducer from "@/src/features/cart/store/cartSlice";
import wishlistReducer from "@/src/features/wishlist/store/wishlistSlice";
import searchReducer from "@/src/features/search/store/searchSlice";
import locationReducer from "@/src/features/location/store/locationSlice";
import shippingAddressReducer from "@/src/features/shippingAddress/store/shippingAddressSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  wishlist: wishlistReducer,
  search: searchReducer,
  location: locationReducer,
  shippingAddress: shippingAddressReducer,
});

export default rootReducer;
