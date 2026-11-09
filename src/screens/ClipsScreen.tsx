import React, { useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEvent } from "expo";
import { VideoView, useVideoPlayer } from "expo-video";
import * as Haptics from "expo-haptics";
import { Asset, requestPermissionsAsync } from "expo-media-library";
import { isAvailableAsync, shareAsync } from "expo-sharing";
import { Screen, TitleRow } from "../components/Screen";
import { Glass } from "../components/Glass";
import { Segments } from "../components/Segments";
import { Primary, Ghost, RoundBtn } from "../components/Buttons";
import { Eyebrow, H1, Bold, Mono } from "../components/Text";
import { Icon } from "../components/Icon";
import { Chip } from "../components/Chip";
import { C, alpha } from "../theme";
import { useAzuka } from "../store/useAzuka";
import { cachedUri, deleteClip, fetchClip, requestClips } from "../net/clips";
import { epochMs, type ClipItem } from "../net/protocol";
import { go } from "../nav/ref";
import { hhmm, mmss } from "../util/time";

const thumbUri = (c: ClipItem) => (c.thumb ? `data:image/jpeg;base64,${c.thumb}` : null);
const verb = (c: ClipItem) => (c.kind === "recording" ? "recorded" : "clipped");

function Thumb({ c, color, selected, onPress }: { c: ClipItem; color: string; selected: boolean; onPress: () => void }) {
  const uri = thumbUri(c);
  return (
    <Pressable onPress={() => { Haptics.selectionAsync(); onPress(); }} style={({ pressed }) => ({ width: "48%", gap: 6, opacity: pressed ? 0.8 : 1 })}>
      <View style={[s.thumb, { borderColor: selected ? alpha(color, 0.6) : "rgba(255,255,255,0.08)" }, selected && { shadowColor: color, shadowOpacity: 0.27, shadowRadius: 9 }]}>
        {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : (
          <LinearGradient colors={[alpha(color, 0.33), "#10121c"]} start={{ x: 0, y: 0 }} end={{ x: 0.7, y: 1 }} style={StyleSheet.absoluteFill} />
        )}
        <View style={s.thumbPlay}><Icon name="play" size={15} /></View>
        <View style={{ position: "absolute", right: 6, bottom: 6 }}>
          <Chip text={mmss(c.seconds * 1000)} h={20} style={{ paddingHorizontal: 7 }} />
        </View>
      </View>
      <Bold size={13.5} numberOfLines={1}>{c.name}</Bold>
      <Mono size={10.5} style={{ marginTop: -3 }}>{`${verb(c)} ${hhmm(epochMs(c.at))} · ${mmss(c.seconds * 1000)}`}</Mono>
    </Pressable>
  );
}

function Player({ c, color }: { c: ClipItem; color: string }) {
  const dl = useAzuka((st) => st.downloads[c.id]);
  const toast = useAzuka((st) => st.showToast);
  const uri = dl?.done ? dl.uri : cachedUri(c.id);
  const [busy, setBusy] = useState<"save" | "share" | null>(null);

  const player = useVideoPlayer(uri ? { uri } : null, (p) => { p.loop = false; p.timeUpdateEventInterval = 0.25; });
  const { isPlaying } = useEvent(player, "playingChange", { isPlaying: player.playing, oldIsPlaying: false });
  const { currentTime } = useEvent(player, "timeUpdate", { currentTime: 0, currentLiveTimestamp: null, currentOffsetFromLive: null, bufferedPosition: 0 });
  const total = c.seconds || player.duration || 0;
  const pct = total ? Math.min(1, Math.max(0, currentTime / total)) : 0;

  useEffect(() => {
    if (!uri && !dl?.error && !(dl && !dl.done)) fetchClip(c.id).catch(() => {});
  }, [c.id, uri, dl]);

  const toggle = () => {
    Haptics.selectionAsync();
    if (!uri) { fetchClip(c.id).catch((e: Error) => toast(e.message, "bad")); return; }
    if (isPlaying) player.pause();
    else { if (total && currentTime >= total - 0.2) player.currentTime = 0; player.play(); }
  };

  const ensureFile = async () => uri ?? (await fetchClip(c.id));

  const save = async () => {
    setBusy("save");
    try {
      const file = await ensureFile();
      const perm = await requestPermissionsAsync(true);
      if (!perm.granted) { toast("Photos access was refused", "bad"); return; }
      await Asset.create(file);
      toast("Saved to Photos", "good");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save that", "bad");
    } finally { setBusy(null); }
  };

  const share = async () => {
    setBusy("share");
    try {
      const file = await ensureFile();
      if (!(await isAvailableAsync())) { toast("Sharing is not available here", "bad"); return; }
      await shareAsync(file, { mimeType: "video/mp4", UTI: "public.mpeg-4", dialogTitle: c.name });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not share that", "bad");
    } finally { setBusy(null); }
  };

  const remove = () => {
    Alert.alert(`Delete ${c.kind === "recording" ? "recording" : "clip"}?`, `${c.name} goes from the PC and this phone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { deleteClip(c.id); toast("Deleted"); } },
    ]);
  };

  const thumb = thumbUri(c);
  const fetching = !!dl && !dl.done && !dl.error;
  const label = c.kind === "recording" ? "REC" : "CLIP";

  return (
    <Glass accent={alpha(color, 0.75)} inner={{ padding: 8, gap: 10 }}>
      <View style={s.player}>
        {uri ? (
          <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls={false} />
        ) : thumb ? (
          <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <LinearGradient colors={["#1b1630", "#0f1622"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        )}
        {!isPlaying ? <LinearGradient colors={["transparent", "rgba(9,8,13,0.7)"]} locations={[0.55, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" /> : null}
        <Pressable onPress={toggle} style={StyleSheet.absoluteFill}>
          {!isPlaying ? (
            <View style={s.bigPlay}>
              {fetching ? <Mono size={11} color={C.bg}>{`${Math.round((dl?.progress ?? 0) * 100)}%`}</Mono> : <Icon name="play" size={22} color={C.bg} stroke={2.4} />}
            </View>
          ) : null}
        </Pressable>
        <View style={{ position: "absolute", left: 10, top: 10 }}>
          <Chip text={`${label} · ${mmss(c.seconds * 1000)}`} icon={c.kind === "recording" ? "rec" : "scissor"} fg={color} />
        </View>
        {dl?.error ? (
          <View style={{ position: "absolute", right: 10, top: 10 }}>
            <Chip text={dl.error.toUpperCase().slice(0, 32)} fg={C.rd} />
          </View>
        ) : null}
      </View>

      <View style={{ paddingHorizontal: 6, gap: 4 }}>
        <View style={s.strip}>
          {fetching ? (
            <View style={[s.fill, { width: `${Math.round((dl?.progress ?? 0) * 100)}%`, backgroundColor: alpha(color, 0.35), borderColor: alpha(color, 0.6) }]} />
          ) : (
            <View style={[s.fill, { width: `${Math.max(2, Math.round(pct * 100))}%`, backgroundColor: alpha(C.am, 0.12), borderColor: C.am }]} />
          )}
          {!fetching ? <View style={[s.head, { left: `${Math.round(pct * 100)}%` }]} /> : null}
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Mono>{mmss(currentTime * 1000)}</Mono>
          <Mono color={C.am}>{fetching ? `fetching ${Math.round((dl?.progress ?? 0) * 100)}%` : `${verb(c)} ${hhmm(epochMs(c.at))}`}</Mono>
          <Mono>{mmss(total * 1000)}</Mono>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 2, paddingBottom: 2 }}>
        <Primary label={busy === "save" ? "Saving" : "Save to Photos"} icon="down" colors={[C.rd, C.rd2]} h={42} onPress={save} disabled={busy !== null} />
        <Ghost label={busy === "share" ? "Sharing" : "Share"} icon="out" h={42} onPress={share} disabled={busy !== null} />
        <RoundBtn icon="x" size={42} color={C.rd} onPress={remove} />
      </View>
    </Glass>
  );
}

export function ClipsScreen() {
  const [seg, setSeg] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const creds = useAzuka((s) => s.creds);
  const clips = useAzuka((s) => s.clips);
  const linkState = useAzuka((s) => s.link);

  useEffect(() => { if (linkState === "linked") requestClips(); }, [linkState]);

  const kind = seg === 0 ? "clip" : "recording";
  const shown = useMemo(() => clips.filter((c) => c.kind === kind).sort((a, b) => epochMs(b.at) - epochMs(a.at)), [clips, kind]);
  const nClips = clips.filter((c) => c.kind === "clip").length;
  const nRecs = clips.length - nClips;
  const color = seg === 0 ? C.rd : C.rd2;
  const selected = shown.find((c) => c.id === picked) ?? shown[0] ?? null;

  return (
    <Screen hue={C.rd} hue2={C.pu} tabs={false}>
      <TitleRow eyebrow={<Eyebrow>Saved on {creds?.name || "PC"}</Eyebrow>} title={<H1 size={28}>Clips</H1>} right={<RoundBtn icon="back" onPress={() => go("Tabs")} />} />
      <Segments items={[`Clips · ${nClips}`, `Recordings · ${nRecs}`]} value={seg} onChange={(i) => { setSeg(i); setPicked(null); }} colors={[C.rd, C.rd2]} />

      {selected ? <Player key={selected.id} c={selected} color={color} /> : (
        <Glass accent={alpha(color, 0.75)} inner={{ padding: 8, gap: 10 }}>
          <View style={s.player}>
            <LinearGradient colors={["#1b1630", "#0f1622"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 10 }}>
              <Icon name={seg === 0 ? "scissor" : "rec"} size={36} color={color} stroke={1.4} />
              <Mono color={C.mu}>{linkState === "linked" ? (seg === 0 ? "NOTHING CLIPPED YET" : "NOTHING RECORDED YET") : "PC OUT OF REACH"}</Mono>
            </LinearGradient>
          </View>
          <View style={{ paddingHorizontal: 6, paddingBottom: 4, gap: 4 }}>
            <Bold size={14.5}>{seg === 0 ? "No clips yet" : "No recordings yet"}</Bold>
            <Mono>{seg === 0 ? "clips she saves on the PC list here" : "recordings from the PC list here"}</Mono>
          </View>
        </Glass>
      )}

      {shown.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 }}>
          {shown.map((c) => <Thumb key={c.id} c={c} color={color} selected={selected?.id === c.id} onPress={() => setPicked(c.id)} />)}
        </View>
      ) : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  player: { height: 196, borderRadius: 15, overflow: "hidden", backgroundColor: "#0f1622" },
  bigPlay: {
    position: "absolute", left: "50%", top: "50%", width: 54, height: 54, marginLeft: -27, marginTop: -27, borderRadius: 27,
    backgroundColor: "rgba(241,236,251,0.92)", alignItems: "center", justifyContent: "center", shadowColor: "#fff", shadowOpacity: 0.35, shadowRadius: 12,
  },
  strip: { height: 34, borderRadius: 8, backgroundColor: C.s2, overflow: "hidden" },
  fill: { position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 8, borderWidth: 2 },
  head: { position: "absolute", top: -2, bottom: -2, width: 2, marginLeft: -1, backgroundColor: "#fff", shadowColor: "#fff", shadowOpacity: 1, shadowRadius: 3 },
  thumb: { height: 96, borderRadius: 14, overflow: "hidden", borderWidth: 1, backgroundColor: "#10121c" },
  thumbPlay: { position: "absolute", left: "50%", top: "50%", width: 34, height: 34, marginLeft: -17, marginTop: -17, borderRadius: 17, backgroundColor: "rgba(9,8,13,0.6)", alignItems: "center", justifyContent: "center" },
});
