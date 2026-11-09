import React, { useMemo, useRef } from "react";
import { PanResponder, StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from "react-native";
import * as Haptics from "expo-haptics";
import { click, moveTo, scroll } from "../net/input";
import { LONG_PRESS_MS, SCROLL_LINE_PX, TAP_MS, TAP_SLOP_PX } from "../config";

type Props = { streamW: number; streamH: number; enabled: boolean };
type Pt = { x: number; y: number };

// finger position -> 0..1 in the captured display, allowing for the letterbox of a "contain" fit
function toScreen(p: Pt, vw: number, vh: number, sw: number, sh: number): Pt {
  const w = sw > 0 ? sw : vw;
  const h = sh > 0 ? sh : vh;
  const scale = Math.min(vw / w, vh / h);
  const dw = w * scale;
  const dh = h * scale;
  const ox = (vw - dw) / 2;
  const oy = (vh - dh) / 2;
  return { x: Math.min(1, Math.max(0, (p.x - ox) / dw)), y: Math.min(1, Math.max(0, (p.y - oy) / dh)) };
}

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

export function TouchPad({ streamW, streamH, enabled }: Props) {
  const size = useRef({ w: 1, h: 1 });
  const stream = useRef({ w: streamW, h: streamH });
  stream.current = { w: streamW, h: streamH };
  const g = useRef({
    start: 0, startPos: { x: 0, y: 0 }, last: { x: 0, y: 0 }, moved: false, fingers: 1, longFired: false,
    longTimer: null as ReturnType<typeof setTimeout> | null,
    centroid: null as Pt | null, twoMoved: false, scrollAcc: 0,
    tap: null as { at: number; pos: Pt; timer: ReturnType<typeof setTimeout> } | null,
  });

  const norm = (p: Pt) => toScreen(p, size.current.w, size.current.h, stream.current.w, stream.current.h);

  const touchesOf = (evt: GestureResponderEvent): Pt[] =>
    evt.nativeEvent.touches.map((t) => ({ x: t.locationX, y: t.locationY }));

  const clearLong = () => { const s = g.current; if (s.longTimer) { clearTimeout(s.longTimer); s.longTimer = null; } };

  const tap = (pos: Pt) => {
    const s = g.current;
    const now = Date.now();
    const n = norm(pos);
    if (s.tap && now - s.tap.at < TAP_MS && dist(s.tap.pos, pos) < TAP_SLOP_PX * 2) {
      clearTimeout(s.tap.timer);
      s.tap = null;
      click("left", n.x, n.y, true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      return;
    }
    if (s.tap) clearTimeout(s.tap.timer);
    s.tap = {
      at: now, pos,
      timer: setTimeout(() => { s.tap = null; click("left", n.x, n.y); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); }, TAP_MS),
    };
  };

  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (evt) => {
      const s = g.current;
      const pts = touchesOf(evt);
      const p = pts[0] ?? { x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY };
      s.start = Date.now();
      s.startPos = p;
      s.last = p;
      s.moved = false;
      s.fingers = Math.max(1, pts.length);
      s.longFired = false;
      s.centroid = null;
      s.twoMoved = false;
      s.scrollAcc = 0;
      clearLong();
      if (s.fingers === 1) {
        const n = norm(p);
        moveTo(n.x, n.y);
        s.longTimer = setTimeout(() => {
          s.longTimer = null;
          if (s.moved || s.fingers !== 1) return;
          s.longFired = true;
          const q = norm(s.last);
          click("right", q.x, q.y);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        }, LONG_PRESS_MS);
      }
    },
    onPanResponderMove: (evt) => {
      const s = g.current;
      const pts = touchesOf(evt);
      if (pts.length >= 2) {
        s.fingers = Math.max(s.fingers, pts.length);
        clearLong();
        const c = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
        if (s.centroid) {
          const dy = c.y - s.centroid.y;
          if (Math.abs(dy) > 1 || dist(c, s.centroid) > TAP_SLOP_PX) s.twoMoved = true;
          s.scrollAcc += -dy / SCROLL_LINE_PX;
          const lines = s.scrollAcc > 0 ? Math.floor(s.scrollAcc) : Math.ceil(s.scrollAcc);
          if (lines !== 0) { scroll(0, lines); s.scrollAcc -= lines; }
        }
        s.centroid = c;
        s.last = c;
        return;
      }
      if (s.fingers >= 2) return;
      const p = pts[0];
      if (!p) return;
      s.last = p;
      if (!s.moved && dist(p, s.startPos) > TAP_SLOP_PX) { s.moved = true; clearLong(); }
      if (s.moved && !s.longFired) { const n = norm(p); moveTo(n.x, n.y); }
    },
    onPanResponderRelease: () => {
      const s = g.current;
      clearLong();
      const held = Date.now() - s.start;
      if (s.fingers >= 2) {
        if (!s.twoMoved && held < TAP_MS + 100 && s.centroid) {
          const n = norm(s.centroid);
          click("middle", n.x, n.y);
          Haptics.selectionAsync().catch(() => {});
        }
        return;
      }
      if (s.longFired || s.moved) return;
      if (held < TAP_MS + 100) tap(s.startPos);
    },
    onPanResponderTerminate: () => { clearLong(); },
  }), []);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    size.current = { w: Math.max(1, width), h: Math.max(1, height) };
  };

  if (!enabled) return null;
  return <View onLayout={onLayout} style={StyleSheet.absoluteFill} {...pan.panHandlers} />;
}
