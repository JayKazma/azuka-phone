import * as Updates from "expo-updates";
import { useAzuka } from "../store/useAzuka";

export const UPDATES_ON = Updates.isEnabled && !__DEV__;

export function updateLabel(): string {
  if (!UPDATES_ON) return "development build";
  const id = Updates.updateId ? Updates.updateId.slice(0, 8) : "built-in";
  const when = Updates.createdAt ? ` · ${Updates.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}` : "";
  return `${id}${when}`;
}

/** Ask the update server for a newer bundle and swap to it. True when the app restarts. */
export async function checkForUpdate(manual = true): Promise<boolean> {
  const toast = useAzuka.getState().showToast;
  if (!UPDATES_ON) {
    if (manual) toast("Updates need a published build.");
    return false;
  }
  try {
    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) {
      if (manual) toast("Up to date.");
      return false;
    }
    if (manual) toast("Downloading the update.");
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
    return true;
  } catch (e) {
    if (manual) toast(`Update failed: ${(e as Error).message}`);
    return false;
  }
}
