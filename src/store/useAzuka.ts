import { create } from "zustand";
import type { AzState, Creds, LinkState, Mode, PermissionMsg, PhoneStatus, Reminder, SpotifyPlayer, SuggestMsg } from "../net/protocol";
import { ACTIVITY_MAX } from "../config";

export type ChatRole = "you" | "her" | "notice" | "reminder";
export type ChatMsg = { id: string; role: ChatRole; text: string; at: number; streaming?: boolean };
export type StepState = "done" | "running" | "next" | "failed" | "wait";
export type Step = { id: string; title: string; detail?: string; state: StepState; at: number };
export type Permission = PermissionMsg & { at: number };
export type Suggestion = SuggestMsg & { at: number };
export type ActivityKind = "permission" | "suggest" | "reply" | "notice" | "reminder" | "done" | "clip" | "error";
export type ActivityItem = { id: string; kind: ActivityKind; title: string; sub?: string; at: number; needs: boolean; refId?: string };
export type Toast = { text: string; tone?: "good" | "bad" | "plain" };
export type Shot = { uri: string; w: number; h: number; at: number };
export type Hello = { name: string; version?: string; tailscale?: string | boolean | null };

let seq = 0;
export const uid = () => `${Date.now().toString(36)}${(seq++).toString(36)}`;

type Store = {
  link: LinkState;
  creds: Creds | null;
  hello: Hello | null;
  ready: boolean;
  state: AzState;
  latency: number | null;
  status: PhoneStatus | null;
  shot: Shot | null;
  shotError: string | null;
  messages: ChatMsg[];
  streamId: string | null;
  steps: Step[];
  permissions: Permission[];
  suggestion: Suggestion | null;
  spotify: SpotifyPlayer | null;
  modes: Mode[];
  activeMode: string | null;
  health: Record<string, unknown> | null;
  game: { on: boolean; app?: string } | null;
  reminders: Reminder[];
  settings: Record<string, unknown>;
  activity: ActivityItem[];
  toast: Toast | null;
  micLevel: number;
  talking: boolean;

  setLink: (link: LinkState) => void;
  setCreds: (creds: Creds | null) => void;
  patch: (p: Partial<Store>) => void;
  addMsg: (role: ChatRole, text: string, streaming?: boolean) => string;
  appendDelta: (text: string) => void;
  finishStream: (text: string) => boolean;
  upsertStep: (s: Omit<Step, "at">) => void;
  settleSteps: () => void;
  clearSteps: () => void;
  pushPermission: (p: PermissionMsg) => void;
  dropPermission: (id: string) => void;
  addActivity: (item: Omit<ActivityItem, "id" | "at"> & { at?: number }) => void;
  resolveActivity: (refId: string, kind?: ActivityKind, title?: string) => void;
  hydrateActivity: (items: ActivityItem[]) => void;
  needsYou: () => ActivityItem[];
  showToast: (text: string, tone?: Toast["tone"]) => void;
  resetSession: () => void;
};

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useAzuka = create<Store>((set, get) => ({
  link: "offline",
  creds: null,
  hello: null,
  ready: false,
  state: "offline",
  latency: null,
  status: null,
  shot: null,
  shotError: null,
  messages: [],
  streamId: null,
  steps: [],
  permissions: [],
  suggestion: null,
  spotify: null,
  modes: [],
  activeMode: null,
  health: null,
  game: null,
  reminders: [],
  settings: {},
  activity: [],
  toast: null,
  micLevel: 0,
  talking: false,

  setLink: (link) => set({ link, ...(link === "linked" ? {} : { state: "offline", latency: null }) }),
  setCreds: (creds) => set({ creds }),
  patch: (p) => set(p),

  addMsg: (role, text, streaming) => {
    const id = uid();
    set((s) => ({ messages: [...s.messages.slice(-199), { id, role, text, at: Date.now(), streaming }], streamId: streaming ? id : s.streamId }));
    return id;
  },
  appendDelta: (text) => {
    const { streamId, messages } = get();
    if (!streamId) { get().addMsg("her", text, true); return; }
    set({ messages: messages.map((m) => (m.id === streamId ? { ...m, text: m.text + text } : m)) });
  },
  finishStream: (text) => {
    const { streamId, messages } = get();
    if (!streamId) return false;
    set({ streamId: null, messages: messages.map((m) => (m.id === streamId ? { ...m, text, streaming: false } : m)) });
    return true;
  },
  upsertStep: (st) => {
    const steps = get().steps.slice();
    const i = steps.findIndex((x) => x.id === st.id);
    if (i >= 0) steps[i] = { ...steps[i], ...st };
    else steps.push({ ...st, at: Date.now() });
    set({ steps });
  },
  settleSteps: () => set((s) => ({ steps: s.steps.map((x) => (x.state === "running" || x.state === "wait" ? { ...x, state: "done" } : x)) })),
  clearSteps: () => set({ steps: [] }),
  pushPermission: (p) => set((s) => (s.permissions.some((x) => x.id === p.id) ? {} : { permissions: [...s.permissions, { ...p, at: Date.now() }] })),
  dropPermission: (id) => set((s) => ({ permissions: s.permissions.filter((x) => x.id !== id) })),

  addActivity: (item) =>
    set((s) => ({ activity: [{ id: uid(), at: item.at ?? Date.now(), ...item }, ...s.activity].slice(0, ACTIVITY_MAX) })),
  resolveActivity: (refId, kind, title) =>
    set((s) => ({ activity: s.activity.map((a) => (a.refId === refId && a.needs ? { ...a, needs: false, kind: kind ?? a.kind, title: title ?? a.title } : a)) })),
  hydrateActivity: (items) => set((s) => (s.activity.length ? {} : { activity: items.slice(0, ACTIVITY_MAX) })),
  needsYou: () => get().activity.filter((a) => a.needs),

  showToast: (text, tone = "plain") => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: { text, tone } });
    toastTimer = setTimeout(() => set({ toast: null }), 2600);
  },
  resetSession: () =>
    set({ hello: null, ready: false, state: "offline", latency: null, status: null, shot: null, shotError: null, messages: [], streamId: null, steps: [], permissions: [], suggestion: null, spotify: null, modes: [], activeMode: null, health: null, game: null, reminders: [], settings: {} }),
}));
