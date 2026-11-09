import { AppState } from "react-native";
import { link } from "./link";
import { dispatch } from "./handlers";
import { clearCreds, loadCreds, saveCreds } from "./creds";
import type { Creds, PairTarget } from "./protocol";
import { useAzuka } from "../store/useAzuka";
import { loadActivity, watchActivity } from "../store/activity";
import { PING_EVERY_MS, SCREEN_EVERY_MS, SCREEN_WIDTH, STATUS_EVERY_MS } from "../config";
import { stopAudio } from "../audio/player";
import { PHONE_NAME, SPOTIFY_EVERY_MS } from "../config";

let booted = false;
let statusTimer: ReturnType<typeof setInterval> | null = null;
let pingTimer: ReturnType<typeof setInterval> | null = null;
let spotifyTimer: ReturnType<typeof setInterval> | null = null;
let shotTimer: ReturnType<typeof setInterval> | null = null;
let shotWatchers = 0;

function startPolling() {
  stopPolling();
  const tick = () => { link.send({ type: "phone", op: "status" }); };
  const ping = () => { link.send({ type: "phone", op: "ping", t: Date.now() }); };
  tick(); ping();
  statusTimer = setInterval(tick, STATUS_EVERY_MS);
  pingTimer = setInterval(ping, PING_EVERY_MS);
  spotifyTimer = setInterval(refreshSpotify, SPOTIFY_EVERY_MS);
  if (shotWatchers > 0) startShots();
}

function stopPolling() {
  if (statusTimer) clearInterval(statusTimer);
  if (pingTimer) clearInterval(pingTimer);
  if (spotifyTimer) clearInterval(spotifyTimer);
  statusTimer = null; pingTimer = null; spotifyTimer = null;
  stopShots();
}

function startShots() {
  if (shotTimer) return;
  const grab = () => { link.send({ type: "phone", op: "screenshot", width: SCREEN_WIDTH }); };
  grab();
  shotTimer = setInterval(grab, SCREEN_EVERY_MS);
}

function stopShots() {
  if (shotTimer) clearInterval(shotTimer);
  shotTimer = null;
}

// the Control screen holds this while it is on screen
export function watchScreen(): () => void {
  shotWatchers++;
  if (link.isOpen) startShots();
  return () => {
    shotWatchers = Math.max(0, shotWatchers - 1);
    if (shotWatchers === 0) stopShots();
  };
}

// the PC only pushes Spotify to the panel's Music view, so the phone asks
export async function refreshSpotify() {
  if (!link.isOpen) return;
  try {
    const r = await link.ask("spotify", "player");
    dispatch({ ...(r as object), type: "spotify", event: "player" } as never);
  } catch {}
}

async function afterLink() {
  const S = useAzuka.getState();
  await refreshSpotify();
  try { const r = await link.ask("modes", "list"); S.patch({ modes: (r.items as never) || [], activeMode: (r.active as string | null) ?? null }); } catch {}
  try { const r = await link.ask("reminders", "list"); if (Array.isArray(r.items)) S.patch({ reminders: r.items as never }); } catch {}
}

export async function boot() {
  if (booted) return;
  booted = true;
  await loadActivity();
  watchActivity();
  link.onMessage(dispatch);
  link.onState((st) => {
    useAzuka.getState().setLink(st);
    if (st === "linked") { startPolling(); afterLink(); }
    else { stopPolling(); if (st !== "reconnecting") stopAudio(); }
  });
  AppState.addEventListener("change", (s) => {
    if (s === "active") link.retryNow();
  });
  const creds = await loadCreds();
  useAzuka.getState().setCreds(creds);
  if (creds) link.connect(creds);
}

export async function pairWith(t: PairTarget): Promise<Creds> {
  const S = useAzuka.getState();
  S.setLink("pairing");
  try {
    const got = await link.pair(t.host, t.port, t.code, PHONE_NAME);
    const creds: Creds = { host: t.host, port: t.port, token: got.token, name: got.name || t.name || t.host, id: got.id };
    await saveCreds(creds);
    S.setCreds(creds);
    S.resetSession();
    link.connect(creds);
    return creds;
  } catch (e) {
    S.setLink("offline");
    throw e;
  }
}

export async function unpair() {
  link.disconnect();
  await clearCreds();
  const S = useAzuka.getState();
  S.setCreds(null);
  S.resetSession();
}

export function sendText(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  const S = useAzuka.getState();
  if (!link.send({ type: "text", text: t })) { S.showToast("Not linked to the PC", "bad"); return false; }
  S.clearSteps();
  S.addMsg("you", t);
  return true;
}

export function interrupt() {
  stopAudio();
  link.send({ type: "interrupt" });
}
