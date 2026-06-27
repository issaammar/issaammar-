// Personal progression & achievements store, persisted locally.
// Tracks current level, total wins, win streaks, daily completions, and
// monthly trophies (one per month where the player completes every day).

import { useCallback, useEffect, useMemo, useState } from "react";

import { storage } from "@/src/utils/storage";

const KEY = "arrow-maze:stats-v1";

export type StatsState = {
  currentLevel: number;            // next handcrafted level number to play (1-indexed)
  highestLevel: number;            // furthest level reached
  totalWins: number;               // total puzzles cleared (any kind)
  currentWinStreak: number;        // consecutive wins without quit/restart
  longestWinStreak: number;        // best ever consecutive wins
  lastWinDate: string | null;      // YYYY-MM-DD of last completion
  longestDayStreak: number;        // best consecutive-day login/win streak
  currentDayStreak: number;
  completedDailies: string[];      // ["YYYY-MM-DD", ...]
  monthlyTrophies: string[];       // ["YYYY-MM", ...]
};

const EMPTY: StatsState = {
  currentLevel: 1,
  highestLevel: 1,
  totalWins: 0,
  currentWinStreak: 0,
  longestWinStreak: 0,
  lastWinDate: null,
  longestDayStreak: 0,
  currentDayStreak: 0,
  completedDailies: [],
  monthlyTrophies: [],
};

export const ymd = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const ym = (d: Date) => ymd(d).slice(0, 7);

const daysInMonth = (year: number, month0: number) =>
  new Date(year, month0 + 1, 0).getDate();

export const useStats = () => {
  const [stats, setStats] = useState<StatsState>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const raw = await storage.getItem<string>(KEY, "");
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<StatsState>;
          if (active) setStats({ ...EMPTY, ...parsed });
        } catch {
          /* ignore */
        }
      }
      if (active) setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback(async (next: StatsState) => {
    await storage.setItem(KEY, JSON.stringify(next));
  }, []);

  const recordLevelWin = useCallback(
    (levelNumber: number) => {
      setStats((cur) => {
        const today = ymd(new Date());
        let dayStreak = cur.currentDayStreak;
        if (cur.lastWinDate === null) {
          dayStreak = 1;
        } else if (cur.lastWinDate === today) {
          // same day, no change
        } else {
          const prev = new Date(cur.lastWinDate + "T00:00:00");
          const diffMs = new Date(today + "T00:00:00").getTime() - prev.getTime();
          const diffDays = Math.round(diffMs / 86400000);
          dayStreak = diffDays === 1 ? cur.currentDayStreak + 1 : 1;
        }
        const next: StatsState = {
          ...cur,
          currentLevel: Math.max(cur.currentLevel, levelNumber + 1),
          highestLevel: Math.max(cur.highestLevel, levelNumber + 1),
          totalWins: cur.totalWins + 1,
          currentWinStreak: cur.currentWinStreak + 1,
          longestWinStreak: Math.max(
            cur.longestWinStreak,
            cur.currentWinStreak + 1,
          ),
          lastWinDate: today,
          currentDayStreak: dayStreak,
          longestDayStreak: Math.max(cur.longestDayStreak, dayStreak),
        };
        void persist(next);
        return next;
      });
    },
    [persist],
  );

  const recordDailyWin = useCallback(
    (dateKey: string) => {
      setStats((cur) => {
        const completed = cur.completedDailies.includes(dateKey)
          ? cur.completedDailies
          : [...cur.completedDailies, dateKey];

        // Check monthly trophy: all days of the month completed?
        const monthKey = dateKey.slice(0, 7);
        const [y, m] = monthKey.split("-").map(Number);
        const totalDays = daysInMonth(y, m - 1);
        const monthCount = completed.filter((d) => d.startsWith(monthKey)).length;
        let trophies = cur.monthlyTrophies;
        if (monthCount >= totalDays && !trophies.includes(monthKey)) {
          trophies = [...trophies, monthKey];
        }

        const today = ymd(new Date());
        let dayStreak = cur.currentDayStreak;
        if (!cur.lastWinDate) {
          dayStreak = 1;
        } else if (cur.lastWinDate !== today) {
          const prev = new Date(cur.lastWinDate + "T00:00:00");
          const diffMs = new Date(today + "T00:00:00").getTime() - prev.getTime();
          const diffDays = Math.round(diffMs / 86400000);
          dayStreak = diffDays === 1 ? cur.currentDayStreak + 1 : 1;
        }

        const next: StatsState = {
          ...cur,
          completedDailies: completed,
          monthlyTrophies: trophies,
          totalWins: cur.totalWins + 1,
          currentWinStreak: cur.currentWinStreak + 1,
          longestWinStreak: Math.max(
            cur.longestWinStreak,
            cur.currentWinStreak + 1,
          ),
          lastWinDate: today,
          currentDayStreak: dayStreak,
          longestDayStreak: Math.max(cur.longestDayStreak, dayStreak),
        };
        void persist(next);
        return next;
      });
    },
    [persist],
  );

  const breakStreak = useCallback(() => {
    setStats((cur) => {
      const next = { ...cur, currentWinStreak: 0 };
      void persist(next);
      return next;
    });
  }, [persist]);

  const reset = useCallback(() => {
    setStats(EMPTY);
    void persist(EMPTY);
  }, [persist]);

  return useMemo(
    () => ({
      stats,
      loaded,
      recordLevelWin,
      recordDailyWin,
      breakStreak,
      reset,
    }),
    [stats, loaded, recordLevelWin, recordDailyWin, breakStreak, reset],
  );
};

export const monthlyProgress = (
  completedDailies: string[],
  refDate: Date = new Date(),
) => {
  const monthKey = ym(refDate);
  const total = daysInMonth(refDate.getFullYear(), refDate.getMonth());
  const done = completedDailies.filter((d) => d.startsWith(monthKey)).length;
  return { done, total, monthKey };
};
