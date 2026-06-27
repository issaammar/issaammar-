// Level select grid: handcrafted levels + an "Infinite" tile.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { playTap } from "@/src/game/audio";
import { HANDCRAFTED } from "@/src/game/levels";
import { colors, fonts, spacing } from "@/src/game/theme";
import { useProgress } from "@/src/game/useProgress";

const formatTime = (ms?: number) => {
  if (!ms && ms !== 0) return "—";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
};

export default function Levels() {
  const router = useRouter();
  const { progress } = useProgress();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Pressable
          onPress={() => {
            playTap();
            router.back();
          }}
          style={styles.backBtn}
          testID="levels-back-button"
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={26} color={colors.black} />
        </Pressable>
        <Text style={styles.title}>Levels</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.section}>HANDCRAFTED</Text>
        <View style={styles.grid} testID="levels-grid">
          {HANDCRAFTED.map((lvl, idx) => {
            const completed = progress.completed.includes(lvl.id);
            const best = progress.bestTimes[lvl.id];
            return (
              <Pressable
                key={lvl.id}
                onPress={() => {
                  playTap();
                  router.push(`/game/${lvl.id}`);
                }}
                testID={`level-tile-${lvl.id}`}
                style={({ pressed }) => [
                  styles.tile,
                  completed && styles.tileCompleted,
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}
              >
                <Text
                  style={[
                    styles.tileNumber,
                    completed && styles.tileNumberCompleted,
                  ]}
                >
                  {idx + 1}
                </Text>
                <Text
                  style={[
                    styles.tileLabel,
                    completed && styles.tileLabelCompleted,
                  ]}
                  numberOfLines={1}
                >
                  {lvl.title}
                </Text>
                <Text style={styles.tileMeta}>
                  {completed ? `BEST ${formatTime(best)}` : `${lvl.arrows.length} arrows`}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.section, { marginTop: spacing.xl }]}>ENDLESS</Text>
        <Pressable
          testID="infinite-tile"
          onPress={() => {
            playTap();
            router.push("/game/infinite");
          }}
          style={({ pressed }) => [
            styles.infTile,
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
        >
          <View>
            <Text style={styles.infTitle}>Infinite</Text>
            <Text style={styles.infSub}>Procedural · ramps up forever</Text>
          </View>
          <Ionicons name="arrow-forward" size={26} color={colors.white} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const TILE_GAP = 10;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backBtn: { padding: 4 },
  title: {
    fontFamily: fonts.display,
    fontWeight: "900",
    fontSize: 20,
    color: colors.black,
    letterSpacing: 1,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: TILE_GAP,
  },
  tile: {
    width: `${100 / 3 - 3}%`,
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: colors.locked,
    padding: spacing.sm,
    justifyContent: "space-between",
  },
  tileCompleted: {
    borderWidth: 2,
    borderColor: colors.black,
  },
  tileNumber: {
    fontFamily: fonts.display,
    fontWeight: "900",
    fontSize: 36,
    color: colors.locked,
    lineHeight: 38,
  },
  tileNumberCompleted: {
    color: colors.black,
  },
  tileLabel: {
    fontFamily: fonts.ui,
    fontSize: 12,
    color: colors.textSecondary,
  },
  tileLabelCompleted: {
    color: colors.black,
    fontWeight: "600",
  },
  tileMeta: {
    fontFamily: fonts.ui,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  infTile: {
    backgroundColor: colors.blue,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infTitle: {
    fontFamily: fonts.display,
    fontSize: 26,
    fontWeight: "900",
    color: colors.white,
    letterSpacing: -0.5,
  },
  infSub: {
    fontFamily: fonts.ui,
    fontSize: 12,
    color: colors.blueSoft,
    marginTop: 4,
  },
});
