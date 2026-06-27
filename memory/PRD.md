# Arrow Maze — Product Requirements (MVP)

A minimalist 2D mobile puzzle game where players tap interlocking arrow tiles
on a clean white grid; tapping an arrow makes it slide along its direction
and fly off the board — but only if the path to the edge is clear. Clearing
the entire board triggers a bold blue "Spectacular!" celebration with falling
blue and white confetti.

## Stack
- Frontend: Expo SDK 54, React Native 0.81, expo-router 6
- Animations: react-native-reanimated 4
- Audio: expo-audio (bundled WAV: swoosh, tap, victory)
- Backend: FastAPI + MongoDB (motor)
- Storage: AsyncStorage via /app/frontend/src/utils/storage

## Screens
- `/` Home — bold typographic menu (Play, Levels, Infinite, Stats)
- `/levels` Level grid (10 handcrafted + endless Infinite)
- `/game/[id]` Gameplay (taps, slide-off, victory overlay)
- `/stats` Player profile, personal bests, global leaderboard

## Core gameplay
- Grid of N×N cells. Each occupied cell holds an arrow pointing up/down/left/right.
- Tap arrow → if no other arrow lies between it and the grid edge in its
  direction, it animates a slide off the board and is removed.
- Blocked taps trigger a shake animation; MOVES is not incremented.
- Goal: clear every arrow.
- Handcrafted levels are generated with the procedural algorithm using fixed
  seeds, which guarantees solvability and stable layouts.
- Infinite mode increases grid size (4→7) and arrow density per round.

## Backend API (prefix `/api`)
- `POST /players` — create or fetch a player by name (idempotent).
- `GET /players/{id}` — fetch a player.
- `POST /scores` — submit a completed level run.
- `GET /scores/leaderboard?limit=` — global top scores by fastest time.
- `GET /scores/leaderboard/{level_id}?limit=` — per-level leaderboard.
- `GET /scores/recent?limit=` — most recent submissions.
- `GET /stats/{player_id}` — levels_completed, total_plays, total_moves, best_times.

## Persistence
- Local: `arrow-maze:player` (id+name), `arrow-maze:progress-v1` (completed
  levels, best times/moves), `arrow-maze:sound-enabled`.
- Remote: MongoDB collections `players` and `scores` (no `_id` exposed).

## Design
- Pure minimalist white/black with `#0044FF` blue accent.
- Bold display fonts for headings/victory. UI sans for body.
- Square tiles, 0px radius, sharp lines (per design_guidelines.json).
- Confetti: 70 particles, blue/white, falling with rotation + drift.

## Status
- Backend endpoints implemented and verified via curl.
- All four screens render and gameplay loop completes end-to-end (taps →
  slide → victory → next).
- Procedural-seeded handcrafted levels are guaranteed solvable.
