// Lightweight audio manager around expo-audio.
// Preloads our short bundled WAV effects once, then exposes simple play()s.
// Honours a global mute toggle persisted via the storage helper.

import { useAudioPlayer, setAudioModeAsync, AudioPlayer } from "expo-audio";
import { useEffect, useMemo } from "react";

import { storage } from "@/src/utils/storage";

const STORAGE_KEY = "arrow-maze:sound-enabled";

let soundEnabled = true;

export const loadSoundPreference = async () => {
  const v = await storage.getItem<boolean>(STORAGE_KEY, true);
  soundEnabled = v ?? true;
  return soundEnabled;
};

export const getSoundEnabled = () => soundEnabled;

export const setSoundEnabled = async (enabled: boolean) => {
  soundEnabled = enabled;
  await storage.setItem(STORAGE_KEY, enabled);
};

export const configureAudioSession = async () => {
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: false,
    });
  } catch (e) {
    // session config is best-effort; on web this can no-op
    console.warn("audio session config failed", e);
  }
};

// Sound assets (require() so Metro bundles them).
const SOUND_ASSETS = {
  swoosh: require("../../assets/sounds/swoosh.wav"),
  victory: require("../../assets/sounds/victory.wav"),
  tap: require("../../assets/sounds/tap.wav"),
} as const;

export type SoundKey = keyof typeof SOUND_ASSETS;

// Hook that hosts the three players. Keep this mounted high in the tree
// (e.g. root layout) so players persist across screens.
export const useGameSounds = () => {
  const swoosh = useAudioPlayer(SOUND_ASSETS.swoosh);
  const victory = useAudioPlayer(SOUND_ASSETS.victory);
  const tap = useAudioPlayer(SOUND_ASSETS.tap);

  useEffect(() => {
    void configureAudioSession();
    void loadSoundPreference();
  }, []);

  const players = useMemo(
    () => ({ swoosh, victory, tap }),
    [swoosh, victory, tap],
  );

  // expose globally so non-hook code can trigger sounds
  useEffect(() => {
    globalPlayers = players;
    return () => {
      if (globalPlayers === players) globalPlayers = null;
    };
  }, [players]);

  return players;
};

let globalPlayers: { swoosh: AudioPlayer; victory: AudioPlayer; tap: AudioPlayer } | null = null;

const playOne = (p: AudioPlayer | undefined) => {
  if (!soundEnabled || !p) return;
  try {
    p.seekTo(0);
    p.play();
  } catch (e) {
    // swallow — sound failures should never crash gameplay
    console.warn("sound play failed", e);
  }
};

export const playSwoosh = () => playOne(globalPlayers?.swoosh);
export const playVictory = () => playOne(globalPlayers?.victory);
export const playTap = () => playOne(globalPlayers?.tap);
