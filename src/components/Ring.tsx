import React from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";

type Props = { pct: number; size: number; color: string; w?: number; children?: React.ReactNode };

export function Ring({ pct, size, color, w = 5, children }: Props) {
  const c = size / 2;
  const r = c - w;
  const circ = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pct));
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={w} />
        <Circle
          cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round"
          strokeDasharray={`${(circ * p) / 100} ${circ}`} transform={`rotate(-90 ${c} ${c})`}
        />
      </Svg>
      {children}
    </View>
  );
}
