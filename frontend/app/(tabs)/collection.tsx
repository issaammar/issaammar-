// Collection tab: stat cards + 12 monthly trophies for the current year.

import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSettings } from "@/src/game/settings";
import { ColorPalette, fonts, radius, spacing, useColors } from "@/src/game/theme";
import { useStats } from "@/src/game/useStats";

const MONTH_SHORT = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

const buildMonthGrid = (refDate: Date) => {
  const year = refDate.getFullYear();
  const items: { key: string; label: string }[] = [];
  for (let m = 0; m < 12; m++) {
    const monthKey = `${year}-${String(m + 1).padStart(2, "0")}`;
    items.push({ key: monthKey, label: `${MONTH_SHORT[m]} ${year}` });
  }
  return items;
};

const StatCard = ({
  c,
  label,
  value,
  icon,
  testID,
}: {
  c: ColorPalette;
  label: string;
  value: number | string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  testID: string;
}) => (
  <View
    testID={testID}
    style={[
      collectionStyles.statCard,
      { backgroundColor: c.backgroundSecondary },
    ]}
  >
    <Ionicons name={icon} size={22} color={c.blue} />
    <Text style={[collectionStyles.statValue, { color: c.text }]}>{value}</Text>
    <Text style={[collectionStyles.statLabel, { color: c.textSecondary }]}>
      {label}
    </Text>
  </View>
);

export default function Collection() {
  const c = useColors();
  const { settings } = useSettings();
  const { stats } = useStats();

  const months = useMemo(() => buildMonthGrid(new Date()), []);
  const styles = useMemo(() => buildStyles(c), [c]);

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: c.background }]} edges={["top"]}>
      <StatusBar style={settings.darkMode ? "light" : "dark"} />
      <View style={styles.headerBar}>
        <Text style={styles.title}>Collection</Text>
      </View>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.section}>Stats</Text>
        <View style={collectionStyles.statRow}>
          <StatCard
            c={c}
            icon="flame"
            label="Longest day streak"
            value={stats.longestDayStreak}
            testID="stat-longest-day-streak"
          />
          <StatCard
            c={c}
            icon="trending-up"
            label="Highest win streak"
            value={stats.longestWinStreak}
            testID="stat-longest-win-streak"
          />
        </View>
        <View style={collectionStyles.statRow}>
          <StatCard
            c={c}
            icon="trophy"
            label="Most wins"
            value={stats.totalWins}
            testID="stat-total-wins"
          />
          <StatCard
            c={c}
            icon="layers-outline"
            label="Highest level"
            value={stats.highestLevel}
            testID="stat-highest-level"
          />
        </View>

        <Text style={[styles.section, { marginTop: spacing.xl }]}>
          Monthly Trophies · {new Date().getFullYear()}
        </Text>
        <View style={collectionStyles.trophyGrid} testID="trophy-grid">
          {months.map((m) => {
            const unlocked = stats.monthlyTrophies.includes(m.key);
            return (
              <View
                key={m.key}
                style={[
                  collectionStyles.trophyCell,
                  {
                    backgroundColor: c.backgroundSecondary,
                  },
                ]}
                testID={`trophy-${m.key}`}
              >
                <Ionicons
                  name={unlocked ? "trophy" : "lock-closed-outline"}
                  size={30}
                  color={unlocked ? c.trophyGold : c.locked}
                />
                <Text
                  style={[
                    collectionStyles.trophyLabel,
                    { color: unlocked ? c.text : c.textMuted },
                  ]}
                >
                  {m.label}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const buildStyles = (c: ColorPalette) =>
  StyleSheet.create({
    headerBar: {
      alignItems: "center",
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    title: {
      fontFamily: fonts.display,
      fontWeight: "900",
      fontSize: 22,
      color: c.text,
      letterSpacing: 0.3,
    },
    section: {
      fontFamily: fonts.display,
      fontSize: 14,
      color: c.textSecondary,
      letterSpacing: 1,
      marginBottom: spacing.sm,
      fontWeight: "700",
    },
  });

const collectionStyles = StyleSheet.create({
  statRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 6,
    minHeight: 110,
  },
  statValue: {
    fontFamily: fonts.display,
    fontWeight: "900",
    fontSize: 30,
    letterSpacing: -1,
  },
  statLabel: {
    fontFamily: fonts.ui,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  trophyGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  trophyCell: {
    width: `${100 / 3 - 2.5}%`,
    aspectRatio: 1,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  trophyLabel: {
    fontFamily: fonts.ui,
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "600",
  },
});
