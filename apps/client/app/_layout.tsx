import React, { useEffect, useRef } from "react";
import { Platform } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import Head from "expo-router/head";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  DMSans_400Regular,
  DMSans_400Regular_Italic,
  DMSans_500Medium,
  DMSans_500Medium_Italic,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { JetBrainsMono_400Regular } from "@expo-google-fonts/jetbrains-mono";
import "react-native-reanimated";

import { SafeAreaProvider } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppSettingsStore } from "@/features/settings/store";
import { useAuthStore } from "@/features/auth/store";
import { useServersStore } from "@/features/servers/store";
import { getBootstrapTarget } from "@/features/servers/bootstrap";


SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

export const unstable_settings = {
  anchor: "(app)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const settingsLoaded = useAppSettingsStore((s) => s.loaded);
  const loadSettings = useAppSettingsStore((s) => s.load);
  const authLoaded = useAuthStore((s) => s.loaded);
  const loadAuth = useAuthStore((s) => s.load);
  const serversLoaded = useServersStore((s) => s.loaded);
  const loadServers = useServersStore((s) => s.load);
  const ensureLocalServer = useServersStore((s) => s.ensureLocalServer);
  const setBootstrapReady = useServersStore((s) => s.setBootstrapReady);
  const claimLocalServer = useAuthStore((s) => s.claimLocalServer);
  const authorizeWithCode = useAuthStore((s) => s.authorizeWithCode);
  const bootstrapAttempted = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (!['127.0.0.1', 'localhost'].includes(window.location.hostname) || window.location.port !== '8082') return;
    window.location.replace(`http://127.0.0.1:8081${window.location.pathname}${window.location.search}${window.location.hash}`);
  }, []);

  useEffect(() => {
    if (!settingsLoaded) loadSettings();
  }, [settingsLoaded, loadSettings]);

  useEffect(() => {
    if (!authLoaded) loadAuth();
  }, [authLoaded, loadAuth]);

  useEffect(() => {
    if (!serversLoaded) loadServers();
  }, [serversLoaded, loadServers]);

  useEffect(() => {
    if (!authLoaded || !serversLoaded || bootstrapAttempted.current) return;
    bootstrapAttempted.current = true;
    void (async () => {
      const code = Platform.OS === 'web' && typeof window !== 'undefined' ? new URL(window.location.href).searchParams.get('k') : null;
      if (code && typeof window !== 'undefined') {
        const address = window.location.origin;
        window.history.replaceState({}, '', window.location.pathname || '/');
        const server = await ensureLocalServer(address);
        const result = await authorizeWithCode(address, code, server.id, server.name);
        console.info('[pideck/bootstrap] device code', { success: result.success, error: result.error ?? null });
        setBootstrapReady(true);
        return;
      }
      const target = await getBootstrapTarget();
      console.info('[pideck/bootstrap] target', target.kind);
      if (target.kind === 'local') {
        const server = await ensureLocalServer(target.server.address);
        const claim = await claimLocalServer(server);
        console.info('[pideck/bootstrap] local claim', { success: claim.success, error: claim.error ?? null });
      }
      setBootstrapReady(true);
    })();
  }, [authLoaded, authorizeWithCode, claimLocalServer, ensureLocalServer, serversLoaded, setBootstrapReady]);

  const [fontsLoaded] = useFonts({
    "DMSans-Regular": DMSans_400Regular,
    "DMSans-Italic": DMSans_400Regular_Italic,
    "DMSans-Medium": DMSans_500Medium,
    "DMSans-MediumItalic": DMSans_500Medium_Italic,
    "DMSans-SemiBold": DMSans_600SemiBold,
    "DMSans-Bold": DMSans_700Bold,
    "JetBrainsMono-Regular": JetBrainsMono_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      if (typeof document === 'undefined') return;
      const startup = document.getElementById('pideck-web-startup');
      startup?.classList.add('is-ready');
      const timeout = setTimeout(() => startup?.remove(), 200);
      return () => clearTimeout(timeout);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider style={{ flex: 1 }}>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Head>
            <title>PiDeck</title>
          </Head>
          <Stack>
            <Stack.Screen
              name="(app)"
              options={{ headerShown: false, animation: "none" }}
            />
            <Stack.Screen
              name="connect"
              options={{ headerShown: false, animation: "none" }}
            />
            <Stack.Screen
              name="modal"
              options={{ presentation: "modal", title: "Modal" }}
            />
          </Stack>
          <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
