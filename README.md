# Azuka on the iPhone

The phone side of Azuka: pair once with the QR code the PC shows, then talk to her, watch her work, answer her yes/no asks with Face ID, see the PC screen, and drive Spotify and modes from your pocket. Expo SDK 58, React Native, TypeScript. No native code of our own, so a free Apple ID is enough.

## What you need

- Windows PC running Azuka with **Phone link** turned on (Azuka → Settings → Connections). It listens on port 8766.
- **Tailscale** on the PC and on the iPhone, signed into the same account. That is the private link; it also works on the same Wi-Fi without it, or from anywhere through a Cloudflare Tunnel (below).
- An iPhone on iOS 16 or newer, a USB cable, and a free Apple ID.
- No Mac. The app is built by GitHub Actions and signed on the PC with Sideloadly.

## Get the app onto the phone (no Mac)

1. **Build.** Run `phone\build.bat` on the PC: it mirrors the `phone/` folder to the public repo [JayKazma/azuka-phone](https://github.com/JayKazma/azuka-phone). [Codemagic](https://codemagic.io) watches that repo and builds the app on a Mac for free (500 minutes a month on a personal account; a build takes about 15). One-time setup: sign in to Codemagic with GitHub, *Add application* → GitHub → `azuka-phone` → *React Native app* → the `codemagic.yaml` in the repo. After each build, open it on Codemagic and download `Azuka-unsigned.ipa` from its artifacts. A full build is only needed when a native package or `app.json` changes; everything else ships over the air (see "Updating").
2. **Sideloadly.** Install [Sideloadly](https://sideloadly.io) on the PC. Plug the iPhone in over USB and tap *Trust* on the phone. In Sideloadly, drag the ipa in, type your Apple ID, press *Start*. It asks for the Apple ID password once (an app-specific password works if two-factor gets in the way) and signs the ipa with a free development certificate.
3. **Trust the profile.** On the phone: Settings → General → VPN & Device Management → your Apple ID → *Trust*.
4. **Re-sign weekly.** Free certificates last 7 days; after that the app refuses to open until it is signed again. Plug in, press *Start* in Sideloadly on the same ipa; nothing on the phone is lost. A paid developer account makes it a year.
5. **AltStore** is the alternative: install AltServer on the PC, AltStore on the phone, then open the ipa with AltStore. It refreshes the signature on its own while the phone is on the same Wi-Fi as the PC.

What a free account cannot do: push notifications and Live Activities. Those need a paid Apple developer account; until then the app only hears from her while it is open, and anything that happened while it was closed arrives on the Activity tab the next time she is linked.

## Updating

The app checks Expo's update server when it opens and swaps in new JavaScript on its own (Settings → *Update now* forces a check). Publishing an update from the PC:

```
cd C:\Users\ulyss\Azuka\phone
publish.bat
```

One-time setup: a free account at [expo.dev](https://expo.dev), then in `phone/`: `npm install`, `npx eas-cli login`, `npx eas-cli init` (writes the project id into `app.json`; commit it). The first build after that setup must be a full `build.bat` + Sideloadly, because the update client ships inside the native app. From then on only native changes need `build.bat`. The weekly re-sign is unrelated to updates and stays until a paid Apple account.

## Pair

1. Open the app. It starts on **Pair**.
2. On the PC: Azuka → Settings → Connections → Phone → *Pair a phone*. A QR code and a 6 digit code appear.
3. Point the phone at the QR code. It reads `azuka://pair?host=…&port=8766&code=…&name=…`, connects, gets a token, and keeps it in the iPhone keychain. No Mac, no account, nothing leaves your network.
4. If the camera is awkward, *Type it instead*: the PC's Tailscale IP, a `host:port`, or the tunnel hostname (`azuka.example.com`, `https://…` and `wss://…` also work) and the code.

## From anywhere

Without Tailscale, the PC can sit behind a **Cloudflare Tunnel** instead, so the phone reaches it from any network. On the PC, install cloudflared once (`winget install --id Cloudflare.cloudflared`), then in Azuka → Settings → Connections → Phone set **Reach from anywhere**:

- **Quick tunnel**: no account. Azuka starts `cloudflared` and gets a throwaway `https://….trycloudflare.com` address; the card shows it when it is up. The address changes every time the tunnel starts, so pair again when it has (the app keeps the old host until you do). Good for trying it out.
- **Named tunnel**: a stable address. Needs a free Cloudflare account with a domain on it. In Cloudflare Zero Trust → Networks → Tunnels create a tunnel, add a public hostname (say `azuka.example.com`) pointing at `http://127.0.0.1:8766`, copy the tunnel token, and paste the token and hostname into the Phone card's form. Azuka keeps them in `tunnel.json` next to `backend.py`, never in git.

Pair as usual: the QR now carries the tunnel hostname, port 443 and `tls=1`, and the app connects over `wss://`. Settings shows what carries the link (Tunnel, Tailscale or Wi-Fi). While the tunnel is up the PC pairs through it rather than Tailscale, since it works everywhere; a phone already paired keeps the host it paired with until you pair again.

The pill at the top of Home shows the link: **Linked**, **Reconnecting** (backs off 1 → 30 s), **Offline**. The gear opens Settings with the PC name, host, latency, Azuka's version on the PC, *Reconnect* and *Unpair*.

## Screens

- **Home**: her state, a greeting, what is in front on the PC, latency, the "She suggests" card and her pending asks, and tiles for Tourney, Playing, PC and Clips.
- **Control**: the PC screen live over WebRTC while the tab is open (2 fps screenshots until the stream is up or if it cannot be), with latency, bitrate and frame size, Touch and Keys to drive the PC, Clip and Record, a landscape full-screen mode, plus Lock, Volume, Media, Open app, Focus, Modes, Routine and Stop her.
- **Talk** (the purple orb): the chat thread, her step rail while she works, the amber approval card (Allow goes through Face ID first), a text box, and the cyan orb: hold to talk, let go to send. Audio goes up as 16 kHz mono PCM; her replies play as mp3.
- **Play**: Spotify now playing with controls, one-tap modes, and the tourney card.
- **Activity**: everything that needed you or happened while you were away, kept on the phone.
- **Clips**: the replay clips and recordings saved on the PC, with a player, Save to Photos, Share and Delete.

## Live view and control

The Control tab asks the PC for a WebRTC stream of the captured display as soon as it opens and lets it go when you leave the tab or background the app; the picture falls back to 2 fps screenshots while the stream is connecting or if the connection fails. The chip in the corner shows the frame size, fps and latency; tap it to pick Auto, 720p or 1080p. The expand button opens a landscape full-screen view.

**Touch** turns the picture into a trackpad for the PC's cursor, mapped to the real screen even when the video is letterboxed:

| Gesture | Does |
| --- | --- |
| one finger drag | moves the cursor (the finger is the cursor) |
| tap | left click |
| double tap | double click |
| hold 0.5 s | right click |
| two finger drag | scroll |
| two finger tap | middle click |

**Keys** brings up the keyboard: what you type goes to the PC as you type it, Return is Enter, and the row of chips sends Esc, Tab, Ctrl+C, Ctrl+V, Alt+Tab, Win, Enter and the arrow keys.

For either to work, **Phone control** must be on in Azuka → Settings → Connections on the PC. If it is off the PC answers "Phone control is off" and the app drops out of Touch. Control pauses while a game is in front unless you allowed it there; the picture keeps going.

## Clips

The PC keeps a rolling replay buffer of the last 30 seconds of the screen. Say "clip that" to her, or tap **Clip** on the Control tab, and those 30 seconds are saved on the PC; **Record** starts and stops a longer recording. Both land on the Clips screen (the Clips tile on Home shows today's count and the time of the last one, and Activity gets a "Clip saved" row).

Pick a clip to play it; the app pulls the mp4 from the PC over the link the first time and keeps it in its cache. **Save to Photos** writes it to the Photos library (the app asks for add-only access the first time), **Share** opens the iOS share sheet, and the cross deletes it on the PC and the phone. Nothing is uploaded anywhere; the file only travels PC → phone over your own link.

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
- Stream: the phone sends `stream start` (quality auto / 720 / 1080), the PC answers `stream started` with width, height and fps, the phone builds a recvonly `RTCPeerConnection` (STUN `stun.l.google.com:19302`), sends its offer as `stream signal {sdp}`, gets the answer the same way and ICE candidates trickle both ways as `stream signal {candidate}`; `stream stop` ends it.
- Input (only while Touch or Keys is on): `input` ops `move` (x, y normalised 0..1 on the captured display), `down` / `up` / `click` / `dblclick` with `button`, `scroll` (dx, dy in lines, +dy is down), `keys` (`combo` like `ctrl+c`) and `text`.
- Clips: `clips list` → `items` (id, kind clip / recording, name, at, seconds, bytes, thumb), `clips clip` → broadcast `saved`, `clips record {on}` → `recording {on, since}`, `clips get {id}` → `file` chunks (seq, total, base64 ≤ 192 KB) then `file_end {bytes}`, `clips delete {id}` → a fresh list.

## Develop

```
cd phone
npm ci
npm run typecheck
npx expo export --platform ios      # Metro bundle, no Mac needed
```

Running it live on a phone from Windows needs a build from the workflow (or an EAS dev build); Expo Go is not a reliable stand-in for the microphone stream and the camera scanner this app uses.
