export const COLORS = {
  light: {
    primary: "#6366f1", // Premium Indigo
    primaryDark: "#4f46e5",
    primaryLight: "#e0e7ff",
    background: "#f8fafc", // Cool Slate background
    surface: "#ffffff",
    text: "#0f172a", // Very dark slate
    textMuted: "#64748b", // Muted slate
    border: "#e2e8f0",
    error: "#ef4444", // Soft red
    success: "#10b981", // Soft emerald green
    warning: "#f59e0b", // Warm amber
    shadow: "#000000",
    inputBg: "#f1f5f9",
    inputPlaceholder: "#94a3b8",
  },
  dark: {
    primary: "#818cf8", // Rich indigo for dark mode
    primaryDark: "#6366f1",
    primaryLight: "#312e81",
    background: "#0f172a", // Deep slate background
    surface: "#1e293b", // Slate container
    text: "#f8fafc", // Off-white
    textMuted: "#94a3b8", // Muted slate
    border: "#334155",
    error: "#f87171",
    success: "#34d399",
    warning: "#fbbf24",
    shadow: "#000000",
    inputBg: "#1e293b",
    inputPlaceholder: "#64748b",
  },
};

export type ThemeType = "light" | "dark";

export default COLORS;
