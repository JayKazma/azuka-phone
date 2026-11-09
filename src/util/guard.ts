import * as LocalAuthentication from "expo-local-authentication";

// Face ID before anything that acts on his PC; a phone without biometrics still gets a passcode prompt
export async function confirmIdentity(reason: string): Promise<boolean> {
  try {
    const hw = await LocalAuthentication.hasHardwareAsync();
    const enrolled = hw && (await LocalAuthentication.isEnrolledAsync());
    if (!enrolled) return true;
    const r = await LocalAuthentication.authenticateAsync({ promptMessage: reason, cancelLabel: "Cancel", disableDeviceFallback: false });
    return r.success;
  } catch {
    return false;
  }
}
