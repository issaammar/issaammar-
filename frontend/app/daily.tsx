// Daily challenge calendar. Each day of the current month is a tile; tap to
// play that day's puzzle (seeded deterministically by the date). A progress
// bar tracks completions toward this month's trophy.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { hapticLight, playTap } from "@/src/game/audio";
import { useSettings } from "@/src/game/settings";
import { ColorPalette, fonts, spacing, useColors } from "@/src/game/theme";
import { monthlyProgress, useStats, ymd } from "@/src/game/useStats";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const buildMonthDays = (ref: Date) => {
  const year = ref.getFullYear();
  const month0 = ref.getMonth();
  const last = new Date(year, month0 + 1, 0).getDate();
  const out: { day: number; dateKey: string }[] = [];
  for (let d = 1; d <= last; d++) {
    const dt = new Date(year, month0, d);
    out.push({ day: d, dateKey: ymd(dt) });
  }
  return out;
};

export default function DailyScreen() {
  const router = useRouter();
  const c = useColors();
  const { settings } = useSettings();
  const { stats } = useStats();

  const today = useMemo(() => new Date(), []);
  const days = useMemo(() => buildMonthDays(today), [today]);
  const progress = useMemo(
    () => monthlyProgress(stats.completedDailies, today),
    [stats.completedDailies, today],
  );
  const todayKey = ymd(today);

  const styles = useMemo(() => buildStyles(c), [c]);

  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: c.background }]}
      edges={["top", "bottom"]}
    >
      <StatusBar style={settings.darkMode ? "light" : "dark"} />
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            playTap();
            router.back();
          }}
          style={styles.iconBtn}
          testID="daily-back-button"
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={26} color={c.text} />
        </Pressable>
        <Text style={styles.title}>Daily</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroKicker}>
              {MONTH_NAMES[today.getMonth()].toUpperCase()} TROPHY
            </Text>
            <Text style={styles.heroTitle}>
              {progress.done} of {progress.total}
            </Text>
            <Text style={styles.heroSub}>days cleared</Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(progress.done / Math.max(1, progress.total)) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>
          <View style={styles.trophy}>
            <Ionicons
              name="trophy"
              size={56}
              color={
                stats.monthlyTrophies.includes(progress.monthKey)
                  ? c.trophyGold
                  : c.locked
              }
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>SELECT A DAY</Text>

        <View style={styles.grid} testID="daily-grid">
          {days.map((d) => {
            const done = stats.completedDailies.includes(d.dateKey);
            const isToday = d.dateKey === todayKey;
            const isFuture = d.dateKey > todayKey;
            return (
              <Pressable
                key={d.dateKey}
                testID={`daily-day-${d.day}`}
                disabled={isFuture}
                onPress={() => {
                  playTap();
                  hapticLight();
                  router.push(`/game/daily-${d.dateKey}`);
                }}
                style={({ pressed }) => [
                  styles.cell,
                  done && styles.cellDone,
                  isToday && !done && styles.cellToday,
                  isFuture && styles.cellFuture,
                  pressed && !isFuture && { transform: [{ scale: 0.96 }] },
                ]}
              >
                <Text
                  style={[
                    styles.cellNum,
                    done && styles.cellNumDone,
                    isToday && !done && styles.cellNumToday,
                    isFuture && styles.cellNumFuture,
                  ]}
                >
                  {d.day}
                </Text>
                {done && (
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color={c.white}
                    style={styles.cellCheck}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const buildStyles = (c: ColorPalette) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    iconBtn: { padding: 4, width: 30, alignItems: "center" },
    title: {
      fontFamily: fonts.display,
      fontWeight: "900",
      fontSize: 20,
      letterSpacing: 1,
      color: c.text,
    },
    heroCard: {
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.backgroundSecondary,
      padding: spacing.lg,
      flexDirection: "row",
      alignItems: "center",
    },
    heroKicker: {
      fontFamily: fonts.ui,
      fontSize: 11,
      letterSpacing: 2,
      color: c.textSecondary,
    },
    heroTitle: {
      fontFamily: fonts.display,
      fontWeight: "900",
      fontSize: 36,
      color: c.text,
      marginTop: 4,
      letterSpacing: -1,
    },
    heroSub: {
      fontFamily: fonts.ui,
      fontSize: 12,
      color: c.textSecondary,
      marginTop: 2,
    },
    progressTrack: {
      height: 6,
      backgroundColor: c.border,
      marginTop: spacing.md,
      overflow: "hidden",
    },
    progressFill: { height: 6, backgroundColor: c.blue },
    trophy: {
      width: 80,
      height: 80,
      alignItems: "center",
      justifyContent: "center",
    },
    sectionLabel: {
      fontFamily: fonts.ui,
      fontSize: 11,
      letterSpacing: 2,
      color: c.textSecondary,
      marginTop: spacing.xl,
      marginBottom: spacing.sm,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    cell: {
      width: `${100 / 7 - 1.6}%`,
      aspectRatio: 1,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.background,
    },
    cellDone: {
      backgroundColor: c.blue,
      borderColor: c.blue,
    },
    cellToday: {
      borderColor: c.text,
      borderWidth: 2,
    },
    cellFuture: { opacity: 0.4 },
    cellNum: {
      fontFamily: fonts.display,
      fontWeight: "800",
      fontSize: 16,
      color: c.text,
    },
    cellNumDone: { color: c.white },
    cellNumToday: { color: c.text },
    cellNumFuture: { color: c.textMuted },
    cellCheck: {
      position: "absolute",
      top: 4,
      right: 4,
    },
  });
