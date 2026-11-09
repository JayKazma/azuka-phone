import React from "react";
import { Image, View } from "react-native";
import { Ring } from "./Ring";
import { C } from "../theme";

const face = require("../../assets/azuka-avatar.png");

type Props = { size?: number; ring?: boolean; pct?: number; color?: string };

export function Avatar({ size = 44, ring = true, pct = 75, color = C.cy }: Props) {
  const inner = ring ? size - 10 : size;
  const img = <Image source={face} style={{ width: inner, height: inner, borderRadius: inner / 2 }} />;
  if (!ring) return img;
  return (
    <Ring pct={pct} size={size} color={color} w={2.5}>
      <View style={{ shadowColor: color, shadowOpacity: 0.5, shadowRadius: 6 }}>{img}</View>
    </Ring>
  );
}
