// Settings screen: list of toggles for Language, Vibrations, Sounds, Dark
// Mode, and Native Refresh Rate.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { hapticLight, playTap } from "@/src/game/audio";
import { useSettings } from "@/src/game/settings";
import { ColorPalette, fonts, spacing, useColors } from "@/src/game/theme";

const Row = ({
  c,
  icon,
  label,
  value,
  onChange,
  testID,
}: {
  c: ColorPalette;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  testID: string;
}) => (
  <View
    style={[settingsStyles.row, { borderBottomColor: c.border }]}
    testID={`${testID}-row`}
  >
    <View style={settingsStyles.rowLeft}>
      <View
        style={[
          settingsStyles.iconWrap,
          { backgroundColor: c.backgroundSecondary, borderColor: c.border },
        ]}
      >
        <Ionicons name={icon} size={18} color={c.text} />
      </View>
      <Text style={[settingsStyles.label, { color: c.text }]}>{label}</Text>
    </View>
    <Switch
      testID={testID}
      value={value}
      onValueChange={(v) => {
        hapticLight();
        onChange(v);
      }}
      trackColor={{ false: c.border, true: c.blue }}
      thumbColor={c.white}
    />
  </View>
);

const LanguageRow = ({
  c,
  language,
}: {
  c: ColorPalette;
  language: string;
}) => (
  <View
    style={[settingsStyles.row, { borderBottomColor: c.border }]}
    testID="setting-language-row"
  >
    <View style={settingsStyles.rowLeft}>
      <View
        style={[
          settingsStyles.iconWrap,
          { backgroundColor: c.backgroundSecondary, borderColor: c.border },
        ]}
      >
        <Ionicons name="globe-outline" size={18} color={c.text} />
      </View>
      <Text style={[settingsStyles.label, { color: c.text }]}>Language</Text>
    </View>
    <View style={settingsStyles.langValue}>
      <Text style={[settingsStyles.langText, { color: c.textSecondary }]}>
        {language === "en" ? "English" : language}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
    </View>
  </View>
);

export default function SettingsScreen() {
  const router = useRouter();
  const c = useColors();
  const { settings, toggle } = useSettings();

  const styles = useMemo(() => buildHeaderStyles(c), [c]);

  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: c.background }]}
      edges={["top", "bottom"]}
    >
      <StatusBar style={settings.darkMode ? "light" : "dark"} />
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            playTap();
            router.back();
          }}
          style={styles.iconBtn}
          testID="settings-back-button"
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={26} color={c.text} />
        </Pressable>
        <Text style={[styles.title, { color: c.text }]}>Settings</Text>
        <View style={{ width: 30 }} />
      </View>
      <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg }}
          showsVerticalScrollIndicator={false}
        >
          <LanguageRow c={c} language={settings.language} />
          <Row
            c={c}
            icon="phone-portrait-outline"
            label="Vibrations"
            value={settings.vibrations}
            onChange={() => toggle("vibrations")}
            testID="setting-vibrations"
          />
          <Row
            c={c}
            icon="volume-high-outline"
            label="Sounds"
            value={settings.sounds}
            onChange={() => toggle("sounds")}
            testID="setting-sounds"
          />
          <Row
            c={c}
            icon="moon-outline"
            label="Dark Mode"
            value={settings.darkMode}
            onChange={() => toggle("darkMode")}
            testID="setting-dark-mode"
          />
          <Row
            c={c}
            icon="speedometer-outline"
            label="Native Refresh Rate"
            value={settings.nativeRefreshRate}
            onChange={() => toggle("nativeRefreshRate")}
            testID="setting-refresh-rate"
          />

          <Text style={[styles.footnote, { color: c.textMuted }]}>
            Settings sync locally to this device.
          </Text>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const buildHeaderStyles = (_c: ColorPalette) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    iconBtn: { padding: 4, width: 30, alignItems: "center" },
    title: {
      fontFamily: fonts.display,
      fontWeight: "900",
      fontSize: 20,
      letterSpacing: 1,
    },
    footnote: {
      fontFamily: fonts.ui,
      fontSize: 12,
      textAlign: "center",
      marginTop: spacing.xl,
    },
  });

const settingsStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: fonts.ui,
    fontSize: 16,
    fontWeight: "500",
  },
  langValue: { flexDirection: "row", alignItems: "center", gap: 6 },
  langText: { fontFamily: fonts.ui, fontSize: 14 },
});
