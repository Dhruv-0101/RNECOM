import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { ReduxProvider } from "@/src/shared/providers/ReduxProvider";
import { QueryProvider } from "@/src/shared/providers/QueryProvider";
import { ThemeProvider, useTheme } from "@/src/shared/providers/ThemeProvider";
import { useDispatch } from "react-redux";
import { secureStorage } from "@/src/services/storage/secureStorage";
import { setAuth, setInitialized } from "@/src/features/auth/store/authSlice";
import { authApi } from "@/src/features/auth/api/authApi";
import { useCurrentUser } from "@/src/features/auth/hooks/useCurrentUser";
import { Text } from "@/src/shared/ui/Text";
import { AppDispatch } from "@/src/store/store";

function RootLayoutNav() {
  const { isAuthenticated, isInitialized } = useCurrentUser();
  const [showSplash, setShowSplash] = useState(true);
  const dispatch = useDispatch<AppDispatch>();
  const segments = useSegments();
  const router = useRouter();
  const { colors, theme } = useTheme();

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
          } else {
            // ❌ Step E: If the token is invalid or inactive, delete it from storage to clean up.
            await secureStorage.removeToken();
          }
        }
      } catch (error) {
        // ⚠️ Step F: If the server request fails (e.g., network timeout, invalid token causing a 401 error),
        // log the error and clear the invalid token from secure storage.
        console.log("Auth session recovery failed, cleaning storage token:", error);
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
    const protectedRoutes = ["cart", "profile", "checkout", "orders"];
    const isProtectedRoute = (segments as string[]).some((segment) =>
      protectedRoutes.includes(segment)
    );

    if (!isAuthenticated && isProtectedRoute) {
      // Guest trying to enter protected section -> redirect to login
      router.replace("/login");
    } else if (isAuthenticated && inAuthGroup) {
      // Authenticated user landing on login/register page -> redirect to Home
      router.replace("/");
    }
  }, [isAuthenticated, isInitialized, showSplash, segments, router]);

  // Render Premium Brand Splash Screen
  if (!isInitialized || showSplash) {
    return (
      <View style={[styles.splashContainer, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
        <View style={styles.brandContainer}>
          <View style={[styles.logoBadge, { backgroundColor: colors.primaryLight }]}>
            <Text variant="xxxl" weight="bold" color={colors.primary}>
              🛍️
            </Text>
          </View>
          <Text variant="xxxl" weight="bold" color={colors.primary} style={styles.brandText}>
            E-Shop
          </Text>
          <Text variant="sm" color={colors.textMuted}>
            Your Premium E-Commerce Hub
          </Text>
        </View>
        <ActivityIndicator size="small" color={colors.primary} style={styles.spinner} />
      </View>
    );
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

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 48,
  },
  brandContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  brandText: {
    letterSpacing: 1,
    marginBottom: 4,
  },
  spinner: {
    marginTop: "auto",
  },
});

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
//hi
