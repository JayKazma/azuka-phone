import React from "react";
import { Pressable, View, StyleSheet, ViewStyle, StyleProp, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Icon, IconName } from "./Icon";
import { C, F, alpha } from "../theme";
import { Glass } from "./Glass";

type BtnProps = {
  label: string;
  icon?: IconName;
  onPress?: () => void;
  h?: number;
  colors?: [string, string];
  fg?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

export function Primary({ label, icon, onPress, h = 46, colors = [C.pu, C.pu2], fg = C.white, style, disabled }: BtnProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress?.(); }}
      style={({ pressed }) => [{ flex: 1, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }, style]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.primary, { minHeight: h, shadowColor: colors[0] }]}
      >
        {icon ? <Icon name={icon} size={17} color={fg} stroke={2.2} /> : null}
        <Text style={[s.label, { color: fg }]}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function Ghost({ label, icon, onPress, h = 46, style, disabled }: BtnProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => { Haptics.selectionAsync(); onPress?.(); }}
      style={({ pressed }) => [s.ghost, { minHeight: h, opacity: disabled ? 0.5 : pressed ? 0.7 : 1 }, style]}
    >
      {icon ? <Icon name={icon} size={17} color={C.mu} /> : null}
      <Text style={[s.ghostLabel]}>{label}</Text>
    </Pressable>
  );
}

type RoundProps = { icon: IconName; onPress?: () => void; badge?: number | string; size?: number; color?: string; style?: StyleProp<ViewStyle> };

export function RoundBtn({ icon, onPress, badge, size = 40, color = C.tx, style }: RoundProps) {
  return (
    <Pressable onPress={() => { Haptics.selectionAsync(); onPress?.(); }} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }, style]} hitSlop={6}>
      <Glass radius={size / 2} shadow={false} fill style={{ width: size, height: size }} inner={{ alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={size * 0.45} color={color} />
      </Glass>
      {badge ? (
        <View style={s.badge}>
          <Text style={s.badgeText}>{String(badge)}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

type ToggleProps = { label: string; icon: IconName; color: string; on?: boolean; onPress?: () => void };

export function ToggleBtn({ label, icon, color, on, onPress }: ToggleProps) {
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync(); onPress?.(); }}
      style={({ pressed }) => [
        s.toggle,
        on ? { borderColor: alpha(color, 0.47), backgroundColor: alpha(color, 0.12), shadowColor: color, shadowOpacity: 0.2, shadowRadius: 8 } : null,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Icon name={icon} size={15} color={on ? color : C.mu} />
      <Text style={[s.toggleLabel, { color: on ? color : C.tx, fontFamily: on ? F.bodyB : F.body }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  primary: {
    flex: 1, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    shadowOpacity: 0.33, shadowRadius: 11, shadowOffset: { width: 0, height: 8 },
  },
  label: { fontFamily: F.bodyB, fontSize: 15 },
  ghost: {
    flex: 1, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.04)",
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  ghostLabel: { fontFamily: F.body, fontSize: 15, color: C.tx },
  badge: {
    position: "absolute", top: -3, right: -3, minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9, backgroundColor: C.am,
    alignItems: "center", justifyContent: "center", shadowColor: C.am, shadowOpacity: 0.6, shadowRadius: 5, shadowOffset: { width: 0, height: 0 },
  },
  badgeText: { fontFamily: F.bodyB, fontSize: 11, color: C.bg },
  toggle: {
    flex: 1, height: 42, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)",
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
  },
  toggleLabel: { fontSize: 12.5 },
});
