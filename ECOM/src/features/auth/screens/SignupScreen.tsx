import React from "react";
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { SignupForm } from "../components/SignupForm";
import { Text } from "@/src/shared/ui/Text";
import { Card } from "@/src/shared/ui/Card";
import { SPACING } from "@/src/shared/constants/spacing";

export const SignupScreen: React.FC = () => {
  const { colors } = useTheme();
  const router = useRouter();

  const handleSignupSuccess = () => {
    // Navigate back to the login page upon success
    router.replace("/login");
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
            <View style={[styles.logoPlaceholder, { backgroundColor: colors.primaryLight }]}>
              <Text variant="xxl" weight="bold" color={colors.primary}>
                🚀
              </Text>
            </View>

            <Text variant="xxxl" weight="bold" style={styles.title}>
              Create Account
            </Text>
            <Text variant="sm" color={colors.textMuted} style={styles.subtitle}>
              Join us to browse, save and order items seamlessly
            </Text>
          </View>

          <Card style={styles.card}>
            <SignupForm onSuccess={handleSignupSuccess} />
          </Card>

          <View style={styles.footer}>
            <Text variant="sm" color={colors.textMuted}>
              {"Already have an account? "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text variant="sm" weight="semibold" color={colors.primary}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
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
});

export default SignupScreen;
