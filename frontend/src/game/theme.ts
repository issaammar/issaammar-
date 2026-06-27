// Dynamic light/dark theme. Static spacing/font tokens; colors come from a
// hook so callers re-render when dark mode flips.
// Palette aligned with the reference "Arrows" app (lavender / indigo).

import { Platform } from "react-native";

import { useSettings } from "@/src/game/settings";

export type ColorPalette = {
  background: string;
  backgroundSecondary: string;   // soft lavender card bg
  surface: string;
  surfaceStrong: string;          // selected tab pill bg
  text: string;
  textSecondary: string;
  textMuted: string;
  victory: string;
  blue: string;                   // primary indigo accent
  blueSoft: string;
  border: string;
  borderStrong: string;
  locked: string;
  arrow: string;
  white: string;
  black: string;
  trophyGold: string;
  success: string;                // calendar completed
  danger: string;                 // hearts
  toggleOff: string;
};

export const LIGHT: ColorPalette = {
  background: "#F5F5FC",
  backgroundSecondary: "#ECEAF7",
  surface: "#FFFFFF",
  surfaceStrong: "#DCD9F0",
  text: "#1B1D3A",
  textSecondary: "#7C7DA4",
  textMuted: "#B5B7D4",
  victory: "#5C5BE6",
  blue: "#5C5BE6",
  blueSoft: "#D5D3F7",
  border: "#E1DEF3",
  borderStrong: "#1B1D3A",
  locked: "#CFCFE4",
  arrow: "#1B1D3A",
  white: "#FFFFFF",
  black: "#1B1D3A",
  trophyGold: "#F1B900",
  success: "#22C55E",
  danger: "#FF5B6E",
  toggleOff: "#2A2C4F",
};

export const DARK: ColorPalette = {
  background: "#0E1320",
  backgroundSecondary: "#181F32",
  surface: "#1B2236",
  surfaceStrong: "#2A3454",
  text: "#FFFFFF",
  textSecondary: "#9DA6BC",
  textMuted: "#5B6377",
  victory: "#8C8BF5",
  blue: "#8C8BF5",
  blueSoft: "#283255",
  border: "#232B41",
  borderStrong: "#FFFFFF",
  locked: "#2F3651",
  arrow: "#FFFFFF",
  white: "#FFFFFF",
  black: "#0A0A0F",
  trophyGold: "#F1B900",
  success: "#34D399",
  danger: "#FF7384",
  toggleOff: "#3B4467",
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
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const timing = {
  slide: 320,
  bounce: 240,
  tap: 120,
  victoryIn: 420,
} as const;
