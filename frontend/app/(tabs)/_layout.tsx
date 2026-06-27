// Tabs layout matching the reference 'Arrows' app: Home / Challenge /
// Collection / Settings, with the selected tab highlighted by a lavender
// pill behind the icon.

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { hapticLight, playTap } from "@/src/game/audio";
import { useSettings } from "@/src/game/settings";
import { fonts, useColors } from "@/src/game/theme";
import { monthlyProgress, useStats } from "@/src/game/useStats";

const TAB_ICON_SIZE = 22;

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const TabIcon = ({
  name,
  focused,
  dot,
}: {
  name: IconName;
  focused: boolean;
  dot?: boolean;
}) => {
  const c = useColors();
  return (
    <View style={[styles.iconWrap, focused && { backgroundColor: c.surfaceStrong }]}>
      <Ionicons name={name} size={TAB_ICON_SIZE} color={c.text} />
      {dot ? <View style={[styles.dot, { backgroundColor: c.danger }]} /> : null}
    </View>
  );
};

const TabLabel = ({ label, focused }: { label: string; focused: boolean }) => {
  const c = useColors();
  return (
    <Text
      style={[
        styles.label,
        { color: c.text, opacity: focused ? 1 : 0.7 },
      ]}
    >
      {label}
    </Text>
  );
};

export default function TabsLayout() {
  const c = useColors();
  const { settings } = useSettings();
  const { stats } = useStats();
  const monthly = monthlyProgress(stats.completedDailies);
  const challengeUnseen = monthly.done < monthly.total;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: c.background,
          borderTopWidth: 0,
          elevation: 0,
          height: 78,
          paddingTop: 6,
          paddingBottom: 12,
        },
        tabBarItemStyle: { gap: 4 },
        sceneStyle: { backgroundColor: c.background },
      }}
      screenListeners={{
        tabPress: () => {
          playTap();
          hapticLight();
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Home" focused={focused} />,
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="challenge"
        options={{
          tabBarLabel: ({ focused }) => (
            <TabLabel label="Challenge" focused={focused} />
          ),
          tabBarIcon: ({ focused }) => (
            <TabIcon name="calendar" focused={focused} dot={challengeUnseen} />
          ),
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          tabBarLabel: ({ focused }) => (
            <TabLabel label="Collection" focused={focused} />
          ),
          tabBarIcon: ({ focused }) => <TabIcon name="star" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarLabel: ({ focused }) => (
            <TabLabel label="Settings" focused={focused} />
          ),
          tabBarIcon: ({ focused }) => (
            <TabIcon name="settings-sharp" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 64,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    top: 1,
    right: 18,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontFamily: fonts.ui,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
});
