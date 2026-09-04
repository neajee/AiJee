import { useCallback, useEffect, useMemo } from 'react';
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PiClientProvider, type PiClientConfig } from '@aijee/client-sdk';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { useAuthStore } from '@/features/auth/store';
import { useServersStore } from '@/features/servers/store';
import { useWorkspaceStore } from '@/features/workspace/store';

export default function MobileRootLayout() {
  const colors = useThemeTokens();
  const authLoaded = useAuthStore((state) => state.loaded);
  const serversLoaded = useServersStore((state) => state.loaded);
  const activeServerId = useAuthStore((state) => state.activeServerId);
  const servers = useServersStore((state) => state.servers);
  const accessToken = useAuthStore((state) =>
    state.activeServerId ? state.tokens[state.activeServerId]?.accessToken ?? '' : '',
  );
  const activateServer = useAuthStore((state) => state.activateServer);
  const refreshActiveServerSession = useAuthStore((state) => state.refreshActiveServerSession);
  const fetchWorkspaces = useWorkspaceStore((state) => state.fetchWorkspaces);
  const activeServer = activeServerId
    ? servers.find((server) => server.id === activeServerId)
    : undefined;
  const onAuthError = useCallback(() => {
    void refreshActiveServerSession();
  }, [refreshActiveServerSession]);
  const onApiAuthError = useCallback(async () => {
    const refreshed = await refreshActiveServerSession();
    if (!refreshed) return null;
    const state = useAuthStore.getState();
    return state.activeServerId ? state.tokens[state.activeServerId]?.accessToken ?? null : null;
  }, [refreshActiveServerSession]);
  const clientConfig = useMemo<PiClientConfig>(() => ({
    serverUrl: activeServer?.address ?? '',
    accessToken,
    onAuthError,
    onApiAuthError,
  }), [accessToken, activeServer?.address, onApiAuthError, onAuthError]);

  useEffect(() => {
    if (!authLoaded || !serversLoaded || !activeServer) return;
    let cancelled = false;
    void activateServer(activeServer).then((valid) => {
      if (valid && !cancelled) void fetchWorkspaces(activeServer.id);
    });
    return () => {
      cancelled = true;
    };
  }, [activateServer, activeServer, authLoaded, fetchWorkspaces, serversLoaded]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.root, { backgroundColor: colors.background }]}
    >
      <PiClientProvider
        key={activeServer?.id ?? 'unconnected'}
        config={activeServer && accessToken ? clientConfig : undefined}
      >
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </PiClientProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
