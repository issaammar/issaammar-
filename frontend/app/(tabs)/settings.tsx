// Settings tab. Grouped lavender-card layout mirroring the reference 'Arrows'
// app: Language / Vibrations / Sounds / Dark mode / Native Refresh Rate, then
// Account Connection, then Remove Ads / Restore purchases, then Rate us /
// Write us, then Privacy / Terms of Service.

import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { hapticLight, playTap } from "@/src/game/audio";
import { useSettings } from "@/src/game/settings";
import { ColorPalette, fonts, radius, spacing, useColors } from "@/src/game/theme";

const ICONS = {
  language: "globe-outline",
  vibrations: "pulse",
  sounds: "volume-high",
  darkMode: "moon",
  refresh: "phone-portrait",
  account: "person",
  removeAds: "remove-circle",
  restore: "refresh",
  rate: "star",
  write: "create",
  privacy: "document-text",
  terms: "information-circle",
} as const;

const Row = ({
  c,
  icon,
  label,
  right,
  testID,
}: {
  c: ColorPalette;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  right: React.ReactNode;
  testID?: string;
}) => (
  <View style={settingsStyles.row} testID={testID}>
    <View style={settingsStyles.rowLeft}>
      <Ionicons name={icon} size={20} color={c.text} />
      <Text style={[settingsStyles.label, { color: c.text }]}>{label}</Text>
    </View>
    {right}
  </View>
);

export default function SettingsScreen() {
  const c = useColors();
  const { settings, toggle } = useSettings();
  const styles = useMemo(() => buildStyles(c), [c]);

  const SwitchRight = ({
    value,
    onChange,
    testID,
  }: {
    value: boolean;
    onChange: () => void;
    testID: string;
  }) => (
    <Switch
      testID={testID}
      value={value}
      onValueChange={() => {
        hapticLight();
        onChange();
      }}
      trackColor={{ false: c.toggleOff, true: c.blue }}
      thumbColor={c.white}
      ios_backgroundColor={c.toggleOff}
    />
  );

  const ChevronRight = ({ value }: { value: string }) => (
    <View style={settingsStyles.langValue}>
      <Text style={[settingsStyles.langText, { color: c.textSecondary }]}>
        {value}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
    </View>
  );

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: c.background }]} edges={["top"]}>
      <StatusBar style={settings.darkMode ? "light" : "dark"} />
      <View style={styles.headerBar}>
        <Text style={styles.title}>Settings</Text>
      </View>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        showsVerticalScrollIndicator={false}
      >
        {/* Group 1: device & theme */}
        <View style={styles.group}>
          <Row
            c={c}
            icon={ICONS.language}
            label="Language"
            right={<ChevronRight value="English" />}
            testID="setting-language-row"
          />
          <View style={styles.divider} />
          <Row
            c={c}
            icon={ICONS.vibrations}
            label="Vibrations"
            right={
              <SwitchRight
                value={settings.vibrations}
                onChange={() => toggle("vibrations")}
                testID="setting-vibrations"
              />
            }
            testID="setting-vibrations-row"
          />
          <View style={styles.divider} />
          <Row
            c={c}
            icon={ICONS.sounds}
            label="Sounds"
            right={
              <SwitchRight
                value={settings.sounds}
                onChange={() => toggle("sounds")}
                testID="setting-sounds"
              />
            }
            testID="setting-sounds-row"
          />
          <View style={styles.divider} />
          <Row
            c={c}
            icon={ICONS.darkMode}
            label="Dark mode"
            right={
              <SwitchRight
                value={settings.darkMode}
                onChange={() => toggle("darkMode")}
                testID="setting-dark-mode"
              />
            }
            testID="setting-dark-mode-row"
          />
          <View style={styles.divider} />
          <Row
            c={c}
            icon={ICONS.refresh}
            label="Native Refresh Rate"
            right={
              <SwitchRight
                value={settings.nativeRefreshRate}
                onChange={() => toggle("nativeRefreshRate")}
                testID="setting-refresh-rate"
              />
            }
            testID="setting-refresh-rate-row"
          />
        </View>

        {/* Group 2: account */}
        <View style={styles.group}>
          <Row
            c={c}
            icon={ICONS.account}
            label="Account Connection"
            right={
              <Switch
                value={false}
                disabled
                trackColor={{ false: c.toggleOff, true: c.blue }}
                thumbColor={c.white}
                testID="setting-account"
              />
            }
            testID="setting-account-row"
          />
        </View>

        {/* Group 3: purchases */}
        <View style={styles.group}>
          <Row
            c={c}
            icon={ICONS.removeAds}
            label="Remove Ads"
            right={
              <Switch
                value={false}
                disabled
                trackColor={{ false: c.toggleOff, true: c.blue }}
                thumbColor={c.white}
                testID="setting-remove-ads"
              />
            }
            testID="setting-remove-ads-row"
          />
          <View style={styles.divider} />
          <Pressable
            onPress={() => {
              playTap();
              hapticLight();
            }}
            testID="setting-restore-row"
          >
            <Row
              c={c}
              icon={ICONS.restore}
              label="Restore purchases"
              right={<View />}
            />
          </Pressable>
        </View>

        {/* Group 4: feedback */}
        <View style={styles.group}>
          <Pressable
            onPress={() => {
              playTap();
              hapticLight();
            }}
            testID="setting-rate-row"
          >
            <Row c={c} icon={ICONS.rate} label="Rate us" right={<View />} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            onPress={() => {
              playTap();
              hapticLight();
            }}
            testID="setting-write-row"
          >
            <Row c={c} icon={ICONS.write} label="Write us" right={<View />} />
          </Pressable>
        </View>

        {/* Group 5: legal */}
        <View style={styles.group}>
          <Pressable
            onPress={() => {
              playTap();
              hapticLight();
            }}
            testID="setting-privacy-row"
          >
            <Row c={c} icon={ICONS.privacy} label="Privacy" right={<View />} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            onPress={() => {
              playTap();
              hapticLight();
            }}
            testID="setting-terms-row"
          >
            <Row c={c} icon={ICONS.terms} label="Terms of Service" right={<View />} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const buildStyles = (c: ColorPalette) =>
  StyleSheet.create({
    headerBar: {
      alignItems: "center",
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    title: {
      fontFamily: fonts.display,
      fontWeight: "900",
      fontSize: 22,
      color: c.text,
      letterSpacing: 0.3,
    },
    group: {
      backgroundColor: c.backgroundSecondary,
      borderRadius: radius.lg,
      paddingVertical: 4,
      paddingHorizontal: spacing.md,
    },
    divider: {
      height: 1,
      backgroundColor: c.border,
      marginLeft: 32,
    },
  });

const settingsStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  label: {
    fontFamily: fonts.ui,
    fontSize: 16,
    fontWeight: "500",
  },
  langValue: { flexDirection: "row", alignItems: "center", gap: 4 },
  langText: { fontFamily: fonts.ui, fontSize: 14, fontWeight: "500" },
});
