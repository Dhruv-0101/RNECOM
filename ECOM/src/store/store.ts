import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./rootReducer";

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

// RootState represents the shape of the entire global state tree
export type RootState = ReturnType<typeof store.getState>;

// AppDispatch is the strictly-typed dispatch function for sending actions
export type AppDispatch = typeof store.dispatch;

export default store;
