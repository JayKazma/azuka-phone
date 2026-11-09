import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Glass } from "./Glass";
import { Eyebrow, Mono, Body } from "./Text";
import { Icon } from "./Icon";
import { C, alpha } from "../theme";
import { useAzuka, type Step } from "../store/useAzuka";

const COLOR: Record<Step["state"], string> = { done: C.gr, running: C.am, wait: C.am, failed: C.rd, next: C.dim };

function Blink() {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 0.25, duration: 600, useNativeDriver: true }),
      Animated.timing(v, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [v]);
  return <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.bg, opacity: v }} />;
}

function Row({ s, last }: { s: Step; last: boolean }) {
  const c = COLOR[s.state];
  const lit = s.state !== "next";
  return (
    <View style={{ flexDirection: "row", gap: 10, paddingVertical: 4 }}>
      <View style={{ width: 22, alignItems: "center" }}>
        <View
          style={{
            width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center",
            backgroundColor: lit ? c : "transparent", borderWidth: lit ? 0 : 1.5, borderColor: C.line2, borderStyle: lit ? "solid" : "dashed",
            shadowColor: c, shadowOpacity: lit ? 0.55 : 0, shadowRadius: 6,
          }}
        >
          {s.state === "done" ? <Icon name="check" size={11} color={C.bg} stroke={3} /> : null}
          {s.state === "failed" ? <Icon name="x" size={11} color={C.bg} stroke={3} /> : null}
          {s.state === "running" || s.state === "wait" ? <Blink /> : null}
        </View>
        {!last ? <LinearGradient colors={[c, C.line2]} style={{ width: 2, flex: 1, marginTop: 2, minHeight: 10 }} /> : null}
      </View>
      <View style={{ flex: 1, gap: 1, paddingBottom: last ? 0 : 6 }}>
        <Body size={13.5} color={lit ? C.tx : C.mu}>{s.title}</Body>
        {s.detail ? <Mono size={10.5}>{s.detail}</Mono> : null}
      </View>
    </View>
  );
}

export function StepRail() {
  const steps = useAzuka((s) => s.steps);
  if (!steps.length) return null;
  const done = steps.filter((s) => s.state === "done").length;
  const pct = Math.round((done / steps.length) * 100);
  return (
    <Glass radius={18} shadow={false} inner={{ paddingHorizontal: 14, paddingVertical: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 6 }}>
        <Eyebrow color={C.dim}>Steps</Eyebrow>
        <View style={{ width: 120, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <LinearGradient colors={[C.gr, C.am]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${pct}%`, height: "100%" }} />
        </View>
      </View>
      {steps.map((s, i) => <Row key={s.id} s={s} last={i === steps.length - 1} />)}
    </Glass>
  );
}

export function stepCount(steps: Step[]) {
  const done = steps.filter((s) => s.state === "done").length;
  return `${Math.min(steps.length, done + 1)} of ${steps.length}`;
}

export const stepAccent = (c: string) => alpha(c, 0.9);
