import { configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import rootReducer from "./rootReducer";

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["cart", "wishlist"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

// RootState represents the shape of the entire global state tree
export type RootState = ReturnType<typeof store.getState>;

// AppDispatch is the strictly-typed dispatch function for sending actions
export type AppDispatch = typeof store.dispatch;

export default store;
/*
Think of the whole flow like this:

```text id="0b7s2j"
Redux Store
    ↓
cart
wishlist
auth
search
    ↓
Redux Persist
    ↓
AsyncStorage
```

---

# 1. rootReducer

```ts
const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  wishlist: wishlistReducer,
  search: searchReducer,
});
```

### Feel

This is creating one big Redux state from many smaller slices.

Result:

```js
{
  auth: {...},
  cart: {...},
  wishlist: {...},
  search: {...}
}
```

Think:

```text id="s4q8po"
auth reducer
cart reducer
wishlist reducer
search reducer
       ↓
combineReducers
       ↓
one big Redux Store
```

---

# 2. persistConfig

```ts
const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["cart", "wishlist"],
};
```

### Feel

This tells Redux Persist:

```text id="i1e86w"
"Only save cart and wishlist."
```

Equivalent:

```text id="3j4o6d"
cart      ✅ save
wishlist  ✅ save
auth      ❌ don't save
search    ❌ don't save
```

---

### Example

Before closing app:

```js
{
  auth: {
    user: "Dhruv"
  },

  cart: {
    items: [...]
  },

  wishlist: {
    items: [...]
  },

  search: {
    query: "iphone"
  }
}
```

Only this goes into AsyncStorage:

```js
{
  cart: {
    items: [...]
  },

  wishlist: {
    items: [...]
  }
}
```

---

# 3. persistReducer

```ts
const persistedReducer =
  persistReducer(
    persistConfig,
    rootReducer
  );
```

### Feel

Wrap the root reducer with persistence powers.

Before:

```text id="owgg3d"
rootReducer
```

After:

```text id="m47s40"
persistedReducer
```

Now Redux knows:

```text id="rhh39p"
Save cart
Save wishlist
Restore cart
Restore wishlist
```

---

# 4. configureStore

```ts
export const store =
 configureStore({
   reducer: persistedReducer,
 });
```

### Feel

Creates the global Redux Store.

Result:

```js
store
```

contains:

```js
{
  auth,
  cart,
  wishlist,
  search
}
```

---

# 5. Middleware

```ts
serializableCheck: {
  ignoredActions: [
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER
  ]
}
```

### Feel

Redux Toolkit normally warns:

```text id="jlwmrw"
"Non-serializable value detected"
```

Redux Persist internally uses some special objects.

So you're telling Redux:

```text id="smgfjz"
Ignore warnings
for Redux Persist actions.
```

Nothing fancy.

Just preventing console warnings.

---

# 6. persistStore

```ts
export const persistor =
  persistStore(store);
```

### Feel

Creates the engine that:

```text id="xyrp5j"
Saves state
Loads state
Clears state
```

Think:

```text id="a6yjlwm"
store
   ↓
persistor
   ↓
AsyncStorage
```

---

# 7. ReduxProvider

```tsx
<Provider store={store}>
```

### Feel

Makes Redux available everywhere.

Without this:

```ts
useSelector(...)
useDispatch(...)
```

won't work.

---

### Example

Now any screen can do:

```ts
const cart =
 useSelector(
   state => state.cart
 );
```

because of Provider.

---

# 8. PersistGate

```tsx
<PersistGate
  persistor={persistor}
>
```

### Feel

Wait until AsyncStorage data is restored.

---

Without PersistGate:

```text id="evhuyh"
App Opens
↓
Cart Empty
↓
AsyncStorage Loads
↓
Cart Appears
```

UI flicker.

---

With PersistGate:

```text id="abg6of"
App Opens
↓
Loading Spinner
↓
Cart Restored
↓
App Shows
```

Much cleaner.

---

# 9. ActivityIndicator

```tsx
<ActivityIndicator
  size="large"
  color="#0284c7"
/>
```

### Feel

While PersistGate is loading:

```text id="0fclum"
⟳ Loading...
```

show spinner.

---

# Complete Flow

### User adds products

```text id="q80mnf"
Add To Cart
↓
Redux Cart Updated
↓
Persistor Saves Cart
↓
AsyncStorage
```

---

### User closes app

```text id="7p04f7"
App Closed
```

Cart still exists in AsyncStorage.

---

### User opens app again

```text id="0st2u6"
App Starts
↓
PersistGate waits
↓
Persistor reads AsyncStorage
↓
Cart restored
↓
App renders
```

---

# Final Feel

```text id="v9n93j"
rootReducer
= combines all slices

persistConfig
= decides what to save

persistReducer
= gives persistence powers

store
= global Redux state

persistor
= save/load engine

Provider
= makes Redux available

PersistGate
= waits for saved data

ActivityIndicator
= loading spinner
```

And because of:

```ts
whitelist: ["cart", "wishlist"]
```

Only:

```text id="wwhtgz"
cart      ✅ persisted
wishlist  ✅ persisted

auth      ❌ not persisted
search    ❌ not persisted
```

are saved to AsyncStorage and restored automatically when the app starts.

*/