import React from "react";
import { ScrollView, StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Backdrop } from "./Backdrop";
import { PAGE_BOTTOM, SP } from "../theme";

type Props = { hue?: string; hue2?: string; tabs?: boolean; scroll?: boolean; style?: StyleProp<ViewStyle>; children?: React.ReactNode };

export function Screen({ hue, hue2, tabs = true, scroll = true, style, children }: Props) {
  const insets = useSafeAreaInsets();
  const pad = { paddingTop: insets.top + 6, paddingHorizontal: SP.page, paddingBottom: tabs ? insets.bottom + PAGE_BOTTOM : insets.bottom + 14 };
  return (
    <View style={s.root}>
      <Backdrop hue={hue} hue2={hue2} />
      {scroll ? (
        <ScrollView contentContainerStyle={[pad, s.col, style]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[s.root, pad, s.col, style]}>{children}</View>
      )}
    </View>
  );
}

export function TitleRow({ eyebrow, title, right }: { eyebrow: React.ReactNode; title: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View style={s.titleRow}>
      <View style={{ gap: 4 }}>
        {eyebrow}
        {title}
      </View>
      {right}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  col: { gap: SP.gap },
  titleRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
});
