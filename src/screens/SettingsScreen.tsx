import React from "react";
import { Alert, View } from "react-native";
import { Screen, TitleRow } from "../components/Screen";
import { Glass } from "../components/Glass";
import { RoundBtn, Ghost } from "../components/Buttons";
import { Eyebrow, H1, Body, Mono } from "../components/Text";
import { Dot } from "../components/Chip";
import { LINK_COLOR, LINK_LABEL } from "../components/DevicePill";
import { C } from "../theme";
import { useAzuka } from "../store/useAzuka";
import { unpair } from "../net/session";
import { link } from "../net/link";
import { clearActivity } from "../store/activity";
import { go } from "../nav/ref";
import { APP_VERSION } from "../config";

function Row({ k, v, color, last }: { k: string; v: React.ReactNode; color?: string; last?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: "rgba(255,255,255,0.06)" }}>
      <Body size={14.5}>{k}</Body>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {color ? <Dot color={color} size={6} /> : null}
        {typeof v === "string" ? <Mono size={12} color={C.mu}>{v}</Mono> : v}
      </View>
    </View>
  );
}

export function SettingsScreen() {
  const creds = useAzuka((s) => s.creds);
  const linkState = useAzuka((s) => s.link);
  const latency = useAzuka((s) => s.latency);
  const hello = useAzuka((s) => s.hello);
  const status = useAzuka((s) => s.status);
  const ts = hello?.tailscale ?? status?.tailscale;

  const askUnpair = () => {
    Alert.alert("Unpair this PC?", "The phone forgets the token. Pair again from the PC's code.", [
      { text: "Cancel", style: "cancel" },
      { text: "Unpair", style: "destructive", onPress: () => { unpair(); } },
    ]);
  };

  return (
    <Screen tabs={false}>
      <TitleRow eyebrow={<Eyebrow color={C.dim}>Phone</Eyebrow>} title={<H1 size={28}>Settings</H1>} right={<RoundBtn icon="x" onPress={() => go("Tabs")} />} />

      <Eyebrow color={C.dim}>Linked PC</Eyebrow>
      <Glass radius={20} inner={{ paddingHorizontal: 16 }}>
        <Row k="PC" v={creds?.name || "none"} />
        <Row k="Host" v={creds ? `${creds.host}:${creds.port}` : "none"} />
        <Row k="Link" v={LINK_LABEL[linkState]} color={LINK_COLOR[linkState]} />
        <Row k="Latency" v={latency !== null ? `${latency} ms` : "—"} />
        <Row k="Private link" v={ts === undefined ? "unknown" : ts ? (typeof ts === "string" ? `tailscale ${ts}` : "tailscale") : "same network"} />
        <Row k="Azuka on the PC" v={hello?.version ? `v${hello.version}` : "—"} last />
      </Glass>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Ghost label="Reconnect" icon="link" h={42} onPress={() => link.retryNow()} disabled={!creds} />
        <Ghost label="Unpair" icon="x" h={42} onPress={askUnpair} disabled={!creds} />
      </View>

      <Eyebrow color={C.dim}>This phone</Eyebrow>
      <Glass radius={20} inner={{ paddingHorizontal: 16 }}>
        <Row k="App" v={`v${APP_VERSION}`} />
        <Row k="Siri" v="azuka://ask and azuka://talk" />
        <Row k="Push alerts" v="needs a paid Apple account" last />
      </Glass>
      <Ghost label="Clear activity" icon="bell" h={42} onPress={() => { clearActivity(); useAzuka.getState().showToast("Activity cleared"); }} />
    </Screen>
  );
}
