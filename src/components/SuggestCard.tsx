import React from "react";
import { View } from "react-native";
import { Glass } from "./Glass";
import { GlowIcon } from "./GlowIcon";
import { Eyebrow, Mono, Body } from "./Text";
import { Primary, Ghost } from "./Buttons";
import { C, alpha } from "../theme";
import { useAzuka } from "../store/useAzuka";
import { link } from "../net/link";
import { ago } from "../util/time";

export function SuggestCard() {
  const sug = useAzuka((s) => s.suggestion);
  if (!sug) return null;
  const answer = (yes: boolean) => {
    const S = useAzuka.getState();
    link.send({ type: "initiative", op: "answer", id: sug.id, choice: yes ? "yes" : "not_now", answer: yes ? "yes" : "later" });
    S.patch({ suggestion: null });
    S.resolveActivity(sug.id, "done", yes ? "You said yes" : "Not now");
  };
  return (
    <Glass accent={alpha(C.pu, 0.9)} inner={{ padding: 14, gap: 12 }}>
      <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
        <GlowIcon icon="spark" color={C.puL} />
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Eyebrow color={C.puL}>She suggests</Eyebrow>
            <Mono>{ago(sug.at)}</Mono>
          </View>
          <Body>{sug.text}</Body>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Primary label="Yes" icon="check" h={42} onPress={() => answer(true)} />
        <Ghost label="Not now" h={42} onPress={() => answer(false)} />
      </View>
    </Glass>
  );
}
