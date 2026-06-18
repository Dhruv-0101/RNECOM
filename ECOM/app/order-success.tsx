import React from "react";
import { View, StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { Text } from "@/src/shared/ui/Text";
import { Button } from "@/src/shared/ui/Button";
import { SPACING } from "@/src/shared/constants/spacing";

export default function OrderSuccessScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          {/* Green Checkmark Circle Banner */}
          <View style={[styles.successIconWrapper, { backgroundColor: colors.success + "15" }]}>
            <Ionicons name="checkmark-circle" size={80} color={colors.success} />
          </View>

          {/* Success Messaging */}
          <Text variant="xxl" weight="bold" align="center" style={styles.title}>
            Order Placed Successfully!
          </Text>

          <Text variant="md" color={colors.textMuted} align="center" style={styles.subtitle}>
            Thank you for shopping with us. Your payment has been processed successfully, and we have received your order. We are preparing it for shipment!
          </Text>

          {/* Home Catalog CTA Button */}
          <Button
            title="Continue Shopping"
            onPress={() => router.replace("/")}
            icon="basket-outline"
            style={styles.homeBtn}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "100%",
    paddingHorizontal: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  successIconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xl,
  },
  title: {
    marginBottom: SPACING.md,
    lineHeight: 32,
  },
  subtitle: {
    lineHeight: 22,
    marginBottom: SPACING.xxl,
  },
  homeBtn: {
    minWidth: 200,
  },
});
