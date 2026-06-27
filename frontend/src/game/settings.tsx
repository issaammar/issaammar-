// App-wide settings store + provider.
// Settings are persisted to AsyncStorage via the storage helper and exposed
// through React context so any screen can read or update them.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { storage } from "@/src/utils/storage";

export type Settings = {
  darkMode: boolean;
  vibrations: boolean;
  sounds: boolean;
  language: "en";
  nativeRefreshRate: boolean;
};

const DEFAULTS: Settings = {
  darkMode: false,
  vibrations: true,
  sounds: true,
  language: "en",
  nativeRefreshRate: true,
};

const KEY = "arrow-maze:settings-v1";

type Ctx = {
  settings: Settings;
  loaded: boolean;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  toggle: (key: keyof Omit<Settings, "language">) => void;
};

const SettingsContext = createContext<Ctx | null>(null);

export const SettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const raw = await storage.getItem<string>(KEY, "");
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<Settings>;
          if (active) setSettings({ ...DEFAULTS, ...parsed });
        } catch {
          /* ignore corrupt blob */
        }
      }
      if (active) setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback(async (next: Settings) => {
    await storage.setItem(KEY, JSON.stringify(next));
  }, []);

  const update = useCallback<Ctx["update"]>(
    (key, value) => {
      setSettings((cur) => {
        const next = { ...cur, [key]: value };
        void persist(next);
        return next;
      });
    },
    [persist],
  );

  const toggle = useCallback<Ctx["toggle"]>(
    (key) => {
      setSettings((cur) => {
        const next = { ...cur, [key]: !cur[key] } as Settings;
        void persist(next);
        return next;
      });
    },
    [persist],
  );

  const value = useMemo<Ctx>(
    () => ({ settings, loaded, update, toggle }),
    [settings, loaded, update, toggle],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): Ctx => {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used inside <SettingsProvider>");
  }
  return ctx;
};
