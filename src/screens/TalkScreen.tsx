import React, { useEffect, useRef, useState } from "react";
import { Animated, FlatList, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Backdrop } from "../components/Backdrop";
import { Glass } from "../components/Glass";
import { Avatar } from "../components/Avatar";
import { RoundBtn } from "../components/Buttons";
import { Icon } from "../components/Icon";
import { Bold, Mono, Body } from "../components/Text";
import { Dot } from "../components/Chip";
import { StepRail, stepCount } from "../components/StepRail";
import { PermissionStack } from "../components/PermissionCard";
import { SuggestCard } from "../components/SuggestCard";
import { C, F, alpha } from "../theme";
import { useAzuka, type ChatMsg } from "../store/useAzuka";
import { interrupt, sendText } from "../net/session";
import { usePushToTalk } from "../audio/ptt";
import { stateLabel } from "./HomeScreen";
import type { RootParams } from "../nav/ref";

const face = require("../../assets/azuka-avatar.png");

function Bubble({ m }: { m: ChatMsg }) {
  if (m.role === "you") {
    return (
      <View style={{ alignItems: "flex-end" }}>
        <LinearGradient colors={[C.pu, C.pu2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.you}>
          <Text style={s.youText}>{m.text}</Text>
        </LinearGradient>
      </View>
    );
  }
  if (m.role === "notice" || m.role === "reminder") {
    return (
      <View style={{ alignItems: "center", paddingVertical: 2 }}>
        <Mono color={m.role === "reminder" ? C.am : C.dim} style={{ textAlign: "center" }}>{m.text}</Mono>
      </View>
    );
  }
  return (
    <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end", maxWidth: "88%" }}>
      <Image source={face} style={{ width: 26, height: 26, borderRadius: 13 }} />
      <Glass radius={20} shadow={false} inner={{ paddingHorizontal: 14, paddingVertical: 11, borderBottomLeftRadius: 6 }} style={{ flexShrink: 1 }}>
        <Body>{m.text || "…"}</Body>
      </Glass>
    </View>
  );
}

type Props = NativeStackScreenProps<RootParams, "Talk">;

export function TalkScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const messages = useAzuka((st) => st.messages);
  const steps = useAzuka((st) => st.steps);
  const state = useAzuka((st) => st.state);
  const link = useAzuka((st) => st.link);
  const creds = useAzuka((st) => st.creds);
  const [text, setText] = useState("");
  const [latched, setLatched] = useState(false);
  const list = useRef<FlatList<ChatMsg>>(null);
  const ptt = usePushToTalk();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(pulse, { toValue: ptt.level, duration: 90, useNativeDriver: true }).start();
  }, [ptt.level, pulse]);

  useEffect(() => {
    if (route.params?.autoTalk) {
      setLatched(true);
      ptt.start();
      navigation.setParams({ autoTalk: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.autoTalk]);

  useEffect(() => {
    const t = setTimeout(() => list.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [messages.length, steps.length]);

  const [label, color] = stateLabel(state, link);
  const busy = link === "linked" && state !== "idle";
  const sub = [label.toLowerCase(), steps.length && busy ? stepCount(steps) : null, creds?.name].filter(Boolean).join(" · ");

  const submit = () => {
    if (sendText(text)) setText("");
  };

  const orbIn = () => { if (latched) return; ptt.start(); };
  const orbOut = () => { if (latched) return; ptt.stop(); };
  const orbTap = () => { if (latched) { ptt.stop(); setLatched(false); } };

  return (
    <View style={{ flex: 1 }}>
      <Backdrop hue={C.rd} hue2={C.pu} />
      <View style={[s.head, { paddingTop: insets.top + 6 }]}>
        <RoundBtn icon="back" onPress={() => navigation.goBack()} />
        <Avatar size={44} color={color} pct={busy ? 75 : 100} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Bold size={16}>Azuka</Bold>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Dot color={color} size={6} />
            <Mono color={color} numberOfLines={1}>{sub}</Mono>
          </View>
        </View>
        {busy ? (
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); interrupt(); }} style={s.stop}>
            <Icon name="stop" size={13} color={C.rd} stroke={2.4} />
            <Text style={{ fontFamily: F.bodyB, fontSize: 13, color: C.rd }}>Stop</Text>
          </Pressable>
        ) : null}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>
        <FlatList
          ref={list}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <Bubble m={item} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 10 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60, gap: 8 }}>
              <Mono color={C.dim}>{link === "linked" ? "SHE IS LISTENING" : "HER PC IS OUT OF REACH"}</Mono>
            </View>
          }
          ListFooterComponent={
            <View style={{ gap: 10 }}>
              <StepRail />
              <PermissionStack />
              <SuggestCard />
            </View>
          }
          keyboardShouldPersistTaps="handled"
        />

        <View style={[s.dock, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {ptt.active ? (
            <View style={s.listening}>
              <Dot color={C.cy} size={6} />
              <Mono color={C.cy}>{latched ? "LISTENING · TAP TO SEND" : "LISTENING"}</Mono>
            </View>
          ) : null}
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <Glass radius={26} shadow={false} style={{ flex: 1, height: 52 }} inner={{ flexDirection: "row", alignItems: "center", gap: 10, paddingLeft: 16, paddingRight: 6 }}>
              <TextInput
                value={text}
                onChangeText={setText}
                onSubmitEditing={submit}
                returnKeyType="send"
                placeholder="Message Azuka"
                placeholderTextColor={C.dim}
                style={s.input}
                blurOnSubmit={false}
              />
              <RoundBtn icon={text.trim() ? "send" : "plus"} onPress={text.trim() ? submit : () => useAzuka.getState().showToast("Attachments come later")} />
            </Glass>
            <Pressable
              onPressIn={orbIn}
              onPressOut={orbOut}
              onPress={orbTap}
              delayLongPress={120}
              accessibilityLabel="Hold to talk"
              style={{ width: 52, height: 52, alignItems: "center", justifyContent: "center" }}
            >
              <Animated.View style={[s.meter, { transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) }], opacity: ptt.active ? 0.5 : 0 }]} />
              <LinearGradient colors={ptt.active ? ["#ffd7dd", C.rd, C.rd2] : ["#a8f3f8", C.cy, "#2aa9b3"]} locations={[0, 0.5, 1]} start={{ x: 0.3, y: 0.2 }} end={{ x: 0.8, y: 1 }} style={s.orb}>
                <Icon name="mic" size={21} color={C.bg} stroke={2.3} />
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingBottom: 8 },
  stop: { height: 36, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: alpha(C.rd, 0.4), backgroundColor: alpha(C.rd, 0.1), flexDirection: "row", alignItems: "center", gap: 6 },
  you: { maxWidth: "82%", paddingHorizontal: 14, paddingVertical: 11, borderRadius: 20, borderBottomRightRadius: 6, shadowColor: C.pu2, shadowOpacity: 0.45, shadowRadius: 11, shadowOffset: { width: 0, height: 8 } },
  youText: { fontFamily: F.body, fontSize: 15, lineHeight: 21, color: C.white },
  dock: { paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  listening: { alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 6, height: 24, paddingHorizontal: 10, borderRadius: 999, backgroundColor: alpha(C.cy, 0.1), borderWidth: 1, borderColor: alpha(C.cy, 0.3) },
  input: { flex: 1, minWidth: 0, fontFamily: F.body, fontSize: 15, color: C.tx, height: 50 },
  meter: { position: "absolute", width: 52, height: 52, borderRadius: 26, backgroundColor: alpha(C.rd, 0.5) },
  orb: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", shadowColor: C.cy, shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
});
