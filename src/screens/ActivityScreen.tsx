import React, { useState } from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Screen, TitleRow } from "../components/Screen";
import { Glass } from "../components/Glass";
import { DevicePill } from "../components/DevicePill";
import { Segments } from "../components/Segments";
import { GlowIcon } from "../components/GlowIcon";
import { Eyebrow, H1, Bold, Mono, Body } from "../components/Text";
import { Primary, Ghost } from "../components/Buttons";
import type { IconName } from "../components/Icon";
import { C, alpha } from "../theme";
import { useAzuka, type ActivityItem } from "../store/useAzuka";
import { go } from "../nav/ref";
import { hhmm } from "../util/time";

const LOOK: Record<ActivityItem["kind"], [IconName, string]> = {
  permission: ["kbd", C.am],
  suggest: ["spark", C.puL],
  reply: ["text", C.cy],
  notice: ["bell", C.dim],
  reminder: ["clock", C.am],
  done: ["check", C.gr],
  clip: ["scissor", C.rd],
  error: ["code", C.rd],
};

function Row({ a, last }: { a: ActivityItem; last: boolean }) {
  const [icon, color] = LOOK[a.kind] ?? LOOK.notice;
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      <View style={{ width: 38, alignItems: "center" }}>
        <GlowIcon icon={icon} color={color} size={38} isz={17} />
        {!last ? <LinearGradient colors={[alpha(color, 0.55), "rgba(255,255,255,0.05)"]} style={{ width: 2, flex: 1, marginTop: 4, minHeight: 12 }} /> : null}
      </View>
      <View style={{ flex: 1, paddingBottom: last ? 0 : 12 }}>
        <Glass radius={18} shadow={false} accent={a.needs ? alpha(C.am, 0.8) : undefined} glow={a.needs ? C.am : undefined} inner={{ paddingHorizontal: 14, paddingVertical: 12, gap: 3 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
            <Bold size={14.5} style={{ flex: 1 }} numberOfLines={1}>{a.title}</Bold>
            <Mono>{hhmm(a.at)}</Mono>
          </View>
          {a.sub ? <Body size={13} color={C.mu} numberOfLines={3}>{a.sub}</Body> : null}
          {a.needs ? (
            <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
              <Primary label="Open" colors={[C.am, C.am2]} fg={C.bg} h={36} onPress={() => go("Talk")} />
              <Ghost label="Later" h={36} onPress={() => useAzuka.getState().resolveActivity(a.refId || "", "done", "Left for later")} />
            </View>
          ) : null}
        </Glass>
      </View>
    </View>
  );
}

export function ActivityScreen() {
  const [seg, setSeg] = useState(0);
  const activity = useAzuka((s) => s.activity);
  const link = useAzuka((s) => s.link);
  const creds = useAzuka((s) => s.creds);
  const needs = activity.filter((a) => a.needs);
  const done = activity.filter((a) => !a.needs);
  const shown = seg === 0 ? activity : seg === 1 ? needs : done;
  const needsShown = seg !== 2 ? shown.filter((a) => a.needs) : [];
  const earlier = seg !== 1 ? shown.filter((a) => !a.needs) : [];

  return (
    <Screen>
      <TitleRow eyebrow={<Eyebrow color={C.am}>While you were away</Eyebrow>} title={<H1 size={28}>Activity</H1>} right={<DevicePill name={creds?.name || "PC"} link={link} onPress={() => go("Settings")} />} />
      <Segments items={["All", `Needs you · ${needs.length}`, "Done"]} value={seg} onChange={setSeg} />

      {needsShown.length ? <Eyebrow color={C.am}>Needs you</Eyebrow> : null}
      {needsShown.map((a, i) => <Row key={a.id} a={a} last={i === needsShown.length - 1} />)}

      {earlier.length ? <Eyebrow color={C.dim}>Earlier</Eyebrow> : null}
      {earlier.map((a, i) => <Row key={a.id} a={a} last={i === earlier.length - 1} />)}

      {!shown.length ? (
        <View style={{ alignItems: "center", paddingTop: 48 }}>
          <Mono color={C.dim}>{seg === 1 ? "NOTHING NEEDS YOU" : "NOTHING YET"}</Mono>
        </View>
      ) : null}
    </Screen>
  );
}
