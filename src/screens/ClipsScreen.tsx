import React, { useState } from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Screen, TitleRow } from "../components/Screen";
import { Glass } from "../components/Glass";
import { Segments } from "../components/Segments";
import { RoundBtn } from "../components/Buttons";
import { Eyebrow, H1, Bold, Mono } from "../components/Text";
import { Icon } from "../components/Icon";
import { Chip } from "../components/Chip";
import { C, alpha } from "../theme";
import { useAzuka } from "../store/useAzuka";
import { go } from "../nav/ref";

export function ClipsScreen() {
  const [seg, setSeg] = useState(0);
  const creds = useAzuka((s) => s.creds);
  return (
    <Screen hue={C.rd} hue2={C.pu} tabs={false}>
      <TitleRow eyebrow={<Eyebrow>Saved on {creds?.name || "PC"}</Eyebrow>} title={<H1 size={28}>Clips</H1>} right={<RoundBtn icon="back" onPress={() => go("Tabs")} />} />
      <Segments items={["Clips · 0", "Recordings · 0"]} value={seg} onChange={setSeg} colors={[C.rd, C.rd2]} />
      <Glass accent={alpha(C.rd, 0.75)} inner={{ padding: 8, gap: 10 }}>
        <View style={{ height: 196, borderRadius: 15, overflow: "hidden" }}>
          <LinearGradient colors={["#1b1630", "#0f1622"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 10 }}>
            <Icon name="scissor" size={36} color={C.rd} stroke={1.4} />
            <Mono color={C.mu}>CLIPS LAND HERE IN PHASE 3</Mono>
          </LinearGradient>
          <View style={{ position: "absolute", left: 10, top: 10 }}>
            <Chip text="CLIP" icon="scissor" fg={C.rd} />
          </View>
        </View>
        <View style={{ paddingHorizontal: 6, paddingBottom: 4, gap: 4 }}>
          <Bold size={14.5}>{seg === 0 ? "No clips yet" : "No recordings yet"}</Bold>
          <Mono>{seg === 0 ? "clips she saves on the PC will list here" : "phone recordings come with phase 3"}</Mono>
        </View>
      </Glass>
    </Screen>
  );
}
