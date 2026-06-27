// Main menu: big level number, prominent Continue button, plus three icon
// shortcuts (Daily, Awards, Settings) in the top corner, mirroring the
// reference 'Arrows' app.

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { hapticLight, playTap } from "@/src/game/audio";
import { useSettings } from "@/src/game/settings";
import { ColorPalette, fonts, spacing, useColors } from "@/src/game/theme";
import { monthlyProgress, useStats } from "@/src/game/useStats";

const IconButton = ({
  c,
  name,
  onPress,
  testID,
}: {
  c: ColorPalette;
  name: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  testID: string;
}) => (
  <Pressable
    testID={testID}
    onPress={onPress}
    hitSlop={10}
    style={({ pressed }) => [
      styles.iconBtn,
      {
        backgroundColor: c.backgroundSecondary,
        borderColor: c.border,
      },
      pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
    ]}
  >
    <Ionicons name={name} size={22} color={c.text} />
  </Pressable>
);

export default function Home() {
  const router = useRouter();
  const c = useColors();
  const { stats } = useStats();
  const { settings } = useSettings();

  const monthly = useMemo(
    () => monthlyProgress(stats.completedDailies),
    [stats.completedDailies],
  );

  const continueLevel = Math.max(1, stats.currentLevel);

  const styles2 = useMemo(() => buildStyles(c), [c]);

  const press = (fn: () => void) => () => {
    playTap();
    hapticLight();
    fn();
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: c.background }]}
      edges={["top", "bottom"]}
    >
      <StatusBar style={settings.darkMode ? "light" : "dark"} />

      <View style={styles.topRow}>
        <Animated.Text
          entering={FadeIn.duration(400)}
          style={[styles2.brand, { color: c.text }]}
          testID="brand-mark"
        >
          Arrows
        </Animated.Text>
        <View style={styles.iconRow}>
          <IconButton
            c={c}
            name="calendar-outline"
            onPress={press(() => router.push("/daily"))}
            testID="menu-daily-button"
          />
          <IconButton
            c={c}
            name="trophy-outline"
            onPress={press(() => router.push("/awards"))}
            testID="menu-awards-button"
          />
          <IconButton
            c={c}
            name="settings-outline"
            onPress={press(() => router.push("/settings"))}
            testID="menu-settings-button"
          />
        </View>
      </View>

      <Animated.View
        entering={FadeInDown.delay(80).duration(500)}
        style={styles.levelBlock}
      >
        <Text style={[styles2.levelLabel, { color: c.textSecondary }]}>
          LEVEL
        </Text>
        <Text
          style={[styles2.levelNumber, { color: c.text }]}
          testID="home-level-number"
        >
          {continueLevel}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons
              name="fire"
              size={16}
              color={c.textSecondary}
            />
            <Text style={[styles2.metaText, { color: c.textSecondary }]}>
              {stats.currentWinStreak} win streak
            </Text>
          </View>
          <View style={[styles.dot, { backgroundColor: c.textMuted }]} />
          <Text style={[styles2.metaText, { color: c.textSecondary }]}>
            {stats.totalWins} cleared
          </Text>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(180).duration(500)}
        style={styles.cta}
      >
        <Pressable
          testID="menu-continue-button"
          onPress={press(() => router.push(`/game/${continueLevel}`))}
          style={({ pressed }) => [
            styles2.continueBtn,
            { backgroundColor: c.text },
            pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
          ]}
        >
          <Text style={[styles2.continueBtnText, { color: c.background }]}>
            Continue
          </Text>
          <Ionicons name="arrow-forward" size={22} color={c.background} />
        </Pressable>

        <View style={styles.secondaryRow}>
          <Pressable
            testID="menu-daily-card"
            onPress={press(() => router.push("/daily"))}
            style={({ pressed }) => [
              styles2.smallCard,
              { backgroundColor: c.backgroundSecondary, borderColor: c.border },
              pressed && { opacity: 0.85 },
            ]}
          >
            <View style={styles.cardHead}>
              <Text style={[styles2.cardKicker, { color: c.textSecondary }]}>
                DAILY
              </Text>
              <Ionicons name="calendar" size={14} color={c.blue} />
            </View>
            <Text style={[styles2.cardTitle, { color: c.text }]}>
              {monthly.done}/{monthly.total}
            </Text>
            <View style={[styles2.progressTrack, { backgroundColor: c.border }]}>
              <View
                style={[
                  styles2.progressFill,
                  {
                    backgroundColor: c.blue,
                    width: `${(monthly.done / Math.max(1, monthly.total)) * 100}%`,
                  },
                ]}
              />
            </View>
          </Pressable>

          <Pressable
            testID="menu-awards-card"
            onPress={press(() => router.push("/awards"))}
            style={({ pressed }) => [
              styles2.smallCard,
              { backgroundColor: c.backgroundSecondary, borderColor: c.border },
              pressed && { opacity: 0.85 },
            ]}
          >
            <View style={styles.cardHead}>
              <Text style={[styles2.cardKicker, { color: c.textSecondary }]}>
                AWARDS
              </Text>
              <Ionicons name="trophy" size={14} color={c.trophyGold} />
            </View>
            <Text style={[styles2.cardTitle, { color: c.text }]}>
              {stats.monthlyTrophies.length}
            </Text>
            <Text style={[styles2.cardSub, { color: c.textSecondary }]}>
              trophies earned
            </Text>
          </Pressable>
        </View>

        <Pressable
          testID="menu-levels-button"
          onPress={press(() => router.push("/levels"))}
          style={({ pressed }) => [
            styles2.ghostBtn,
            { borderColor: c.border },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={[styles2.ghostBtnText, { color: c.text }]}>
            All levels
          </Text>
          <Ionicons name="chevron-forward" size={18} color={c.text} />
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.md,
  },
  iconRow: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  levelBlock: {
    alignItems: "center",
    paddingTop: spacing.lg,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: spacing.md,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  cta: { gap: spacing.sm, paddingBottom: spacing.md },
  secondaryRow: { flexDirection: "row", gap: 8 },
  cardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
});

const buildStyles = (c: ColorPalette) =>
  StyleSheet.create({
    brand: {
      fontFamily: fonts.display,
      fontWeight: "900",
      fontSize: 18,
      letterSpacing: 1,
    },
    levelLabel: {
      fontFamily: fonts.ui,
      fontSize: 12,
      letterSpacing: 4,
    },
    levelNumber: {
      fontFamily: fonts.display,
      fontWeight: "900",
      fontSize: 136,
      lineHeight: 140,
      letterSpacing: -4,
      marginTop: 4,
    },
    metaText: {
      fontFamily: fonts.ui,
      fontSize: 12,
      letterSpacing: 1,
    },
    continueBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 20,
      gap: 10,
    },
    continueBtnText: {
      fontFamily: fonts.display,
      fontWeight: "800",
      fontSize: 20,
      letterSpacing: 1,
    },
    smallCard: {
      flex: 1,
      padding: spacing.md,
      borderWidth: 1,
      minHeight: 96,
      justifyContent: "space-between",
    },
    cardKicker: {
      fontFamily: fonts.ui,
      fontSize: 10,
      letterSpacing: 2,
    },
    cardTitle: {
      fontFamily: fonts.display,
      fontWeight: "900",
      fontSize: 28,
      marginTop: 4,
    },
    cardSub: {
      fontFamily: fonts.ui,
      fontSize: 11,
      marginTop: 4,
    },
    progressTrack: {
      height: 4,
      width: "100%",
      marginTop: 8,
      overflow: "hidden",
    },
    progressFill: {
      height: 4,
    },
    ghostBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      borderWidth: 1,
      gap: 6,
      marginBottom: 0,
    },
    ghostBtnText: {
      fontFamily: fonts.display,
      fontWeight: "700",
      fontSize: 14,
      letterSpacing: 1,
    },
    // typed but rarely used - prevent c-unused warnings
    _unused: { color: c.text },
  });
