import React, { useState } from "react";
import { View } from "react-native";
import * as Haptics from "expo-haptics";
import { Glass } from "./Glass";
import { GlowIcon } from "./GlowIcon";
import { Bold, Mono } from "./Text";
import { Primary, Ghost } from "./Buttons";
import { C, alpha } from "../theme";
import { useAzuka, type Permission } from "../store/useAzuka";
import { link } from "../net/link";
import { confirmIdentity } from "../util/guard";
import type { IconName } from "./Icon";

function iconFor(tool?: string): IconName {
  const t = (tool || "").toLowerCase();
  if (t.includes("key") || t.includes("type")) return "kbd";
  if (t.includes("click") || t.includes("mouse")) return "pad2";
  if (t.includes("open") || t.includes("launch")) return "apps";
  if (t.includes("screen") || t.includes("capture")) return "screen";
  if (t.includes("mode")) return "pad";
  if (t.includes("lock")) return "lock";
  return "bolt";
}

function title(p: Permission) {
  return p.summary || p.title || p.label || (p.tool ? `${p.tool.split("__").pop()?.replace(/_/g, " ")}?` : "Allow this?");
}

export function PermissionCard({ p }: { p: Permission }) {
  const [busy, setBusy] = useState(false);
  const reply = async (allow: boolean) => {
    if (busy) return;
    setBusy(true);
    if (allow) {
      const ok = await confirmIdentity("Allow Azuka to act on your PC");
      if (!ok) { setBusy(false); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}); return; }
    }
    const S = useAzuka.getState();
    link.send({ type: "permission_reply", id: p.id, allow });
    S.dropPermission(p.id);
    S.resolveActivity(p.id, "done", allow ? "You allowed it" : "You said no");
    Haptics.notificationAsync(allow ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => {});
    setBusy(false);
  };
  const detail = p.detail || [p.tool, p.app].filter(Boolean).join(" → ");
  return (
    <Glass accent={alpha(C.am, 0.9)} glow={C.am} inner={{ padding: 14, gap: 12 }}>
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        <GlowIcon icon={iconFor(p.tool)} color={C.am} size={40} />
        <View style={{ flex: 1, gap: 2 }}>
          <Bold size={15.5}>{title(p)}</Bold>
          {detail ? <Mono size={11.5} color={C.mu}>{detail}</Mono> : null}
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Primary label="Allow" icon="face" colors={[C.am, C.am2]} fg={C.bg} onPress={() => reply(true)} disabled={busy} />
        <Ghost label="Deny" onPress={() => reply(false)} disabled={busy} />
      </View>
    </Glass>
  );
}

export function PermissionStack() {
  const perms = useAzuka((s) => s.permissions);
  if (!perms.length) return null;
  return <PermissionCard p={perms[0]} />;
}
