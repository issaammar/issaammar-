// Lightweight audio + haptics layer. Preloads short bundled WAV effects via
// expo-audio. Honours `sounds` and `vibrations` settings persisted in
// /src/game/settings.tsx (read via a module-level mirror that components
// keep in sync).

import * as Haptics from "expo-haptics";
import { useAudioPlayer, setAudioModeAsync, AudioPlayer } from "expo-audio";
import { useEffect, useMemo } from "react";
import { Platform } from "react-native";

let soundsEnabled = true;
let vibrationsEnabled = true;

export const setSoundsEnabled = (v: boolean) => {
  soundsEnabled = v;
};
export const setVibrationsEnabled = (v: boolean) => {
  vibrationsEnabled = v;
};

export const configureAudioSession = async () => {
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: false,
    });
  } catch (e) {
    console.warn("audio session config failed", e);
  }
};

const SOUND_ASSETS = {
  swoosh: require("../../assets/sounds/swoosh.wav"),
  victory: require("../../assets/sounds/victory.wav"),
  tap: require("../../assets/sounds/tap.wav"),
} as const;

export type SoundKey = keyof typeof SOUND_ASSETS;

export const useGameSounds = () => {
  const swoosh = useAudioPlayer(SOUND_ASSETS.swoosh);
  const victory = useAudioPlayer(SOUND_ASSETS.victory);
  const tap = useAudioPlayer(SOUND_ASSETS.tap);

  useEffect(() => {
    void configureAudioSession();
  }, []);

  const players = useMemo(
    () => ({ swoosh, victory, tap }),
    [swoosh, victory, tap],
  );

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
  if (!soundsEnabled || !p) return;
  try {
    p.seekTo(0);
    p.play();
  } catch (e) {
    console.warn("sound play failed", e);
  }
};

export const playSwoosh = () => playOne(globalPlayers?.swoosh);
export const playVictory = () => playOne(globalPlayers?.victory);
export const playTap = () => playOne(globalPlayers?.tap);

// Haptics — gated by vibrationsEnabled. No-op on web.
const isHapticPlatform = Platform.OS === "ios" || Platform.OS === "android";

export const hapticLight = () => {
  if (!vibrationsEnabled || !isHapticPlatform) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};
export const hapticMedium = () => {
  if (!vibrationsEnabled || !isHapticPlatform) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};
export const hapticHeavy = () => {
  if (!vibrationsEnabled || !isHapticPlatform) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
};
export const hapticSuccess = () => {
  if (!vibrationsEnabled || !isHapticPlatform) return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};
export const hapticError = () => {
  if (!vibrationsEnabled || !isHapticPlatform) return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};
