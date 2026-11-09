// The phone <-> Azuka backend protocol. One WebSocket, JSON frames.

export type LinkState = "offline" | "connecting" | "reconnecting" | "linked" | "pairing";

export type Creds = { host: string; port: number; token: string; name: string; id?: string };

export const PAIR_SCHEME = "azuka://pair";

export function pairUrl(host: string, port: number, code: string): string {
  return `ws://${host}:${port}/?pair=${encodeURIComponent(code)}`;
}

export function linkUrl(c: Creds): string {
  return `ws://${c.host}:${c.port}/?t=${encodeURIComponent(c.token)}`;
}

export type PairTarget = { host: string; port: number; code: string; name?: string };

// azuka://pair?host=<ip>&port=8766&code=<6 digits>&name=<pc>
export function parsePairQr(data: string): PairTarget | null {
  const m = /^azuka:\/\/pair\??(.*)$/i.exec(data.trim());
  if (!m) return null;
  const q: Record<string, string> = {};
  for (const part of m[1].split("&")) {
    if (!part) continue;
    const [k, v = ""] = part.split("=");
    q[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, " "));
  }
  if (!q.host || !q.code) return null;
  const port = parseInt(q.port || "8766", 10);
  return { host: q.host, port: Number.isFinite(port) ? port : 8766, code: q.code, name: q.name };
}

export type AzState = "idle" | "listening" | "thinking" | "speaking" | "working" | "offline" | (string & {});

// ---- server -> phone ----

export type Paired = { type: "paired"; token: string; name: string; id?: string };
export type StateMsg = { type: "state"; value: AzState };
export type ReadyMsg = { type: "ready" };
export type SettingsMsg = { type: "settings"; values: Record<string, unknown> };
export type RemindersMsg = { type: "reminders"; items: Reminder[] };
export type WatchesMsg = { type: "watches"; items: unknown[] };
export type HelloMsg = { type: "phone_hello"; name: string; version?: string; tailscale?: boolean };
export type TranscriptMsg = { type: "transcript"; text: string };
export type ReplyMsg = { type: "reply"; text: string; ack?: boolean; did?: unknown; quiet?: boolean };
export type DeltaMsg = { type: "delta"; text: string };
export type SpeakMsg = { type: "speak"; audio?: string; text?: string; id?: string | number; volume?: number };
export type StopAudioMsg = { type: "stop_audio" };
export type StepMsg = {
  type: "step"; id: string; title?: string; label?: string; tool?: string; detail?: string;
  state?: "done" | "running" | "next" | "failed" | "wait"; done?: boolean; failed?: boolean;
};
export type PermissionMsg = {
  type: "permission"; id: string; tool?: string; label?: string; app?: string; summary?: string; detail?: string; title?: string;
};
export type PermissionDoneMsg = { type: "permission_done"; id: string };
export type SuggestMsg = {
  type: "suggest"; id: string; text: string; kind?: string; reason?: string; actions?: unknown; at?: number; expires?: number;
};
export type InitiativeMsg = { type: "initiative"; event: string; id?: string; kind?: string; text?: string | null; choice?: string };
export type NoticeMsg = { type: "notice"; text: string };
export type ReminderMsg = { type: "reminder"; text: string; kind?: string; suggest_id?: string; id?: string };
export type SpotifyEvent = { type: "spotify"; event?: "player" | "error" | string; rid?: string } & Partial<SpotifyPlayer>;
export type ModesMsg = { type: "modes"; rid?: string; items?: Mode[]; active?: string | null; text?: string };
export type HealthMsg = { type: "health"; rid?: string } & Record<string, unknown>;
export type GameMsg = { type: "game"; on: boolean; app?: string };
export type PhoneReply =
  | { type: "phone"; op: "status"; rid?: string } & PhoneStatus
  | { type: "phone"; op: "screenshot"; rid?: string; jpeg: string; w: number; h: number; at?: number }
  | { type: "phone"; op: "pong"; rid?: string; t: number }
  | { type: "phone"; op: string; rid?: string; ok?: boolean; error?: string };
export type ErrorMsg = { type: "error"; text?: string; error?: string };
export type AddonReply = { type: string; op?: string; rid: string; ok?: boolean; error?: string } & Record<string, unknown>;

export type ServerMsg =
  | Paired | StateMsg | ReadyMsg | SettingsMsg | RemindersMsg | WatchesMsg | HelloMsg | TranscriptMsg | ReplyMsg | DeltaMsg
  | SpeakMsg | StopAudioMsg | StepMsg | PermissionMsg | PermissionDoneMsg | SuggestMsg | InitiativeMsg | NoticeMsg | ReminderMsg
  | SpotifyEvent | ModesMsg | HealthMsg | GameMsg | PhoneReply | ErrorMsg;

export type PhoneStatus = {
  pc?: string; foreground?: string; mode?: string | null; game?: { on: boolean; app?: string } | null;
  cpu?: number; gpu_temp?: number; ram_pct?: number; tailscale?: boolean; server_time?: number;
};

export type SpotifyTrack = {
  id?: string; uri?: string; name: string; artists?: string[]; album?: string; art?: string; duration_ms?: number; kind?: string;
};
export type SpotifyPlayer = {
  active: boolean; is_playing: boolean; track: SpotifyTrack | null; progress_ms: number; at?: number;
  device?: { name?: string; volume?: number } | null; shuffle?: boolean; repeat?: string;
};

export type ModeStep = { open?: string; setting?: string; value?: unknown; playlist?: string };
export type Mode = { name: string; label: string; steps?: ModeStep[]; summary?: string; builtin?: boolean };

export type Reminder = { id: string; text: string; fire_at: number; repeat?: string | null };

// ---- phone -> server ----

export type TextOut = { type: "text"; text: string };
export type AudioChunkOut = { type: "phone_audio"; seq: number; pcm: string };
export type AudioEndOut = { type: "phone_audio_end" };
export type InterruptOut = { type: "interrupt" };
export type PermissionReplyOut = { type: "permission_reply"; id: string; allow: boolean };
export type InitiativeAnswerOut = { type: "initiative"; op: "answer"; id: string; choice: "yes" | "not_now"; answer: "yes" | "later"; rid?: string };
export type PhoneOut =
  | { type: "phone"; op: "status"; rid?: string }
  | { type: "phone"; op: "screenshot"; width: number; rid?: string }
  | { type: "phone"; op: "ping"; t: number; rid?: string };
export type SpotifyOut = { type: "spotify"; op: "status" | "player" | "play" | "pause" | "resume" | "next" | "previous" | "subscribe" | "unsubscribe" | "shuffle" | "volume"; rid?: string; value?: unknown };
export type ModesOut = { type: "modes"; op: "list" | "run" | "end"; name?: string; rid?: string };
export type RemindersOut = { type: "reminders"; op: "list"; rid?: string };
export type HealthOut = { type: "health"; op: "now" | "subscribe" | "unsubscribe"; rid?: string };

export type ClientMsg =
  | TextOut | AudioChunkOut | AudioEndOut | InterruptOut | PermissionReplyOut | InitiativeAnswerOut | PhoneOut | SpotifyOut | ModesOut | RemindersOut | HealthOut;
