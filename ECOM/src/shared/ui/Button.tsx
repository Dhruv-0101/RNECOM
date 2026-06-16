import React from "react";
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { Text } from "./Text";
import { SPACING, BORDER_RADIUS } from "@/src/shared/constants/spacing";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "text";
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: "left" | "right";
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  iconPosition = "left",
  style,
  textStyle,
}) => {
  const { colors } = useTheme();

  // Combine conditions
  const isInteractionDisabled = disabled || loading;

  // Determine styles dynamically based on theme/variant
  let buttonBg = colors.primary;
  let buttonBorder = "transparent";
  let textColor = "#ffffff";

  if (variant === "outline") {
    buttonBg = "transparent";
    buttonBorder = colors.primary;
    textColor = colors.primary;
  } else if (variant === "text") {
    buttonBg = "transparent";
    buttonBorder = "transparent";
    textColor = colors.primary;
  }

  // Disabled overlay/adjustment
  if (disabled) {
    buttonBg = variant === "primary" ? colors.border : "transparent";
    buttonBorder = variant === "outline" ? colors.border : "transparent";
    textColor = colors.textMuted;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isInteractionDisabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: buttonBg,
          borderColor: buttonBorder,
          borderWidth: variant === "outline" ? 1.5 : 0,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === "primary" ? "#ffffff" : colors.primary} />
      ) : (
        <>
          {icon && iconPosition === "left" && (
            <Ionicons
              name={icon}
              size={18}
              color={textColor}
              style={{ marginRight: SPACING.sm }}
            />
          )}
          <Text
            variant="md"
            weight="semibold"
            color={textColor}
            style={textStyle}
          >
            {title}
          </Text>
          {icon && iconPosition === "right" && (
            <Ionicons
              name={icon}
              size={18}
              color={textColor}
              style={{ marginLeft: SPACING.sm }}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    width: "100%",
    marginVertical: SPACING.xs,
  },
});

export default Button;
