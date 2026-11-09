import * as Linking from "expo-linking";
import { go, navRef } from "./ref";
import { parsePairQr } from "../net/protocol";
import { pairWith, sendText } from "../net/session";
import { useAzuka } from "../store/useAzuka";

// azuka://ask?text=...   azuka://talk   azuka://home   azuka://pair?host=&port=&code=&name=[&tls=1]
export function routeUrl(url: string | null | undefined) {
  if (!url || !/^azuka:\/\//i.test(url)) return;
  const rest = url.replace(/^azuka:\/\//i, "");
  const [path, query = ""] = rest.split("?");
  const route = path.replace(/\/+$/, "").toLowerCase();
  const q: Record<string, string> = {};
  for (const part of query.split("&")) {
    if (!part) continue;
    const [k, v = ""] = part.split("=");
    try { q[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, " ")); } catch {}
  }
  const whenReady = (fn: () => void) => {
    if (navRef.isReady()) fn();
    else setTimeout(() => whenReady(fn), 150);
  };
  if (route === "pair") {
    const t = parsePairQr(url);
    if (t) pairWith(t).catch((e) => useAzuka.getState().showToast((e as Error).message, "bad"));
    return;
  }
  if (route === "ask") {
    const text = (q.text || "").trim();
    whenReady(() => {
      go("Talk");
      if (text) setTimeout(() => sendText(text), 200);
    });
    return;
  }
  if (route === "talk") { whenReady(() => go("Talk", { autoTalk: true })); return; }
  if (route === "home" || route === "") { whenReady(() => go("Tabs", { screen: "Home" })); return; }
  if (route === "control" || route === "play" || route === "activity") {
    const screen = (route.charAt(0).toUpperCase() + route.slice(1)) as "Control" | "Play" | "Activity";
    whenReady(() => go("Tabs", { screen }));
  }
}

export function watchUrls(): () => void {
  Linking.getInitialURL().then(routeUrl).catch(() => {});
  const sub = Linking.addEventListener("url", (e) => routeUrl(e.url));
  return () => sub.remove();
}
