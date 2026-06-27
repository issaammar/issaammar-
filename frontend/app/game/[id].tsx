// Gameplay screen. Tap arrows to slide them off the board; if the path is
// blocked another arrow lies between this arrow and the edge, the arrow
// slides forward, hits the wall, and bounces back to its original cell.
// Cleared boards trigger a "Superb!" victory celebration with confetti.

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
import { ColorPalette, fonts, spacing, timing, useColors } from "@/src/game/theme";
import { usePlayer } from "@/src/game/usePlayer";
import { useStats, ymd } from "@/src/game/useStats";

// Variety: rotate congratulatory words across wins so it feels alive.
const CONGRATS = ["Spectacular!", "Superb!", "Brilliant!", "Excellent!", "Fantastic!"];

// Parse a daily-YYYY-MM-DD style level id into a deterministic seed.
const parseDailySeed = (id: string): { seed: number; dateKey: string } | null => {
  if (!id.startsWith("daily-")) return null;
  const dateKey = id.slice("daily-".length);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const seed = y * 10000 + mo * 100 + d;
  return { seed, dateKey };
};

const buildLevel = (id: string, infiniteRound: number): Level => {
  if (id === "infinite") {
    const size = Math.min(4 + Math.floor(infiniteRound / 2), 7);
    const target = Math.max(5, Math.floor(size * size * 0.55));
    return generateProceduralLevel(
      size,
      target,
      Date.now() + infiniteRound,
      "infinite",
      "Infinite",
    );
  }
  const daily = parseDailySeed(id);
  if (daily) {
    // size scales with day so each day feels different; cap at 6
    const dayNum = Number(daily.dateKey.slice(-2));
    const size = 4 + (dayNum % 3);
    const target = Math.max(6, Math.floor(size * size * 0.55));
    return generateProceduralLevel(
      size,
      target,
      daily.seed,
      id,
      `Daily ${daily.dateKey}`,
    );
  }
  const num = Number(id);
  if (!Number.isFinite(num) || num < 1) {
    return HANDCRAFTED[0];
  }
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
  const { recordLevelWin, recordDailyWin } = useStats();

  const [infiniteRound, setInfiniteRound] = useState(0);
  const [level, setLevel] = useState<Level>(() => buildLevel(levelId, 0));
  const [arrows, setArrows] = useState<Arrow[]>(level.arrows);
  const [exiting, setExiting] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<Set<string>>(new Set()); // bouncing arrows
  const [moves, setMoves] = useState(0);
  const [startMs, setStartMs] = useState<number>(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
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
    setMoves(0);
    setStartMs(Date.now());
    setElapsed(0);
    setCompleted(false);
    setFinalTimeMs(0);
    submittedRef.current = false;
    tileRefs.current = {};
  };

  useEffect(() => {
    const lvl = buildLevel(levelId, 0);
    setInfiniteRound(0);
    reset(lvl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelId]);

  useEffect(() => {
    if (completed) return;
    const t = setInterval(() => setElapsed(Date.now() - startMs), 250);
    return () => clearInterval(t);
  }, [completed, startMs]);

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

      // record locally
      if (isDaily) {
        const daily = parseDailySeed(level.id);
        if (daily) recordDailyWin(daily.dateKey);
      } else if (numericLevel != null) {
        recordLevelWin(numericLevel);
      }

      // submit remote
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
    if (completed) return;
    if (exiting.has(arrow.id) || busy.has(arrow.id)) return;
    const cellSize = boardSize / level.size;
    const result = tryMove(activeArrows, level.size, arrow);

    if (!result.ok) {
      // bounce-back: forward to the blocker, then return
      setBusy((cur) => {
        const next = new Set(cur);
        next.add(arrow.id);
        return next;
      });
      playTap();
      hapticError();
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
      router.replace("/daily");
      return;
    }
    if (numericLevel != null) {
      router.replace(`/game/${numericLevel + 1}`);
      return;
    }
    router.replace("/");
  };

  const headerLabel =
    level.id === "infinite"
      ? `INFINITE · ROUND ${infiniteRound + 1}`
      : isDaily
        ? `DAILY · ${ymd(new Date(parseDailySeed(level.id)!.dateKey + "T00:00:00"))}`
        : `LEVEL ${level.id}`;

  const cellSize = boardSize > 0 ? boardSize / level.size : 0;
  const styles = useMemo(() => buildStyles(c), [c]);

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: c.background }]} edges={["top", "bottom"]}>
      <StatusBar style={settings.darkMode ? "light" : "dark"} />

      <View style={styles.header}>
        <Pressable
          testID="game-back-button"
          onPress={() => {
            playTap();
            router.back();
          }}
          hitSlop={12}
          style={styles.iconBtn}
        >
          <Ionicons name="chevron-back" size={26} color={c.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel} testID="game-header-label">
            {headerLabel}
          </Text>
          <View style={styles.statRow}>
            <Text style={styles.statText} testID="game-moves">
              MOVES {moves}
            </Text>
            <Text style={styles.statDot}>·</Text>
            <Text style={styles.statText} testID="game-time">
              {formatTime(elapsed)}
            </Text>
          </View>
        </View>
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
          hitSlop={12}
          style={styles.iconBtn}
        >
          <Ionicons name="refresh" size={24} color={c.text} />
        </Pressable>
      </View>

      <View style={styles.boardWrap}>
        <View
          testID="gameplay-grid"
          style={styles.board}
          onLayout={(e) => setBoardSize(e.nativeEvent.layout.width)}
        >
          {boardSize > 0 &&
            Array.from({ length: level.size + 1 }).map((_, i) => (
              <View
                key={`v-${i}`}
                style={[
                  styles.gridLine,
                  { left: i * cellSize, top: 0, width: 1, height: boardSize },
                ]}
              />
            ))}
          {boardSize > 0 &&
            Array.from({ length: level.size + 1 }).map((_, i) => (
              <View
                key={`h-${i}`}
                style={[
                  styles.gridLine,
                  { top: i * cellSize, left: 0, height: 1, width: boardSize },
                ]}
              />
            ))}
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

      <View style={styles.footer}>
        <Text style={styles.footerHint} testID="footer-hint">
          {level.id === "infinite"
            ? "Tap an arrow to slide it. Survive as long as you can."
            : "Tap an arrow. Blocked arrows bounce back."}
        </Text>
      </View>

      {completed && (
        <Animated.View
          style={[styles.victoryOverlay, { pointerEvents: "auto" }]}
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
            style={styles.victoryStatsRow}
          >
            <View style={styles.victoryStat}>
              <Text style={styles.victoryStatLabel}>TIME</Text>
              <Text style={styles.victoryStatValue}>
                {formatTime(finalTimeMs)}
              </Text>
            </View>
            <View style={styles.victoryDivider} />
            <View style={styles.victoryStat}>
              <Text style={styles.victoryStatLabel}>MOVES</Text>
              <Text style={styles.victoryStatValue}>{moves}</Text>
            </View>
          </Animated.View>
          <Animated.View
            entering={FadeInDown.delay(360).duration(500)}
            style={styles.victoryButtons}
          >
            <Pressable
              testID="next-level-button"
              onPress={handleNext}
              style={({ pressed }) => [
                styles.btnPrimary,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={styles.btnPrimaryText}>
                {level.id === "infinite"
                  ? "Next round"
                  : isDaily
                    ? "Back to calendar"
                    : "Next level"}
              </Text>
              <Ionicons name="arrow-forward" size={22} color={c.background} style={{ marginLeft: 10 }} />
            </Pressable>
            <Pressable
              testID="back-to-menu-button"
              onPress={() => {
                playTap();
                router.replace("/");
              }}
              style={({ pressed }) => [
                styles.btnSecondary,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.btnSecondaryText}>Menu</Text>
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
      paddingBottom: spacing.md,
    },
    iconBtn: { padding: 4, minWidth: 30, alignItems: "center" },
    headerCenter: { flex: 1, alignItems: "center", gap: 2 },
    headerLabel: {
      fontFamily: fonts.display,
      fontWeight: "900",
      fontSize: 12,
      letterSpacing: 2,
      color: c.text,
    },
    statRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    statText: {
      fontFamily: fonts.ui,
      fontSize: 12,
      color: c.textSecondary,
      letterSpacing: 1,
    },
    statDot: { color: c.textMuted, fontSize: 12 },
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
    gridLine: { position: "absolute", backgroundColor: c.border },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      alignItems: "center",
    },
    footerHint: {
      fontFamily: fonts.ui,
      fontSize: 12,
      color: c.textMuted,
      textAlign: "center",
    },
    victoryOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.background,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.lg,
    },
    victoryText: {
      fontFamily: fonts.display,
      fontWeight: "900",
      color: c.victory,
      fontSize: 64,
      letterSpacing: -2,
      textAlign: "center",
    },
    victoryStatsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg,
      marginTop: spacing.xl,
    },
    victoryStat: { alignItems: "center" },
    victoryStatLabel: {
      fontFamily: fonts.ui,
      color: c.textSecondary,
      fontSize: 11,
      letterSpacing: 2,
    },
    victoryStatValue: {
      fontFamily: fonts.display,
      fontWeight: "900",
      color: c.text,
      fontSize: 32,
      marginTop: 4,
    },
    victoryDivider: { width: 1, height: 36, backgroundColor: c.text },
    victoryButtons: {
      marginTop: spacing.xxl,
      width: "100%",
      gap: spacing.sm,
    },
    btnPrimary: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.text,
      paddingVertical: 18,
      paddingHorizontal: spacing.lg,
    },
    btnPrimaryText: {
      fontFamily: fonts.display,
      fontWeight: "800",
      fontSize: 18,
      color: c.background,
      letterSpacing: 1,
    },
    btnSecondary: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      backgroundColor: "transparent",
    },
    btnSecondaryText: {
      fontFamily: fonts.ui,
      fontSize: 14,
      color: c.textSecondary,
      letterSpacing: 2,
    },
  });
