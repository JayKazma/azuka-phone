export const C = {
  bg: "#09080d",
  s0: "#0e0c14",
  s1: "#13111b",
  s2: "#1a1724",
  s3: "#221e2f",
  line: "#262036",
  line2: "#342c48",
  tx: "#f1ecfb",
  mu: "#aba2bf",
  dim: "#8f86a3",
  cy: "#5ee6ef",
  pu: "#a36bf0",
  pu2: "#6d3fc0",
  puL: "#c9a6ff",
  am: "#f2b84b",
  am2: "#e0952a",
  gr: "#5fd39a",
  rd: "#ff7a8a",
  rd2: "#d9506a",
  white: "#ffffff",
};

export const F = {
  head: "Outfit_600SemiBold",
  body: "Inter_400Regular",
  bodyM: "Inter_500Medium",
  bodyB: "Inter_600SemiBold",
  mono: "JetBrainsMono_400Regular",
  monoB: "JetBrainsMono_600SemiBold",
};

export const R = { hero: 26, card: 22, tile: 20, row: 18, btn: 14, pill: 999 };
export const SP = { page: 16, gap: 12, tile: 10 };
export const TABBAR_H = 66;
export const TABBAR_BOTTOM = 22;
export const PAGE_BOTTOM = TABBAR_H + TABBAR_BOTTOM + 16;

export function alpha(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}

export const GLASS_FILL: [string, string] = ["rgba(32,27,48,0.78)", "rgba(17,15,25,0.72)"];
export const GLASS_EDGE: [string, string, string] = [alpha(C.pu, 0.55), alpha(C.cy, 0.16), "rgba(255,255,255,0.05)"];
