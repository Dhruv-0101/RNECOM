import React, { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useCurrentUser } from "@/src/features/auth/hooks/useCurrentUser";
import { useTheme } from "@/src/shared/providers/ThemeProvider";

export default function AdminLayout() {
  const { user, isAuthenticated, isInitialized } = useCurrentUser();
  const isLoading = !isInitialized;
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    if (!isLoading) {
      if (
        !isAuthenticated ||
        !user ||
        (!user.isAdmin && user.email !== "admin@gmail.com")
      ) {
        router.replace("/");
      }
    }
  }, [isAuthenticated, user, isLoading]);

  if (
    isLoading ||
    !user ||
    (!user.isAdmin && user.email !== "admin@gmail.com")
  ) {
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

  return <Stack screenOptions={{ headerShown: false }} />;
}
