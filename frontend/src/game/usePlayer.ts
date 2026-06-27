// Local player identity. We auto-create an anonymous player on first launch
// (so leaderboards work offline-first) and let users edit the display name.

import { useCallback, useEffect, useState } from "react";

import { api, Player } from "@/src/game/api";
import { storage } from "@/src/utils/storage";

const PLAYER_KEY = "arrow-maze:player";

type Stored = { id: string; name: string };

const randomName = () => {
  const adj = [
    "Swift", "Quiet", "Bold", "Clever", "Crisp", "Bright", "Sharp", "Steady",
    "Lucky", "Sly", "Mellow", "Keen", "Pure", "Rapid", "Calm",
  ];
  const noun = [
    "Arrow", "Hawk", "Lynx", "Falcon", "Comet", "Bolt", "Tiger", "Echo",
    "Drift", "Maze", "Spark", "Glide", "Pulse", "Vector", "Ridge",
  ];
  return `${adj[Math.floor(Math.random() * adj.length)]}${noun[Math.floor(Math.random() * noun.length)]}${Math.floor(Math.random() * 99)}`;
};

export const usePlayer = () => {
  const [player, setPlayer] = useState<Stored | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const init = async () => {
      const stored = await storage.getItem<string>(PLAYER_KEY, "");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Stored;
          if (parsed?.id && parsed?.name) {
            if (active) {
              setPlayer(parsed);
              setLoading(false);
            }
            return;
          }
        } catch {
          /* fall through */
        }
      }
      // create new
      try {
        const p: Player = await api.createOrGetPlayer(randomName());
        const next = { id: p.id, name: p.name };
        await storage.setItem(PLAYER_KEY, JSON.stringify(next));
        if (active) setPlayer(next);
      } catch (e) {
        console.warn("create player failed", e);
        // fallback offline identity
        const offline = { id: `local-${Math.random().toString(36).slice(2, 10)}`, name: randomName() };
        await storage.setItem(PLAYER_KEY, JSON.stringify(offline));
        if (active) setPlayer(offline);
      } finally {
        if (active) setLoading(false);
      }
    };
    void init();
    return () => {
      active = false;
    };
  }, []);

  const rename = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const p = await api.createOrGetPlayer(trimmed);
      const next = { id: p.id, name: p.name };
      await storage.setItem(PLAYER_KEY, JSON.stringify(next));
      setPlayer(next);
    } catch (e) {
      console.warn("rename failed", e);
    }
  }, []);

  return { player, loading, rename };
};
