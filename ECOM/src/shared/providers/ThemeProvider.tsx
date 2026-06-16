import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import { COLORS, ThemeType } from "@/src/shared/constants/colors";

type ThemeContextType = {
  theme: ThemeType;
  colors: typeof COLORS.light;
  isDark: boolean;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>((systemScheme as ThemeType) || "light");

  useEffect(() => {
    if (systemScheme) {
      setThemeState(systemScheme as ThemeType);
    }
  }, [systemScheme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  const setTheme = (selectedTheme: ThemeType) => {
    setThemeState(selectedTheme);
  };

  const colors = COLORS[theme];
  const isDark = theme === "dark";

  return (
    <ThemeContext.Provider value={{ theme, colors, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
