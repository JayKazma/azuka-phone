import React, { useEffect, useRef } from "react";
import { Animated, Image, Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop, Rect, Path } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { Screen } from "../components/Screen";
import { Glass } from "../components/Glass";
import { DevicePill } from "../components/DevicePill";
import { RoundBtn } from "../components/Buttons";
import { Eyebrow, H1, Body, Head, Mono } from "../components/Text";
import { Chip, Dot } from "../components/Chip";
import { GlowIcon } from "../components/GlowIcon";
import { Ring } from "../components/Ring";
import { Bars } from "../components/Bars";
import { SuggestCard } from "../components/SuggestCard";
import { PermissionStack } from "../components/PermissionCard";
import type { IconName } from "../components/Icon";
import { C, R, alpha } from "../theme";
import { useAzuka } from "../store/useAzuka";
import { go } from "../nav/ref";
import { OWNER } from "../config";
import { greeting, hhmm } from "../util/time";
import { epochMs, foregroundApp, type AzState } from "../net/protocol";

const corner = require("../../assets/azuka-corner.png");

const STATE_LABEL: Record<string, [string, string]> = {
  idle: ["Resting", C.cy],
  listening: ["Listening", C.gr],
  thinking: ["Thinking", C.am],
  working: ["Working", C.am],
  speaking: ["Speaking", C.pu],
  offline: ["Offline", C.rd],
};

export function stateLabel(st: AzState, link: string): [string, string] {
  if (link !== "linked") return [link === "offline" ? "Offline" : "Reconnecting", link === "offline" ? C.rd : C.am];
  return STATE_LABEL[st] ?? [String(st).charAt(0).toUpperCase() + String(st).slice(1), C.cy];
}

function Halo() {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 24000, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rot = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={260} height={260} style={{ position: "absolute", right: -60, top: -40 }}>
        <Defs>
          <RadialGradient id="h" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={C.pu} stopOpacity={0.55} />
            <Stop offset="0.55" stopColor={C.cy} stopOpacity={0.12} />
            <Stop offset="0.7" stopColor={C.cy} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={260} height={260} fill="url(#h)" />
      </Svg>
      <Animated.View style={{ position: "absolute", right: -50, top: -30, opacity: 0.7, transform: [{ rotate: rot }] }}>
        <Svg width={260} height={260}>
          <Circle cx={130} cy={130} r={118} fill="none" stroke={C.cy} strokeOpacity={0.35} strokeWidth={1} strokeDasharray="2 6" />
          <Circle cx={130} cy={130} r={96} fill="none" stroke={C.pu} strokeOpacity={0.5} strokeWidth={2} strokeDasharray="60 30" />
        </Svg>
      </Animated.View>
    </View>
  );
}

function Tile({ icon, color, label, value, sub, viz, onPress }: { icon: IconName; color: string; label: string; value: string; sub: string; viz?: React.ReactNode; onPress?: () => void }) {
  return (
    <Pressable onPress={() => { Haptics.selectionAsync(); onPress?.(); }} style={({ pressed }) => ({ flex: 1, minWidth: 0, opacity: pressed ? 0.8 : 1 })}>
      <Glass radius={R.tile} inner={{ padding: 12, paddingHorizontal: 13, gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <GlowIcon icon={icon} color={color} size={30} isz={15} />
            <Eyebrow color={C.dim}>{label}</Eyebrow>
          </View>
          {viz}
        </View>
        <Head size={21} numberOfLines={1}>{value}</Head>
        <Body size={12} color={C.mu} numberOfLines={1} style={{ marginTop: -4 }}>{sub}</Body>
      </Glass>
    </Pressable>
  );
}

function Spark({ pts, color, w = 44, h = 20 }: { pts: number[]; color: string; w?: number; h?: number }) {
  const mx = Math.max(1, ...pts);
  const xy = pts.map((p, k) => [(k * w) / Math.max(1, pts.length - 1), h - (p / mx) * (h - 4) - 2]);
  const d = "M " + xy.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ");
  return (
    <Svg width={w} height={h}>
      <Path d={d} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function HomeScreen() {
  const link = useAzuka((s) => s.link);
  const creds = useAzuka((s) => s.creds);
  const st = useAzuka((s) => s.state);
  const status = useAzuka((s) => s.status);
  const latency = useAzuka((s) => s.latency);
  const game = useAzuka((s) => s.game);
  const spotify = useAzuka((s) => s.spotify);
  const needs = useAzuka((s) => s.needsYou().length);
  const reminders = useAzuka((s) => s.reminders);
  const clips = useAzuka((s) => s.clips);
  const cpuHist = useRef<number[]>([]);
  if (status?.cpu !== undefined) {
    const last = cpuHist.current[cpuHist.current.length - 1];
    if (last !== status.cpu) cpuHist.current = [...cpuHist.current.slice(-8), Number(status.cpu) || 0];
  }

  const [label, color] = stateLabel(st, link);
  const pcName = creds?.name || "PC";
  const fg = foregroundApp(status?.foreground);
  const mode = status?.mode;
  const line = link !== "linked"
    ? "Her PC is out of reach."
    : [fg ? `${fg} is in front.` : "Nothing is in front.", mode ? `${mode} mode on.` : ""].filter(Boolean).join(" ");
  const nextRem = reminders.length ? reminders[0] : null;
  const track = spotify?.track;
  const dayStart = new Date().setHours(0, 0, 0, 0);
  const today = clips.filter((c) => epochMs(c.at) >= dayStart).length;
  const lastClip = clips.reduce<number>((m, c) => Math.max(m, epochMs(c.at)), 0);

  return (
    <Screen>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <DevicePill name={pcName} link={link} onPress={() => go("Settings")} />
        <View style={{ flexDirection: "row", gap: 8 }}>
          <RoundBtn icon="gear" onPress={() => go("Settings")} />
          <RoundBtn icon="bell" badge={needs || undefined} onPress={() => go("Tabs", { screen: "Activity" })} />
        </View>
      </View>

      <Pressable onPress={() => go("Talk")} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
        <View style={{ height: 196 }}>
          <Glass radius={R.hero} fill style={StyleSheet.absoluteFill}>
            <Halo />
          </Glass>
          <Image source={corner} style={s.corner} resizeMode="contain" />
          <View style={{ position: "absolute", left: 18, top: 18, right: 132, gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
              <Dot color={color} />
              <Eyebrow color={color}>{label}</Eyebrow>
            </View>
            <H1 size={31}>{`${greeting()},\n${OWNER}.`}</H1>
            <Body size={13.5} color={C.mu}>{line}</Body>
          </View>
          <View style={{ position: "absolute", left: 18, bottom: 16, flexDirection: "row", gap: 8 }}>
            {latency !== null ? <Chip text={`${latency} ms`} icon="bolt" fg={C.cy} bg={alpha(C.cy, 0.1)} border={alpha(C.cy, 0.3)} h={28} /> : null}
            {game?.on ? <Chip text={game.app ? `In ${game.app}` : "In game"} icon="rec" fg={C.rd} bg={alpha(C.rd, 0.12)} border={alpha(C.rd, 0.35)} h={28} /> : null}
          </View>
        </View>
      </Pressable>

      <PermissionStack />
      <SuggestCard />

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Tile icon="trophy" color={C.am} label="Tourney" value={nextRem ? hhmm(nextRem.fire_at * 1000) : "None"} sub={nextRem ? nextRem.text : "no match today"} viz={<Ring pct={nextRem ? 64 : 0} size={26} color={C.am} w={3} />} onPress={() => go("Tabs", { screen: "Play" })} />
        <Tile icon="music" color={C.pu} label="Playing" value={track ? track.name : "Quiet"} sub={track ? (track.artists || []).join(", ") : "nothing on"} viz={<Bars n={6} color={C.puL} h={18} w={3} gap={2} live={!!spotify?.is_playing} />} onPress={() => go("Tabs", { screen: "Play" })} />
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Tile
          icon="cpu" color={C.cy} label="PC"
          value={status ? `${Math.round(Number(status.cpu) || 0)}%${status.gpu_temp !== undefined ? ` · ${Math.round(Number(status.gpu_temp))}°` : ""}` : "—"}
          sub={status ? ((Number(status.cpu) || 0) > 80 ? "Working hard" : "All good") : "no reading yet"}
          viz={<Spark pts={cpuHist.current.length > 1 ? cpuHist.current : [0, 0]} color={C.cy} />}
          onPress={() => go("Tabs", { screen: "Control" })}
        />
        <Tile icon="scissor" color={C.rd} label="Clips" value={clips.length ? `${today} today` : "None"} sub={lastClip ? `Last one ${hhmm(lastClip)}` : "nothing saved yet"} viz={<Bars n={5} color={C.rd} h={18} w={3} gap={2} live={today > 0} />} onPress={() => go("Clips")} />
      </View>
      <Mono color={C.dim} style={{ textAlign: "center", marginTop: 4 }}>{link === "linked" && status?.server_time ? `PC time ${hhmm(status.server_time * 1000)}` : ""}</Mono>
    </Screen>
  );
}

const s = StyleSheet.create({
  corner: { position: "absolute", right: 2, bottom: 0, height: 232, width: 232 * (193 / 480), shadowColor: C.pu, shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 12 } },
});
