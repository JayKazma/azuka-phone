import React from "react";
import { View } from "react-native";
import { Icon, IconName } from "./Icon";
import { alpha } from "../theme";

type Props = { icon: IconName; color: string; size?: number; isz?: number };

export function GlowIcon({ icon, color, size = 38, isz = 18 }: Props) {
  return (
    <View
      style={{
        width: size, height: size, borderRadius: Math.round(size * 0.32), alignItems: "center", justifyContent: "center",
        backgroundColor: alpha(color, 0.16), borderWidth: 1, borderColor: alpha(color, 0.33),
        shadowColor: color, shadowOpacity: 0.3, shadowRadius: 9, shadowOffset: { width: 0, height: 0 },
      }}
    >
      <View style={{ position: "absolute", left: size * 0.15, top: size * 0.1, width: size * 0.45, height: size * 0.45, borderRadius: size, backgroundColor: alpha(color, 0.22) }} />
      <Icon name={icon} size={isz} color={color} />
    </View>
  );
}
