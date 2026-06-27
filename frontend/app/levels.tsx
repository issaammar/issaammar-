// Level select grid: handcrafted levels + an "Infinite" tile.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { hapticLight, playTap } from "@/src/game/audio";
import { HANDCRAFTED } from "@/src/game/levels";
import { useSettings } from "@/src/game/settings";
import { ColorPalette, fonts, spacing, useColors } from "@/src/game/theme";
import { useStats } from "@/src/game/useStats";

export default function Levels() {
  const router = useRouter();
  const c = useColors();
  const { settings } = useSettings();
  const { stats } = useStats();

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
          style={styles.backBtn}
          testID="levels-back-button"
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={26} color={c.text} />
        </Pressable>
        <Text style={styles.title}>Levels</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.section}>STAGES</Text>
        <View style={styles.grid} testID="levels-grid">
          {HANDCRAFTED.map((lvl, idx) => {
            const num = idx + 1;
            const cleared = stats.highestLevel > num;
            const isCurrent = stats.currentLevel === num;
            return (
              <Pressable
                key={lvl.id}
                onPress={() => {
                  playTap();
                  hapticLight();
                  router.push(`/game/${lvl.id}`);
                }}
                testID={`level-tile-${lvl.id}`}
                style={({ pressed }) => [
                  styles.tile,
                  cleared && styles.tileCompleted,
                  isCurrent && styles.tileCurrent,
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}
              >
                <Text
                  style={[
                    styles.tileNumber,
                    cleared && styles.tileNumberCompleted,
                    isCurrent && styles.tileNumberCurrent,
                  ]}
                >
                  {num}
                </Text>
                <Text style={styles.tileLabel} numberOfLines={1}>
                  {lvl.title}
                </Text>
                <Text style={styles.tileMeta}>{lvl.arrows.length} arrows</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.section, { marginTop: spacing.xl }]}>ENDLESS</Text>
        <Pressable
          testID="infinite-tile"
          onPress={() => {
            playTap();
            hapticLight();
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
          <Ionicons name="arrow-forward" size={26} color={c.white} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const TILE_GAP = 10;

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
    backBtn: { padding: 4 },
    title: {
      fontFamily: fonts.display,
      fontWeight: "900",
      fontSize: 20,
      color: c.text,
      letterSpacing: 1,
    },
    scroll: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
    },
    section: {
      fontFamily: fonts.ui,
      fontSize: 11,
      color: c.textSecondary,
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
      borderColor: c.border,
      backgroundColor: c.backgroundSecondary,
      padding: spacing.sm,
      justifyContent: "space-between",
    },
    tileCompleted: {
      borderWidth: 1,
      borderColor: c.text,
      backgroundColor: c.backgroundSecondary,
    },
    tileCurrent: {
      borderWidth: 2,
      borderColor: c.blue,
      backgroundColor: c.background,
    },
    tileNumber: {
      fontFamily: fonts.display,
      fontWeight: "900",
      fontSize: 32,
      color: c.text,
      lineHeight: 36,
    },
    tileNumberCompleted: { color: c.text, opacity: 0.5 },
    tileNumberCurrent: { color: c.blue },
    tileLabel: {
      fontFamily: fonts.ui,
      fontSize: 12,
      color: c.text,
      fontWeight: "600",
    },
    tileMeta: {
      fontFamily: fonts.ui,
      fontSize: 10,
      color: c.textSecondary,
      letterSpacing: 1,
    },
    infTile: {
      backgroundColor: c.blue,
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
      color: c.white,
      letterSpacing: -0.5,
    },
    infSub: {
      fontFamily: fonts.ui,
      fontSize: 12,
      color: c.blueSoft,
      marginTop: 4,
    },
  });
