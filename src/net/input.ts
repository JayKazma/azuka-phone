import { link } from "./link";
import type { MouseButton } from "./protocol";
import { MOVE_EVERY_MS } from "../config";

let pendingMove: { x: number; y: number } | null = null;
let moveTimer: ReturnType<typeof setTimeout> | null = null;
let lastMoveAt = 0;

const r4 = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 10000) / 10000;

function flushMove() {
  moveTimer = null;
  if (!pendingMove) return;
  lastMoveAt = Date.now();
  link.send({ type: "input", op: "move", x: pendingMove.x, y: pendingMove.y });
  pendingMove = null;
}

export function moveTo(x: number, y: number) {
  pendingMove = { x: r4(x), y: r4(y) };
  const since = Date.now() - lastMoveAt;
  if (since >= MOVE_EVERY_MS && !moveTimer) { flushMove(); return; }
  if (!moveTimer) moveTimer = setTimeout(flushMove, Math.max(1, MOVE_EVERY_MS - since));
}

export function click(button: MouseButton, x: number, y: number, double = false) {
  if (moveTimer) { clearTimeout(moveTimer); moveTimer = null; }
  pendingMove = null;
  link.send({ type: "input", op: double ? "dblclick" : "click", button, x: r4(x), y: r4(y) });
}

export function scroll(dx: number, dy: number) {
  if (!dx && !dy) return;
  link.send({ type: "input", op: "scroll", dx, dy });
}

export function keys(combo: string) {
  link.send({ type: "input", op: "keys", combo });
}

export function text(t: string) {
  if (!t) return;
  link.send({ type: "input", op: "text", text: t });
}
