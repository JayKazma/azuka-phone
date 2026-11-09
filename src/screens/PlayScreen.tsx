import React, { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Screen, TitleRow } from "../components/Screen";
import { Glass } from "../components/Glass";
import { DevicePill } from "../components/DevicePill";
import { RoundBtn } from "../components/Buttons";
import { Eyebrow, H1, Head, Body, Mono, Bold } from "../components/Text";
import { GlowIcon } from "../components/GlowIcon";
import { Bars } from "../components/Bars";
import { Icon, type IconName } from "../components/Icon";
import { C, R, alpha } from "../theme";
import { useAzuka } from "../store/useAzuka";
import { link } from "../net/link";
import { go } from "../nav/ref";
import { refreshSpotify } from "../net/session";
import { useIsFocused } from "@react-navigation/native";
import { mmss } from "../util/time";
import type { Mode } from "../net/protocol";

const MODE_LOOK: [IconName, string][] = [["pad", C.cy], ["code", C.pu], ["screen", C.am], ["music", C.gr], ["focus", C.puL], ["bolt", C.rd]];

function ModeCard({ m, i, on, onPress }: { m: Mode; i: number; on: boolean; onPress: () => void }) {
  const [icon, color] = MODE_LOOK[i % MODE_LOOK.length];
  return (
    <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }} style={({ pressed }) => ({ width: 128, opacity: pressed ? 0.8 : 1 })}>
      <Glass radius={R.tile} shadow={false} accent={on ? alpha(color, 0.8) : undefined} glow={on ? color : undefined} inner={{ padding: 12, gap: 8 }}>
        <GlowIcon icon={icon} color={color} size={34} isz={16} />
        <Bold size={14} numberOfLines={1}>{m.label || m.name}</Bold>
        <Mono color={on ? C.gr : C.dim} numberOfLines={1}>{on ? "RUNNING" : "ready"}</Mono>
      </Glass>
    </Pressable>
  );
}

export function PlayScreen() {
  const linkState = useAzuka((s) => s.link);
  const creds = useAzuka((s) => s.creds);
  const sp = useAzuka((s) => s.spotify);
  const modes = useAzuka((s) => s.modes);
  const active = useAzuka((s) => s.activeMode);
  const toast = useAzuka((s) => s.showToast);
  const [now, setNow] = useState(Date.now());
  const focused = useIsFocused();

  useEffect(() => { if (focused) refreshSpotify(); }, [focused]);

  useEffect(() => {
    if (!sp?.is_playing) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [sp?.is_playing]);

  const track = sp?.track ?? null;
  const dur = track?.duration_ms || 0;
  const base = sp?.progress_ms || 0;
  const pos = sp?.is_playing ? Math.min(dur || Infinity, base + (now - (sp?.at || now))) : base;
  const pct = dur ? Math.max(0, Math.min(100, (pos / dur) * 100)) : 0;

  const op = (o: "pause" | "resume" | "next" | "previous") => link.ask("spotify", o).then(() => setTimeout(refreshSpotify, 600)).catch((e) => toast(e.message, "bad"));
  const shuffle = () => toast("Shuffle is not on the phone link yet");

  const runMode = (m: Mode) => {
    if (active === m.name) {
      link.ask("modes", "end").then((r) => toast(String(r.text || "Mode ended"))).catch((e) => toast(e.message, "bad"));
    } else {
      link.ask("modes", "run", { name: m.name }).then((r) => toast(String(r.text || `${m.label || m.name} on`), "good")).catch((e) => toast(e.message, "bad"));
    }
  };

  return (
    <Screen hue="#7a3fe0" hue2={C.am}>
      <TitleRow eyebrow={<Eyebrow>On {creds?.name || "PC"}</Eyebrow>} title={<H1 size={28}>Play</H1>} right={<DevicePill name={creds?.name || "PC"} link={linkState} onPress={() => go("Settings")} />} />

      <Glass radius={R.hero} inner={{ padding: 16, gap: 14 }}>
        <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
          <View style={{ width: 92, height: 92, borderRadius: 16, overflow: "hidden", shadowColor: C.pu, shadowOpacity: 0.45, shadowRadius: 13, shadowOffset: { width: 0, height: 10 } }}>
            {track?.art ? <Image source={{ uri: track.art }} style={{ width: 92, height: 92 }} /> : (
              <LinearGradient colors={["#2a1650", C.pu, "#2aa9b3", "#10243a"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 92, height: 92, alignItems: "center", justifyContent: "center" }}>
                <View style={{ width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: "rgba(255,255,255,0.6)" }} />
              </LinearGradient>
            )}
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <Eyebrow color={C.gr}>{`Spotify · ${sp?.device?.name || creds?.name || "PC"}`}</Eyebrow>
            <Head size={22} numberOfLines={2}>{track ? track.name : sp ? "Nothing playing" : "Spotify is quiet"}</Head>
            <Body size={13.5} color={C.mu} numberOfLines={1}>{track ? (track.artists || []).join(", ") : linkState === "linked" ? "nothing on" : "PC out of reach"}</Body>
          </View>
        </View>
        <View style={{ alignItems: "center" }}>
          <Bars n={16} color={C.puL} h={30} w={4} gap={4} live={!!sp?.is_playing} />
        </View>
        <View style={{ gap: 6 }}>
          <View style={{ height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <LinearGradient colors={[C.cy, C.pu]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${pct}%`, height: "100%", borderRadius: 3 }} />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Mono>{mmss(pos)}</Mono>
            <Mono>{mmss(dur)}</Mono>
          </View>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 18 }}>
          <RoundBtn icon="shuffle" color={sp?.shuffle ? C.cy : C.tx} onPress={shuffle} />
          <RoundBtn icon="prev" onPress={() => op("previous")} />
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); op(sp?.is_playing ? "pause" : "resume"); }} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <LinearGradient colors={["#ffffff", "#d9cff0"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", shadowColor: C.puL, shadowOpacity: 0.5, shadowRadius: 13 }}>
              <Icon name={sp?.is_playing ? "pause" : "play"} size={24} color={C.bg} stroke={2.4} />
            </LinearGradient>
          </Pressable>
          <RoundBtn icon="next" onPress={() => op("next")} />
          <RoundBtn icon="vol" onPress={() => go("Tabs", { screen: "Control" })} />
        </View>
      </Glass>

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Eyebrow color={C.dim}>Modes</Eyebrow>
        <Mono>{active ? `${active} running` : "one tap"}</Mono>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
        {modes.length ? modes.map((m, i) => <ModeCard key={m.name} m={m} i={i} on={active === m.name} onPress={() => runMode(m)} />) : (
          <Glass radius={R.tile} shadow={false} style={{ width: 200 }} inner={{ padding: 12, gap: 6 }}>
            <Bold size={14}>No modes yet</Bold>
            <Mono>{linkState === "linked" ? "none saved on the PC" : "PC out of reach"}</Mono>
          </Glass>
        )}
      </ScrollView>

      <Glass accent={alpha(C.am, 0.85)} glow={C.am} inner={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 14 }}>
        <GlowIcon icon="trophy" color={C.am} size={44} isz={20} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Eyebrow color={C.am}>Tourney</Eyebrow>
          <Bold>No bracket linked</Bold>
          <Mono color={C.mu}>brackets arrive in a later phase</Mono>
        </View>
        <Mono size={26} color={C.am} style={{ textShadowColor: alpha(C.am, 0.6), textShadowRadius: 14 }}>{"--:--"}</Mono>
      </Glass>
    </Screen>
  );
}
