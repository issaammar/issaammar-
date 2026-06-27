// Arrow tile that renders a directional arrow icon and animates a slide-off.
// Uses react-native-reanimated for smooth 60fps motion.

import { Ionicons } from "@expo/vector-icons";
import React, { forwardRef, useImperativeHandle } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import type { Direction } from "@/src/game/levels";
import { colors, timing } from "@/src/game/theme";

const ROTATION: Record<Direction, string> = {
  up: "0deg",
  right: "90deg",
  down: "180deg",
  left: "270deg",
};

export type ArrowTileHandle = {
  slideOff: (
    dxCells: number,
    dyCells: number,
    cellSize: number,
    onDone: () => void,
  ) => void;
  shake: () => void;
};

export type ArrowTileProps = {
  testID?: string;
  direction: Direction;
  size: number;       // cell size (px)
  onPress: () => void;
  disabled?: boolean;
};

const ArrowTileInner = forwardRef<ArrowTileHandle, ArrowTileProps>(function ArrowTile(
  { direction, size, onPress, testID, disabled },
  ref,
) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useImperativeHandle(ref, () => ({
    slideOff: (dxCells, dyCells, cellSize, onDone) => {
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      cancelAnimation(opacity);
      const dx = dxCells * cellSize;
      const dy = dyCells * cellSize;
      translateX.value = withTiming(dx, {
        duration: timing.slide,
        easing: Easing.out(Easing.cubic),
      });
      translateY.value = withTiming(
        dy,
        { duration: timing.slide, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(onDone)();
        },
      );
      opacity.value = withTiming(0, {
        duration: timing.slide,
        easing: Easing.in(Easing.cubic),
      });
    },
    shake: () => {
      const amp = 6;
      translateX.value = withSequence(
        withTiming(-amp, { duration: 60 }),
        withTiming(amp, { duration: 60 }),
        withTiming(-amp / 2, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
    },
  }));

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { stiffness: 250, damping: 18 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { stiffness: 250, damping: 18 });
  };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { width: size, height: size },
        animStyle,
      ]}
    >
      <Pressable
        testID={testID}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={styles.pressable}
      >
        <View
          style={[
            styles.tile,
            { transform: [{ rotate: ROTATION[direction] }] },
          ]}
        >
          <Ionicons
            name="arrow-up"
            size={Math.round(size * 0.66)}
            color={colors.black}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
});

export const ArrowTile = React.memo(ArrowTileInner);

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  pressable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tile: {
    alignItems: "center",
    justifyContent: "center",
  },
});
