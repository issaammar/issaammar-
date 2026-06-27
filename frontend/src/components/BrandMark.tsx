// "Arrows" wordmark — uppercase 'A' is replaced by a solid up-pointing
// triangle (matching the reference 'Arrows' app), followed by the rest of
// the lowercase letters in a heavy display font.

import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { fonts, useColors } from "@/src/game/theme";

export const BrandMark = ({
  size = 36,
  testID = "brand-mark",
}: {
  size?: number;
  testID?: string;
}) => {
  const c = useColors();
  const triangleSize = size * 0.82;
  return (
    <View style={styles.row} testID={testID}>
      <View
        style={[
          styles.triangle,
          {
            borderLeftWidth: triangleSize / 2,
            borderRightWidth: triangleSize / 2,
            borderBottomWidth: triangleSize * 0.88,
            borderBottomColor: c.text,
          },
        ]}
      />
      <Text
        style={[
          styles.tail,
          {
            fontSize: size,
            color: c.text,
            marginLeft: -size * 0.05,
            lineHeight: size * 1.05,
          },
        ]}
      >
        rrows
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  triangle: {
    width: 0,
    height: 0,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderStyle: "solid",
  },
  tail: {
    fontFamily: fonts.display,
    fontWeight: "900",
    letterSpacing: -1,
  },
});
