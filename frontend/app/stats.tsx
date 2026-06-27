// Stats screen: shows player profile, personal bests, and global leaderboard.

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api, LeaderboardEntry, PlayerStats } from "@/src/game/api";
import { playTap } from "@/src/game/audio";
import { colors, fonts, spacing } from "@/src/game/theme";
import { usePlayer } from "@/src/game/usePlayer";

const formatTime = (ms?: number) => {
  if (!ms && ms !== 0) return "—";
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export default function Stats() {
  const router = useRouter();
  const { player, rename } = usePlayer();

  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!player) return;
    setLoading(true);
    setError(null);
    try {
      const [s, b] = await Promise.all([
        api.playerStats(player.id).catch(() => null),
        api.globalLeaderboard().catch(() => []),
      ]);
      setStats(s);
      setBoard(b);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [player]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const commitRename = async () => {
    const v = nameDraft.trim();
    if (v) {
      await rename(v);
    }
    setEditing(false);
    setNameDraft("");
    setTimeout(() => void load(), 200);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            playTap();
            router.back();
          }}
          style={styles.iconBtn}
          testID="stats-back-button"
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={26} color={colors.black} />
        </Pressable>
        <Text style={styles.title}>Stats</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Player card */}
        <View style={styles.playerCard} testID="player-card">
          <Text style={styles.smallLabel}>YOU</Text>
          {editing ? (
            <View style={styles.editRow}>
              <TextInput
                value={nameDraft}
                onChangeText={setNameDraft}
                style={styles.nameInput}
                placeholder={player?.name ?? "Your name"}
                placeholderTextColor={colors.textMuted}
                autoFocus
                maxLength={24}
                returnKeyType="done"
                onSubmitEditing={commitRename}
                testID="player-name-input"
              />
              <Pressable
                onPress={commitRename}
                style={styles.saveBtn}
                testID="player-name-save"
              >
                <Text style={styles.saveBtnText}>Save</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                setNameDraft(player?.name ?? "");
                setEditing(true);
              }}
              style={styles.nameRow}
              testID="player-name-button"
            >
              <Text style={styles.nameText} numberOfLines={1}>
                {player?.name ?? "..."}
              </Text>
              <Ionicons
                name="pencil"
                size={16}
                color={colors.textSecondary}
              />
            </Pressable>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <Text style={styles.statNum} testID="stat-levels-completed">
                {stats?.levels_completed ?? 0}
              </Text>
              <Text style={styles.statCap}>CLEARED</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statCell}>
              <Text style={styles.statNum} testID="stat-total-plays">
                {stats?.total_plays ?? 0}
              </Text>
              <Text style={styles.statCap}>RUNS</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statCell}>
              <Text style={styles.statNum} testID="stat-total-moves">
                {stats?.total_moves ?? 0}
              </Text>
              <Text style={styles.statCap}>MOVES</Text>
            </View>
          </View>
        </View>

        {/* Personal Bests */}
        <Text style={styles.section}>PERSONAL BESTS</Text>
        <View style={styles.list} testID="personal-bests">
          {stats && Object.keys(stats.best_times).length > 0 ? (
            Object.entries(stats.best_times)
              .sort(([a], [b]) => (a === "infinite" ? 1 : b === "infinite" ? -1 : Number(a) - Number(b)))
              .map(([lid, t]) => (
                <View key={lid} style={styles.row} testID={`pb-row-${lid}`}>
                  <Text style={styles.rowLabel}>
                    {lid === "infinite" ? "Infinite" : `Level ${lid}`}
                  </Text>
                  <Text style={styles.rowVal}>{formatTime(t)}</Text>
                </View>
              ))
          ) : (
            <Text style={styles.empty}>No records.</Text>
          )}
        </View>

        {/* Global leaderboard */}
        <Text style={[styles.section, { marginTop: spacing.xl }]}>
          GLOBAL LEADERBOARD
        </Text>
        <View style={styles.list} testID="global-leaderboard">
          {loading ? (
            <Text style={styles.empty}>Loading…</Text>
          ) : error ? (
            <Text style={styles.empty}>Couldn't load leaderboard.</Text>
          ) : board.length === 0 ? (
            <Text style={styles.empty}>No records yet — be the first.</Text>
          ) : (
            board.slice(0, 20).map((e, i) => (
              <View
                key={`${e.player_name}-${e.created_at}-${i}`}
                style={styles.row}
                testID={`lb-row-${i}`}
              >
                <Text style={styles.rank}>{(i + 1).toString().padStart(2, "0")}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel} numberOfLines={1}>
                    {e.player_name}
                  </Text>
                  <Text style={styles.rowSub}>
                    {e.level_id === "infinite"
                      ? "Infinite"
                      : `Level ${e.level_id}`}
                    {" · "}
                    {e.moves} moves
                  </Text>
                </View>
                <Text style={styles.rowVal}>{formatTime(e.time_ms)}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  iconBtn: { padding: 4 },
  title: {
    fontFamily: fonts.display,
    fontWeight: "900",
    fontSize: 20,
    color: colors.black,
    letterSpacing: 1,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  playerCard: {
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.black,
  },
  smallLabel: {
    fontFamily: fonts.ui,
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 2,
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: spacing.sm,
  },
  nameInput: {
    flex: 1,
    fontFamily: fonts.display,
    fontWeight: "900",
    fontSize: 28,
    color: colors.black,
    paddingVertical: 4,
    borderBottomWidth: 2,
    borderBottomColor: colors.black,
  },
  saveBtn: {
    backgroundColor: colors.black,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  saveBtnText: {
    color: colors.white,
    fontFamily: fonts.display,
    fontWeight: "800",
    fontSize: 14,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: spacing.sm,
  },
  nameText: {
    fontFamily: fonts.display,
    fontWeight: "900",
    fontSize: 28,
    color: colors.black,
    letterSpacing: -0.5,
  },
  statsRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statCell: { alignItems: "center", flex: 1 },
  divider: { width: 1, height: 36, backgroundColor: colors.border },
  statNum: {
    fontFamily: fonts.display,
    fontWeight: "900",
    fontSize: 24,
    color: colors.black,
  },
  statCap: {
    fontFamily: fonts.ui,
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 2,
    marginTop: 2,
  },
  section: {
    marginTop: spacing.xl,
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  list: {
    borderTopWidth: 1,
    borderColor: colors.black,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  rank: {
    fontFamily: fonts.display,
    fontWeight: "900",
    fontSize: 16,
    color: colors.black,
    width: 30,
  },
  rowLabel: {
    fontFamily: fonts.ui,
    fontWeight: "600",
    fontSize: 15,
    color: colors.black,
    flex: 1,
  },
  rowSub: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rowVal: {
    fontFamily: fonts.display,
    fontWeight: "800",
    fontSize: 16,
    color: colors.blue,
  },
  empty: {
    fontFamily: fonts.ui,
    color: colors.textSecondary,
    paddingVertical: spacing.lg,
    textAlign: "center",
  },
});
