import React from "react";
import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Glass } from "./Glass";
import { C, F } from "../theme";

type Props = { items: string[]; value: number; onChange: (i: number) => void; colors?: [string, string] };

export function Segments({ items, value, onChange, colors = [C.pu, C.pu2] }: Props) {
  return (
    <Glass radius={16} shadow={false} inner={{ flexDirection: "row", gap: 4, padding: 4 }}>
      {items.map((label, i) => {
        const on = i === value;
        const Inner = (
          <Text style={{ fontFamily: on ? F.bodyB : F.body, fontSize: 13, color: on ? C.tx : C.mu }}>{label}</Text>
        );
        return (
          <Pressable key={label} onPress={() => { Haptics.selectionAsync(); onChange(i); }} style={{ flex: 1 }}>
            {on ? (
              <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" }}>
                {Inner}
              </LinearGradient>
            ) : (
              <View style={{ height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" }}>{Inner}</View>
            )}
          </Pressable>
        );
      })}
    </Glass>
  );
}
