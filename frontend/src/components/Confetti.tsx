// Confetti overlay used in the victory screen.
// 60-80 small particles fall from above with varied velocities and rotations.

import React, { useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { colors } from "@/src/game/theme";

const PARTICLE_COUNT = 70;
const FALL_DURATION = 3200;

type Particle = {
  key: number;
  left: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  shape: "square" | "rect";
  startRotation: number;
  rotationSpeed: number;
  horizontalDrift: number;
};

const buildParticles = (width: number, height: number): Particle[] => {
  const out: Particle[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const isBlue = Math.random() < 0.5;
    out.push({
      key: i,
      left: Math.random() * width,
      size: 6 + Math.random() * 8,
      color: isBlue ? colors.blue : colors.white,
      delay: Math.random() * 1200,
      duration: FALL_DURATION + Math.random() * 1400 - 700,
      shape: Math.random() < 0.5 ? "square" : "rect",
      startRotation: Math.random() * 360,
      rotationSpeed: 220 + Math.random() * 400,
      horizontalDrift: (Math.random() - 0.5) * 60,
    });
  }
  return out;
};

const ConfettiPiece = ({
  p,
  height,
}: {
  p: Particle;
  height: number;
}) => {
  const fall = useSharedValue(-30);
  const rotate = useSharedValue(p.startRotation);
  const drift = useSharedValue(0);

  React.useEffect(() => {
    fall.value = withDelay(
      p.delay,
      withRepeat(
        withSequence(
          withTiming(height + 40, {
            duration: p.duration,
            easing: Easing.in(Easing.quad),
          }),
          withTiming(-30, { duration: 0 }),
        ),
        -1,
      ),
    );
    rotate.value = withRepeat(
      withTiming(p.startRotation + p.rotationSpeed, {
        duration: p.duration,
        easing: Easing.linear,
      }),
      -1,
    );
    drift.value = withRepeat(
      withSequence(
        withTiming(p.horizontalDrift, {
          duration: p.duration / 2,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(-p.horizontalDrift, {
          duration: p.duration / 2,
          easing: Easing.inOut(Easing.sin),
        }),
      ),
      -1,
    );
  }, [drift, fall, height, p, rotate]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: fall.value },
      { translateX: drift.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const shapeStyle =
    p.shape === "rect"
      ? { width: p.size, height: p.size * 0.45 }
      : { width: p.size, height: p.size };

  return (
    <Animated.View
      style={[
        styles.piece,
        animStyle,
        { left: p.left, backgroundColor: p.color, borderColor: colors.blueSoft },
        shapeStyle,
      ]}
    />
  );
};

export const Confetti = React.memo(function Confetti({
  active,
}: {
  active: boolean;
}) {
  const { width, height } = Dimensions.get("window");
  const particles = useMemo(
    () => buildParticles(width, height),
    [width, height],
  );

  if (!active) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((p) => (
        <ConfettiPiece key={p.key} p={p} height={height} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  piece: {
    position: "absolute",
    top: 0,
    borderWidth: 0.5,
  },
});
