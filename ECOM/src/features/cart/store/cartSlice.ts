import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Product } from "@/src/features/products/types/product.types";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  brand: string;
  image?: string;
  price: number;
  color: string;
  size: string;
  quantity: number;
  qtyLeft: number;
}

interface CartState {
  items: CartItem[];
}

export interface AddToCartPayload {
  product: Product;
  color: string;
  size: string;
  quantity: number;
}

const initialState: CartState = {
  items: [],
};

const getCartItemId = (productId: string, color: string, size: string) =>
  `${productId}:${color}:${size}`;

const toCartItem = ({ product, color, size, quantity }: AddToCartPayload): CartItem => ({
  id: getCartItemId(product._id, color, size),
  productId: product._id,
  name: product.name,
  brand: product.brand,
  image: product.images?.[0],
  price: product.price,
  color,
  size,
  quantity,
  qtyLeft: product.qtyLeft ?? product.totalQty ?? 0,
});

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    hydrateCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
    },
    addToCart: (state, action: PayloadAction<AddToCartPayload>) => {
      const { product, color, size, quantity } = action.payload;
      const itemId = getCartItemId(product._id, color, size);
      const existingItem = state.items.find((item) => item.id === itemId);

      if (existingItem) {
        const maxQty = product.qtyLeft ?? product.totalQty ?? existingItem.qtyLeft;
        existingItem.quantity = Math.min(existingItem.quantity + quantity, maxQty);
        return;
      }

      state.items.push(toCartItem(action.payload));
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    updateCartQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const { id, quantity } = action.payload;
      const existingItem = state.items.find((item) => item.id === id);
      if (existingItem) {
        existingItem.quantity = Math.max(1, Math.min(quantity, existingItem.qtyLeft));
      }
    },
    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const { hydrateCart, addToCart, removeFromCart, clearCart, updateCartQuantity } = cartSlice.actions;
export default cartSlice.reducer;
