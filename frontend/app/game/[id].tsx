// Gameplay screen. Renders a grid of arrow tiles; player taps to slide them off.
// Handles handcrafted levels (id = "1".."10") and procedural ("infinite").

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
import { playSwoosh, playTap, playVictory } from "@/src/game/audio";
import {
  Arrow,
  HANDCRAFTED,
  Level,
  canMove,
  generateProceduralLevel,
} from "@/src/game/levels";
import { colors, fonts, spacing, timing } from "@/src/game/theme";
import { usePlayer } from "@/src/game/usePlayer";
import { useProgress } from "@/src/game/useProgress";

const buildLevel = (id: string, infiniteRound: number): Level => {
  if (id === "infinite") {
    // ramp difficulty: 4x4 -> 7x7 across rounds 0..N
    const size = Math.min(4 + Math.floor(infiniteRound / 2), 7);
    const target = Math.max(5, Math.floor(size * size * 0.55));
    return generateProceduralLevel(size, target, Date.now() + infiniteRound);
  }
  const found = HANDCRAFTED.find((l) => l.id === id);
  return found ?? HANDCRAFTED[0];
};

const formatTime = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const exitDelta = (dir: Arrow["dir"], row: number, col: number, size: number) => {
  switch (dir) {
    case "up":
      return { dx: 0, dy: -(row + 1) };
    case "down":
      return { dx: 0, dy: size - row };
    case "left":
      return { dx: -(col + 1), dy: 0 };
    case "right":
      return { dx: size - col, dy: 0 };
  }
};

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const levelId = params.id ?? "1";

  const { player } = usePlayer();
  const { recordWin } = useProgress();

  const [infiniteRound, setInfiniteRound] = useState(0);
  const [level, setLevel] = useState<Level>(() => buildLevel(levelId, 0));
  const [arrows, setArrows] = useState<Arrow[]>(level.arrows);
  const [exiting, setExiting] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [startMs, setStartMs] = useState<number>(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [finalTimeMs, setFinalTimeMs] = useState(0);
  const [boardSize, setBoardSize] = useState(0);
  const submittedRef = useRef(false);

  const tileRefs = useRef<Record<string, ArrowTileHandle | null>>({});

  const reset = (next?: Level) => {
    const lvl = next ?? level;
    setLevel(lvl);
    setArrows(lvl.arrows);
    setExiting(new Set());
    setMoves(0);
    setStartMs(Date.now());
    setElapsed(0);
    setCompleted(false);
    setFinalTimeMs(0);
    submittedRef.current = false;
    tileRefs.current = {};
  };

  // initialize for the (potentially changing) levelId param
  useEffect(() => {
    const lvl = buildLevel(levelId, 0);
    setInfiniteRound(0);
    reset(lvl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelId]);

  // timer
  useEffect(() => {
    if (completed) return;
    const t = setInterval(() => setElapsed(Date.now() - startMs), 250);
    return () => clearInterval(t);
  }, [completed, startMs]);

  // detect completion after arrows update
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
      playVictory();
      // record + submit
      void recordWin(level.id, final, moves);
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
  }, [arrows, exiting, level, moves, player, recordWin, startMs, completed]);

  const activeArrows = useMemo(
    () => arrows.filter((a) => !exiting.has(a.id)),
    [arrows, exiting],
  );

  const handleTap = (arrow: Arrow) => {
    if (completed) return;
    if (exiting.has(arrow.id)) return;
    if (!canMove(activeArrows, level.size, arrow)) {
      tileRefs.current[arrow.id]?.shake();
      playTap();
      return;
    }
    setMoves((m) => m + 1);
    // mark exiting so canMove for future taps ignores it
    setExiting((cur) => {
      const next = new Set(cur);
      next.add(arrow.id);
      return next;
    });
    playSwoosh();
    const { dx, dy } = exitDelta(arrow.dir, arrow.row, arrow.col, level.size);
    const cellSize = boardSize / level.size;
    const handle = tileRefs.current[arrow.id];
    if (handle) {
      handle.slideOff(dx, dy, cellSize, () => {
        setArrows((cur) => cur.filter((a) => a.id !== arrow.id));
        setExiting((cur) => {
          const next = new Set(cur);
          next.delete(arrow.id);
          return next;
        });
      });
    } else {
      // fallback: remove immediately
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
    if (level.id === "infinite") {
      const round = infiniteRound + 1;
      setInfiniteRound(round);
      reset(buildLevel("infinite", round));
      return;
    }
    const idx = HANDCRAFTED.findIndex((l) => l.id === level.id);
    if (idx >= 0 && idx + 1 < HANDCRAFTED.length) {
      const nextLvl = HANDCRAFTED[idx + 1];
      router.replace(`/game/${nextLvl.id}`);
    } else {
      // last handcrafted -> go infinite
      router.replace(`/game/infinite`);
    }
  };

  const headerLabel =
    level.id === "infinite"
      ? `INFINITE · ROUND ${infiniteRound + 1}`
      : `LEVEL ${level.id} · ${level.title.toUpperCase()}`;

  const cellSize = boardSize > 0 ? boardSize / level.size : 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <StatusBar style="dark" />

      {/* Header */}
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
          <Ionicons name="chevron-back" size={26} color={colors.black} />
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
            reset(level.id === "infinite" ? buildLevel("infinite", infiniteRound) : level);
          }}
          hitSlop={12}
          style={styles.iconBtn}
        >
          <Ionicons name="refresh" size={24} color={colors.black} />
        </Pressable>
      </View>

      {/* Board */}
      <View style={styles.boardWrap}>
        <View
          testID="gameplay-grid"
          style={styles.board}
          onLayout={(e) => setBoardSize(e.nativeEvent.layout.width)}
        >
          {/* Background grid lines */}
          {boardSize > 0 &&
            Array.from({ length: level.size + 1 }).map((_, i) => (
              <View
                key={`v-${i}`}
                style={[
                  styles.gridLine,
                  {
                    left: i * cellSize,
                    top: 0,
                    width: 1,
                    height: boardSize,
                  },
                ]}
              />
            ))}
          {boardSize > 0 &&
            Array.from({ length: level.size + 1 }).map((_, i) => (
              <View
                key={`h-${i}`}
                style={[
                  styles.gridLine,
                  {
                    top: i * cellSize,
                    left: 0,
                    height: 1,
                    width: boardSize,
                  },
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
                  onPress={() => handleTap(a)}
                />
              </View>
            ))}
        </View>

        {arrows.length === 0 && !completed && (
          <Animated.View
            style={styles.emptyHint}
            entering={FadeIn.duration(400)}
          >
            <Text style={styles.emptyHintText}>Almost there…</Text>
          </Animated.View>
        )}
      </View>

      {/* Footer hint */}
      <View style={styles.footer}>
        <Text style={styles.footerHint} testID="footer-hint">
          {level.id === "infinite"
            ? "Tap an arrow to slide it. Survive as long as you can."
            : "Tap an arrow. If its path is clear, it flies off."}
        </Text>
      </View>

      {/* Victory overlay */}
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
            Spectacular!
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
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.btnPrimaryText}>
                {level.id === "infinite" ? "Next round" : "Next level"}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={22}
                color={colors.white}
                style={{ marginLeft: 10 }}
              />
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
  iconBtn: { padding: 4, minWidth: 30, alignItems: "center" },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  headerLabel: {
    fontFamily: fonts.display,
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 2,
    color: colors.black,
  },
  statRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statText: {
    fontFamily: fonts.ui,
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  statDot: { color: colors.textMuted, fontSize: 12 },
  boardWrap: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  board: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: colors.background,
    position: "relative",
    overflow: "hidden",
  },
  gridLine: {
    position: "absolute",
    backgroundColor: colors.border,
  },
  emptyHint: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyHintText: {
    fontFamily: fonts.display,
    fontWeight: "900",
    fontSize: 18,
    color: colors.textMuted,
    letterSpacing: 2,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    alignItems: "center",
  },
  footerHint: {
    fontFamily: fonts.ui,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
  },
  victoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.96)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  victoryText: {
    fontFamily: fonts.display,
    fontWeight: "900",
    color: colors.victory,
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
    color: colors.textSecondary,
    fontSize: 11,
    letterSpacing: 2,
  },
  victoryStatValue: {
    fontFamily: fonts.display,
    fontWeight: "900",
    color: colors.black,
    fontSize: 32,
    marginTop: 4,
  },
  victoryDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.black,
  },
  victoryButtons: {
    marginTop: spacing.xxl,
    width: "100%",
    gap: spacing.sm,
  },
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.black,
    paddingVertical: 18,
    paddingHorizontal: spacing.lg,
  },
  btnPrimaryText: {
    fontFamily: fonts.display,
    fontWeight: "800",
    fontSize: 18,
    color: colors.white,
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
    color: colors.textSecondary,
    letterSpacing: 2,
  },
});
