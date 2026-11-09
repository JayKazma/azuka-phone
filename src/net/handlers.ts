import * as Haptics from "expo-haptics";
import { foregroundApp, type ServerMsg, type StepMsg } from "./protocol";
import { useAzuka } from "../store/useAzuka";
import { playMp3Base64, stopAudio } from "../audio/player";

function humanTool(tool?: string) {
  if (!tool) return "Working";
  const last = tool.split("__").pop() || tool;
  const t = last.replace(/_/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function stepState(m: StepMsg) {
  if (m.state) return m.state;
  if (m.done) return m.failed ? "failed" : "done";
  return "running";
}

function noticeText(t: string) {
  if (t === "unclear") return "I did not catch that";
  if (t === "timeout") return "I heard nothing";
  return t;
}

export function dispatch(msg: ServerMsg) {
  const S = useAzuka.getState();
  switch (msg.type) {
    case "state": {
      S.patch({ state: msg.value });
      if (msg.value === "idle") S.settleSteps();
      break;
    }
    case "ready": S.patch({ ready: true }); break;
    case "settings": S.patch({ settings: msg.values || {} }); break;
    case "reminders": S.patch({ reminders: msg.items || [] }); break;
    case "watches": break;
    case "phone_hello": S.patch({ hello: { name: msg.name, version: msg.version, tailscale: msg.tailscale } }); break;
    case "transcript":
      S.finishStream(S.messages.find((m) => m.id === S.streamId)?.text || "");
      S.clearSteps();
      if (msg.text) S.addMsg("you", msg.text);
      break;
    case "delta": if (msg.text) S.appendDelta(msg.text); break;
    case "reply": {
      if (!S.finishStream(msg.text)) S.addMsg("her", msg.text);
      if (!msg.ack && msg.text) S.addActivity({ kind: "reply", title: "She said", sub: msg.text, needs: false });
      break;
    }
    case "speak":
      if (msg.audio) playMp3Base64(msg.audio).catch(() => {});
      break;
    case "stop_audio": stopAudio(); break;
    case "step":
      if (!msg.id) break;
      S.upsertStep({ id: String(msg.id), title: msg.title || msg.label || humanTool(msg.tool), detail: msg.detail || msg.tool, state: stepState(msg) });
      break;
    case "permission": {
      if (msg.tool === "azuka_suggestion") break;
      S.pushPermission(msg);
      S.addActivity({ kind: "permission", title: "She needs a yes", sub: msg.summary || msg.title || msg.label || humanTool(msg.tool), needs: true, refId: msg.id });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      break;
    }
    case "permission_done": S.dropPermission(msg.id); S.resolveActivity(msg.id, "done", "Settled"); break;
    case "suggest": {
      S.patch({ suggestion: { ...msg, at: Date.now() } });
      S.addActivity({ kind: "suggest", title: "She suggests", sub: msg.text, needs: true, refId: msg.id });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      break;
    }
    case "initiative": {
      if (msg.id && (msg.event === "settled" || msg.event === "did" || msg.event === "expired")) {
        if (S.suggestion?.id === msg.id) S.patch({ suggestion: null });
        S.resolveActivity(msg.id, "done", msg.event === "did" ? "She did it" : "Suggestion closed");
        if (msg.event === "did" && msg.text) S.addMsg("notice", msg.text);
      }
      break;
    }
    case "notice": {
      const t = noticeText(msg.text);
      S.addMsg("notice", t);
      S.showToast(t);
      S.addActivity({ kind: "notice", title: "Notice", sub: t, needs: false });
      break;
    }
    case "reminder": {
      S.addMsg("reminder", msg.text);
      S.addActivity({ kind: "reminder", title: msg.kind === "initiative" ? "She mentioned" : "Reminder", sub: msg.text, needs: false });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      break;
    }
    case "spotify": {
      if (msg.event === "player" || (!msg.event && msg.track !== undefined)) {
        const { type: _t, event: _e, rid: _r, ...now } = msg;
        S.patch({ spotify: { active: !!now.active, is_playing: !!now.is_playing, track: now.track ?? null, progress_ms: now.progress_ms ?? 0, at: now.at ?? Date.now(), device: now.device ?? null, shuffle: now.shuffle, repeat: now.repeat } });
      } else if (msg.event === "error") {
        const e = msg as unknown as { text?: string };
        if (e.text) S.showToast(e.text, "bad");
      }
      break;
    }
    case "modes": if (msg.items) S.patch({ modes: msg.items, activeMode: msg.active ?? null }); break;
    case "health": { const { type: _t, rid: _r, ...rest } = msg; if (Object.keys(rest).length) S.patch({ health: rest }); break; }
    case "game": S.patch({ game: { on: !!msg.on, app: msg.app } }); break;
    case "phone": {
      const m = msg as { op: string } & Record<string, unknown>;
      if (m.op === "status") {
        const { type: _t, op: _o, rid: _r, ...st } = m;
        S.patch({ status: st });
        const g = st.game;
        if (g && typeof g === "object") S.patch({ game: g as { on: boolean; app?: string } });
        else if (typeof g === "boolean") S.patch({ game: { on: g, app: g ? foregroundApp(st.foreground as never) : undefined } });
      } else if (m.op === "screenshot") {
        if (typeof m.jpeg === "string") S.patch({ shot: { uri: `data:image/jpeg;base64,${m.jpeg}`, w: Number(m.w) || 0, h: Number(m.h) || 0, at: Date.now() }, shotError: null });
        else if (m.ok === false) S.patch({ shotError: String(m.error || "No screen right now") });
      } else if ((m.op === "pong" || m.op === "ping") && typeof m.t === "number") {
        S.patch({ latency: Math.max(0, Math.round(Date.now() - m.t)) });
      }
      break;
    }
    case "error": {
      const t = msg.text || msg.error;
      if (t) S.showToast(t, "bad");
      break;
    }
    default: break;
  }
}
