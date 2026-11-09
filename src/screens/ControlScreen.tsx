import React, { useEffect, useState } from "react";
import { Alert, Image, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { RTCView } from "react-native-webrtc";
import { Screen, TitleRow } from "../components/Screen";
import { Glass } from "../components/Glass";
import { Eyebrow, H1, Mono, Bold } from "../components/Text";
import { RoundBtn, ToggleBtn } from "../components/Buttons";
import { Chip, Dot } from "../components/Chip";
import { GlowIcon } from "../components/GlowIcon";
import { Icon, type IconName } from "../components/Icon";
import { Ring } from "../components/Ring";
import { TouchPad } from "../components/TouchPad";
import { KeysBar } from "../components/KeysBar";
import { C, F, alpha } from "../theme";
import { useAzuka, type Shot, type Stream } from "../store/useAzuka";
import { interrupt, refreshSpotify, sendText, watchScreen } from "../net/session";
import { setStreamQuality, streamQuality, watchStream } from "../net/stream";
import { clipNow, setRecording } from "../net/clips";
import { link } from "../net/link";
import { go } from "../nav/ref";
import { CLIP_FLASH_MS, REPLAY_SECONDS, SCREEN_FPS } from "../config";
import { foregroundApp, type StreamQuality } from "../net/protocol";
import { mmss } from "../util/time";

const QUALITIES: StreamQuality[] = ["auto", "720", "1080"];

function DeviceCard({ icon, name, sub, color, on, onPress }: { icon: IconName; name: string; sub: string; color: string; on: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={() => { Haptics.selectionAsync(); onPress?.(); }} style={[s.dev, on && { borderColor: alpha(C.cy, 0.55), backgroundColor: alpha(C.cy, 0.08), shadowColor: C.cy, shadowOpacity: 0.18, shadowRadius: 10 }]}>
      <Icon name={icon} size={20} color={on ? C.cy : C.mu} />
      <View style={{ gap: 1, flex: 1 }}>
        <Bold size={14} numberOfLines={1}>{name}</Bold>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Dot color={color} size={6} glow={on} />
          <Mono size={10.5} color={color}>{sub}</Mono>
        </View>
      </View>
    </Pressable>
  );
}

function Action({ icon, color, label, onPress }: { icon: IconName; color: string; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }} style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.75 : 1 })}>
      <Glass radius={18} shadow={false} inner={{ alignItems: "center", gap: 7, paddingTop: 10, paddingBottom: 9 }}>
        <GlowIcon icon={icon} color={color} size={36} isz={17} />
        <Text style={{ fontFamily: F.body, fontSize: 11.5, color: C.tx }}>{label}</Text>
      </Glass>
    </Pressable>
  );
}

function Vital({ k, v, pct, color }: { k: string; v: string; pct: number; color: string }) {
  return (
    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Ring pct={pct} size={34} color={color} w={3.5} />
      <View>
        <Mono size={13} color={C.tx}>{v}</Mono>
        <Eyebrow color={C.dim}>{k}</Eyebrow>
      </View>
    </View>
  );
}

function prompt(title: string, make: (v: string) => string) {
  Alert.prompt(title, undefined, [
    { text: "Cancel", style: "cancel" },
    { text: "Send", onPress: (v) => { if (v && v.trim()) sendText(make(v.trim())); } },
  ], "plain-text", "", "default");
}

// the live picture: WebRTC when it is up, the 2 fps screenshot otherwise
function Picture({ stream, shot, up, fallback }: { stream: Stream; shot: Shot | null; up: boolean; fallback: string }) {
  if (stream.state === "live" && stream.url) return <RTCView streamURL={stream.url} objectFit="contain" style={StyleSheet.absoluteFill} />;
  if (shot) return <Image source={{ uri: shot.uri }} style={StyleSheet.absoluteFill} resizeMode="contain" />;
  return (
    <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", gap: 8 }]}>
      <Icon name="screen" size={30} color={C.dim} stroke={1.5} />
      <Mono style={{ textAlign: "center", paddingHorizontal: 20 }}>{!up ? "PC OUT OF REACH" : fallback.toUpperCase()}</Mono>
    </View>
  );
}

function useTick(on: boolean) {
  const [, setN] = useState(0);
  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => setN((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [on]);
}

export function ControlScreen() {
  const focused = useIsFocused();
  const linkState = useAzuka((s) => s.link);
  const creds = useAzuka((s) => s.creds);
  const shot = useAzuka((s) => s.shot);
  const shotError = useAzuka((s) => s.shotError);
  const latency = useAzuka((s) => s.latency);
  const status = useAzuka((s) => s.status);
  const modes = useAzuka((s) => s.modes);
  const activeMode = useAzuka((s) => s.activeMode);
  const spotify = useAzuka((s) => s.spotify);
  const stream = useAzuka((s) => s.stream);
  const touch = useAzuka((s) => s.touch);
  const keysOn = useAzuka((s) => s.keysOn);
  const recording = useAzuka((s) => s.recording);
  const clipFlash = useAzuka((s) => s.clipFlash);
  const patch = useAzuka((s) => s.patch);
  const toast = useAzuka((s) => s.showToast);
  const [full, setFull] = useState(false);
  const win = useWindowDimensions();

  useEffect(() => {
    if (!focused) return;
    const offShots = watchScreen();
    const offStream = watchStream();
    return () => { offShots(); offStream(); patch({ touch: false, keysOn: false }); setFull(false); };
  }, [focused, patch]);

  const flash = clipFlash !== null && Date.now() - clipFlash < CLIP_FLASH_MS;
  useTick(recording.on || flash);

  const up = linkState === "linked";
  const live = stream.state === "live" && !!stream.url;
  const stale = live ? false : shot ? Date.now() - shot.at > 4000 : true;
  const recFor = recording.on && recording.since ? mmss(Date.now() - recording.since) : "";
  const size = live ? `${stream.frameWidth || stream.width}×${stream.frameHeight || stream.height}` : shot ? `${shot.w}×${shot.h}` : "—";
  const fps = live ? `${stream.fps || "—"} fps` : `${SCREEN_FPS} fps`;
  const fallback = stream.state === "failed" && stream.error ? stream.error : shotError ? shotError : stream.state === "connecting" ? "Connecting the live view" : "Waiting for the first frame";

  const media = () => {
    const playing = !!spotify?.is_playing;
    Alert.alert("Media", spotify?.track ? spotify.track.name : "Spotify on the PC", [
      { text: playing ? "Pause" : "Play", onPress: () => link.ask("spotify", playing ? "pause" : "resume").then(() => setTimeout(refreshSpotify, 600)).catch((e) => toast(e.message, "bad")) },
      { text: "Next", onPress: () => link.ask("spotify", "next").then(() => setTimeout(refreshSpotify, 600)).catch((e) => toast(e.message, "bad")) },
      { text: "Previous", onPress: () => link.ask("spotify", "previous").then(() => setTimeout(refreshSpotify, 600)).catch((e) => toast(e.message, "bad")) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const pickMode = () => {
    if (!modes.length) { toast("No modes on the PC yet"); return; }
    Alert.alert("Modes", activeMode ? `${activeMode} is running` : undefined, [
      ...modes.slice(0, 6).map((m) => ({
        text: m.label || m.name,
        onPress: () => link.ask("modes", "run", { name: m.name }).then((r) => toast(String(r.text || `${m.label || m.name} on`), "good")).catch((e) => toast(e.message, "bad")),
      })),
      ...(activeMode ? [{ text: "End the mode", style: "destructive" as const, onPress: () => link.ask("modes", "end").then(() => toast("Mode ended")).catch((e) => toast(e.message, "bad")) }] : []),
      { text: "Cancel", style: "cancel" as const },
    ]);
  };

  const volume = () => {
    Alert.alert("Volume", undefined, [
      { text: "Mute", onPress: () => sendText("mute the pc") },
      { text: "Quiet", onPress: () => sendText("set the volume to 20 percent") },
      { text: "Half", onPress: () => sendText("set the volume to 50 percent") },
      { text: "Loud", onPress: () => sendText("set the volume to 80 percent") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const pickQuality = () => {
    const cur = streamQuality();
    Alert.alert("Live view", `Quality: ${cur}`, [
      ...QUALITIES.map((q) => ({ text: q === "auto" ? "Auto" : `${q}p`, onPress: () => setStreamQuality(q) })),
      { text: "Cancel", style: "cancel" as const },
    ]);
  };

  const toggleTouch = () => {
    if (!up) { toast("Not linked to the PC", "bad"); return; }
    patch({ touch: !touch });
  };
  const toggleKeys = () => {
    if (!up) { toast("Not linked to the PC", "bad"); return; }
    patch({ keysOn: !keysOn });
  };
  const clip = () => {
    if (!clipNow()) toast("Not linked to the PC", "bad");
  };
  const record = () => {
    if (!setRecording(!recording.on)) toast("Not linked to the PC", "bad");
  };

  const pcName = creds?.name || "PC";
  const cpu = Math.round(Number(status?.cpu) || 0);
  const gpu = status?.gpu_temp !== undefined && status?.gpu_temp !== null ? Math.round(Number(status.gpu_temp)) : null;
  const ram = Math.round(Number(status?.ram_pct) || 0);

  const overlays = (compact: boolean) => (
    <>
      <View style={{ position: "absolute", left: 10, top: 10, flexDirection: "row", gap: 6 }}>
        <Chip text="LIVE" dot={stale ? C.dim : C.rd} fg={stale ? C.dim : C.rd} />
        {live && stream.kbps !== null ? <Chip text={`${stream.kbps} kbps`} fg={C.cy} /> : null}
      </View>
      <View style={{ position: "absolute", right: 10, top: 10 }}>
        {recording.on
          ? <Chip text={`REC ${recFor}`} dot={C.rd} fg={C.rd} bold />
          : <Chip text={compact ? `REPLAY ${REPLAY_SECONDS}s` : foregroundApp(status?.foreground).slice(0, 22) || `REPLAY ${REPLAY_SECONDS}s`} fg={C.am} icon={compact ? "rec" : "screen"} />}
      </View>
      {flash ? (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 46, alignItems: "center" }}>
          <Chip text={`Clipped · last ${REPLAY_SECONDS} s`} icon="check" fg={C.bg} bg={C.gr} h={28} bold style={{ shadowColor: C.gr, shadowOpacity: 0.45, shadowRadius: 9, shadowOffset: { width: 0, height: 6 } }} />
        </View>
      ) : null}
      <Pressable onPress={pickQuality} style={{ position: "absolute", left: 10, bottom: 10 }}>
        <Chip text={`${size} · ${fps}${latency !== null ? ` · ${latency} ms` : ""}`} />
      </Pressable>
    </>
  );

  return (
    <Screen hue={C.cy} hue2={C.pu}>
      <TitleRow eyebrow={<Eyebrow>Remote</Eyebrow>} title={<H1 size={28}>Control</H1>} right={<RoundBtn icon="gear" onPress={() => go("Settings")} />} />

      <View style={{ flexDirection: "row", gap: 8 }}>
        <DeviceCard icon="desk" name={pcName} sub={up ? `online${latency !== null ? ` · ${latency} ms` : ""}` : linkState} color={up ? C.gr : C.am} on={up} />
        <DeviceCard icon="laptop" name="Second PC" sub="not paired" color={C.mu} on={false} onPress={() => toast("One PC per phone for now")} />
      </View>

      <Glass accent={alpha(C.cy, 0.7)} inner={{ padding: 8, gap: 8 }}>
        <View style={s.screen}>
          <Picture stream={stream} shot={shot} up={up} fallback={fallback} />
          <TouchPad streamW={stream.width} streamH={stream.height} enabled={touch && up} />
          {overlays(false)}
          <Pressable onPress={() => (live || shot) && setFull(true)} style={s.expand}>
            <Icon name="expand" size={16} />
          </Pressable>
        </View>
        <View style={{ flexDirection: "row", gap: 6 }}>
          <ToggleBtn label="Touch" icon="pad2" color={C.cy} on={touch} onPress={toggleTouch} />
          <ToggleBtn label="Keys" icon="kbd" color={C.cy} on={keysOn} onPress={toggleKeys} />
          <ToggleBtn label="Clip" icon="scissor" color={C.am} on={flash} onPress={clip} />
          <ToggleBtn label="Record" icon="rec" color={C.rd} on={recording.on} onPress={record} />
        </View>
        {keysOn && up ? <KeysBar /> : null}
      </Glass>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Action icon="lock" color={C.cy} label="Lock" onPress={() => sendText("lock the pc")} />
        <Action icon="vol" color={C.pu} label="Volume" onPress={volume} />
        <Action icon="play" color={C.puL} label="Media" onPress={media} />
        <Action icon="apps" color={C.gr} label="Open app" onPress={() => prompt("Open app", (v) => `open ${v}`)} />
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Action icon="focus" color={C.gr} label="Focus" onPress={() => sendText("start a focus session")} />
        <Action icon="pad" color={C.cy} label="Modes" onPress={pickMode} />
        <Action icon="bolt" color={C.am} label="Routine" onPress={() => prompt("Routine", (v) => `run the ${v} routine`)} />
        <Action icon="stop" color={C.rd} label="Stop her" onPress={() => { interrupt(); toast("Stopped"); }} />
      </View>

      <Glass radius={18} shadow={false} inner={{ flexDirection: "row", paddingHorizontal: 14, paddingVertical: 10 }}>
        <Vital k="CPU" v={status ? `${cpu}%` : "—"} pct={cpu} color={C.cy} />
        <Vital k="GPU" v={gpu !== null ? `${gpu}°` : "—"} pct={gpu ?? 0} color={C.am} />
        <Vital k="RAM" v={status ? `${ram}%` : "—"} pct={ram} color={C.pu} />
      </Glass>

      <Modal visible={full} animationType="fade" onRequestClose={() => setFull(false)} statusBarTranslucent>
        <StatusBar hidden />
        <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: win.height, height: win.width, transform: [{ rotate: "90deg" }], backgroundColor: "#000" }}>
            <Picture stream={stream} shot={shot} up={up} fallback={fallback} />
            <TouchPad streamW={stream.width} streamH={stream.height} enabled={touch && up} />
            {overlays(true)}
            <View style={{ position: "absolute", right: 10, bottom: 8, flexDirection: "row", gap: 8 }}>
              <Pressable onPress={toggleTouch} style={[s.fullBtn, touch && { borderColor: alpha(C.cy, 0.5), backgroundColor: alpha(C.cy, 0.15) }]}>
                <Icon name="pad2" size={16} color={touch ? C.cy : C.tx} />
              </Pressable>
              <Pressable onPress={() => setFull(false)} style={s.fullBtn}>
                <Icon name="x" size={16} />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const s = StyleSheet.create({
  dev: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, height: 54, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)" },
  screen: { height: 198, borderRadius: 15, overflow: "hidden", backgroundColor: "#0f1622" },
  expand: { position: "absolute", right: 10, bottom: 8, width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(9,8,13,0.75)", alignItems: "center", justifyContent: "center" },
  fullBtn: { width: 36, height: 36, borderRadius: 11, backgroundColor: "rgba(9,8,13,0.75)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
});
