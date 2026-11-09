import * as SecureStore from "expo-secure-store";
import type { Creds } from "./protocol";

const KEY = "azuka.link";

export async function loadCreds(): Promise<Creds | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Creds;
    if (!c.host || !c.token) return null;
    return c;
  } catch {
    return null;
  }
}

export async function saveCreds(c: Creds): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(c));
}

export async function clearCreds(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}
