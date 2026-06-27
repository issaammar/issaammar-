# Arrow Maze — Product Requirements

Minimalist 2D mobile puzzle visually + structurally matched to the reference
"Arrows" app. Soft lavender theme, indigo primary accent.

## Stack
- Expo SDK 54, expo-router 6 (Tabs + Stack), Reanimated 4
- Audio: expo-audio · Haptics: expo-haptics
- Backend: FastAPI + MongoDB (motor)

## Navigation
Bottom Tabs (root): **Home / Challenge / Collection / Settings**
Stack overlay (full screen, no tab bar): `/game/[id]` for level play.

## Screens
- **Home** — small streak chip, Challenge card (trophy + Play pill),
  "Arrows" wordmark (triangle "A" + tail), big Level N, full-width Play pill.
- **Challenge** — large trophy, green/lavender progress bar (done / total),
  "Month Year" indigo title, Mo–Su weekday row, monthly day grid (lavender
  pills, today highlighted in indigo, future days dimmed), Play pill.
- **Collection** — 4 stat cards (Longest day streak / Highest win streak /
  Most wins / Highest level) + 12-month trophy grid (locked icon → gold
  trophy when a full month is cleared).
- **Settings** — grouped lavender cards:
  Group 1 Language/Vibrations/Sounds/Dark mode/Native Refresh Rate
  Group 2 Account Connection
  Group 3 Remove Ads / Restore purchases
  Group 4 Rate us / Write us
  Group 5 Privacy / Terms of Service
- **Game** — lavender circle Back + Restart top-left, 3 red hearts centered
  (lose one per blocked tap; zero → retry overlay), board, bottom row with
  "LEVEL N · MOVES N" + small grid icon. Victory overlay rotates Spectacular
  / Superb / Brilliant / Excellent / Fantastic over blue+white confetti.

## Theme
- Light palette: lavender bg `#F5F5FC`, soft lavender card `#ECEAF7`, indigo
  primary `#5C5BE6`, navy text `#1B1D3A`, success green `#22C55E`, hearts red
  `#FF5B6E`.
- Dark palette: dark navy bg `#0E1320`, indigo accent `#8C8BF5`.
- `useColors()` hook returns the active palette based on the dark-mode toggle.

## Mechanics
- `tryMove(arrows, size, arrow)` → `{ ok, cells }`. Successful tap slides off
  (`cells` to edge), failed tap bounces forward `cells` steps and back.
- Bounce costs a heart; 0 hearts → fail overlay with Retry + Home.
- Sounds gated by `sounds`; haptics gated by `vibrations`.

## Backend API (prefix `/api`)
- POST /players (idempotent by name)
- POST /scores · GET /scores/leaderboard[?limit] · /leaderboard/{level_id}
  · /recent
- GET /stats/{player_id}
- All responses strip `_id`; documents typed via Pydantic.

## Status
- Backend pytest 10/10 ✅
- All four tab screens + game render exactly to the reference look
  (lavender / indigo, pill buttons, calendar grid, lavender setting cards,
  3 hearts in game).
