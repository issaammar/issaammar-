// Arrow tile: animated arrow that supports slide-off (exits the grid) and
// bounce (slides forward, hits a wall, returns).

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
import { timing } from "@/src/game/theme";

const ROTATION: Record<Direction, string> = {
  up: "0deg",
  right: "90deg",
  down: "180deg",
  left: "270deg",
};

const DIR_VEC: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

export type ArrowTileHandle = {
  slideOff: (cells: number, cellSize: number, onDone: () => void) => void;
  bounce: (cells: number, cellSize: number, onDone: () => void) => void;
};

export type ArrowTileProps = {
  testID?: string;
  direction: Direction;
  size: number;
  color: string;
  onPress: () => void;
  disabled?: boolean;
};

const ArrowTileInner = forwardRef<ArrowTileHandle, ArrowTileProps>(function ArrowTile(
  { direction, size, color, onPress, testID, disabled },
  ref,
) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useImperativeHandle(ref, () => ({
    slideOff: (cells, cellSize, onDone) => {
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      cancelAnimation(opacity);
      const { dx, dy } = DIR_VEC[direction];
      const tx = dx * cells * cellSize;
      const ty = dy * cells * cellSize;
      translateX.value = withTiming(tx, {
        duration: timing.slide,
        easing: Easing.out(Easing.cubic),
      });
      translateY.value = withTiming(
        ty,
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
    bounce: (cells, cellSize, onDone) => {
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      const { dx, dy } = DIR_VEC[direction];
      // slide forward by `cells` cells (clamped so we don't overlap the
      // blocker), then snap back. We forward 70% of the available distance
      // to leave a visible gap and emphasise the rebound.
      const forwardCells = Math.max(0.45, cells * 0.7);
      const fx = dx * forwardCells * cellSize;
      const fy = dy * forwardCells * cellSize;
      translateX.value = withSequence(
        withTiming(fx, {
          duration: timing.bounce * 0.55,
          easing: Easing.out(Easing.cubic),
        }),
        withTiming(0, {
          duration: timing.bounce * 0.7,
          easing: Easing.inOut(Easing.cubic),
        }),
      );
      translateY.value = withSequence(
        withTiming(fy, {
          duration: timing.bounce * 0.55,
          easing: Easing.out(Easing.cubic),
        }),
        withTiming(
          0,
          {
            duration: timing.bounce * 0.7,
            easing: Easing.inOut(Easing.cubic),
          },
          (finished) => {
            if (finished) runOnJS(onDone)();
          },
        ),
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
      style={[styles.wrapper, { width: size, height: size }, animStyle]}
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
          <Ionicons name="arrow-up" size={Math.round(size * 0.66)} color={color} />
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
