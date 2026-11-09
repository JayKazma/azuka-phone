import { AddonReply, ClientMsg, Creds, LinkState, Paired, ServerMsg, linkUrl, pairUrl } from "./protocol";

type MsgFn = (msg: ServerMsg) => void;
type StateFn = (state: LinkState) => void;

const BACKOFF_MIN = 1000;
const BACKOFF_MAX = 30000;

class Link {
  private ws: WebSocket | null = null;
  private creds: Creds | null = null;
  private wanted = false;
  private everUp = false;
  private backoff = BACKOFF_MIN;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private nextRid = 1;
  private pending = new Map<string, { resolve: (m: AddonReply) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  private msgFns = new Set<MsgFn>();
  private stateFns = new Set<StateFn>();
  state: LinkState = "offline";

  onMessage(fn: MsgFn) { this.msgFns.add(fn); return () => { this.msgFns.delete(fn); }; }
  onState(fn: StateFn) { this.stateFns.add(fn); return () => { this.stateFns.delete(fn); }; }

  get isOpen() { return !!this.ws && this.ws.readyState === WebSocket.OPEN; }

  connect(creds: Creds) {
    this.creds = creds;
    this.wanted = true;
    this.everUp = false;
    this.backoff = BACKOFF_MIN;
    this.open();
  }

  disconnect() {
    this.wanted = false;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    const ws = this.ws;
    this.ws = null;
    try { ws?.close(); } catch {}
    this.dropPending("Unlinked.");
    this.setState("offline");
  }

  retryNow() {
    if (!this.wanted || this.isOpen) return;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    this.backoff = BACKOFF_MIN;
    this.open();
  }

  send(msg: ClientMsg | Record<string, unknown>): boolean {
    if (!this.isOpen || !this.ws) return false;
    try { this.ws.send(JSON.stringify(msg)); return true; } catch { return false; }
  }

  ask(type: string, op?: string, data: Record<string, unknown> = {}, timeoutMs = 20000): Promise<AddonReply> {
    return new Promise((resolve, reject) => {
      if (!this.isOpen) { reject(new Error("Not linked.")); return; }
      const rid = `p${this.nextRid++}`;
      const timer = setTimeout(() => { this.pending.delete(rid); reject(new Error("She did not answer in time.")); }, timeoutMs);
      this.pending.set(rid, { resolve, reject, timer });
      const payload: Record<string, unknown> = { type, rid, ...data };
      if (op) payload.op = op;
      if (!this.send(payload)) { clearTimeout(timer); this.pending.delete(rid); reject(new Error("Not linked.")); }
    });
  }

  // first contact: the code from the QR, back comes a token
  pair(host: string, port: number, code: string, timeoutMs = 15000): Promise<Paired> {
    return new Promise((resolve, reject) => {
      let done = false;
      const ws = new WebSocket(pairUrl(host, port, code));
      const timer = setTimeout(() => { if (!done) { done = true; try { ws.close(); } catch {} reject(new Error("The PC did not answer.")); } }, timeoutMs);
      ws.onmessage = (ev) => {
        let msg: ServerMsg;
        try { msg = JSON.parse(String(ev.data)); } catch { return; }
        if (msg.type === "paired") {
          done = true; clearTimeout(timer);
          resolve(msg);
          setTimeout(() => { try { ws.close(); } catch {} }, 100);
        } else if (msg.type === "error") {
          done = true; clearTimeout(timer);
          reject(new Error(msg.text || msg.error || "Pairing was refused."));
          try { ws.close(); } catch {}
        }
      };
      ws.onerror = () => { if (!done) { done = true; clearTimeout(timer); reject(new Error("Could not reach the PC.")); } };
      ws.onclose = () => { if (!done) { done = true; clearTimeout(timer); reject(new Error("The PC closed the link. Check the code.")); } };
    });
  }

  private setState(s: LinkState) {
    if (this.state === s) return;
    this.state = s;
    for (const fn of this.stateFns) { try { fn(s); } catch {} }
  }

  private dropPending(why: string) {
    for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(new Error(why)); }
    this.pending.clear();
  }

  private open() {
    if (!this.creds || !this.wanted) return;
    this.setState(this.everUp ? "reconnecting" : "connecting");
    const ws = new WebSocket(linkUrl(this.creds));
    this.ws = ws;
    ws.onopen = () => {
      if (this.ws !== ws) return;
      this.everUp = true;
      this.backoff = BACKOFF_MIN;
      this.setState("linked");
    };
    ws.onmessage = (ev) => {
      if (this.ws !== ws) return;
      let msg: ServerMsg & { rid?: string };
      try { msg = JSON.parse(String(ev.data)); } catch { return; }
      if (msg.rid !== undefined) {
        const job = this.pending.get(msg.rid);
        if (job) {
          this.pending.delete(msg.rid);
          clearTimeout(job.timer);
          const r = msg as AddonReply;
          if (r.ok === false) job.reject(new Error(r.error || "That failed."));
          else job.resolve(r);
        }
      }
      for (const fn of this.msgFns) { try { fn(msg); } catch (e) { console.warn("handler failed", e); } }
    };
    ws.onerror = () => {};
    ws.onclose = () => {
      if (this.ws !== ws) return;
      this.ws = null;
      this.dropPending("The link dropped.");
      if (!this.wanted) { this.setState("offline"); return; }
      this.setState("reconnecting");
      const wait = this.backoff;
      this.backoff = Math.min(BACKOFF_MAX, this.backoff * 2);
      this.timer = setTimeout(() => { this.timer = null; this.open(); }, wait);
    };
  }
}

export const link = new Link();
