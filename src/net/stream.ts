import { AppState } from "react-native";
import { MediaStream, RTCIceCandidate, RTCPeerConnection, RTCSessionDescription } from "react-native-webrtc";
import { link } from "./link";
import type { IceInit, StreamMsg, StreamQuality } from "./protocol";
import { useAzuka, idleStream, type Stream } from "../store/useAzuka";
import { STREAM_START_TIMEOUT_MS, STREAM_STATS_EVERY_MS } from "../config";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

let watchers = 0;
let wanted = false;
let gen = 0;
let pc: RTCPeerConnection | null = null;
let quality: StreamQuality = "auto";
let pendingIce: IceInit[] = [];
let startTimer: ReturnType<typeof setTimeout> | null = null;
let statsTimer: ReturnType<typeof setInterval> | null = null;
let lastBytes = 0;
let lastStatsAt = 0;
let wired = false;

const S = () => useAzuka.getState();
const patchStream = (p: Partial<Stream>) => S().patch({ stream: { ...S().stream, ...p } });

function wire() {
  if (wired) return;
  wired = true;
  link.onState((st) => {
    if (!wanted) return;
    if (st === "linked") start();
    else { teardown(); patchStream({ state: "connecting", url: null, kbps: null }); }
  });
  AppState.addEventListener("change", (s) => {
    if (!wanted) return;
    if (s === "active") start();
    else stop();
  });
}

// the Control screen holds this while it is on screen
export function watchStream(): () => void {
  wire();
  watchers++;
  wanted = true;
  if (link.isOpen) start();
  return () => {
    watchers = Math.max(0, watchers - 1);
    if (watchers === 0) { wanted = false; stop(); }
  };
}

export function streamQuality() { return quality; }

export function setStreamQuality(q: StreamQuality) {
  quality = q;
  if (wanted) start();
}

export function restartStream() { if (wanted) start(); }

function start() {
  if (!wanted || !link.isOpen) return;
  if (pc || startTimer) link.send({ type: "stream", op: "stop" });
  teardown();
  const myGen = ++gen;
  patchStream({ state: "connecting", url: null, kbps: null, error: null });
  if (!link.send({ type: "stream", op: "start", quality })) { fail("Not linked"); return; }
  startTimer = setTimeout(() => { if (gen === myGen) fail("The PC did not start the stream"); }, STREAM_START_TIMEOUT_MS);
}

function stop() {
  if (pc || startTimer) link.send({ type: "stream", op: "stop" });
  teardown();
  gen++;
  if (wanted) patchStream({ state: "connecting", url: null, kbps: null });
  else S().patch({ stream: idleStream() });
}

function teardown() {
  if (startTimer) { clearTimeout(startTimer); startTimer = null; }
  if (statsTimer) { clearInterval(statsTimer); statsTimer = null; }
  pendingIce = [];
  lastBytes = 0;
  lastStatsAt = 0;
  const old = pc;
  pc = null;
  if (old) { try { old.close(); } catch {} }
}

function fail(why: string) {
  teardown();
  patchStream({ state: "failed", url: null, kbps: null, error: why });
}

async function onStarted(width: number, height: number, fps: number) {
  if (startTimer) { clearTimeout(startTimer); startTimer = null; }
  if (pc) { try { pc.close(); } catch {} pc = null; }
  pendingIce = [];
  const myGen = gen;
  patchStream({ width, height, fps });
  let conn: RTCPeerConnection;
  try {
    conn = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  } catch (e) {
    fail("Live view is not available in this build");
    return;
  }
  pc = conn;
  conn.addTransceiver("video", { direction: "recvonly" });
  conn.addEventListener("track", (ev) => {
    if (pc !== conn || gen !== myGen) return;
    const stream = ev.streams[0] ?? (ev.track ? new MediaStream([ev.track]) : null);
    if (stream) patchStream({ url: stream.toURL(), state: "live", error: null });
  });
  conn.addEventListener("icecandidate", (ev) => {
    if (pc !== conn || !ev.candidate) return;
    const c = ev.candidate;
    link.send({ type: "stream", op: "signal", candidate: { candidate: c.candidate, sdpMid: c.sdpMid ?? null, sdpMLineIndex: c.sdpMLineIndex ?? null } });
  });
  conn.addEventListener("connectionstatechange", () => {
    if (pc !== conn || gen !== myGen) return;
    const st = conn.connectionState;
    if (st === "connected") { if (S().stream.url) patchStream({ state: "live", error: null }); startStats(conn, myGen); }
    else if (st === "failed" || st === "closed") fail("The live view dropped");
    else if (st === "disconnected") patchStream({ state: "connecting" });
  });
  try {
    const offer = await conn.createOffer({});
    if (pc !== conn) return;
    await conn.setLocalDescription(offer);
    if (pc !== conn) return;
    link.send({ type: "stream", op: "signal", sdp: { type: offer.type, sdp: offer.sdp } });
  } catch (e) {
    fail("Could not offer the stream");
  }
}

async function onSignal(m: Extract<StreamMsg, { op: "signal" }>) {
  const conn = pc;
  if (!conn) return;
  try {
    if (m.sdp) {
      await conn.setRemoteDescription(new RTCSessionDescription(m.sdp));
      if (pc !== conn) return;
      const queued = pendingIce;
      pendingIce = [];
      for (const c of queued) await conn.addIceCandidate(new RTCIceCandidate(c));
    }
    if (m.candidate) {
      if (conn.remoteDescription) await conn.addIceCandidate(new RTCIceCandidate(m.candidate));
      else pendingIce.push(m.candidate);
    }
  } catch (e) {
    console.warn("signal failed", e);
  }
}

function startStats(conn: RTCPeerConnection, myGen: number) {
  if (statsTimer) return;
  statsTimer = setInterval(async () => {
    if (pc !== conn || gen !== myGen) return;
    try {
      const report = await conn.getStats();
      let bytes = 0;
      let fps: number | undefined;
      let w: number | undefined;
      let h: number | undefined;
      report.forEach((st: Record<string, unknown>) => {
        if (st.type === "inbound-rtp" && (st.kind === "video" || st.mediaType === "video")) {
          bytes = Number(st.bytesReceived) || 0;
          if (typeof st.framesPerSecond === "number") fps = st.framesPerSecond;
          if (typeof st.frameWidth === "number") w = st.frameWidth;
          if (typeof st.frameHeight === "number") h = st.frameHeight;
        }
      });
      const now = Date.now();
      const p: Partial<Stream> = {};
      if (lastStatsAt) p.kbps = Math.max(0, Math.round(((bytes - lastBytes) * 8) / ((now - lastStatsAt) / 1000) / 1000));
      if (fps !== undefined) p.fps = Math.round(fps);
      if (w && h) { p.frameWidth = w; p.frameHeight = h; }
      lastBytes = bytes;
      lastStatsAt = now;
      if (pc === conn) patchStream(p);
    } catch {}
  }, STREAM_STATS_EVERY_MS);
}

export function onStreamMsg(msg: StreamMsg) {
  switch (msg.op) {
    case "started":
      if (!wanted) { link.send({ type: "stream", op: "stop" }); return; }
      onStarted(Number(msg.width) || 0, Number(msg.height) || 0, Number(msg.fps) || 0);
      break;
    case "signal": onSignal(msg); break;
    case "stopped": if (wanted && pc) fail("The PC stopped the stream"); break;
    default: {
      const m = msg as { ok?: boolean; error?: string; text?: string };
      if (m.ok === false || m.error || m.text) fail(m.error || m.text || "The stream failed");
    }
  }
}
