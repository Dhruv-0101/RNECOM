import { useEffect, useState } from "react";
import { LogBox } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";

LogBox.ignoreLogs([
  "expo-notifications: Android Push notifications",
]);
import { ReduxProvider } from "@/src/shared/providers/ReduxProvider";
import { QueryProvider } from "@/src/shared/providers/QueryProvider";
import { ThemeProvider, useTheme } from "@/src/shared/providers/ThemeProvider";
import { useDispatch } from "react-redux";
import { secureStorage } from "@/src/services/storage/secureStorage";
import { setAuth, setInitialized } from "@/src/features/auth/store/authSlice";
import { authApi } from "@/src/features/auth/api/authApi";
import { wishlistApi } from "@/src/features/wishlist/api/wishlistApi";
import { setWishlist } from "@/src/features/wishlist/store/wishlistSlice";
import { useCurrentUser } from "@/src/features/auth/hooks/useCurrentUser";
import { AppDispatch } from "@/src/store/store";
import { SplashScreen } from "@/src/shared/ui/SplashScreen";
import * as Notifications from "expo-notifications";
import { useRef } from "react";
import { registerForPushNotificationsAsync, registerPushTokenOnBackend } from "@/src/services/notifications/pushNotifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function RootLayoutNav() {
  /*
  The Problem: Checking the login token from device storage/API on startup takes a moment. 
  Without a guard, the app immediately redirects users to /login before the check finishes, 
  causing screen flashing.

The Solution (isInitialized):
While isInitialized is false, the app displays the Splash Screen and freezes all redirects.
Once the startup check is done (guest or authenticated), isInitialized is set to true, hiding the 
Splash Screen and letting routing guards execute safely without glitches.
  */
  const { isAuthenticated, isInitialized } = useCurrentUser();
  const [showSplash, setShowSplash] = useState(true);
  const dispatch = useDispatch<AppDispatch>(); //koi bhi action ka dispatch
  const segments = useSegments();
  const router = useRouter();
  const { colors, theme } = useTheme();

  const responseListener = useRef<any>(null);
  const notificationListener = useRef<any>(null);

  // 1. Hydrate auth state from Secure Store and show Splash Screen
  useEffect(() => {
    async function initAuth() {
      // ⏱️ Step A: Record the exact millisecond when the check starts.
      // This is used later to calculate how long the token validation process took.
      const startTime = Date.now();

      try {
        // 🔑 Step B: Retrieve the stored authentication token from the device's secure storage.
        const token = await secureStorage.getToken();

        if (token) {
          // 🌐 Step C: If a token exists, verify its validity by requesting the profile from the server.
          const profileData = await authApi.getProfile();

          if (profileData.user) {
            // ✅ Step D: If the profile is returned successfully, update the Redux store.
            // This marks the user as 'isAuthenticated' and saves their details.
            dispatch(setAuth({ user: profileData.user, token }));

            // ⭐ ADD THIS: Fetch wishlist after successful auth
            try {
              const wishlistData = await wishlistApi.getWishlist();
              dispatch(setWishlist(wishlistData.wishlist || []));
            } catch (wErr) {
              console.log("Failed to fetch wishlist on startup:", wErr);
            }
          } else {
            // ❌ Step E: If the token is invalid or inactive, delete it from storage to clean up.
            await secureStorage.removeToken();
          }
        }
      } catch (error) {
        // ⚠️ Step F: If the server request fails (e.g., network timeout, invalid token causing a 401 error),
        // log the error and clear the invalid token from secure storage.
        console.log(
          "Auth session recovery failed, cleaning storage token:",
          error,
        );
        await secureStorage.removeToken();
      } finally {
        // ⏳ Step G: Calculate how long the auth validation took.
        const elapsedTime = Date.now() - startTime;

        // 🎬 Step H: Enforce the splash screen to display for at least 1500ms.
        // If the API call completes in 300ms, the splash screen will stay for another 1200ms.
        // This prevents the screen from "flickering" or flashing away too fast on high-speed connections.
        const remainingTime = Math.max(0, 1500 - elapsedTime);

        // 🏁 Step I: Once the minimum duration is met, update the UI states.
        setTimeout(() => {
          // Set 'isInitialized' to true in Redux so that Route Guards know it is safe to redirect or load components.
          dispatch(setInitialized(true));
          // Set local state 'showSplash' to false to unmount the splash screen loader and render the main app screen.
          setShowSplash(false);
        }, remainingTime);
      }
    }
    // Execute the self-contained initialization function on component mount
    initAuth();
  }, [dispatch]);

  // 2. Guest-First Auth Route Guards
  useEffect(() => {
    // Wait for the initialization check to complete and splash screen to hide
    if (!isInitialized || showSplash) return;

    /*
    URL	segments value
/	[] (empty array – root)
/login	["login"]
/profile/settings	["profile", "settings"]
/(auth)/signup (auth group)	["(auth)", "signup"]
/(tabs)/shop/product/42	["(tabs)", "shop", "product", "42"]
    */

    // Check if the route is part of the auth group (e.g. login/signup)
    const inAuthGroup =
      (segments[0] as string) === "(auth)" ||
      (segments as string[]).includes("login") ||
      (segments as string[]).includes("signup");

    // Define namespaces that require authenticated users
    const protectedRoutes = ["checkout", "orders"];
    const isProtectedRoute = (segments as string[]).some((segment) =>
      protectedRoutes.includes(segment),
    );

    if (!isAuthenticated && isProtectedRoute) {
      // Guest trying to enter protected section -> redirect to login
      router.replace("/login");
    } else if (isAuthenticated && inAuthGroup) {
      // Authenticated user landing on login/register page -> redirect to Home
      router.replace("/");
    }
  }, [isAuthenticated, isInitialized, showSplash, segments, router]);

  // 3. Handle Push Notifications setup and tap/received listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    // Register push notification token
    const setupNotifications = async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await registerPushTokenOnBackend(token);
      }
    };
    setupNotifications();

    // Listen for notification response (taps) in foreground / background / closed states
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log("Notification received in foreground:", notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { type?: string; orderId?: string };
      console.log("Notification tapped with data:", data);

      if (data && data.type === "ORDER_STATUS" && data.orderId) {
        router.push({
          pathname: "/profile",
          params: { orderId: data.orderId },
        });
      } else if (data && data.type === "NEW_COUPON") {
        router.push("/");
      }
    });

    // Check if the app was launched by tapping a notification (closed state launch)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content.data as { type?: string; orderId?: string };
        console.log("App launched from notification with data:", data);
        if (data && data.type === "ORDER_STATUS" && data.orderId) {
          router.push({
            pathname: "/profile",
            params: { orderId: data.orderId },
          });
        } else if (data && data.type === "NEW_COUPON") {
          router.push("/");
        }
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated, router]);

  // Render Premium Brand Splash Screen
  if (!isInitialized || showSplash) {
    return <SplashScreen />;
  }

  return (
    <>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} initialRouteName="(tabs)">
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ReduxProvider>
      <QueryProvider>
        <ThemeProvider>
          <RootLayoutNav />
        </ThemeProvider>
      </QueryProvider>
    </ReduxProvider>
  );
}
