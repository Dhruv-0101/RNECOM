import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { ReduxProvider } from "@/src/shared/providers/ReduxProvider";
import { QueryProvider } from "@/src/shared/providers/QueryProvider";
import { ThemeProvider, useTheme } from "@/src/shared/providers/ThemeProvider";
import { useDispatch } from "react-redux";
import { secureStorage } from "@/src/services/storage/secureStorage";
import { setAuth, setInitialized } from "@/src/features/auth/store/authSlice";
import { authApi } from "@/src/features/auth/api/authApi";
import { useCurrentUser } from "@/src/features/auth/hooks/useCurrentUser";
import { AppDispatch } from "@/src/store/store";

function RootLayoutNav() {
  const { isAuthenticated, isInitialized } = useCurrentUser();
  const dispatch = useDispatch<AppDispatch>();
  const segments = useSegments();
  const router = useRouter();
  const { colors, theme } = useTheme();

  // 1. Hydrate auth state from Secure Store
  useEffect(() => {
    async function initAuth() {
      try {
        const token = await secureStorage.getToken();
        if (token) {
          // Fetch active profile to verify token validity
          const profileData = await authApi.getProfile();
          if (profileData.user) {
            dispatch(setAuth({ user: profileData.user, token }));
          } else {
            await secureStorage.removeToken();
          }
        }
      } catch (error) {
        console.log(
          "Auth session recovery failed, cleaning storage token:",
          error,
        );
        await secureStorage.removeToken();
      } finally {
        dispatch(setInitialized(true));
      }
    }
    initAuth();
  }, [dispatch]);

  // 2. Auth Route Guards
  useEffect(() => {
    if (!isInitialized) return;

    // Check if the route is part of the auth group (e.g. (auth)/login)
    const inAuthGroup =
      (segments[0] as string) === "(auth)" ||
      (segments as string[]).includes("login") ||
      (segments as string[]).includes("signup");

    if (!isAuthenticated && !inAuthGroup) {
      // If not logged in and trying to access protected paths -> send to login
      router.replace("/login");
    } else if (isAuthenticated && inAuthGroup) {
      // If already logged in and hitting login/register screens -> redirect to main app
      router.replace("/");
    }
  }, [isAuthenticated, isInitialized, segments, router]);

  if (!isInitialized) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
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
//hi
