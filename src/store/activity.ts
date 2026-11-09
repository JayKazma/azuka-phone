import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityItem, useAzuka } from "./useAzuka";

const KEY = "azuka.activity";
let timer: ReturnType<typeof setTimeout> | null = null;

export async function loadActivity(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return;
    const items = JSON.parse(raw) as ActivityItem[];
    if (Array.isArray(items)) useAzuka.getState().hydrateActivity(items);
  } catch {}
}

export function watchActivity(): () => void {
  return useAzuka.subscribe((s, prev) => {
    if (s.activity === prev.activity) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      AsyncStorage.setItem(KEY, JSON.stringify(s.activity)).catch(() => {});
    }, 400);
  });
}

export async function clearActivity(): Promise<void> {
  useAzuka.setState({ activity: [] });
  await AsyncStorage.removeItem(KEY).catch(() => {});
}
