import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Glass } from "./Glass";
import { Icon, IconName } from "./Icon";
import { C, F, TABBAR_BOTTOM, TABBAR_H } from "../theme";
import { go } from "../nav/ref";
import { useAzuka } from "../store/useAzuka";

const ICONS: Record<string, IconName> = { Home: "home", Control: "desk", Play: "pad", Activity: "bell" };

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const needs = useAzuka((s) => s.needsYou().length);
  const azState = useAzuka((s) => s.state);
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glow]);
  const busy = azState !== "idle" && azState !== "offline";

  const tab = (route: { key: string; name: string }, index: number) => {
    const on = state.index === index;
    return (
      <Pressable
        key={route.key}
        onPress={() => {
          Haptics.selectionAsync();
          const ev = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!on && !ev.defaultPrevented) navigation.navigate(route.name);
        }}
        style={s.tab}
      >
        <Icon name={ICONS[route.name] ?? "home"} size={21} color={on ? C.cy : C.dim} />
        <Text style={[s.label, { color: on ? C.tx : C.dim }]}>{route.name}</Text>
        {on ? <View style={s.dotOn} /> : null}
        {route.name === "Activity" && needs > 0 ? (
          <View style={s.badge}><Text style={s.badgeText}>{needs}</Text></View>
        ) : null}
      </Pressable>
    );
  };

  const routes = state.routes;
  return (
    <View pointerEvents="box-none" style={[s.wrap, { bottom: insets.bottom + TABBAR_BOTTOM - (insets.bottom ? 12 : 0) }]}>
      <Glass radius={24} style={{ height: TABBAR_H }} inner={s.inner}>
        {routes.slice(0, 2).map((r, i) => tab(r, i))}
        <View style={{ width: 62 }} />
        {routes.slice(2).map((r, i) => tab(r, i + 2))}
      </Glass>
      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); go("Talk"); }}
        style={({ pressed }) => [s.orbWrap, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}
        accessibilityLabel="Talk to Azuka"
      >
        <Animated.View style={[s.orbGlow, { opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, busy ? 0.9 : 0.6] }), backgroundColor: busy ? C.cy : C.pu }]} />
        <LinearGradient colors={[C.puL, C.pu, C.pu2]} locations={[0, 0.45, 1]} start={{ x: 0.3, y: 0.2 }} end={{ x: 0.8, y: 1 }} style={s.orb}>
          <Icon name="mic" size={24} color={C.white} stroke={2.2} />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { position: "absolute", left: 14, right: 14, alignItems: "center" },
  inner: { flexDirection: "row", alignItems: "center", paddingHorizontal: 6 },
  tab: { flex: 1, height: "100%", alignItems: "center", justifyContent: "center", gap: 4 },
  label: { fontFamily: F.bodyM, fontSize: 10.5 },
  dotOn: { position: "absolute", bottom: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: C.cy, shadowColor: C.cy, shadowOpacity: 1, shadowRadius: 4 },
  badge: { position: "absolute", top: 8, right: 14, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, backgroundColor: C.am, alignItems: "center", justifyContent: "center" },
  badgeText: { fontFamily: F.bodyB, fontSize: 10, color: C.bg },
  orbWrap: { position: "absolute", top: -26, width: 62, height: 62, alignItems: "center", justifyContent: "center" },
  orbGlow: { position: "absolute", width: 62, height: 62, borderRadius: 31, shadowColor: C.pu, shadowOpacity: 0.9, shadowRadius: 16, shadowOffset: { width: 0, height: 10 } },
  orb: { width: 62, height: 62, borderRadius: 31, alignItems: "center", justifyContent: "center" },
});
