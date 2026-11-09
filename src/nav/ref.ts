import { createNavigationContainerRef } from "@react-navigation/native";

export type RootParams = {
  Tabs: { screen?: "Home" | "Control" | "Play" | "Activity" } | undefined;
  Talk: { autoTalk?: boolean } | undefined;
  Clips: undefined;
  Settings: undefined;
};

export const navRef = createNavigationContainerRef<RootParams>();

export function go<K extends keyof RootParams>(name: K, params?: RootParams[K]) {
  if (navRef.isReady()) (navRef.navigate as unknown as (n: string, p?: unknown) => void)(name, params);
}
