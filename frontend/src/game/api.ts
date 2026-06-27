// Thin API client around the backend. Reads EXPO_PUBLIC_BACKEND_URL from env.

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";

export type Player = {
  id: string;
  name: string;
  created_at: string;
};

export type LeaderboardEntry = {
  player_name: string;
  level_id: string;
  time_ms: number;
  moves: number;
  grid_size: number;
  arrow_count: number;
  created_at: string;
};

export type PlayerStats = {
  player_id: string;
  player_name: string;
  levels_completed: number;
  total_plays: number;
  total_moves: number;
  best_times: Record<string, number>;
};

export type ScoreInput = {
  player_id: string;
  player_name: string;
  level_id: string;
  time_ms: number;
  moves: number;
  grid_size: number;
  arrow_count: number;
};

const json = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
};

export const api = {
  createOrGetPlayer: (name: string) =>
    json<Player>("/players", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  submitScore: (s: ScoreInput) =>
    json("/scores", { method: "POST", body: JSON.stringify(s) }),

  globalLeaderboard: () => json<LeaderboardEntry[]>("/scores/leaderboard"),
  levelLeaderboard: (levelId: string) =>
    json<LeaderboardEntry[]>(`/scores/leaderboard/${encodeURIComponent(levelId)}`),

  playerStats: (playerId: string) => json<PlayerStats>(`/stats/${playerId}`),

  recentScores: () => json<LeaderboardEntry[]>(`/scores/recent`),
};
