// Centralized design tokens for the puzzle game.
// White / black / blue minimalist palette per /app/design_guidelines.json.

import { Platform } from "react-native";

export const colors = {
  background: "#FFFFFF",
  backgroundSecondary: "#F8F8F8",
  text: "#000000",
  textSecondary: "#7A7A7A",
  textMuted: "#B5B5B5",
  victory: "#0044FF",
  blue: "#0044FF",
  blueSoft: "#CCDDFF",
  border: "#EBEBEB",
  borderStrong: "#000000",
  locked: "#D1D1D1",
  black: "#000000",
  white: "#FFFFFF",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// Use platform-appropriate bold display fonts. We avoid @expo-google-fonts and
// just lean on system bold weights for the "Spectacular" aesthetic.
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
  sm: 0, // strictly geometric per guidelines
  pill: 999,
} as const;

export const timing = {
  slide: 320,
  tap: 120,
  victoryIn: 420,
} as const;
