import React, { useEffect, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Glass } from "./Glass";
import { Icon } from "./Icon";
import { C, F, alpha } from "../theme";
import { keys, text } from "../net/input";

const CHIPS: [string, string][] = [
  ["Esc", "esc"], ["Tab", "tab"], ["Ctrl+C", "ctrl+c"], ["Ctrl+V", "ctrl+v"], ["Alt+Tab", "alt+tab"], ["Win", "win"], ["Enter", "enter"],
  ["←", "left"], ["↑", "up"], ["↓", "down"], ["→", "right"],
];

export function KeysBar({ color = C.cy }: { color?: string }) {
  const input = useRef<React.ComponentRef<typeof TextInput>>(null);
  useEffect(() => {
    const t = setTimeout(() => input.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  const press = (combo: string) => {
    Haptics.selectionAsync().catch(() => {});
    keys(combo);
  };

  return (
    <Glass radius={16} shadow={false} inner={{ paddingVertical: 6, paddingHorizontal: 6 }}>
      <TextInput
        ref={input}
        style={s.hidden}
        value=""
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
        autoComplete="off"
        keyboardAppearance="dark"
        submitBehavior="submit"
        returnKeyType="default"
        onChangeText={(v) => { if (v) text(v); }}
        onKeyPress={(e) => { if (e.nativeEvent.key === "Backspace") keys("backspace"); }}
        onSubmitEditing={() => keys("enter")}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" contentContainerStyle={{ gap: 6, alignItems: "center" }}>
        <Pressable onPress={() => input.current?.focus()} style={[s.chip, { borderColor: alpha(color, 0.45), backgroundColor: alpha(color, 0.12) }]} hitSlop={4}>
          <Icon name="kbd" size={14} color={color} />
        </Pressable>
        {CHIPS.map(([label, combo]) => (
          <Pressable key={combo} onPress={() => press(combo)} style={({ pressed }) => [s.chip, pressed && { backgroundColor: alpha(color, 0.18), borderColor: alpha(color, 0.45) }]} hitSlop={4}>
            <Text style={s.label}>{label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </Glass>
  );
}

const s = StyleSheet.create({
  hidden: { position: "absolute", left: 0, top: 0, width: 1, height: 1, opacity: 0 },
  chip: {
    height: 32, minWidth: 36, paddingHorizontal: 11, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center", justifyContent: "center",
  },
  label: { fontFamily: F.mono, fontSize: 12, color: C.tx },
});
