// Dynamic light/dark theme. Static spacing/font tokens; colors come from a
// hook so callers re-render when dark mode flips.

import { Platform } from "react-native";

import { useSettings } from "@/src/game/settings";

export type ColorPalette = {
  background: string;
  backgroundSecondary: string;
  surface: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  victory: string;
  blue: string;
  blueSoft: string;
  border: string;
  borderStrong: string;
  locked: string;
  arrow: string;
  white: string;
  black: string;
  trophyGold: string;
};

export const LIGHT: ColorPalette = {
  background: "#FFFFFF",
  backgroundSecondary: "#F4F4F6",
  surface: "#FFFFFF",
  text: "#0A0A0F",
  textSecondary: "#6E6E78",
  textMuted: "#B5B5B5",
  victory: "#0044FF",
  blue: "#0044FF",
  blueSoft: "#D8E2FF",
  border: "#EBEBEB",
  borderStrong: "#0A0A0F",
  locked: "#D1D1D1",
  arrow: "#0A0A0F",
  white: "#FFFFFF",
  black: "#0A0A0F",
  trophyGold: "#F1B900",
};

export const DARK: ColorPalette = {
  background: "#0E1320",
  backgroundSecondary: "#181F32",
  surface: "#1B2236",
  text: "#FFFFFF",
  textSecondary: "#9DA6BC",
  textMuted: "#5B6377",
  victory: "#5A8BFF",
  blue: "#5A8BFF",
  blueSoft: "#1E2A4D",
  border: "#232B41",
  borderStrong: "#FFFFFF",
  locked: "#2F3651",
  arrow: "#FFFFFF",
  white: "#FFFFFF",
  black: "#0A0A0F",
  trophyGold: "#F1B900",
};

export const useColors = (): ColorPalette => {
  const { settings } = useSettings();
  return settings.darkMode ? DARK : LIGHT;
};

// Static design tokens — these don't change with theme.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const fonts = {
  display: Platform.select({
    ios: "Avenir-Heavy",
    android: "sans-serif-black",
    default: "System",
  }) as string,
  ui: Platform.select({
    ios: "Avenir-Medium",
    android: "sans-serif-medium",
    default: "System",
  }) as string,
} as const;

export const radius = {
  sm: 0,
  md: 14,
  lg: 24,
  pill: 999,
} as const;

export const timing = {
  slide: 320,
  bounce: 240,
  tap: 120,
  victoryIn: 420,
} as const;
