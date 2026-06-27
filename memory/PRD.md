# Arrow Maze — Product Requirements

Minimalist 2D mobile puzzle. Players tap interlocking arrow tiles on a grid;
each tapped arrow slides along its direction. If the path is clear it exits
the board, otherwise it slides forward, hits the blocker, and bounces back
to its origin. Clearing the board triggers a confetti celebration with a
rotating congratulatory word.

## Stack
- Expo SDK 54, expo-router 6, React Native 0.81, Reanimated 4
- Audio: expo-audio (bundled WAV); Haptics: expo-haptics
- Backend: FastAPI + MongoDB (motor)
- Storage: AsyncStorage via /app/frontend/src/utils/storage

## Screens
- `/` Home — big LEVEL number, Continue, Daily/Awards cards, All-levels, 3
  icon shortcuts (daily/awards/settings)
- `/levels` Stages grid + Infinite tile
- `/game/[id]` Gameplay (numeric levels, `infinite`, `daily-YYYY-MM-DD`)
- `/daily` Calendar with progress + monthly trophy
- `/awards` Stat cards + 12-month trophy grid
- `/settings` Language, Vibrations, Sounds, Dark Mode, Native Refresh Rate

## Theme
- Light + Dark palettes exposed via `useColors()` hook; switching is instant
  and persisted in `arrow-maze:settings-v1`.

## Mechanics
- `tryMove(arrows, size, arrow)` → `{ ok, cells }`; `cells` is exit distance
  on ok, or forward distance before the blocker on fail.
- `ArrowTile.slideOff(cells)` translates and fades; `ArrowTile.bounce(cells)`
  forwards 70% then snaps back.
- Sounds gated by `sounds`; haptics gated by `vibrations`.
- Victory rotates between Spectacular/Superb/Brilliant/Excellent/Fantastic.

## Stats (local)
- `arrow-maze:stats-v1`: currentLevel, highestLevel, totalWins,
  currentWinStreak, longestWinStreak, longestDayStreak, currentDayStreak,
  completedDailies[], monthlyTrophies[].
- Monthly trophy unlocks when every day of a month is cleared.

## Backend API (prefix `/api`)
- `POST /players` (idempotent by name)
- `POST /scores` — submit completion
- `GET /scores/leaderboard[?limit]` and `GET /scores/leaderboard/{level_id}`
- `GET /scores/recent`
- `GET /stats/{player_id}`

## Status
- Backend pytest 10/10 ✅
- Frontend tests across home, settings, daily, awards, levels, gameplay,
  bounce-back, victory and deep-links all ✅
