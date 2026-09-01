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
  DMSans_500Medium,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import "react-native-reanimated";

import { SafeAreaProvider } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
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
  const themeTokens = useThemeTokens();
  const themePreset = useAppSettingsStore((s) => s.themePreset);
  const uiFontSize = useAppSettingsStore((s) => s.uiFontSize);
  const codeFontSize = useAppSettingsStore((s) => s.codeFontSize);
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
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const root = document.documentElement;
    const css = {
      '--aijee-background': themeTokens.background,
      '--aijee-surface': themeTokens.surface,
      '--aijee-surface-raised': themeTokens.surfaceRaised,
      '--aijee-text': themeTokens.text,
      '--aijee-text-secondary': themeTokens.textSecondary,
      '--aijee-border': themeTokens.border,
      '--aijee-accent': themeTokens.accent,
      '--aijee-code-background': themeTokens.code,
      '--aijee-code-text': themeTokens.codeText,
      '--aijee-ui-font-size': `${uiFontSize}px`,
      '--aijee-code-font-size': `${codeFontSize}px`,
      '--aijee-ui-font-family': themeTokens.uiFont,
      '--aijee-code-font-family': themeTokens.codeFont,
    } as Record<string, string>;
    Object.entries(css).forEach(([key, value]) => root.style.setProperty(key, value));
    root.dataset.aijeeTheme = `${themePreset}-${colorScheme ?? 'light'}`;
    document.body.style.backgroundColor = themeTokens.background;
    document.body.style.color = themeTokens.text;
    document.body.style.fontSize = `${uiFontSize}px`;
  }, [codeFontSize, colorScheme, themePreset, themeTokens, uiFontSize]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const expoPort = process.env.EXPO_PUBLIC_AIJEE_EXPO_PORT ?? '8082';
    const webPort = process.env.EXPO_PUBLIC_AIJEE_WEB_PORT ?? '8081';
    if (!['127.0.0.1', 'localhost'].includes(window.location.hostname) || window.location.port !== expoPort) return;
    window.location.replace(`http://127.0.0.1:${webPort}${window.location.pathname}${window.location.search}${window.location.hash}`);
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
        console.info('[aijee/bootstrap] device code', { success: result.success, error: result.error ?? null });
        setBootstrapReady(true);
        return;
      }
      const target = await getBootstrapTarget();
      console.info('[aijee/bootstrap] target', target.kind);
      if (target.kind === 'local') {
        const server = await ensureLocalServer(target.server.address);
        const claim = await claimLocalServer(server);
        console.info('[aijee/bootstrap] local claim', { success: claim.success, error: claim.error ?? null });
      }
      setBootstrapReady(true);
    })();
  }, [authLoaded, authorizeWithCode, claimLocalServer, ensureLocalServer, serversLoaded, setBootstrapReady]);

  const [fontsLoaded] = useFonts({
    "DMSans-Regular": DMSans_400Regular,
    "DMSans-Medium": DMSans_500Medium,
    "DMSans-Bold": DMSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      if (typeof document === 'undefined') return;
      const startup = document.getElementById('aijee-web-startup');
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
            <title>AiJee</title>
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
