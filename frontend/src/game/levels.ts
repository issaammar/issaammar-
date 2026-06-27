// Game level definitions and procedural generator for the Arrow Maze puzzle.
// A cell is empty (null) or contains an arrow pointing in one of 4 directions.

export type Direction = "up" | "down" | "left" | "right";

export type Arrow = {
  id: string;
  row: number;
  col: number;
  dir: Direction;
};

export type Level = {
  id: string;
  size: number;
  arrows: Arrow[];
  title: string;
};

export type MoveResult =
  | { ok: true; cells: number }   // cells to slide off the grid (incl. exit cell)
  | { ok: false; cells: number }; // cells to slide forward before bouncing back

const DIRS: Direction[] = ["up", "down", "left", "right"];

const dirDelta = (d: Direction): { dr: number; dc: number } => {
  switch (d) {
    case "up":
      return { dr: -1, dc: 0 };
    case "down":
      return { dr: 1, dc: 0 };
    case "left":
      return { dr: 0, dc: -1 };
    case "right":
      return { dr: 0, dc: 1 };
  }
};

const pathClearToEdge = (
  grid: (Arrow | null)[][],
  row: number,
  col: number,
  dir: Direction,
): boolean => {
  const { dr, dc } = dirDelta(dir);
  let r = row + dr;
  let c = col + dc;
  while (r >= 0 && r < grid.length && c >= 0 && c < grid.length) {
    if (grid[r][c]) return false;
    r += dr;
    c += dc;
  }
  return true;
};

// ----------------------------------------------------------------------------
// Procedural generation: place arrows in REVERSE order of clearing.
// ----------------------------------------------------------------------------

export const generateProceduralLevel = (
  size: number,
  targetArrows: number,
  seed?: number,
  id = "infinite",
  title = "Infinite",
): Level => {
  const rng = mulberry32(seed ?? Math.floor(Math.random() * 1e9));
  const grid: (Arrow | null)[][] = Array.from({ length: size }, () =>
    Array(size).fill(null) as (Arrow | null)[],
  );
  const placed: Arrow[] = [];

  let attempts = 0;
  const maxAttempts = targetArrows * 80;
  while (placed.length < targetArrows && attempts < maxAttempts) {
    attempts++;
    const r = Math.floor(rng() * size);
    const c = Math.floor(rng() * size);
    if (grid[r][c]) continue;
    const shuffled = [...DIRS].sort(() => rng() - 0.5);
    let chosen: Direction | null = null;
    for (const d of shuffled) {
      if (pathClearToEdge(grid, r, c, d)) {
        chosen = d;
        break;
      }
    }
    if (!chosen) continue;
    const arrow: Arrow = { id: `${r}-${c}`, row: r, col: c, dir: chosen };
    grid[r][c] = arrow;
    placed.push(arrow);
  }

  return { id, size, arrows: placed, title };
};

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ----------------------------------------------------------------------------
// Handcrafted levels — generated with stable seeds so they're guaranteed
// solvable and the same on every launch.
// ----------------------------------------------------------------------------

type Recipe = { id: string; title: string; size: number; arrows: number; seed: number };

const RECIPES: Recipe[] = [
  { id: "1", title: "First Steps", size: 3, arrows: 3, seed: 101 },
  { id: "2", title: "Crossroads", size: 4, arrows: 5, seed: 207 },
  { id: "3", title: "Four Corners", size: 4, arrows: 6, seed: 311 },
  { id: "4", title: "Quick Exit", size: 5, arrows: 8, seed: 419 },
  { id: "5", title: "Stacked", size: 5, arrows: 10, seed: 523 },
  { id: "6", title: "Tight Squeeze", size: 5, arrows: 12, seed: 631 },
  { id: "7", title: "Spiral", size: 6, arrows: 14, seed: 743 },
  { id: "8", title: "Chambers", size: 6, arrows: 17, seed: 857 },
  { id: "9", title: "Pressure", size: 7, arrows: 20, seed: 967 },
  { id: "10", title: "Spectacular", size: 7, arrows: 24, seed: 1091 },
];

export const HANDCRAFTED: Level[] = RECIPES.map((r) =>
  generateProceduralLevel(r.size, r.arrows, r.seed, r.id, r.title),
);

// Build an N-th higher level by procedurally extending past the handcrafted
// set. Used for "Continue" past level 10.
export const buildHandcraftedOrExtended = (n: number): Level => {
  if (n <= HANDCRAFTED.length) return HANDCRAFTED[n - 1];
  // Increase size and arrow count gently
  const size = Math.min(5 + Math.floor((n - HANDCRAFTED.length) / 3), 9);
  const arrows = Math.max(10, Math.floor(size * size * 0.55));
  return generateProceduralLevel(size, arrows, n * 31 + 17, String(n), `Level ${n}`);
};

// ----------------------------------------------------------------------------
// Move resolution
// ----------------------------------------------------------------------------

export const tryMove = (
  arrows: Arrow[],
  size: number,
  arrow: Arrow,
): MoveResult => {
  const grid: (Arrow | null)[][] = Array.from({ length: size }, () =>
    Array(size).fill(null) as (Arrow | null)[],
  );
  for (const a of arrows) grid[a.row][a.col] = a;
  const { dr, dc } = dirDelta(arrow.dir);

  let r = arrow.row + dr;
  let c = arrow.col + dc;
  let steps = 0;
  while (r >= 0 && r < size && c >= 0 && c < size) {
    if (grid[r][c]) {
      return { ok: false, cells: steps };
    }
    steps++;
    r += dr;
    c += dc;
  }
  // We walked off the edge => add one more step to actually clear the board
  return { ok: true, cells: steps + 1 };
};

export const dirToDelta = dirDelta;
