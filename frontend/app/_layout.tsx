import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  setSoundsEnabled,
  setVibrationsEnabled,
  useGameSounds,
} from "@/src/game/audio";
import { SettingsProvider, useSettings } from "@/src/game/settings";
import { useColors } from "@/src/game/theme";
import { useIconFonts } from "@/src/hooks/use-icon-fonts";

LogBox.ignoreAllLogs(true);

SplashScreen.preventAutoHideAsync();

const ThemedShell = () => {
  const c = useColors();
  const { settings } = useSettings();

  useEffect(() => {
    setSoundsEnabled(settings.sounds);
  }, [settings.sounds]);
  useEffect(() => {
    setVibrationsEnabled(settings.vibrations);
  }, [settings.vibrations]);

  useGameSounds();

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.background },
          animation: "fade",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="game/[id]" options={{ animation: "slide_from_right" }} />
      </Stack>
    </View>
  );
};

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <ThemedShell />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
