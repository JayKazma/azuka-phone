import React from "react";
import Svg, { Path, Rect, Circle } from "react-native-svg";
import { C } from "../theme";

const P: Record<string, React.ReactNode> = {
  home: <><Path d="M3 11 12 4l9 7" /><Path d="M5 10v10h14V10" /></>,
  desk: <><Rect x="3" y="4" width="18" height="12" rx="1.5" /><Path d="M9 20h6" /><Path d="M12 16v4" /></>,
  laptop: <><Rect x="4" y="5" width="16" height="11" rx="1.5" /><Path d="M2 19h20" /></>,
  pad: <><Path d="M6 8h12a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4h-1l-2-2H9l-2 2H6a4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4z" /><Path d="M7 12h3M8.5 10.5v3" /><Path d="M16 11.5h.01M18 13.5h.01" /></>,
  pad2: <><Rect x="4" y="3" width="16" height="18" rx="3" /><Path d="M4 15h16" /><Path d="M12 15v6" /></>,
  bell: <><Path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" /><Path d="M10 21h4" /></>,
  mic: <><Rect x="9" y="3" width="6" height="11" rx="3" /><Path d="M5 11a7 7 0 0 0 14 0" /><Path d="M12 18v3" /><Path d="M9 21h6" /></>,
  search: <><Circle cx="11" cy="11" r="6.5" /><Path d="m20 20-4-4" /></>,
  gear: <><Circle cx="12" cy="12" r="3" /><Path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  lock: <><Rect x="5" y="11" width="14" height="10" rx="2" /><Path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  vol: <><Path d="M11 5 6 9H3v6h3l5 4z" /><Path d="M15.5 8.5a5 5 0 0 1 0 7" /><Path d="M18.5 5.5a9 9 0 0 1 0 13" /></>,
  play: <Path d="M7 5v14l12-7z" />,
  pause: <><Rect x="6" y="5" width="4" height="14" rx="1" /><Rect x="14" y="5" width="4" height="14" rx="1" /></>,
  stop: <Rect x="6" y="6" width="12" height="12" rx="2" />,
  prev: <><Path d="M19 5v14l-10-7z" /><Path d="M6 5v14" /></>,
  next: <><Path d="M5 5v14l10-7z" /><Path d="M18 5v14" /></>,
  shuffle: <><Path d="M16 3h5v5" /><Path d="M4 20 21 3" /><Path d="M21 16v5h-5" /><Path d="m15 15 6 6" /><Path d="M4 4l5 5" /></>,
  apps: <><Rect x="4" y="4" width="6" height="6" rx="1.5" /><Rect x="14" y="4" width="6" height="6" rx="1.5" /><Rect x="4" y="14" width="6" height="6" rx="1.5" /><Rect x="14" y="14" width="6" height="6" rx="1.5" /></>,
  focus: <><Circle cx="12" cy="12" r="3" /><Path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></>,
  bolt: <Path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  kbd: <><Rect x="2" y="6" width="20" height="12" rx="2" /><Path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" /></>,
  scissor: <><Circle cx="6" cy="6" r="3" /><Circle cx="6" cy="18" r="3" /><Path d="M20 4 8.1 15.9" /><Path d="M14.5 14.5 20 20" /><Path d="M8.1 8.1 12 12" /></>,
  rec: <><Circle cx="12" cy="12" r="8" /><Circle cx="12" cy="12" r="3.5" fill="currentColor" /></>,
  spark: <><Path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><Path d="m12 7 1.6 3.4L17 12l-3.4 1.6L12 17l-1.6-3.4L7 12l3.4-1.6z" /></>,
  check: <Path d="m5 12 5 5L20 7" />,
  trophy: <><Path d="M8 4h8v5a4 4 0 0 1-8 0z" /><Path d="M8 6H5v1a3 3 0 0 0 3 3" /><Path d="M16 6h3v1a3 3 0 0 1-3 3" /><Path d="M12 13v4" /><Path d="M8 21h8" /><Path d="M9 17h6v4H9z" /></>,
  music: <><Path d="M9 18V6l11-2v12" /><Circle cx="6" cy="18" r="3" /><Circle cx="17" cy="16" r="3" /></>,
  cpu: <><Rect x="6" y="6" width="12" height="12" rx="2" /><Rect x="10" y="10" width="4" height="4" /><Path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" /></>,
  face: <><Path d="M4 8V6a2 2 0 0 1 2-2h2" /><Path d="M16 4h2a2 2 0 0 1 2 2v2" /><Path d="M20 16v2a2 2 0 0 1-2 2h-2" /><Path d="M8 20H6a2 2 0 0 1-2-2v-2" /><Path d="M9 9v1" /><Path d="M15 9v1" /><Path d="M12 9v4h-1" /><Path d="M9 16c1.6 1.2 4.4 1.2 6 0" /></>,
  down: <><Path d="M12 4v12" /><Path d="m6 10 6 6 6-6" /><Path d="M4 20h16" /></>,
  down2: <Path d="m6 9 6 6 6-6" />,
  up2: <Path d="m6 15 6-6 6 6" />,
  back: <Path d="m15 6-6 6 6 6" />,
  expand: <><Path d="M4 9V4h5" /><Path d="M20 9V4h-5" /><Path d="M4 15v5h5" /><Path d="M20 15v5h-5" /></>,
  plus: <Path d="M12 5v14M5 12h14" />,
  x: <Path d="M6 6l12 12M18 6 6 18" />,
  code: <><Path d="m8 8-4 4 4 4" /><Path d="m16 8 4 4-4 4" /><Path d="m14 5-4 14" /></>,
  screen: <><Rect x="3" y="5" width="18" height="12" rx="2" /><Path d="M8 21h8" /></>,
  out: <><Path d="M14 4h6v6" /><Path d="M20 4 10 14" /><Path d="M18 13v7H4V6h7" /></>,
  camera: <><Path d="M4 8h3l2-3h6l2 3h3v11H4z" /><Circle cx="12" cy="13" r="3.5" /></>,
  link: <><Path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><Path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  phone: <><Rect x="7" y="2" width="10" height="20" rx="2.5" /><Path d="M11 18h2" /></>,
  text: <><Path d="M4 6h16" /><Path d="M4 12h10" /><Path d="M4 18h7" /></>,
  send: <><Path d="M21 3 10 14" /><Path d="M21 3 14 21l-4-7-7-4z" /></>,
  clock: <><Circle cx="12" cy="12" r="8" /><Path d="M12 8v4l3 2" /></>,
  dots: <><Circle cx="5" cy="12" r="1.5" fill="currentColor" /><Circle cx="12" cy="12" r="1.5" fill="currentColor" /><Circle cx="19" cy="12" r="1.5" fill="currentColor" /></>,
};

export type IconName = keyof typeof P;

type Props = { name: IconName; size?: number; color?: string; stroke?: number };

export function Icon({ name, size = 18, color = C.tx, stroke = 2 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" color={color}>
      {P[name]}
    </Svg>
  );
}
