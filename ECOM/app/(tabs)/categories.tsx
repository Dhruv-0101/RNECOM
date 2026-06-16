import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { Text } from "@/src/shared/ui/Text";

export default function Categories() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text variant="xl" weight="bold">Categories Screen</Text>
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
