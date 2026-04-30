import {
  Tajawal_400Regular,
  Tajawal_500Medium,
  Tajawal_700Bold,
  useFonts,
} from "@expo-google-fonts/tajawal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CampaignsProvider } from "@/hooks/useCampaigns";
import { ChatProvider } from "@/hooks/useChat";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Force dark background to avoid white flash before app renders.
SystemUI.setBackgroundColorAsync("#0A1014").catch(() => {});

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "رجوع",
        contentStyle: { backgroundColor: "#0A1014" },
        headerStyle: { backgroundColor: "#0F1A20" },
        headerTintColor: "#D4A24C",
        headerTitleStyle: {
          fontFamily: "Inter_700Bold",
          fontSize: 17,
          color: "#F5F1E8",
        },
        headerTitleAlign: "center",
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="donate" options={{ title: "تبرع الآن" }} />
      <Stack.Screen name="news" options={{ title: "آخر الأخبار" }} />
      <Stack.Screen name="request-help" options={{ title: "اطلب مساعدة الآن" }} />
      <Stack.Screen name="contact" options={{ title: "تواصل معنا" }} />
      <Stack.Screen name="settings" options={{ title: "إعدادات التطبيق" }} />
      <Stack.Screen name="language" options={{ title: "تغيير اللغة" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular: Tajawal_400Regular,
    Inter_500Medium: Tajawal_500Medium,
    Inter_600SemiBold: Tajawal_500Medium,
    Inter_700Bold: Tajawal_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0A1014" }}>
            <KeyboardProvider>
              <CampaignsProvider>
                <ChatProvider>
                  <StatusBar style="light" />
                  <RootLayoutNav />
                </ChatProvider>
              </CampaignsProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
