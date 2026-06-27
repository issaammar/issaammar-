// Awards & trophies screen: stats cards + grid of monthly trophies.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { playTap } from "@/src/game/audio";
import { useSettings } from "@/src/game/settings";
import { ColorPalette, fonts, spacing, useColors } from "@/src/game/theme";
import { useStats } from "@/src/game/useStats";

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
    style={[
      awardsStyles.statCard,
      { backgroundColor: c.backgroundSecondary, borderColor: c.border },
    ]}
    testID={testID}
  >
    <Ionicons name={icon} size={20} color={c.blue} />
    <Text style={[awardsStyles.statValue, { color: c.text }]}>{value}</Text>
    <Text style={[awardsStyles.statLabel, { color: c.textSecondary }]}>
      {label}
    </Text>
  </View>
);

const MONTH_SHORT = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

const buildMonthGrid = (refDate: Date) => {
  const year = refDate.getFullYear();
  // show current year months (12 slots)
  const items: { key: string; label: string }[] = [];
  for (let m = 0; m < 12; m++) {
    const monthKey = `${year}-${String(m + 1).padStart(2, "0")}`;
    items.push({ key: monthKey, label: `${MONTH_SHORT[m]} ${year}` });
  }
  return items;
};

export default function AwardsScreen() {
  const router = useRouter();
  const c = useColors();
  const { settings } = useSettings();
  const { stats } = useStats();

  const months = useMemo(() => buildMonthGrid(new Date()), []);
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
          testID="awards-back-button"
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={26} color={c.text} />
        </Pressable>
        <Text style={styles.title}>Awards</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>STATS</Text>

        <View style={awardsStyles.row}>
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
        <View style={awardsStyles.row}>
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

        <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>
          MONTHLY TROPHIES · {new Date().getFullYear()}
        </Text>

        <View style={awardsStyles.trophyGrid} testID="trophy-grid">
          {months.map((m) => {
            const unlocked = stats.monthlyTrophies.includes(m.key);
            return (
              <View
                key={m.key}
                style={[
                  awardsStyles.trophyCell,
                  {
                    backgroundColor: c.backgroundSecondary,
                    borderColor: unlocked ? c.trophyGold : c.border,
                  },
                ]}
                testID={`trophy-${m.key}`}
              >
                <Ionicons
                  name={unlocked ? "trophy" : "lock-closed-outline"}
                  size={26}
                  color={unlocked ? c.trophyGold : c.locked}
                />
                <Text
                  style={[
                    awardsStyles.trophyLabel,
                    { color: unlocked ? c.text : c.textMuted },
                  ]}
                >
                  {m.label}
                </Text>
              </View>
            );
          })}
        </View>

        {stats.totalWins === 0 && (
          <Text style={styles.emptyHint}>
            Clear a puzzle to start earning awards.
          </Text>
        )}
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
    sectionLabel: {
      fontFamily: fonts.ui,
      fontSize: 11,
      letterSpacing: 2,
      color: c.textSecondary,
      marginBottom: spacing.sm,
    },
    emptyHint: {
      fontFamily: fonts.ui,
      fontSize: 12,
      color: c.textMuted,
      textAlign: "center",
      marginTop: spacing.xl,
    },
  });

const awardsStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    padding: spacing.md,
    gap: 8,
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
    letterSpacing: 1,
  },
  trophyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  trophyCell: {
    width: `${100 / 3 - 2}%`,
    aspectRatio: 1,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  trophyLabel: {
    fontFamily: fonts.ui,
    fontSize: 10,
    letterSpacing: 1,
  },
});
