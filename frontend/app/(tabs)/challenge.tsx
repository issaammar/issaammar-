// Challenge tab: trophy + progress bar (1 → 30 pills) + monthly calendar
// grid with Mo/Tu/We/Th/Fr/Sa/Su headers + Play pill.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { hapticLight, playTap } from "@/src/game/audio";
import { useSettings } from "@/src/game/settings";
import { ColorPalette, fonts, radius, spacing, useColors } from "@/src/game/theme";
import { monthlyProgress, useStats, ymd } from "@/src/game/useStats";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Monday-first calendar layout: returns 0-padded cells for the month.
const buildMonthCells = (ref: Date) => {
  const year = ref.getFullYear();
  const month0 = ref.getMonth();
  const total = new Date(year, month0 + 1, 0).getDate();
  // JS getDay() 0=Sun..6=Sat; we want Mo=0..Su=6
  const firstDow = (new Date(year, month0, 1).getDay() + 6) % 7;
  const cells: ({ day: number; key: string } | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= total; d++) {
    const dt = new Date(year, month0, d);
    cells.push({ day: d, key: ymd(dt) });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

export default function ChallengeScreen() {
  const router = useRouter();
  const c = useColors();
  const { settings } = useSettings();
  const { stats } = useStats();
  const styles = useMemo(() => buildStyles(c), [c]);

  const today = useMemo(() => new Date(), []);
  const todayKey = ymd(today);
  const cells = useMemo(() => buildMonthCells(today), [today]);
  const monthly = useMemo(
    () => monthlyProgress(stats.completedDailies, today),
    [stats.completedDailies, today],
  );

  // Selected day defaults to today.
  const [selected, setSelected] = useState<string>(todayKey);

  const selectableCount = useMemo(
    () => cells.filter((cell) => cell && cell.key <= todayKey).length,
    [cells, todayKey],
  );

  const press = (fn: () => void) => () => {
    playTap();
    hapticLight();
    fn();
  };

  const handlePlay = () => {
    playTap();
    hapticLight();
    router.push(`/game/daily-${selected}`);
  };

  const progressPct = (monthly.done / Math.max(1, monthly.total)) * 100;

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: c.background }]} edges={["top"]}>
      <StatusBar style={settings.darkMode ? "light" : "dark"} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.trophyHolder}>
          <Ionicons
            name="trophy"
            size={130}
            color={
              stats.monthlyTrophies.includes(monthly.monthKey)
                ? c.trophyGold
                : c.locked
            }
          />
        </View>

        <View style={styles.progressRow} testID="challenge-progress">
          <View style={styles.progressLeftPill}>
            <Text style={styles.progressLeftText}>{monthly.done}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${progressPct}%` }]}
            />
          </View>
          <Text style={styles.progressEndText}>{monthly.total}</Text>
        </View>

        <Text style={styles.monthLabel} testID="challenge-month-label">
          {MONTH_NAMES[today.getMonth()]} {today.getFullYear()}
        </Text>

        <View style={styles.weekRow}>
          {WEEKDAYS.map((w) => (
            <Text key={w} style={styles.weekText}>
              {w}
            </Text>
          ))}
        </View>

        <View style={styles.grid} testID="challenge-grid">
          {cells.map((cell, idx) => {
            if (!cell)
              return <View key={`e-${idx}`} style={styles.cellSpacer} />;
            const done = stats.completedDailies.includes(cell.key);
            const isSelected = selected === cell.key;
            const isFuture = cell.key > todayKey;
            return (
              <Pressable
                key={cell.key}
                testID={`challenge-day-${cell.day}`}
                disabled={isFuture}
                onPress={press(() => setSelected(cell.key))}
                style={({ pressed }) => [
                  styles.cell,
                  styles.cellBase,
                  done && styles.cellDone,
                  isSelected && !done && styles.cellSelected,
                  isFuture && styles.cellFuture,
                  pressed && !isFuture && { transform: [{ scale: 0.95 }] },
                ]}
              >
                {done ? null : (
                  <Text
                    style={[
                      styles.cellNum,
                      isFuture && styles.cellNumFuture,
                      isSelected && styles.cellNumSelected,
                    ]}
                  >
                    {cell.day}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: spacing.md }} />
        {selectableCount > 0 ? (
          <Pressable
            testID="challenge-play-button"
            onPress={handlePlay}
            style={({ pressed }) => [
              styles.playPill,
              pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
            ]}
          >
            <Text style={styles.playPillText}>Play</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const buildStyles = (c: ColorPalette) =>
  StyleSheet.create({
    scroll: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
    },
    trophyHolder: {
      alignItems: "center",
      height: 150,
      justifyContent: "center",
    },
    progressRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 4,
    },
    progressLeftPill: {
      backgroundColor: c.success,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: radius.pill,
      minWidth: 28,
      alignItems: "center",
    },
    progressLeftText: {
      fontFamily: fonts.display,
      fontWeight: "800",
      color: c.white,
      fontSize: 13,
    },
    progressTrack: {
      flex: 1,
      height: 10,
      borderRadius: 5,
      backgroundColor: c.backgroundSecondary,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: c.success,
    },
    progressEndText: {
      fontFamily: fonts.display,
      fontWeight: "800",
      fontSize: 14,
      color: c.textMuted,
    },
    monthLabel: {
      fontFamily: fonts.display,
      fontWeight: "900",
      fontSize: 26,
      color: c.blue,
      textAlign: "center",
      marginTop: spacing.lg,
    },
    weekRow: {
      flexDirection: "row",
      marginTop: spacing.md,
    },
    weekText: {
      flex: 1,
      textAlign: "center",
      fontFamily: fonts.ui,
      fontSize: 13,
      color: c.textMuted,
      fontWeight: "600",
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: spacing.sm,
    },
    cellSpacer: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
    },
    cellBase: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    cell: {
      padding: 3,
    },
    cellDone: {
      // overlay green pill via inner via boxShadow won't work; we draw via a
      // background View by stacking. To keep simple, recolor the cell child:
    },
    cellSelected: {},
    cellFuture: { opacity: 0.45 },
    cellNum: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: c.backgroundSecondary,
      textAlign: "center",
      textAlignVertical: "center",
      lineHeight: 38,
      fontFamily: fonts.display,
      fontWeight: "800",
      fontSize: 15,
      color: c.text,
      overflow: "hidden",
    },
    cellNumFuture: {
      backgroundColor: "transparent",
      color: c.textMuted,
    },
    cellNumSelected: {
      backgroundColor: c.blue,
      color: c.white,
    },
    playPill: {
      backgroundColor: c.blue,
      paddingVertical: 16,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
      marginHorizontal: spacing.lg,
    },
    playPillText: {
      fontFamily: fonts.display,
      fontWeight: "800",
      fontSize: 20,
      color: c.white,
      letterSpacing: 0.5,
    },
  });
