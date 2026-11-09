import React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Svg, { Defs, RadialGradient, Stop, Rect, Pattern, Path, Mask, LinearGradient } from "react-native-svg";
import { C } from "../theme";

type Props = { hue?: string; hue2?: string };

export function Backdrop({ hue = C.pu, hue2 = C.cy }: Props) {
  const { width, height } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: C.bg }]}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id="g1" cx={width * 0.9} cy={-height * 0.08} rx={width * 0.6} ry={height * 0.4} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={hue} stopOpacity={0.33} />
            <Stop offset="1" stopColor={hue} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="g2" cx={-width * 0.15} cy={height * 1.08} rx={width * 0.5} ry={height * 0.35} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={hue2} stopOpacity={0.18} />
            <Stop offset="1" stopColor={hue2} stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0.1" stopColor="#fff" stopOpacity={1} />
            <Stop offset="0.6" stopColor="#fff" stopOpacity={0} />
          </LinearGradient>
          <Mask id="m">
            <Rect width={width} height={height} fill="url(#fade)" />
          </Mask>
          <Pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <Path d="M28 0H0V28" fill="none" stroke={hue} strokeOpacity={0.09} strokeWidth={1} />
          </Pattern>
        </Defs>
        <Rect width={width} height={height} fill="url(#g1)" />
        <Rect width={width} height={height} fill="url(#g2)" />
        <Rect width={width} height={height} fill="url(#grid)" mask="url(#m)" />
      </Svg>
    </View>
  );
}
