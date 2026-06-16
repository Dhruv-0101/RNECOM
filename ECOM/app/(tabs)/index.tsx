import React from "react";
import { StyleSheet, View, SafeAreaView } from "react-native";
import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { useCurrentUser } from "@/src/features/auth/hooks/useCurrentUser";
import { useLogout } from "@/src/features/auth/hooks/useLogout";
import { Text } from "@/src/shared/ui/Text";
import { Button } from "@/src/shared/ui/Button";
import { Card } from "@/src/shared/ui/Card";
import { SPACING } from "@/src/shared/constants/spacing";

export default function Home() {
  const { colors, toggleTheme, theme } = useTheme();
  const { user } = useCurrentUser();
  const { logout } = useLogout();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text variant="xxl" weight="bold">
            Hello, {user?.fullname || "Shopper"}! 👋
          </Text>
          <Text variant="sm" color={colors.textMuted}>
            Welcome to your premium e-commerce app
          </Text>
        </View>

        <Card style={styles.card}>
          <Text variant="lg" weight="semibold" style={styles.cardTitle}>
            Account Information
          </Text>
          <View style={styles.infoRow}>
            <Text variant="sm" color={colors.textMuted}>Email:</Text>
            <Text variant="sm" weight="medium">{user?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text variant="sm" color={colors.textMuted}>Role:</Text>
            <Text variant="sm" weight="medium" color={user?.isAdmin ? colors.primary : colors.text}>
              {user?.isAdmin ? "Administrator" : "Customer"}
            </Text>
          </View>
        </Card>

        <View style={styles.buttonGroup}>
          <Button
            title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
            onPress={toggleTheme}
            variant="outline"
            icon={theme === "light" ? "moon-outline" : "sunny-outline"}
            style={styles.actionBtn}
          />

          <Button
            title="Sign Out"
            onPress={logout}
            variant="primary"
            icon="log-out-outline"
            style={[styles.actionBtn, { backgroundColor: colors.error }]}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: "space-between",
  },
  header: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  cardTitle: {
    marginBottom: SPACING.md,
  },
  card: {
    marginVertical: SPACING.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f033",
  },
  buttonGroup: {
    marginTop: SPACING.xl,
  },
  actionBtn: {
    marginVertical: SPACING.sm,
  },
});
