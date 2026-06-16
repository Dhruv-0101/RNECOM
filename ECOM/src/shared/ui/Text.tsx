import React from "react";
import { Text as RNText, TextProps } from "react-native";
import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { FONTS } from "@/src/shared/constants/spacing";

interface CustomTextProps extends TextProps {
  variant?: keyof typeof FONTS.sizes;
  weight?: keyof typeof FONTS.weights;
  color?: string;
  align?: "auto" | "left" | "right" | "center" | "justify";
}

export const Text: React.FC<CustomTextProps> = ({
  children,
  variant = "md",
  weight = "regular",
  color,
  align = "left",
  style,
  ...props
}) => {
  const { colors } = useTheme();

  const textStyle = [
    {
      fontSize: FONTS.sizes[variant],
      fontWeight: FONTS.weights[weight],
      color: color || colors.text,
      textAlign: align,
    },
    style,
  ];

  return (
    <RNText style={textStyle} {...props}>
      {children}
    </RNText>
  );
};

export default Text;
