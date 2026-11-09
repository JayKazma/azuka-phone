import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import Svg, { Circle } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { Screen } from "../components/Screen";
import { Glass } from "../components/Glass";
import { Eyebrow, H1, Body, Mono } from "../components/Text";
import { Icon } from "../components/Icon";
import { Primary, Ghost } from "../components/Buttons";
import { C, F, alpha } from "../theme";
import { parsePairQr, type PairTarget } from "../net/protocol";
import { pairWith } from "../net/session";
import { useAzuka } from "../store/useAzuka";
import { DEFAULT_PORT } from "../config";

const face = require("../../assets/azuka-avatar.png");

function Core({ size = 124 }: { size?: number }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 14000, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rot = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const c = size / 2;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center", shadowColor: C.pu, shadowOpacity: 0.45, shadowRadius: 24 }}>
      <Animated.View style={{ position: "absolute", transform: [{ rotate: rot }] }}>
        <Svg width={size} height={size}>
          <Circle cx={c} cy={c} r={c - 2} fill="none" stroke={C.cy} strokeOpacity={0.4} strokeWidth={1} strokeDasharray="2 6" />
          <Circle cx={c} cy={c} r={c - 12} fill="none" stroke={C.pu} strokeOpacity={0.6} strokeWidth={2} strokeDasharray="40 24" />
        </Svg>
      </Animated.View>
      <Image source={face} style={{ width: size - 44, height: size - 44, borderRadius: size, borderWidth: 2, borderColor: alpha(C.cy, 0.5) }} />
    </View>
  );
}

function Brackets({ color, size = 22, inset = 14 }: { color: string; size?: number; inset?: number }) {
  const b = { position: "absolute" as const, width: size, height: size, borderColor: color };
  return (
    <>
      <View style={[b, { left: inset, top: inset, borderLeftWidth: 2, borderTopWidth: 2, borderTopLeftRadius: 6 }]} />
      <View style={[b, { right: inset, top: inset, borderRightWidth: 2, borderTopWidth: 2, borderTopRightRadius: 6 }]} />
      <View style={[b, { left: inset, bottom: inset, borderLeftWidth: 2, borderBottomWidth: 2, borderBottomLeftRadius: 6 }]} />
      <View style={[b, { right: inset, bottom: inset, borderRightWidth: 2, borderBottomWidth: 2, borderBottomRightRadius: 6 }]} />
    </>
  );
}

function ScanLine() {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(y, { toValue: 1, duration: 2600, useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 2600, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [y]);
  return (
    <Animated.View pointerEvents="none" style={{ position: "absolute", left: 18, right: 18, top: 12, height: 2, backgroundColor: C.cy, shadowColor: C.cy, shadowOpacity: 1, shadowRadius: 8, opacity: 0.8, transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [0, 196] }) }] }} />
  );
}

type StepState = "done" | "now" | "next";

function StepRow({ k, text, value, state, first }: { k: number; text: string; value: string; state: StepState; first: boolean }) {
  const c = state === "done" ? C.gr : state === "now" ? C.cy : C.dim;
  return (
    <View style={[s.step, !first && { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" }]}>
      <View
        style={{
          width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center",
          backgroundColor: state === "done" ? C.gr : "transparent",
          borderWidth: state === "done" ? 0 : 1.5, borderColor: state === "now" ? C.cy : C.line2, borderStyle: state === "next" ? "dashed" : "solid",
          shadowColor: c, shadowOpacity: state === "next" ? 0 : 0.6, shadowRadius: 6,
        }}
      >
        {state === "done" ? <Icon name="check" size={13} color={C.bg} stroke={3} /> : <Mono color={c}>{k}</Mono>}
      </View>
      <Body size={14.5} color={state === "next" ? C.mu : C.tx} style={{ flex: 1 }}>{text}</Body>
      <Mono color={c}>{value}</Mono>
    </View>
  );
}

export function PairScreen() {
  const [perm, askPerm] = useCameraPermissions();
  const [manual, setManual] = useState(false);
  const [host, setHost] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [found, setFound] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const link = useAzuka((st) => st.link);
  const hello = useAzuka((st) => st.hello);
  const lastScan = useRef(0);

  useEffect(() => { if (!perm) askPerm(); }, [perm, askPerm]);

  const pair = async (t: PairTarget) => {
    if (busy) return;
    setBusy(true); setErr(null); setFound(t.name || t.host);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await pairWith(t);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setErr((e as Error).message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFound(null);
    } finally {
      setBusy(false);
    }
  };

  const onScan = (data: string) => {
    const now = Date.now();
    if (busy || now - lastScan.current < 1500) return;
    lastScan.current = now;
    const t = parsePairQr(data);
    if (!t) { setErr("That is not an Azuka code"); return; }
    pair(t);
  };

  const submitManual = () => {
    const h = host.trim();
    const c = code.trim();
    if (!h || c.length < 4) { setErr("Host and the 6 digit code"); return; }
    const [hn, pt] = h.split(":");
    pair({ host: hn, port: pt ? parseInt(pt, 10) || DEFAULT_PORT : DEFAULT_PORT, code: c });
  };

  const scanState: StepState = busy || link === "pairing" ? "done" : "now";
  const findState: StepState = found ? "done" : "next";
  const tailscale = hello?.tailscale;

  return (
    <Screen tabs={false} style={{ alignItems: "stretch" }}>
      <View style={{ alignItems: "center", gap: 10, paddingTop: 8 }}>
        <Core />
        <Eyebrow>First time</Eyebrow>
        <H1 size={28}>Pair with your PC</H1>
      </View>

      {!manual ? (
        <Glass accent={alpha(C.cy, 0.8)} radius={26} fill style={{ width: 236, height: 220, alignSelf: "center" }} inner={{ alignItems: "center", justifyContent: "center" }}>
          {perm?.granted ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={(r) => onScan(r.data)}
            />
          ) : (
            <Pressable onPress={() => askPerm()} style={{ alignItems: "center", gap: 8 }}>
              <Icon name="camera" size={34} color={C.cy} stroke={1.4} />
              <Mono color={C.cy}>ALLOW THE CAMERA</Mono>
            </Pressable>
          )}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Brackets color={C.cy} />
            {perm?.granted ? <ScanLine /> : null}
            {perm?.granted ? <View style={{ position: "absolute", left: "50%", top: "50%", marginLeft: -24, marginTop: -34, opacity: 0.55 }}><Icon name="focus" size={48} color={C.cy} stroke={1.2} /></View> : null}
            <View style={{ position: "absolute", left: 0, right: 0, bottom: 24, alignItems: "center" }}>
              <Eyebrow color={C.mu}>{busy ? "Pairing" : "Code on your PC"}</Eyebrow>
            </View>
          </View>
        </Glass>
      ) : (
        <Glass radius={20} inner={{ padding: 14, gap: 10 }}>
          <Eyebrow color={C.dim}>PC address</Eyebrow>
          <TextInput value={host} onChangeText={setHost} placeholder="100.64.0.12 or sen" placeholderTextColor={C.dim} autoCapitalize="none" autoCorrect={false} keyboardType="url" style={s.input} />
          <Eyebrow color={C.dim}>Code</Eyebrow>
          <TextInput value={code} onChangeText={setCode} placeholder="6 digits" placeholderTextColor={C.dim} keyboardType="number-pad" maxLength={6} style={[s.input, { fontFamily: F.monoB, letterSpacing: 6 }]} />
          <Primary label={busy ? "Pairing" : "Pair"} icon="link" h={44} onPress={submitManual} disabled={busy} />
        </Glass>
      )}

      <Glass radius={20} inner={{ paddingHorizontal: 16, paddingVertical: 2 }}>
        <StepRow k={1} text="Private link" value={tailscale === undefined ? "tailscale" : tailscale ? "tailscale on" : "same wifi"} state={tailscale ? "done" : "next"} first />
        <StepRow k={2} text="Find your PC" value={found ? `${found} found` : "waiting"} state={findState} first={false} />
        <StepRow k={3} text={manual ? "Type the code from your PC" : "Scan the code on your PC"} value={busy ? "pairing" : "waiting"} state={scanState} first={false} />
      </Glass>

      {err ? <Text style={s.err}>{err}</Text> : null}

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Ghost label={manual ? "Scan instead" : "Type it instead"} icon={manual ? "camera" : "text"} h={42} onPress={() => { setManual((m) => !m); setErr(null); }} />
      </View>

      <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 }}>
        <Icon name="face" size={15} color={C.mu} />
        <Body size={12.5} color={C.mu}>Face ID guards every yes</Body>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  step: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11 },
  input: { height: 44, borderRadius: 12, paddingHorizontal: 12, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: C.tx, fontFamily: F.body, fontSize: 15 },
  err: { fontFamily: F.body, fontSize: 13, color: C.rd, textAlign: "center" },
});
