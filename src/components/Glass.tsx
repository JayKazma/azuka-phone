import React from "react";
import { View, ViewStyle, StyleSheet, StyleProp } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { GLASS_EDGE, GLASS_FILL } from "../theme";

type Props = {
  radius?: number;
  accent?: string;
  glow?: string;
  shadow?: boolean;
  fill?: boolean;
  style?: StyleProp<ViewStyle>;
  inner?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

export function Glass({ radius = 22, accent, glow, shadow = true, fill = false, style, inner, children }: Props) {
  const edge: [string, string, string] = accent ? [accent, GLASS_EDGE[1], GLASS_EDGE[2]] : GLASS_EDGE;
  return (
    <LinearGradient
      colors={edge}
      locations={[0, 0.45, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.7, y: 1 }}
      style={[
        { borderRadius: radius, padding: 1 },
        shadow && s.shadow,
        glow ? { shadowColor: glow, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 0 } } : null,
        style,
      ]}
    >
      <View style={[{ borderRadius: radius - 1, overflow: "hidden" }, fill && { flex: 1 }, inner]}>
        <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} />
        <LinearGradient colors={GLASS_FILL} style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={s.topLine} />
        {children}
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  shadow: { shadowColor: "#000", shadowOpacity: 0.42, shadowRadius: 17, shadowOffset: { width: 0, height: 14 } },
  topLine: { position: "absolute", left: 0, right: 0, top: 0, height: 1, backgroundColor: "rgba(255,255,255,0.06)" },
});
