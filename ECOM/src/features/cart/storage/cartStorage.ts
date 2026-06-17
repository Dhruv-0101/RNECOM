import AsyncStorage from "@react-native-async-storage/async-storage";
import { CartItem } from "../store/cartSlice";

const CART_STORAGE_KEY = "ecom.cart.items";

export const cartStorage = {
  async getItems(): Promise<CartItem[]> {
    try {
      const value = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (!value) return [];

      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.log("Cart storage read failed:", error);
      return [];
    }
  },

  async setItems(items: CartItem[]) {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.log("Cart storage write failed:", error);
    }
  },

  async clear() {
    try {
      await AsyncStorage.removeItem(CART_STORAGE_KEY);
    } catch (error) {
      console.log("Cart storage clear failed:", error);
    }
  },
};

export default cartStorage;
