// Home / main menu screen.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { playTap } from "@/src/game/audio";
import { colors, fonts, spacing } from "@/src/game/theme";
import { usePlayer } from "@/src/game/usePlayer";

const MenuButton = ({
  label,
  onPress,
  testID,
  variant = "primary",
}: {
  label: string;
  onPress: () => void;
  testID: string;
  variant?: "primary" | "secondary";
}) => {
  const isPrimary = variant === "primary";
  return (
    <Pressable
      testID={testID}
      onPress={() => {
        playTap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.btn,
        isPrimary ? styles.btnPrimary : styles.btnSecondary,
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
    >
      <Text
        style={[
          styles.btnLabel,
          isPrimary ? styles.btnLabelPrimary : styles.btnLabelSecondary,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

export default function Home() {
  const router = useRouter();
  const { player } = usePlayer();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <StatusBar style="dark" />

      <View style={styles.topRow}>
        <Animated.Text
          entering={FadeInDown.duration(500)}
          style={styles.brand}
          testID="brand-mark"
        >
          ARROW ⌁ MAZE
        </Animated.Text>
        <View style={styles.you} testID="player-chip">
          <Text style={styles.youLabel}>YOU</Text>
          <Text style={styles.youName} numberOfLines={1}>
            {player?.name ?? "..."}
          </Text>
        </View>
      </View>

      <Animated.View
        style={styles.heroBlock}
        entering={FadeInDown.delay(120).duration(600)}
      >
        <Text style={styles.heroLine1} testID="hero-title">
          Slide
        </Text>
        <View style={styles.heroLine2Row}>
          <Text style={styles.heroLine2}>every arrow</Text>
          <Ionicons name="arrow-forward" size={42} color={colors.blue} />
        </View>
        <Text style={styles.heroLine3}>off the grid.</Text>
        <Text style={styles.heroSub} testID="hero-sub">
          A minimalist puzzle of paths, order and timing.
        </Text>
      </Animated.View>

      <Animated.View
        style={styles.menu}
        entering={FadeInUp.delay(240).duration(600)}
      >
        <MenuButton
          label="Play"
          onPress={() => router.push("/game/1")}
          testID="menu-play-button"
        />
        <MenuButton
          label="Levels"
          variant="secondary"
          onPress={() => router.push("/levels")}
          testID="menu-levels-button"
        />
        <MenuButton
          label="Infinite"
          variant="secondary"
          onPress={() => router.push("/game/infinite")}
          testID="menu-infinite-button"
        />
        <MenuButton
          label="Stats & Leaderboard"
          variant="secondary"
          onPress={() => router.push("/stats")}
          testID="menu-stats-button"
        />
      </Animated.View>

      <Text style={styles.footer} testID="footer-credit">
        Tap an arrow to slide it. Clear the board.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.md,
  },
  brand: {
    fontFamily: fonts.display,
    fontWeight: "900",
    color: colors.black,
    fontSize: 18,
    letterSpacing: 2,
  },
  you: {
    alignItems: "flex-end",
    maxWidth: 160,
  },
  youLabel: {
    fontFamily: fonts.ui,
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 2,
  },
  youName: {
    fontFamily: fonts.display,
    fontWeight: "800",
    color: colors.black,
    fontSize: 14,
  },
  heroBlock: {
    marginTop: spacing.xxxl,
  },
  heroLine1: {
    fontFamily: fonts.display,
    fontWeight: "900",
    color: colors.black,
    fontSize: 68,
    lineHeight: 72,
    letterSpacing: -2,
  },
  heroLine2Row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: -8,
  },
  heroLine2: {
    fontFamily: fonts.display,
    fontWeight: "900",
    color: colors.blue,
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: -2,
  },
  heroLine3: {
    fontFamily: fonts.display,
    fontWeight: "900",
    color: colors.black,
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: -2,
    marginTop: -4,
  },
  heroSub: {
    fontFamily: fonts.ui,
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.md,
    maxWidth: 280,
  },
  menu: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  btn: {
    paddingVertical: 18,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: {
    backgroundColor: colors.black,
  },
  btnSecondary: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.black,
  },
  btnLabel: {
    fontFamily: fonts.display,
    fontWeight: "800",
    fontSize: 18,
    letterSpacing: 1,
  },
  btnLabelPrimary: {
    color: colors.white,
  },
  btnLabelSecondary: {
    color: colors.black,
  },
  footer: {
    fontFamily: fonts.ui,
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "center",
    paddingBottom: spacing.sm,
  },
});
