// The phone <-> Azuka backend protocol. One WebSocket, JSON frames.

export type LinkState = "offline" | "connecting" | "reconnecting" | "linked" | "pairing";

// tls: the PC is behind a Cloudflare Tunnel, so the socket is wss on 443 and TLS is Cloudflare's
export type Creds = { host: string; port: number; token: string; name: string; id?: string; tls?: boolean };

export const PAIR_SCHEME = "azuka://pair";

export function socketBase(host: string, port: number, tls?: boolean): string {
  return `${tls ? "wss" : "ws"}://${host}:${port}`;
}

// name is this phone's name; the PC keeps it next to the token it hands out
export function pairUrl(host: string, port: number, code: string, name: string, tls?: boolean): string {
  return `${socketBase(host, port, tls)}/?pair=${encodeURIComponent(code)}&name=${encodeURIComponent(name)}`;
}

export function linkUrl(c: Creds): string {
  return `${socketBase(c.host, c.port, c.tls)}/?t=${encodeURIComponent(c.token)}`;
}

export type PairTarget = { host: string; port: number; code: string; name?: string; tls?: boolean };

// azuka://pair?host=<ip or hostname>&port=8766&code=<6 digits>&name=<pc>[&tls=1]
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
  const tls = q.tls === "1" || q.tls === "true";
  const port = parseInt(q.port || (tls ? "443" : "8766"), 10);
  return { host: q.host, port: Number.isFinite(port) ? port : tls ? 443 : 8766, code: q.code, name: q.name, tls };
}

export type HostEntry = { host: string; port: number; tls: boolean };

// what he types by hand: "100.64.0.12", "host:8766", "azuka.example.com:443",
// "https://azuka.example.com" or "wss://azuka.example.com"
export function parseHostEntry(text: string, defaultPort: number): HostEntry | null {
  let s = text.trim();
  if (!s) return null;
  let tls = false;
  const scheme = /^([a-z]+):\/\//i.exec(s);
  if (scheme) {
    const sch = scheme[1].toLowerCase();
    tls = sch === "https" || sch === "wss";
    s = s.slice(scheme[0].length);
  }
  s = s.split("/")[0];
  const at = s.lastIndexOf(":");
  let host = s;
  let port = tls ? 443 : defaultPort;
  if (at > 0 && /^\d+$/.test(s.slice(at + 1))) {
    host = s.slice(0, at);
    port = parseInt(s.slice(at + 1), 10);
  }
  host = host.toLowerCase();
  if (!host || !/^[a-z0-9.-]+$/.test(host)) return null;
  if (port === 443 && !scheme) tls = true;
  return { host, port, tls };
}

export type HostKind = "tunnel" | "tailscale" | "wifi";

// what carries the link: a tunnel (tls), the tailnet (100.64.0.0/10), else the home network
export function hostKind(c: Pick<Creds, "host" | "tls">): HostKind {
  if (c.tls) return "tunnel";
  const m = /^100\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/.exec(c.host);
  if (m) {
    const second = parseInt(m[1], 10);
    if (second >= 64 && second <= 127) return "tailscale";
  }
  return "wifi";
}

export const HOST_KIND_LABEL: Record<HostKind, string> = { tunnel: "Tunnel", tailscale: "Tailscale", wifi: "Wi-Fi" };

export type AzState = "idle" | "listening" | "thinking" | "speaking" | "working" | "offline" | (string & {});

// ---- server -> phone ----

export type Paired = { type: "paired"; token: string; name: string; id?: string };
export type StateMsg = { type: "state"; value: AzState };
export type ReadyMsg = { type: "ready" };
export type SettingsMsg = { type: "settings"; values: Record<string, unknown> };
export type RemindersMsg = { type: "reminders"; items: Reminder[] };
export type WatchesMsg = { type: "watches"; items: unknown[] };
export type HelloMsg = { type: "phone_hello"; name: string; version?: string; tailscale?: string | boolean | null; phone?: string };
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
  | { type: "phone"; op: "ping" | "pong"; rid?: string; t: number; pong?: boolean; server_time?: number }
  | { type: "phone"; op: string; rid?: string; ok?: boolean; error?: string };
export type ErrorMsg = { type: "error"; text?: string; error?: string };
export type AddonReply = { type: string; op?: string; rid: string; ok?: boolean; error?: string } & Record<string, unknown>;

export type ServerMsg =
  | Paired | StateMsg | ReadyMsg | SettingsMsg | RemindersMsg | WatchesMsg | HelloMsg | TranscriptMsg | ReplyMsg | DeltaMsg
  | SpeakMsg | StopAudioMsg | StepMsg | PermissionMsg | PermissionDoneMsg | SuggestMsg | InitiativeMsg | NoticeMsg | ReminderMsg
  | SpotifyEvent | ModesMsg | HealthMsg | GameMsg | PhoneReply | StreamMsg | ClipsMsg | ErrorMsg;

export type Foreground = string | { app?: string | null; title?: string | null } | null;
export type PhoneStatus = {
  pc?: string; foreground?: Foreground; mode?: string | null; game?: boolean | { on: boolean; app?: string } | null; busy?: boolean;
  cpu?: number | null; gpu_temp?: number | null; ram_pct?: number | null; tailscale?: string | boolean | null; listening?: string | null;
  phones?: number; version?: string; server_time?: number;
};

export function foregroundApp(f: Foreground | undefined): string {
  if (!f) return "";
  if (typeof f === "string") return f;
  return (f.app || f.title || "").replace(/\.exe$/i, "");
}

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
export type SpotifyOut = { type: "spotify"; op: "status" | "player" | "play" | "pause" | "resume" | "next" | "previous" | "volume"; rid?: string; value?: unknown };
export type ModesOut = { type: "modes"; op: "list" | "run" | "end"; name?: string; rid?: string };
export type RemindersOut = { type: "reminders"; op: "list"; rid?: string };
export type HealthOut = { type: "health"; op: "now" | "subscribe" | "unsubscribe"; rid?: string };

export type ClientMsg =
  | TextOut | AudioChunkOut | AudioEndOut | InterruptOut | PermissionReplyOut | InitiativeAnswerOut | PhoneOut | SpotifyOut | ModesOut | RemindersOut | HealthOut
  | StreamOut | InputOut | ClipsOut;

// ---- live view, input, clips ----

export type StreamQuality = "auto" | "720" | "1080";
export type SdpInit = { type: "offer" | "answer" | "pranswer" | "rollback"; sdp: string };
export type IceInit = { candidate: string; sdpMid: string | null; sdpMLineIndex: number | null };
export type StreamMsg =
  | { type: "stream"; op: "started"; width: number; height: number; fps: number }
  | { type: "stream"; op: "signal"; sdp?: SdpInit; candidate?: IceInit }
  | { type: "stream"; op: "stopped" }
  | { type: "stream"; op: "error"; ok?: boolean; error?: string; text?: string };
export type StreamOut =
  | { type: "stream"; op: "start"; quality: StreamQuality }
  | { type: "stream"; op: "signal"; sdp?: SdpInit; candidate?: IceInit }
  | { type: "stream"; op: "stop" };

export type MouseButton = "left" | "right" | "middle";
export type InputOut =
  | { type: "input"; op: "move"; x: number; y: number }
  | { type: "input"; op: "down" | "up" | "click" | "dblclick"; button: MouseButton; x: number; y: number }
  | { type: "input"; op: "scroll"; dx: number; dy: number }
  | { type: "input"; op: "keys"; combo: string }
  | { type: "input"; op: "text"; text: string };

export type ClipKind = "clip" | "recording";
// at: unix time of the clip (seconds); thumb: base64 jpeg
export type ClipItem = { id: string; kind: ClipKind; name: string; at: number; seconds: number; bytes: number; thumb: string | null };
export type ClipsMsg =
  | { type: "clips"; op: "list"; items: ClipItem[] }
  | { type: "clips"; op: "saved"; item: ClipItem }
  | { type: "clips"; op: "recording"; on: boolean; since?: number | null }
  | { type: "clips"; op: "file"; id: string; seq: number; total: number; data: string }
  | { type: "clips"; op: "file_end"; id: string; bytes: number }
  | { type: "clips"; op: "error"; id?: string; ok?: boolean; error?: string; text?: string };
export type ClipsOut =
  | { type: "clips"; op: "list" }
  | { type: "clips"; op: "clip" }
  | { type: "clips"; op: "record"; on: boolean }
  | { type: "clips"; op: "get"; id: string }
  | { type: "clips"; op: "delete"; id: string };

// the PC may stamp seconds or milliseconds
export function epochMs(t: number | null | undefined): number {
  if (!t) return 0;
  return t > 1e12 ? t : t * 1000;
}

