// Gameplay screen — top bar: back + restart (lavender circles), 3 hearts
// centered, hash icon bottom-right. Arrows live on a square board. Blocked
// taps bounce + cost a heart; running out resets the level.

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { ArrowTile, ArrowTileHandle } from "@/src/components/ArrowTile";
import { Confetti } from "@/src/components/Confetti";
import { api } from "@/src/game/api";
import {
  hapticError,
  hapticLight,
  hapticSuccess,
  playSwoosh,
  playTap,
  playVictory,
} from "@/src/game/audio";
import {
  Arrow,
  HANDCRAFTED,
  Level,
  buildHandcraftedOrExtended,
  generateProceduralLevel,
  tryMove,
} from "@/src/game/levels";
import { useSettings } from "@/src/game/settings";
import { ColorPalette, fonts, radius, spacing, timing, useColors } from "@/src/game/theme";
import { usePlayer } from "@/src/game/usePlayer";
import { useStats, ymd } from "@/src/game/useStats";

const CONGRATS = ["Spectacular!", "Superb!", "Brilliant!", "Excellent!", "Fantastic!"];
const MAX_HEARTS = 3;

const parseDailySeed = (id: string): { seed: number; dateKey: string } | null => {
  if (!id.startsWith("daily-")) return null;
  const dateKey = id.slice("daily-".length);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return { seed: y * 10000 + mo * 100 + d, dateKey };
};

const buildLevel = (id: string, infiniteRound: number): Level => {
  if (id === "infinite") {
    const size = Math.min(4 + Math.floor(infiniteRound / 2), 7);
    const target = Math.max(5, Math.floor(size * size * 0.55));
    return generateProceduralLevel(size, target, Date.now() + infiniteRound, "infinite", "Infinite");
  }
  const daily = parseDailySeed(id);
  if (daily) {
    const dayNum = Number(daily.dateKey.slice(-2));
    const size = 4 + (dayNum % 3);
    const target = Math.max(6, Math.floor(size * size * 0.55));
    return generateProceduralLevel(size, target, daily.seed, id, `Daily ${daily.dateKey}`);
  }
  const num = Number(id);
  if (!Number.isFinite(num) || num < 1) return HANDCRAFTED[0];
  return buildHandcraftedOrExtended(num);
};

const formatTime = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const levelId = params.id ?? "1";

  const c = useColors();
  const { settings } = useSettings();
  const { player } = usePlayer();
  const { recordLevelWin, recordDailyWin, breakStreak } = useStats();

  const [infiniteRound, setInfiniteRound] = useState(0);
  const [level, setLevel] = useState<Level>(() => buildLevel(levelId, 0));
  const [arrows, setArrows] = useState<Arrow[]>(level.arrows);
  const [exiting, setExiting] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [moves, setMoves] = useState(0);
  const [startMs, setStartMs] = useState<number>(() => Date.now());
  const [, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [finalTimeMs, setFinalTimeMs] = useState(0);
  const [boardSize, setBoardSize] = useState(0);
  const [congratsWord, setCongratsWord] = useState(CONGRATS[0]);
  const submittedRef = useRef(false);

  const tileRefs = useRef<Record<string, ArrowTileHandle | null>>({});

  const isDaily = parseDailySeed(level.id) != null;
  const numericId = Number(level.id);
  const numericLevel = Number.isFinite(numericId) && numericId >= 1 ? numericId : null;

  const reset = (next?: Level) => {
    const lvl = next ?? level;
    setLevel(lvl);
    setArrows(lvl.arrows);
    setExiting(new Set());
    setBusy(new Set());
    setHearts(MAX_HEARTS);
    setMoves(0);
    setStartMs(Date.now());
    setElapsed(0);
    setCompleted(false);
    setFailed(false);
    setFinalTimeMs(0);
    submittedRef.current = false;
    tileRefs.current = {};
  };

  useEffect(() => {
    reset(buildLevel(levelId, 0));
    setInfiniteRound(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelId]);

  useEffect(() => {
    if (completed || failed) return;
    const t = setInterval(() => setElapsed(Date.now() - startMs), 250);
    return () => clearInterval(t);
  }, [completed, failed, startMs]);

  useEffect(() => {
    if (
      !completed &&
      arrows.length === 0 &&
      level.arrows.length > 0 &&
      exiting.size === 0
    ) {
      const final = Date.now() - startMs;
      setFinalTimeMs(final);
      setCompleted(true);
      setCongratsWord(CONGRATS[Math.floor(Math.random() * CONGRATS.length)]);
      playVictory();
      hapticSuccess();

      if (isDaily) {
        const daily = parseDailySeed(level.id);
        if (daily) recordDailyWin(daily.dateKey);
      } else if (numericLevel != null) {
        recordLevelWin(numericLevel);
      }

      if (player && !submittedRef.current) {
        submittedRef.current = true;
        void api
          .submitScore({
            player_id: player.id,
            player_name: player.name,
            level_id: level.id,
            time_ms: final,
            moves,
            grid_size: level.size,
            arrow_count: level.arrows.length,
          })
          .catch((e) => console.warn("submit score failed", e));
      }
    }
  }, [
    arrows,
    exiting,
    level,
    moves,
    player,
    recordDailyWin,
    recordLevelWin,
    startMs,
    completed,
    isDaily,
    numericLevel,
  ]);

  const activeArrows = useMemo(
    () => arrows.filter((a) => !exiting.has(a.id)),
    [arrows, exiting],
  );

  const handleTap = (arrow: Arrow) => {
    if (completed || failed) return;
    if (exiting.has(arrow.id) || busy.has(arrow.id)) return;
    const cellSize = boardSize / level.size;
    const result = tryMove(activeArrows, level.size, arrow);

    if (!result.ok) {
      setBusy((cur) => {
        const next = new Set(cur);
        next.add(arrow.id);
        return next;
      });
      playTap();
      hapticError();
      setHearts((h) => {
        const remaining = Math.max(0, h - 1);
        if (remaining === 0) {
          setFailed(true);
          breakStreak();
        }
        return remaining;
      });
      const handle = tileRefs.current[arrow.id];
      handle?.bounce(result.cells, cellSize, () => {
        setBusy((cur) => {
          const next = new Set(cur);
          next.delete(arrow.id);
          return next;
        });
      });
      return;
    }

    setMoves((m) => m + 1);
    setExiting((cur) => {
      const next = new Set(cur);
      next.add(arrow.id);
      return next;
    });
    playSwoosh();
    hapticLight();
    const handle = tileRefs.current[arrow.id];
    if (handle) {
      handle.slideOff(result.cells, cellSize, () => {
        setArrows((cur) => cur.filter((a) => a.id !== arrow.id));
        setExiting((cur) => {
          const next = new Set(cur);
          next.delete(arrow.id);
          return next;
        });
      });
    } else {
      setArrows((cur) => cur.filter((a) => a.id !== arrow.id));
      setExiting((cur) => {
        const next = new Set(cur);
        next.delete(arrow.id);
        return next;
      });
    }
  };

  const handleNext = () => {
    playTap();
    hapticLight();
    if (level.id === "infinite") {
      const round = infiniteRound + 1;
      setInfiniteRound(round);
      reset(buildLevel("infinite", round));
      return;
    }
    if (isDaily) {
      router.replace("/challenge");
      return;
    }
    if (numericLevel != null) {
      router.replace(`/game/${numericLevel + 1}`);
      return;
    }
    router.replace("/");
  };

  const cellSize = boardSize > 0 ? boardSize / level.size : 0;
  const styles = useMemo(() => buildStyles(c), [c]);

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: c.background }]} edges={["top", "bottom"]}>
      <StatusBar style={settings.darkMode ? "light" : "dark"} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            testID="game-back-button"
            onPress={() => {
              playTap();
              router.back();
            }}
            hitSlop={10}
            style={({ pressed }) => [
              styles.circleBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Ionicons name="play" size={18} color={c.text} style={{ transform: [{ rotate: "180deg" }] }} />
          </Pressable>
          <Pressable
            testID="game-restart-button"
            onPress={() => {
              playTap();
              reset(
                level.id === "infinite"
                  ? buildLevel("infinite", infiniteRound)
                  : level,
              );
            }}
            hitSlop={10}
            style={({ pressed }) => [
              styles.circleBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Ionicons name="refresh" size={18} color={c.text} />
          </Pressable>
        </View>

        <View style={styles.heartsRow} testID="hearts-row">
          {Array.from({ length: MAX_HEARTS }).map((_, i) => (
            <Ionicons
              key={i}
              name={i < hearts ? "heart" : "heart-outline"}
              size={26}
              color={i < hearts ? c.danger : c.locked}
              testID={`heart-${i}`}
              style={{ marginHorizontal: 2 }}
            />
          ))}
        </View>

        <View style={styles.headerRight} />
      </View>

      <View style={styles.boardWrap}>
        <View
          testID="gameplay-grid"
          style={styles.board}
          onLayout={(e) => setBoardSize(e.nativeEvent.layout.width)}
        >
          {boardSize > 0 &&
            arrows.map((a) => (
              <View
                key={a.id}
                style={{
                  position: "absolute",
                  left: a.col * cellSize,
                  top: a.row * cellSize,
                  width: cellSize,
                  height: cellSize,
                }}
              >
                <ArrowTile
                  testID={`arrow-tile-${a.row}-${a.col}`}
                  ref={(h) => {
                    tileRefs.current[a.id] = h;
                  }}
                  direction={a.dir}
                  size={cellSize}
                  color={c.arrow}
                  onPress={() => handleTap(a)}
                />
              </View>
            ))}
        </View>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.headerLabel} testID="game-header-label">
          {level.id === "infinite"
            ? `INFINITE · ROUND ${infiniteRound + 1}`
            : isDaily
              ? `DAILY · ${parseDailySeed(level.id)!.dateKey}`
              : `LEVEL ${level.id} · MOVES ${moves}`}
        </Text>
        <View style={styles.hashBtn} testID="game-grid-icon">
          <Ionicons name="grid-outline" size={20} color={c.text} />
        </View>
      </View>

      {failed && (
        <Animated.View
          style={[styles.overlay, { pointerEvents: "auto" }]}
          entering={FadeIn.duration(280)}
        >
          <Text style={styles.overlayTitle} testID="game-over-text">
            Out of hearts
          </Text>
          <Text style={styles.overlaySub}>Tap to try again.</Text>
          <Pressable
            testID="retry-button"
            onPress={() => {
              playTap();
              hapticLight();
              reset(level.id === "infinite" ? buildLevel("infinite", infiniteRound) : level);
            }}
            style={({ pressed }) => [
              styles.playPill,
              pressed && { opacity: 0.9 },
            ]}
          >
            <Text style={styles.playPillText}>Retry</Text>
          </Pressable>
          <Pressable
            testID="back-to-menu-button"
            onPress={() => {
              playTap();
              router.replace("/");
            }}
            style={({ pressed }) => [
              styles.menuBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.menuBtnText}>Home</Text>
          </Pressable>
        </Animated.View>
      )}

      {completed && (
        <Animated.View
          style={[styles.overlay, { pointerEvents: "auto" }]}
          entering={FadeIn.duration(timing.victoryIn)}
        >
          <Confetti active />
          <Animated.Text
            entering={FadeInDown.delay(80).duration(500)}
            style={styles.victoryText}
            testID="victory-text"
          >
            {congratsWord}
          </Animated.Text>
          <Animated.View
            entering={FadeInDown.delay(220).duration(500)}
            style={styles.statsRow}
          >
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>TIME</Text>
              <Text style={styles.statValue}>{formatTime(finalTimeMs)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>MOVES</Text>
              <Text style={styles.statValue}>{moves}</Text>
            </View>
          </Animated.View>
          <Animated.View
            entering={FadeInDown.delay(360).duration(500)}
            style={styles.actionStack}
          >
            <Pressable
              testID="next-level-button"
              onPress={handleNext}
              style={({ pressed }) => [
                styles.playPill,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={styles.playPillText}>
                {level.id === "infinite"
                  ? "Next round"
                  : isDaily
                    ? "Back to calendar"
                    : "Next level"}
              </Text>
            </Pressable>
            <Pressable
              testID="back-to-menu-button"
              onPress={() => {
                playTap();
                router.replace("/");
              }}
              style={({ pressed }) => [
                styles.menuBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.menuBtnText}>Home</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      )}
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
      paddingBottom: spacing.sm,
    },
    headerLeft: { flexDirection: "row", gap: 10, width: 100 },
    headerRight: { width: 100 },
    circleBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: c.backgroundSecondary,
      alignItems: "center",
      justifyContent: "center",
    },
    heartsRow: { flexDirection: "row", alignItems: "center" },
    headerLabel: {
      fontFamily: fonts.display,
      fontWeight: "800",
      fontSize: 11,
      letterSpacing: 2,
      color: c.textSecondary,
    },
    boardWrap: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      alignItems: "center",
      justifyContent: "center",
    },
    board: {
      width: "100%",
      aspectRatio: 1,
      backgroundColor: c.background,
      position: "relative",
      overflow: "hidden",
    },
    footerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    hashBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: c.backgroundSecondary,
      alignItems: "center",
      justifyContent: "center",
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.background,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.lg,
    },
    overlayTitle: {
      fontFamily: fonts.display,
      fontWeight: "900",
      color: c.text,
      fontSize: 38,
      letterSpacing: -1,
      marginBottom: 6,
    },
    overlaySub: {
      fontFamily: fonts.ui,
      color: c.textSecondary,
      fontSize: 14,
      marginBottom: spacing.xl,
    },
    victoryText: {
      fontFamily: fonts.display,
      fontWeight: "900",
      color: c.blue,
      fontSize: 56,
      letterSpacing: -1.5,
      textAlign: "center",
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg,
      marginTop: spacing.xl,
    },
    statCell: { alignItems: "center" },
    statLabel: {
      fontFamily: fonts.ui,
      color: c.textSecondary,
      fontSize: 11,
      letterSpacing: 2,
    },
    statValue: {
      fontFamily: fonts.display,
      fontWeight: "900",
      color: c.text,
      fontSize: 30,
      marginTop: 4,
    },
    divider: { width: 1, height: 32, backgroundColor: c.border },
    actionStack: {
      marginTop: spacing.xxl,
      width: "100%",
      gap: spacing.sm,
      alignItems: "center",
    },
    playPill: {
      backgroundColor: c.blue,
      paddingVertical: 16,
      paddingHorizontal: spacing.xl,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
      minWidth: 220,
    },
    playPillText: {
      fontFamily: fonts.display,
      fontWeight: "800",
      fontSize: 18,
      color: c.white,
      letterSpacing: 0.5,
    },
    menuBtn: {
      paddingVertical: 12,
    },
    menuBtnText: {
      fontFamily: fonts.ui,
      fontSize: 14,
      color: c.textSecondary,
      letterSpacing: 2,
    },
  });
