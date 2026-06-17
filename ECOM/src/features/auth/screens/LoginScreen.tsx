import React from "react";
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { LoginForm } from "../components/LoginForm";
import { Text } from "@/src/shared/ui/Text";
import { Card } from "@/src/shared/ui/Card";
import { SPACING } from "@/src/shared/constants/spacing";

export const LoginScreen: React.FC = () => {
  const { colors } = useTheme();
  const router = useRouter();

  const handleLoginSuccess = () => {
    // Redirecting to root tabs index (the home screen)
    router.replace("/");
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerContainer}>
            {/* Elegant Premium Accent Icon placeholder */}
            <View style={[styles.logoPlaceholder, { backgroundColor: colors.primaryLight }]}>
              <Text variant="xxl" weight="bold" color={colors.primary}>
                🛍️
              </Text>
            </View>

            <Text variant="xxxl" weight="bold" style={styles.title}>
              Welcome Back
            </Text>
            <Text variant="sm" color={colors.textMuted} style={styles.subtitle}>
              Sign in to access your wishlist, cart, and orders
            </Text>
          </View>

          <Card style={styles.card}>
            <LoginForm onSuccess={handleLoginSuccess} />
          </Card>

          <View style={styles.footer}>
            <Text variant="sm" color={colors.textMuted}>
              {"Don't have an account? "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/signup")}>
              <Text variant="sm" weight="semibold" color={colors.primary}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.replace("/")}
            style={styles.guestButton}
            activeOpacity={0.7}
          >
            <Text variant="sm" weight="semibold" color={colors.primary}>
              Browse as Guest
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SPACING.xl,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: SPACING.xxl,
  },
  logoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  title: {
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  subtitle: {
    textAlign: "center",
    paddingHorizontal: SPACING.xl,
  },
  card: {
    width: "100%",
    elevation: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.xl,
  },
  guestButton: {
    alignItems: "center",
    marginTop: SPACING.lg,
    padding: SPACING.sm,
  },
});

export default LoginScreen;
