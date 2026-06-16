import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { Text } from "@/src/shared/ui/Text";

export default function Cart() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text variant="xl" weight="bold">Cart Screen</Text>
      <Text variant="sm" color={colors.textMuted} style={styles.subtitle}>
        Feature coming soon!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  subtitle: {
    marginTop: 8,
  },
});
