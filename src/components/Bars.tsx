import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

const HS = [0.4, 0.8, 0.55, 1, 0.65, 0.9, 0.45, 0.75, 0.5, 0.95, 0.6, 0.85, 0.4, 0.7, 1, 0.55];

type Props = { n: number; color: string; h?: number; w?: number; gap?: number; live?: boolean };

function Bar({ k, color, h, w, live }: { k: number; color: string; h: number; w: number; live: boolean }) {
  const v = useRef(new Animated.Value(HS[k % HS.length])).current;
  useEffect(() => {
    if (!live) { v.setValue(HS[k % HS.length]); return; }
    const lo = 0.25 + (k % 3) * 0.1;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: lo, duration: 420 + (k % 4) * 90, useNativeDriver: false }),
        Animated.timing(v, { toValue: HS[k % HS.length], duration: 420 + (k % 5) * 70, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [live, k, v]);
  return (
    <Animated.View style={{ width: w, borderRadius: 2, backgroundColor: color, height: Animated.multiply(v, h) as unknown as number }} />
  );
}

export function Bars({ n, color, h = 22, w = 3, gap = 3, live = false }: Props) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap, height: h }}>
      {Array.from({ length: n }, (_, k) => <Bar key={k} k={k} color={color} h={h} w={w} live={live} />)}
    </View>
  );
}
