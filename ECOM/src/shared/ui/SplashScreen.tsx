import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, ActivityIndicator, Dimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { Text } from "./Text";
import { SPACING } from "../constants/spacing";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export function SplashScreen() {
  const { colors, theme } = useTheme();

  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textSlideY = useRef(new Animated.Value(20)).current;
  const loaderOpacity = useRef(new Animated.Value(0)).current;
  
  // Custom pulsing loop for the logo
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Entrance Animations: Logo scales up and text slides up/fades in
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(textSlideY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(loaderOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Loop a gentle pulsing animation on the logo once entry is done
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.05,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 0.95,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, [logoScale, logoOpacity, textOpacity, textSlideY, loaderOpacity, pulseScale]);

  // Gradient Colors based on Theme (Premium Gradient look)
  const gradientColors = theme === "dark" 
    ? ["#0b0f19", "#111827", "#1e1b4b"] as const
    : ["#eef2ff", "#e0e7ff", "#c7d2fe"] as const;

  // Icon Badge background
  const badgeBg = theme === "dark" ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.1)";

  // Combine scaling and pulsing
  const logoAnimatedStyle = {
    opacity: logoOpacity,
    transform: [
      { scale: logoScale },
      { scale: pulseScale }
    ]
  };

  const textAnimatedStyle = {
    opacity: textOpacity,
    transform: [{ translateY: textSlideY }]
  };

  return (
    <View style={styles.container}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />
      
      {/* Visual background ambient glow circles */}
      <View style={[styles.ambientGlow, { backgroundColor: colors.primary, opacity: theme === "dark" ? 0.08 : 0.04 }]} />

      <View style={styles.content}>
        <Animated.View style={[styles.logoBadge, { backgroundColor: badgeBg, borderColor: colors.primary + "30" }, logoAnimatedStyle]}>
          <Text variant="xxxl" weight="bold" color={colors.primary} style={styles.logoIcon}>
            🛍️
          </Text>
        </Animated.View>

        <Animated.View style={[styles.brandContainer, textAnimatedStyle]}>
          <Text variant="xxxl" weight="bold" color={colors.primary} style={styles.brandText}>
            E-Shop
          </Text>
          <Text variant="sm" color={colors.textMuted} weight="medium" style={styles.subtext}>
            Your Premium E-Commerce Hub
          </Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { opacity: loaderOpacity }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text variant="xs" color={colors.textMuted} style={styles.loadingText}>
          Loading catalog...
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 56,
  },
  ambientGlow: {
    position: "absolute",
    top: SCREEN_HEIGHT * 0.25,
    width: 250,
    height: 250,
    borderRadius: 125,
    filter: "blur(50px)" as any, // Blur for native/web styles fallback
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoBadge: {
    width: 90,
    height: 90,
    borderRadius: 24,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    // Soft drop shadow
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 40,
    lineHeight: 48,
  },
  brandContainer: {
    alignItems: "center",
  },
  brandText: {
    fontSize: 34,
    letterSpacing: 1.5,
    marginBottom: 6,
    textShadowColor: "rgba(99, 102, 241, 0.15)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 6,
  },
  subtext: {
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    letterSpacing: 1,
  },
});

export default SplashScreen;
