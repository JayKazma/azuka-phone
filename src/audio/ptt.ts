import { useCallback, useRef, useState } from "react";
import { requestRecordingPermissionsAsync, setAudioModeAsync, useAudioStream } from "expo-audio";
import * as Haptics from "expo-haptics";
import { link } from "../net/link";
import { toBase64 } from "./base64";
import { PCM_CHUNK_BYTES } from "../config";
import { useAzuka } from "../store/useAzuka";
import { stopAudio } from "./player";

// hold to talk: 16 kHz mono int16 PCM, ~250 ms a frame, then phone_audio_end
export function usePushToTalk() {
  const [active, setActive] = useState(false);
  const [level, setLevel] = useState(0);
  const seq = useRef(0);
  const buf = useRef<Uint8Array>(new Uint8Array(0));
  const live = useRef(false);

  const flush = useCallback((all: boolean) => {
    let b = buf.current;
    while (b.length >= PCM_CHUNK_BYTES || (all && b.length > 0)) {
      const take = Math.min(PCM_CHUNK_BYTES, b.length);
      const chunk = b.subarray(0, take);
      link.send({ type: "phone_audio", seq: seq.current++, pcm: toBase64(chunk) });
      b = b.subarray(take);
    }
    buf.current = b;
  }, []);

  const { stream } = useAudioStream({
    sampleRate: 16000,
    channels: 1,
    encoding: "int16",
    onBuffer: (frame) => {
      if (!live.current) return;
      const bytes = new Uint8Array(frame.data);
      const joined = new Uint8Array(buf.current.length + bytes.length);
      joined.set(buf.current, 0);
      joined.set(bytes, buf.current.length);
      buf.current = joined;
      const pcm = new Int16Array(frame.data.slice(0, frame.data.byteLength - (frame.data.byteLength % 2)));
      let sum = 0;
      for (let i = 0; i < pcm.length; i += 4) sum += pcm[i] * pcm[i];
      const rms = Math.sqrt(sum / Math.max(1, pcm.length / 4)) / 32768;
      const lv = Math.min(1, rms * 4);
      setLevel(lv);
      useAzuka.setState({ micLevel: lv });
      flush(false);
    },
  });

  const start = useCallback(async () => {
    if (live.current) return;
    if (!link.isOpen) { useAzuka.getState().showToast("Not linked to the PC", "bad"); return; }
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) { useAzuka.getState().showToast("Microphone access is off", "bad"); return; }
    stopAudio();
    link.send({ type: "interrupt" });
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: "mixWithOthers" });
    } catch {}
    seq.current = 0;
    buf.current = new Uint8Array(0);
    live.current = true;
    setActive(true);
    useAzuka.setState({ talking: true });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await stream.start();
    } catch (e) {
      live.current = false;
      setActive(false);
      useAzuka.setState({ talking: false });
      useAzuka.getState().showToast("The microphone would not start", "bad");
    }
  }, [stream]);

  const stop = useCallback(() => {
    if (!live.current) return;
    live.current = false;
    try { stream.stop(); } catch {}
    flush(true);
    if (seq.current > 0) link.send({ type: "phone_audio_end" });
    setActive(false);
    setLevel(0);
    useAzuka.setState({ talking: false, micLevel: 0 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [stream, flush]);

  return { start, stop, active, level };
}
