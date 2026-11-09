import React from "react";
import { Pressable, View, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { Glass } from "./Glass";
import { Icon } from "./Icon";
import { Dot } from "./Chip";
import { C, F } from "../theme";
import type { LinkState } from "../net/protocol";

type Props = { name: string; link: LinkState; onPress?: () => void };

export const LINK_LABEL: Record<LinkState, string> = {
  linked: "Linked",
  connecting: "Connecting",
  reconnecting: "Reconnecting",
  offline: "Offline",
  pairing: "Pairing",
};

export const LINK_COLOR: Record<LinkState, string> = {
  linked: C.gr,
  connecting: C.am,
  reconnecting: C.am,
  offline: C.rd,
  pairing: C.cy,
};

export function DevicePill({ name, link, onPress }: Props) {
  const color = LINK_COLOR[link];
  return (
    <Pressable onPress={() => { Haptics.selectionAsync(); onPress?.(); }} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
      <Glass radius={999} shadow={false} fill style={{ height: 38 }} inner={{ flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 7, paddingRight: 12 }}>
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(95,211,154,0.14)", alignItems: "center", justifyContent: "center" }}>
          <Dot color={color} />
        </View>
        <Text style={{ fontFamily: F.bodyB, fontSize: 13.5, color: C.tx }} numberOfLines={1}>{name}</Text>
        <Text style={{ fontFamily: F.body, fontSize: 13.5, color: C.mu }}>{LINK_LABEL[link]}</Text>
        <Icon name="down2" size={14} color={C.mu} />
      </Glass>
    </Pressable>
  );
}
