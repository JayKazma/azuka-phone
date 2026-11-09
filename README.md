# Azuka on the iPhone

The phone side of Azuka: pair once with the QR code the PC shows, then talk to her, watch her work, answer her yes/no asks with Face ID, see the PC screen, and drive Spotify and modes from your pocket. Expo SDK 58, React Native, TypeScript. No native code of our own, so a free Apple ID is enough.

## What you need

- Windows PC running Azuka with **Phone link** turned on (Azuka → Settings → Connections). It listens on port 8766.
- **Tailscale** on the PC and on the iPhone, signed into the same account. That is the private link; it also works on the same Wi-Fi without it.
- An iPhone on iOS 16 or newer, a USB cable, and a free Apple ID.
- No Mac. The app is built by GitHub Actions and signed on the PC with Sideloadly.

## Get the app onto the phone (no Mac)

1. **Build.** Push anything under `phone/` or run the *iOS app* workflow by hand on GitHub (Actions → iOS app → Run workflow). When it finishes, open the run and download the `Azuka-unsigned.ipa` artifact. Unzip it; inside is `Azuka-unsigned.ipa`.
2. **Sideloadly.** Install [Sideloadly](https://sideloadly.io) on the PC. Plug the iPhone in over USB and tap *Trust* on the phone. In Sideloadly, drag the ipa in, type your Apple ID, press *Start*. It asks for the Apple ID password once (an app-specific password works if two-factor gets in the way) and signs the ipa with a free development certificate.
3. **Trust the profile.** On the phone: Settings → General → VPN & Device Management → your Apple ID → *Trust*.
4. **Re-sign weekly.** Free certificates last 7 days; after that the app refuses to open until it is signed again. Plug in, press *Start* in Sideloadly on the same ipa; nothing on the phone is lost. A paid developer account makes it a year.
5. **AltStore** is the alternative: install AltServer on the PC, AltStore on the phone, then open the ipa with AltStore. It refreshes the signature on its own while the phone is on the same Wi-Fi as the PC.

What a free account cannot do: push notifications and Live Activities. Those need a paid Apple developer account; until then the app only hears from her while it is open, and anything that happened while it was closed arrives on the Activity tab the next time she is linked.

## Pair

1. Open the app. It starts on **Pair**.
2. On the PC: Azuka → Settings → Connections → Phone link → *Show code*. A QR code and a 6 digit code appear.
3. Point the phone at the QR code. It reads `azuka://pair?host=…&port=8766&code=…&name=…`, connects, gets a token, and keeps it in the iPhone keychain. No Mac, no account, nothing leaves your network.
4. If the camera is awkward, *Type it instead*: the PC's Tailscale IP (or `host:port`) and the code.

The pill at the top of Home shows the link: **Linked**, **Reconnecting** (backs off 1 → 30 s), **Offline**. The gear opens Settings with the PC name, host, latency, Azuka's version on the PC, *Reconnect* and *Unpair*.

## Screens

- **Home**: her state, a greeting, what is in front on the PC, latency, the "She suggests" card and her pending asks, and tiles for Tourney, Playing, PC and Clips.
- **Control**: the PC screen at 2 fps while the tab is open, with latency, plus Lock, Volume, Media, Open app, Focus, Modes, Routine and Stop her. Touch, Keys, Clip and Record come in phase 3.
- **Talk** (the purple orb): the chat thread, her step rail while she works, the amber approval card (Allow goes through Face ID first), a text box, and the cyan orb: hold to talk, let go to send. Audio goes up as 16 kHz mono PCM; her replies play as mp3.
- **Play**: Spotify now playing with controls, one-tap modes, and the tourney card.
- **Activity**: everything that needed you or happened while you were away, kept on the phone.
- **Clips**: placeholder until phase 3.

## Siri and the Action Button

The app registers the `azuka://` scheme:

| URL | Does |
| --- | --- |
| `azuka://ask?text=…` | sends the text to her and opens Talk |
| `azuka://talk` | opens Talk and starts listening; tap the orb to send |
| `azuka://home` | opens Home (`control`, `play`, `activity` also work) |
| `azuka://pair?host=…&port=…&code=…&name=…` | pairs |

Two Shortcuts make that voice-friendly. In the Shortcuts app:

**Ask Azuka**
1. New shortcut, name it *Ask Azuka*.
2. Add action **Dictate Text** (stop listening: *After pause*).
3. Add action **Open URLs** with `azuka://ask?text=` and insert the *Dictated Text* variable after the `=`.
4. Done. Say "Hey Siri, Ask Azuka", speak, and it lands in her chat.

**Talk to Azuka**
1. New shortcut, name it *Talk to Azuka*.
2. Add action **Open URLs** with `azuka://talk`.
3. Done.

Action Button (iPhone 15 Pro and newer): Settings → Action Button → *Shortcut* → pick *Talk to Azuka* (or *Ask Azuka*). The Lock Screen's bottom controls and the Control Center can hold the same shortcut.

## Protocol

Everything is in `src/net/protocol.ts`. In short:

- Pair: `ws://host:8766/?pair=<code>` → `{type:"paired", token, name, id}`. Then every connection is `ws://host:8766/?t=<token>`. The phone sends no Origin header.
- On connect the PC sends `state`, `ready`, `settings`, `reminders`, `watches`, `phone_hello` and any open `permission`.
- Rendered: `state`, `transcript`, `delta`, `reply`, `speak` (base64 mp3), `stop_audio`, `step`, `permission` / `permission_done`, `suggest`, `initiative`, `notice`, `reminder`, `spotify` (event `player`), `modes`, `health`, `game`.
- Sent: `text`, `phone_audio` (seq, base64 int16 LE 16 kHz mono, about 250 ms each) then `phone_audio_end`, `interrupt`, `permission_reply`, `initiative` answer, `phone` ops `status` / `screenshot` / `ping`, and the add-on requests `spotify`, `modes`, `reminders`, `health` with a `rid` the PC echoes.

## Develop

```
cd phone
npm ci
npm run typecheck
npx expo export --platform ios      # Metro bundle, no Mac needed
```

Running it live on a phone from Windows needs a dev build, which again comes from the workflow or from EAS; Expo Go does not carry expo-audio's microphone stream or expo-camera's scanner in the shape this app uses.
