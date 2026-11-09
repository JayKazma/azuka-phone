const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const REV = new Uint8Array(256);
for (let i = 0; i < ABC.length; i++) REV[ABC.charCodeAt(i)] = i;

export function toBase64(bytes: Uint8Array): string {
  let out = "";
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out += ABC[(n >> 18) & 63] + ABC[(n >> 12) & 63] + ABC[(n >> 6) & 63] + ABC[n & 63];
  }
  if (i < bytes.length) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const n = (a << 16) | (b << 8);
    out += ABC[(n >> 18) & 63] + ABC[(n >> 12) & 63] + (i + 1 < bytes.length ? ABC[(n >> 6) & 63] : "=") + "=";
  }
  return out;
}

export function fromBase64(s: string): Uint8Array {
  const clean = s.replace(/[^A-Za-z0-9+/]/g, "");
  const pad = (s.match(/=+$/) || [""])[0].length;
  const len = Math.floor((clean.length * 3) / 4) - pad;
  const out = new Uint8Array(Math.max(0, len));
  let o = 0;
  for (let i = 0; i + 3 < clean.length + 1 && o < len; i += 4) {
    const n = (REV[clean.charCodeAt(i)] << 18) | (REV[clean.charCodeAt(i + 1)] << 12) | (REV[clean.charCodeAt(i + 2)] << 6) | REV[clean.charCodeAt(i + 3)];
    out[o++] = (n >> 16) & 255;
    if (o < len) out[o++] = (n >> 8) & 255;
    if (o < len) out[o++] = n & 255;
  }
  return out;
}
