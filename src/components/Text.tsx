import React from "react";
import { Text, TextProps, StyleSheet } from "react-native";
import { C, F } from "../theme";

type P = TextProps & { color?: string; size?: number; children?: React.ReactNode };

export function Eyebrow({ color = C.cy, size = 10.5, style, children, ...rest }: P) {
  return (
    <Text {...rest} style={[s.eyebrow, { color, fontSize: size }, style]}>
      {typeof children === "string" ? children.toUpperCase() : children}
    </Text>
  );
}

export function H1({ size = 30, color = C.tx, style, children, ...rest }: P) {
  return (
    <Text {...rest} style={[s.h1, { fontSize: size, color, lineHeight: size * 1.05 }, style]}>
      {children}
    </Text>
  );
}

export function Head({ size = 21, color = C.tx, style, children, ...rest }: P) {
  return (
    <Text {...rest} style={[{ fontFamily: F.head, fontSize: size, color }, style]}>
      {children}
    </Text>
  );
}

export function Body({ size = 15, color = C.tx, style, children, ...rest }: P) {
  return (
    <Text {...rest} style={[{ fontFamily: F.body, fontSize: size, color, lineHeight: size * 1.4 }, style]}>
      {children}
    </Text>
  );
}

export function Bold({ size = 15, color = C.tx, style, children, ...rest }: P) {
  return (
    <Text {...rest} style={[{ fontFamily: F.bodyB, fontSize: size, color }, style]}>
      {children}
    </Text>
  );
}

export function Mono({ size = 11, color = C.dim, style, children, ...rest }: P) {
  return (
    <Text {...rest} style={[{ fontFamily: F.mono, fontSize: size, color }, style]}>
      {children}
    </Text>
  );
}

const s = StyleSheet.create({
  eyebrow: { fontFamily: F.mono, letterSpacing: 1.9 },
  h1: { fontFamily: F.head, letterSpacing: -0.6 },
});
