import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { Outfit_600SemiBold } from "@expo-google-fonts/outfit/600SemiBold";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { JetBrainsMono_400Regular } from "@expo-google-fonts/jetbrains-mono/400Regular";
import { JetBrainsMono_600SemiBold } from "@expo-google-fonts/jetbrains-mono/600SemiBold";
import { Root } from "./src/nav/Root";
import { PairScreen } from "./src/screens/PairScreen";
import { Toast } from "./src/components/Toast";
import { useAzuka } from "./src/store/useAzuka";
import { boot } from "./src/net/session";
import { watchUrls } from "./src/nav/urls";
import { C } from "./src/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsOk] = useFonts({ Outfit_600SemiBold, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, JetBrainsMono_400Regular, JetBrainsMono_600SemiBold });
  const [booted, setBooted] = useState(false);
  const creds = useAzuka((s) => s.creds);

  useEffect(() => {
    boot().finally(() => setBooted(true));
  }, []);

  useEffect(() => {
    if (fontsOk && booted) SplashScreen.hideAsync().catch(() => {});
  }, [fontsOk, booted]);

  useEffect(() => {
    if (!booted) return;
    return watchUrls();
  }, [booted]);

  if (!fontsOk || !booted) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar style="light" />
        {creds ? <Root /> : <PairScreen />}
        <Toast />
      </View>
    </SafeAreaProvider>
  );
}
