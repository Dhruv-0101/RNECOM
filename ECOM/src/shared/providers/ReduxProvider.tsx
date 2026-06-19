import React from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { store, persistor } from "@/src/store/store";

/*
What does Redux Persist do?

Redux Persist saves selected parts of your Redux Store to persistent storage so the data survives app restarts.

In React Native, it typically works with AsyncStorage:

Redux Store
      ↓
AsyncStorage

For example, if your Redux state contains:

cart: {
  items: [...]
}

Redux Persist can automatically save that cart data into AsyncStorage.

When the user closes and reopens the app:

AsyncStorage
      ↓
Redux Store

The saved data is loaded back into the Redux Store, so the user still sees their cart items, wishlist, login state, etc.

This process of restoring persisted state from storage back into the Redux Store is called rehydration.

Why is it useful?

Without Redux Persist:

Close app
    ↓
Redux Store is cleared
    ↓
Cart, wishlist, and other state are lost

With Redux Persist:

Close app
    ↓
State is saved in AsyncStorage
    ↓
Reopen app
    ↓
State is restored automatically
*/

interface ReduxProviderProps {
  children: React.ReactNode;
}

export const ReduxProvider: React.FC<ReduxProviderProps> = ({ children }) => {
  return (
    <Provider store={store}>
      <PersistGate
        loading={
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0284c7" />
          </View>
        }
        persistor={persistor}
      >
        {children}
      </PersistGate>
    </Provider>
  );
};
/*
When the app restarts, Redux Persist automatically restores the saved state from AsyncStorage
This means your user's login status, cart items, theme preference, etc., are preserved across sessions
Think of it as a "memory" for your app's state.

What is ActivityIndicator?

ActivityIndicator is a built-in React Native component that displays a loading spinner to indicate that something is happening in the background and the user should wait.

Example:

<ActivityIndicator size="large" color="#0284c7" />

This renders a spinning loader on the screen.

Why is it used in your code?

In your code, ActivityIndicator is passed to the loading prop of PersistGate:

<PersistGate
  loading={
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#0284c7" />
    </View>
  }
  persistor={persistor}
>
  {children}
</PersistGate>

When the app starts, Redux Persist needs a moment to load the saved state from AsyncStorage and restore it into the Redux Store.

During that time:

PersistGate prevents the app from rendering.
The loading component is shown instead.
ActivityIndicator displays a spinner.
Once the persisted state has been restored, the spinner disappears and {children} (your app) is rendered.
What the user experiences
App starts
    ↓
Loading spinner appears
    ↓
Redux Persist restores saved data
    ↓
App UI is displayed
*/

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ReduxProvider;
