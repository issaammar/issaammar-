// Simple progress store: which handcrafted levels the user has cleared.

import { useCallback, useEffect, useState } from "react";

import { storage } from "@/src/utils/storage";

const KEY = "arrow-maze:progress-v1";

type Progress = {
  completed: string[];        // level ids cleared at least once
  bestTimes: Record<string, number>;
  bestMoves: Record<string, number>;
};

const empty: Progress = { completed: [], bestTimes: {}, bestMoves: {} };

export const useProgress = () => {
  const [progress, setProgress] = useState<Progress>(empty);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const raw = await storage.getItem<string>(KEY, "");
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Progress;
          if (active) setProgress({ ...empty, ...parsed });
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

  const recordWin = useCallback(
    async (levelId: string, timeMs: number, moves: number) => {
      setProgress((cur) => {
        const next: Progress = {
          completed: cur.completed.includes(levelId)
            ? cur.completed
            : [...cur.completed, levelId],
          bestTimes: {
            ...cur.bestTimes,
            [levelId]:
              cur.bestTimes[levelId] === undefined
                ? timeMs
                : Math.min(cur.bestTimes[levelId], timeMs),
          },
          bestMoves: {
            ...cur.bestMoves,
            [levelId]:
              cur.bestMoves[levelId] === undefined
                ? moves
                : Math.min(cur.bestMoves[levelId], moves),
          },
        };
        void storage.setItem(KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  return { progress, loaded, recordWin };
};
