import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/providers/ThemeProvider";

interface LoaderProps {
  fullScreen?: boolean;
  size?: "small" | "large";
}

export const Loader: React.FC<LoaderProps> = ({ fullScreen = false, size = "large" }) => {
  const { colors } = useTheme();

  if (fullScreen) {
    return (
      <View style={[styles.container, styles.fullScreen, { backgroundColor: "rgba(15, 23, 42, 0.4)" }]}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ActivityIndicator size={size} color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
});

export default Loader;
