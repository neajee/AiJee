import React, { useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet } from "@tanstack/react-router";
import { createRootRoute } from "@tanstack/react-router";
import { SafeAreaProvider } from "@/platform/browser";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { useAppSettingsStore } from "@/features/settings/store";
import { useAuthStore } from "@/features/auth/store";
import { useServersStore } from "@/features/servers/store";
import { getBootstrapTarget } from "@/features/servers/bootstrap";
import { useSettingsMetrics } from "@/components/settings-surface/metrics";
import { useSettingsPalette } from "@/components/settings-surface/palette";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      retry: 1
    }
  }
});
function RootLayout() {
  const colorScheme = useColorScheme();
  const themeTokens = useThemeTokens();
  const themePreset = useAppSettingsStore(s => s.themePreset);
  const uiFontSize = useAppSettingsStore(s => s.uiFontSize);
  const codeFontSize = useAppSettingsStore(s => s.codeFontSize);
  const settingsLoaded = useAppSettingsStore(s => s.loaded);
  const loadSettings = useAppSettingsStore(s => s.load);
  const authLoaded = useAuthStore(s => s.loaded);
  const loadAuth = useAuthStore(s => s.load);
  const serversLoaded = useServersStore(s => s.loaded);
  const loadServers = useServersStore(s => s.load);
  const ensureLocalServer = useServersStore(s => s.ensureLocalServer);
  const setBootstrapReady = useServersStore(s => s.setBootstrapReady);
  const claimLocalServer = useAuthStore(s => s.claimLocalServer);
  const authorizeWithCode = useAuthStore(s => s.authorizeWithCode);
  const metrics = useSettingsMetrics();
  const palette = useSettingsPalette();
  const bootstrapAttempted = useRef(false);
  useEffect(() => {
    if (typeof document === 'undefined') return;
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
      '--gutter': `${metrics.gutter}px`,
      '--group-gap': `${metrics.groupGap}px`,
      '--card-radius': `${metrics.cardRadius}px`,
      '--row-min-height': `${metrics.rowMinHeight}px`,
      '--row-padding-v': `${metrics.rowPaddingV}px`,
      '--tile-size': `${metrics.tileSize}px`,
      '--tile-radius': `${metrics.tileRadius}px`,
      '--label-size': `${metrics.labelSize}px`,
      '--desc-size': `${metrics.descSize}px`,
      '--value-size': `${metrics.valueSize}px`,
      '--header-size': `${metrics.headerSize}px`,
      '--header-inset': `${metrics.headerInset}px`,
      '--title-size': `${metrics.titleSize}px`,
      '--content-max-width': `${metrics.contentMaxWidth ?? 9999}px`,
      '--aijee-card': palette.card,
      '--aijee-muted': palette.tile,
      '--aijee-success': palette.success,
      '--aijee-destructive': palette.destructive,
      '--aijee-on-accent': palette.onAccent,
      '--aijee-overlay': themeTokens.overlay,
      '--bottom-inset': '0px',
      '--row-gap': `${metrics.rowMinHeight > 40 ? 12 : 8}px`
    } as Record<string, string>;
    Object.entries(css).forEach(([key, value]) => root.style.setProperty(key, value));
    root.dataset.aijeeTheme = `${themePreset}-${colorScheme ?? 'light'}`;
    document.body.style.backgroundColor = themeTokens.background;
    document.body.style.color = themeTokens.text;
    document.body.style.fontSize = `${uiFontSize}px`;
    document.body.style.fontFamily = themeTokens.uiFont;
  }, [codeFontSize, colorScheme, metrics, palette, themePreset, themeTokens, uiFontSize]);
  useEffect(() => {
    if (typeof document === 'undefined' || document.getElementById('aijee-web-defaults')) return;
    const style = document.createElement('style');
    style.id = 'aijee-web-defaults';
    style.textContent = 'button { text-align: left; }';
    document.head.appendChild(style);
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
      const code = typeof window !== 'undefined' ? new URL(window.location.href).searchParams.get('k') : null;
      if (code && typeof window !== 'undefined') {
        const address = window.location.origin;
        window.history.replaceState({}, '', window.location.pathname || '/');
        const server = await ensureLocalServer(address);
        const result = await authorizeWithCode(address, code, server.id, server.name);
        console.info('[aijee/bootstrap] device code', {
          success: result.success,
          error: result.error ?? null
        });
        setBootstrapReady(true);
        return;
      }
      const target = await getBootstrapTarget();
      console.info('[aijee/bootstrap] target', target.kind);
      if (target.kind === 'local') {
        const server = await ensureLocalServer(target.server.address);
        const claim = await claimLocalServer(server);
        console.info('[aijee/bootstrap] local claim', {
          success: claim.success,
          error: claim.error ?? null
        });
      }
      setBootstrapReady(true);
    })();
  }, [authLoaded, authorizeWithCode, claimLocalServer, ensureLocalServer, serversLoaded, setBootstrapReady]);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const startup = document.getElementById('aijee-web-startup');
    startup?.classList.add('is-ready');
    const timeout = setTimeout(() => startup?.remove(), 200);
    return () => clearTimeout(timeout);
  }, []);
  return <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <title>AiJee</title>
        <Outlet />
      </SafeAreaProvider>
    </QueryClientProvider>;
}
export const Route = createRootRoute({
  component: RootLayout
});
