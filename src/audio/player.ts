import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { File, Paths } from "expo-file-system";
import { fromBase64 } from "./base64";

let current: AudioPlayer | null = null;
let n = 0;
let modeSet = false;

async function ensureMode() {
  if (modeSet) return;
  modeSet = true;
  try {
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true, shouldPlayInBackground: true, interruptionMode: "mixWithOthers" });
  } catch {}
}

export async function playMp3Base64(b64: string, onDone?: () => void): Promise<void> {
  await ensureMode();
  stopAudio();
  const file = new File(Paths.cache, `azuka-say-${n++ % 8}.mp3`);
  try {
    if (file.exists) file.delete();
    file.create();
    await file.write(fromBase64(b64));
  } catch (e) {
    console.warn("could not write her reply", e);
    return;
  }
  const player = createAudioPlayer({ uri: file.uri });
  current = player;
  const sub = player.addListener("playbackStatusUpdate", (st) => {
    if (st.didJustFinish) {
      sub.remove();
      if (current === player) current = null;
      try { player.release(); } catch {}
      onDone?.();
    }
  });
  player.play();
}

export function stopAudio() {
  const p = current;
  current = null;
  if (!p) return;
  try { p.pause(); } catch {}
  try { p.release(); } catch {}
}

export function isSpeaking() {
  return !!current;
}
