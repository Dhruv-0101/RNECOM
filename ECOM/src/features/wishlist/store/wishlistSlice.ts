import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Product } from "@/src/features/products/types/product.types";

interface WishlistState {
  items: Product[];
}

const initialState: WishlistState = {
  items: [],
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    setWishlist: (state, action: PayloadAction<Product[]>) => {
      state.items = action.payload;
    },
    addToWishlistLocal: (state, action: PayloadAction<Product>) => {
      const exists = state.items.some((item) => item._id === action.payload._id);
      if (!exists) {
        state.items.push(action.payload);
      }
    },
    removeFromWishlistLocal: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item._id !== action.payload);
    },
    clearWishlist: (state) => {
      state.items = [];
    },
  },
});

export const {
  setWishlist,
  addToWishlistLocal,
  removeFromWishlistLocal,
  clearWishlist,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
