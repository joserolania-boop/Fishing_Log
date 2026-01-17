import { Platform } from "react-native";

export const AppColors = {
  primary: "#1E88E5",
  primaryDark: "#1565C0",
  secondary: "#4CAF50",
  accent: "#FF6F00",
  accentLight: "#FF8F00",
  background: "#F5F7FA",
  surface: "#FFFFFF",
  textPrimary: "#1A1A1A",
  textSecondary: "#666666",
  border: "#E0E0E0",
  destructive: "#E53935",
  proBadge: "#FFD700",
  adPlaceholder: "#F0F0F0",
  success: "#4CAF50",
  warning: "#FF9800",
  info: "#2196F3",
};

const tintColorLight = AppColors.primary;
const tintColorDark = "#42A5F5";

export const Colors = {
  light: {
    text: AppColors.textPrimary,
    textSecondary: AppColors.textSecondary,
    buttonText: "#FFFFFF",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    link: AppColors.primary,
    accent: AppColors.accent,
    destructive: AppColors.destructive,
    error: AppColors.destructive,
    border: AppColors.border,
    backgroundRoot: AppColors.background,
    backgroundDefault: AppColors.surface,
    backgroundSecondary: "#F0F0F0",
    backgroundTertiary: "#E8E8E8",
    proBadge: AppColors.proBadge,
    adPlaceholder: AppColors.adPlaceholder,
    card: AppColors.surface,
    success: AppColors.success,
    warning: AppColors.warning,
  },
  dark: {
    text: "#ECEDEE",
    textSecondary: "#9BA1A6",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    link: tintColorDark,
    accent: AppColors.accentLight,
    destructive: "#EF5350",
    error: "#EF5350",
    border: "#404244",
    backgroundRoot: "#1F2123",
    backgroundDefault: "#2A2C2E",
    backgroundSecondary: "#353739",
    backgroundTertiary: "#404244",
    proBadge: AppColors.proBadge,
    adPlaceholder: "#353739",
    card: "#2A2C2E",
    success: "#66BB6A",
    warning: "#FFA726",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
  fabSize: 56,
  cardPhotoSize: 80,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 22,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
