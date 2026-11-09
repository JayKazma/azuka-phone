import * as Haptics from "expo-haptics";
import { Directory, File, Paths } from "expo-file-system";
import { link } from "./link";
import { epochMs, type ClipItem, type ClipsMsg } from "./protocol";
import { useAzuka, type Download } from "../store/useAzuka";
import { mmss } from "../util/time";
import { CLIP_CHUNK_TIMEOUT_MS } from "../config";

type Job = {
  file: File;
  next: number;
  total: number;
  chain: Promise<void>;
  timer: ReturnType<typeof setTimeout> | null;
  promise: Promise<string>;
  resolve: (uri: string) => void;
  reject: (e: Error) => void;
};

const jobs = new Map<string, Job>();
const S = () => useAzuka.getState();

const safeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, "_");
export const clipsDir = () => new Directory(Paths.cache, "clips");
export const clipFile = (id: string) => new File(clipsDir(), `${safeId(id)}.mp4`);

export function cachedUri(id: string): string | null {
  try { const f = clipFile(id); return f.exists && f.size > 0 ? f.uri : null; } catch { return null; }
}

function setDownload(id: string, p: Partial<Download>) {
  const cur = S().downloads[id] ?? { progress: 0, uri: null, error: null, done: false };
  S().patch({ downloads: { ...S().downloads, [id]: { ...cur, ...p } } });
}

function finish(id: string, err: Error | null) {
  const job = jobs.get(id);
  if (!job) return;
  jobs.delete(id);
  if (job.timer) clearTimeout(job.timer);
  if (err) {
    try { if (job.file.exists) job.file.delete(); } catch {}
    setDownload(id, { error: err.message, done: false, uri: null });
    job.reject(err);
  } else {
    setDownload(id, { progress: 1, done: true, uri: job.file.uri, error: null });
    job.resolve(job.file.uri);
  }
}

function armTimeout(job: Job, id: string) {
  if (job.timer) clearTimeout(job.timer);
  job.timer = setTimeout(() => finish(id, new Error("The PC stopped sending the clip")), CLIP_CHUNK_TIMEOUT_MS);
}

// pulls the mp4 over the socket in base64 chunks and lands it in the cache
export function fetchClip(id: string): Promise<string> {
  const have = cachedUri(id);
  if (have) { setDownload(id, { progress: 1, done: true, uri: have, error: null }); return Promise.resolve(have); }
  const running = jobs.get(id);
  if (running) return running.promise;
  let resolve!: (uri: string) => void;
  let reject!: (e: Error) => void;
  const promise = new Promise<string>((res, rej) => { resolve = res; reject = rej; });
  promise.catch(() => {});
  let file: File;
  try {
    const dir = clipsDir();
    if (!dir.exists) dir.create({ intermediates: true });
    file = clipFile(id);
    if (file.exists) file.delete();
    file.create();
  } catch (e) {
    const err = e instanceof Error ? e : new Error("Could not write to the cache");
    setDownload(id, { error: err.message, done: false, uri: null });
    return Promise.reject(err);
  }
  const job: Job = { file, next: 0, total: 0, chain: Promise.resolve(), timer: null, promise, resolve, reject };
  jobs.set(id, job);
  setDownload(id, { progress: 0, done: false, uri: null, error: null });
  if (!link.send({ type: "clips", op: "get", id })) { finish(id, new Error("Not linked to the PC")); return promise; }
  armTimeout(job, id);
  return promise;
}

export function cancelFetch(id: string) {
  if (jobs.has(id)) finish(id, new Error("Cancelled"));
}

export function requestClips() { link.send({ type: "clips", op: "list" }); }
export function clipNow(): boolean { return link.send({ type: "clips", op: "clip" }); }
export function setRecording(on: boolean): boolean { return link.send({ type: "clips", op: "record", on }); }

export function deleteClip(id: string) {
  cancelFetch(id);
  try { const f = clipFile(id); if (f.exists) f.delete(); } catch {}
  const { [id]: _gone, ...rest } = S().downloads;
  S().patch({ downloads: rest, clips: S().clips.filter((c) => c.id !== id) });
  link.send({ type: "clips", op: "delete", id });
}

function onChunk(m: Extract<ClipsMsg, { op: "file" }>) {
  const job = jobs.get(m.id);
  if (!job) return;
  if (m.seq !== job.next) { finish(m.id, new Error("The clip arrived out of order")); return; }
  job.next = m.seq + 1;
  job.total = m.total || job.total;
  armTimeout(job, m.id);
  const data = m.data;
  job.chain = job.chain.then(async () => {
    if (!jobs.has(m.id)) return;
    await job.file.write(data, { encoding: "base64", append: true });
    if (jobs.has(m.id)) setDownload(m.id, { progress: job.total ? Math.min(0.99, (m.seq + 1) / job.total) : 0 });
  }).catch((e) => finish(m.id, e instanceof Error ? e : new Error("Could not write the clip")));
}

function onEnd(m: Extract<ClipsMsg, { op: "file_end" }>) {
  const job = jobs.get(m.id);
  if (!job) return;
  job.chain = job.chain.then(() => {
    if (!jobs.has(m.id)) return;
    let size = 0;
    try { size = job.file.size; } catch {}
    if (m.bytes && size && size !== m.bytes) { finish(m.id, new Error("The clip came through incomplete")); return; }
    finish(m.id, null);
  });
}

export function onClipsMsg(msg: ClipsMsg) {
  const st = S();
  switch (msg.op) {
    case "list": st.patch({ clips: Array.isArray(msg.items) ? msg.items : [] }); break;
    case "saved": {
      const item: ClipItem = msg.item;
      if (!item?.id) break;
      st.patch({ clips: [item, ...st.clips.filter((c) => c.id !== item.id)], clipFlash: Date.now() });
      st.addActivity({ kind: "clip", title: item.kind === "recording" ? "Recording saved" : "Clip saved", sub: `${item.name} · ${mmss(item.seconds * 1000)}`, needs: false, at: epochMs(item.at) || Date.now() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      break;
    }
    case "recording": st.patch({ recording: { on: !!msg.on, since: msg.on ? epochMs(msg.since) || Date.now() : null } }); break;
    case "file": onChunk(msg); break;
    case "file_end": onEnd(msg); break;
    default: {
      const m = msg as { id?: string; ok?: boolean; error?: string; text?: string };
      const why = m.error || m.text;
      if (m.id && jobs.has(m.id)) finish(m.id, new Error(why || "The PC could not send that clip"));
      else if (m.ok === false && why) st.showToast(why, "bad");
    }
  }
}
