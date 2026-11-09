import React from "react";
import { View, Text, ViewStyle, StyleProp } from "react-native";
import { Icon, IconName } from "./Icon";
import { C, F } from "../theme";

type Props = { text: string; fg?: string; bg?: string; border?: string; icon?: IconName; dot?: string; h?: number; style?: StyleProp<ViewStyle>; bold?: boolean };

export function Chip({ text, fg = C.tx, bg = "rgba(9,8,13,0.75)", border, icon, dot, h = 24, style, bold }: Props) {
  return (
    <View
      style={[
        { height: h, paddingHorizontal: 9, borderRadius: 999, backgroundColor: bg, flexDirection: "row", alignItems: "center", gap: 6 },
        border ? { borderWidth: 1, borderColor: border } : null,
        style,
      ]}
    >
      {dot ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dot, shadowColor: dot, shadowOpacity: 0.9, shadowRadius: 4 }} /> : null}
      {icon ? <Icon name={icon} size={11} color={fg} /> : null}
      <Text style={{ fontFamily: bold ? F.monoB : F.mono, fontSize: 10.5, color: fg }}>{text}</Text>
    </View>
  );
}

export function Dot({ color, size = 7, glow = true }: { color: string; size?: number; glow?: boolean }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size, backgroundColor: color, shadowColor: color, shadowOpacity: glow ? 0.9 : 0, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } }} />
  );
}
