import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./rootReducer";
import { hydrateCart } from "@/src/features/cart/store/cartSlice";
import { cartStorage } from "@/src/features/cart/storage/cartStorage";

/**
 * Global Redux Store instance.
 * 
 * Configures the Redux store with the combined rootReducer and registers
 * custom middleware rules.
 */
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Disable the serializable check warning. React Native ecosystem libraries
      // occasionally pass non-serializable objects (functions, native events, dates)
      // in actions. Disabling this avoids unnecessary developer console warnings.
      serializableCheck: false,
    }),
});

cartStorage.getItems().then((items) => {
  store.dispatch(hydrateCart(items));
});

let currentCartItems = store.getState().cart.items;
store.subscribe(() => {
  const nextCartItems = store.getState().cart.items;
  if (nextCartItems !== currentCartItems) {
    currentCartItems = nextCartItems;
    cartStorage.setItems(nextCartItems);
  }
});

// RootState represents the shape of the entire global state tree
export type RootState = ReturnType<typeof store.getState>;

// AppDispatch is the strictly-typed dispatch function for sending actions
export type AppDispatch = typeof store.dispatch;

export default store;
