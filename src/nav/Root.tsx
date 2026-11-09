import React from "react";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { navRef, type RootParams } from "./ref";
import { TabBar } from "../components/TabBar";
import { HomeScreen } from "../screens/HomeScreen";
import { ControlScreen } from "../screens/ControlScreen";
import { PlayScreen } from "../screens/PlayScreen";
import { ActivityScreen } from "../screens/ActivityScreen";
import { TalkScreen } from "../screens/TalkScreen";
import { ClipsScreen } from "../screens/ClipsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { C } from "../theme";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootParams>();

function Tabs() {
  return (
    <Tab.Navigator tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: C.bg } }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Control" component={ControlScreen} />
      <Tab.Screen name="Play" component={PlayScreen} />
      <Tab.Screen name="Activity" component={ActivityScreen} />
    </Tab.Navigator>
  );
}

const theme = { ...DarkTheme, colors: { ...DarkTheme.colors, background: C.bg, card: C.bg, primary: C.cy, text: C.tx, border: C.line } };

export function Root() {
  return (
    <NavigationContainer ref={navRef} theme={theme}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="Talk" component={TalkScreen} options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }} />
        <Stack.Screen name="Clips" component={ClipsScreen} options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: "modal" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
