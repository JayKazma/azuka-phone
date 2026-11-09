import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAzuka } from "../store/useAzuka";
import { Glass } from "./Glass";
import { C, F } from "../theme";

export function Toast() {
  const toast = useAzuka((s) => s.toast);
  const insets = useSafeAreaInsets();
  const y = useRef(new Animated.Value(-80)).current;
  useEffect(() => {
    Animated.spring(y, { toValue: toast ? 0 : -80, useNativeDriver: true, damping: 18, stiffness: 180 }).start();
  }, [toast, y]);
  return (
    <Animated.View pointerEvents="none" style={[s.wrap, { top: insets.top + 8, transform: [{ translateY: y }] }]}>
      <Glass radius={16} accent={toast?.tone === "bad" ? C.rd : toast?.tone === "good" ? C.gr : undefined} inner={s.inner}>
        <Text style={s.text}>{toast?.text ?? ""}</Text>
      </Glass>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { position: "absolute", left: 24, right: 24, zIndex: 50, alignItems: "center" },
  inner: { paddingHorizontal: 16, paddingVertical: 11 },
  text: { fontFamily: F.bodyM, fontSize: 14, color: C.tx, textAlign: "center" },
});
