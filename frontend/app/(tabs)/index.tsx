// Home tab. Matches the reference 'Arrows' app: small streak chip at the
// top, a Challenge card with trophy + Play pill, the "Arrows" wordmark and
// big Level number, and a prominent Play pill that opens the current level.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandMark } from "@/src/components/BrandMark";
import { hapticLight, playTap } from "@/src/game/audio";
import { useSettings } from "@/src/game/settings";
import { ColorPalette, fonts, radius, spacing, useColors } from "@/src/game/theme";
import { monthlyProgress, useStats, ymd } from "@/src/game/useStats";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function Home() {
  const router = useRouter();
  const c = useColors();
  const { settings } = useSettings();
  const { stats } = useStats();
  const styles = useMemo(() => buildStyles(c), [c]);

  const today = new Date();
  const monthly = monthlyProgress(stats.completedDailies, today);
  const todayKey = ymd(today);
  const todayLabel = `${monthNames[today.getMonth()]} ${today.getDate()}`;
  const todayDone = stats.completedDailies.includes(todayKey);

  const continueLevel = Math.max(1, stats.currentLevel);

  const press = (fn: () => void) => () => {
    playTap();
    hapticLight();
    fn();
  };

  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: c.background }]}
      edges={["top"]}
    >
      <StatusBar style={settings.darkMode ? "light" : "dark"} />

      <View style={styles.streakWrap}>
        <View style={styles.streakChip} testID="streak-chip">
          <Ionicons name="trophy" size={14} color={c.textSecondary} />
          <Text style={styles.streakValue} testID="streak-value">
            {stats.currentWinStreak}
          </Text>
          {stats.currentWinStreak > 0 ? (
            <View style={styles.streakDot} />
          ) : null}
        </View>
      </View>

      <Animated.View
        entering={FadeIn.duration(360)}
        style={styles.challengeCard}
        testID="challenge-card"
      >
        <Text style={styles.challengeTitle}>Challenge</Text>
        <Text style={styles.challengeDate}>{todayLabel}</Text>

        <View style={styles.trophyHolder}>
          <Ionicons
            name="trophy"
            size={88}
            color={todayDone ? c.trophyGold : c.locked}
          />
        </View>

        <Pressable
          testID="challenge-play-button"
          onPress={press(() => router.push(`/game/daily-${todayKey}`))}
          style={({ pressed }) => [
            styles.playPillSmall,
            pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
          ]}
        >
          <Text style={styles.playPillTextSmall}>Play</Text>
        </Pressable>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(120).duration(420)}
        style={styles.brandBlock}
      >
        <BrandMark size={42} />
        <Text style={styles.levelText} testID="home-level-text">
          Level {continueLevel}
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(200).duration(420)}
        style={styles.bottomCta}
      >
        <Pressable
          testID="menu-continue-button"
          onPress={press(() => router.push(`/game/${continueLevel}`))}
          style={({ pressed }) => [
            styles.playPill,
            pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
          ]}
        >
          <Text style={styles.playPillText}>Play</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const buildStyles = (c: ColorPalette) =>
  StyleSheet.create({
    streakWrap: {
      alignItems: "center",
      marginTop: spacing.sm,
    },
    streakChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: c.backgroundSecondary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: radius.pill,
    },
    streakValue: {
      fontFamily: fonts.display,
      fontWeight: "800",
      fontSize: 14,
      color: c.text,
    },
    streakDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: c.danger,
      marginLeft: 2,
      marginRight: -2,
    },
    challengeCard: {
      marginTop: spacing.md,
      marginHorizontal: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: c.backgroundSecondary,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      paddingHorizontal: spacing.lg,
      alignItems: "center",
      gap: 6,
    },
    challengeTitle: {
      fontFamily: fonts.display,
      fontWeight: "900",
      fontSize: 22,
      color: c.text,
    },
    challengeDate: {
      fontFamily: fonts.ui,
      fontSize: 13,
      color: c.text,
      marginTop: -2,
    },
    trophyHolder: {
      width: 110,
      height: 110,
      alignItems: "center",
      justifyContent: "center",
    },
    playPillSmall: {
      backgroundColor: c.blue,
      paddingHorizontal: 32,
      paddingVertical: 11,
      borderRadius: radius.pill,
      marginTop: 4,
    },
    playPillTextSmall: {
      fontFamily: fonts.display,
      fontWeight: "800",
      fontSize: 16,
      color: c.white,
      letterSpacing: 0.5,
    },
    brandBlock: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    levelText: {
      fontFamily: fonts.display,
      fontWeight: "900",
      fontSize: 22,
      color: c.blue,
      letterSpacing: 0.3,
    },
    bottomCta: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    playPill: {
      backgroundColor: c.blue,
      paddingVertical: 18,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
    },
    playPillText: {
      fontFamily: fonts.display,
      fontWeight: "800",
      fontSize: 22,
      color: c.white,
      letterSpacing: 0.5,
    },
  });
