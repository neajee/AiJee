import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AppState,
  Platform,
  Pressable,
  Text,
  View,
  type AppStateStatus,
} from 'react-native';
import { Redirect, Slot, usePathname, useRouter } from 'expo-router';

import { Fonts } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

import { PiClientProvider, type PiClientConfig } from '@aijee/client-sdk';
import { AdaptiveNavigation } from '@/features/navigation/containers/adaptive-navigation';
import { TaskEventSubscriber } from '@/features/tasks/components/task-event-subscriber';
import { TurnEndNotifier } from '@/features/agent/components/turn-end-notifier';
import { PreviewEventSubscriber } from '@/features/preview/components/preview-event-subscriber';
import { DesktopEventSubscriber } from '@/features/desktop/components/desktop-event-subscriber';
import { usePreviewServiceWorker, usePreviewTokenSync } from '@/features/preview/service-worker';
import { useAuthStore } from '@/features/auth/store';
import { useServersStore } from '@/features/servers/store';
import { useWorkspaceStore } from '@/features/workspace/store';
import MorphLoading from '@/components/ui/morph-loading';

type StartupStatus = 'loading' | 'ready' | 'no-server' | 'offline';

const STARTUP_MAX_RETRIES = 3;
const STARTUP_RETRY_DELAY_MS = 1200;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function StartupScreen({
  title,
  description,
  primaryLabel,
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress,
}: {
  title: string;
  description: string;
  primaryLabel?: string;
  onPrimaryPress?: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
}) {
  const colors = useThemeTokens();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: colors.background,
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 420,
          paddingHorizontal: 24,
          paddingVertical: 28,
          borderRadius: 24,
          borderWidth: 1,
          backgroundColor: colors.surface,
          borderColor: colors.borderStrong,
        }}
      >
        <Text
          style={{
            fontFamily: Fonts.sansSemiBold,
            fontSize: 24,
            lineHeight: 30,
            color: colors.text,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            marginTop: 10,
            fontFamily: Fonts.sans,
            fontSize: 15,
            lineHeight: 22,
            color: colors.textSecondary,
          }}
        >
          {description}
        </Text>

        {primaryLabel && onPrimaryPress ? (
          <Pressable
            onPress={onPrimaryPress}
            style={({ pressed }) => ({
              marginTop: 24,
              borderRadius: 999,
              paddingHorizontal: 18,
              paddingVertical: 14,
              alignItems: 'center',
              backgroundColor: colors.accent,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Text
              style={{
                fontFamily: Fonts.sansSemiBold,
                fontSize: 15,
                color: colors.onAccent,
              }}
            >
              {primaryLabel}
            </Text>
          </Pressable>
        ) : null}

        {secondaryLabel && onSecondaryPress ? (
          <Pressable
            onPress={onSecondaryPress}
            style={({ pressed }) => ({
              marginTop: 12,
              borderRadius: 999,
              paddingHorizontal: 18,
              paddingVertical: 14,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.borderStrong,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Text
              style={{
                fontFamily: Fonts.sansMedium,
                fontSize: 15,
                color: colors.text,
              }}
            >
              {secondaryLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function UnconnectedNotice({ onAddDevice }: { onAddDevice: () => void }) {
  const colors = useThemeTokens();

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: colors.background }}>
      <View style={{ alignSelf: 'center', width: '100%', maxWidth: 760, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.surfaceRaised }}>
        <Text style={{ flex: 1, fontFamily: Fonts.sans, fontSize: 14, color: colors.text }}>
          未连接 AiJee 设备。连接后即可同步工作区与会话。
        </Text>
        <Pressable onPress={onAddDevice} style={({ pressed }) => ({ borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: colors.accent, opacity: pressed ? 0.7 : 1 })}>
          <Text style={{ fontFamily: Fonts.sansSemiBold, fontSize: 14, color: colors.onAccent }}>添加设备</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function AppLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const colors = useThemeTokens();
  const serversLoaded = useServersStore((s) => s.loaded);
  const bootstrapReady = useServersStore((s) => s.bootstrapReady);
  const servers = useServersStore((s) => s.servers);
  const authLoaded = useAuthStore((s) => s.loaded);
  const activeServerId = useAuthStore((s) => s.activeServerId);
  const hasToken = useAuthStore((s) => s.hasToken);
  const activateServer = useAuthStore((s) => s.activateServer);
  const fetchWorkspaces = useWorkspaceStore((s) => s.fetchWorkspaces);
  const switchServer = useWorkspaceStore((s) => s.switchServer);
  const accessToken = useAuthStore((s) =>
    s.activeServerId ? s.tokens[s.activeServerId]?.accessToken ?? '' : '',
  );
  const serverAddress = useServersStore((s) =>
    activeServerId
      ? s.servers.find((srv) => srv.id === activeServerId)?.address ?? ''
      : '',
  );

  const [status, setStatus] = useState<StartupStatus>('loading');
  const [retryNonce, setRetryNonce] = useState(0);
  const isServerRoute = pathname === '/servers';
  const ensureActiveServerSession = useAuthStore((s) => s.ensureActiveServerSession);
  const refreshActiveServerSession = useAuthStore((s) => s.refreshActiveServerSession);

  usePreviewServiceWorker();
  usePreviewTokenSync(accessToken || undefined);

  const onAuthError = useCallback(() => {
    // Token expired on the SSE stream — try to refresh silently
    refreshActiveServerSession().then((ok) => {
      if (!ok) {
        setStatus('offline');
      }
    });
  }, [refreshActiveServerSession]);

  const onApiAuthError = useCallback(async (): Promise<string | null> => {
    const ok = await refreshActiveServerSession();
    if (!ok) return null;
    const state = useAuthStore.getState();
    const sid = state.activeServerId;
    return sid ? state.tokens[sid]?.accessToken ?? null : null;
  }, [refreshActiveServerSession]);

  const piClientConfig = useMemo<PiClientConfig>(
    () => ({
      serverUrl: serverAddress,
      accessToken,
      onAuthError,
      onApiAuthError,
    }),
    [serverAddress, accessToken, onAuthError, onApiAuthError],
  );

  const syncSessionInBackground = useCallback(() => {
    if (!serverAddress || !accessToken) {
      return;
    }

    void ensureActiveServerSession();
  }, [accessToken, ensureActiveServerSession, serverAddress]);

  useEffect(() => {
    if (!serverAddress || !accessToken) {
      return;
    }

    const appStateSubscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          syncSessionInBackground();
        }
      },
    );

    if (Platform.OS !== 'web') {
      return () => {
        appStateSubscription.remove();
      };
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncSessionInBackground();
      }
    };
    const handleWindowFocus = () => {
      syncSessionInBackground();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      appStateSubscription.remove();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [accessToken, serverAddress, syncSessionInBackground]);

  useEffect(() => {
    if (!serversLoaded || !authLoaded || !bootstrapReady) return;

    const candidate = activeServerId
      ? servers.find((s) => s.id === activeServerId && hasToken(s.id))
      : servers.find((s) => hasToken(s.id));

    if (!candidate) {
      setStatus('no-server');
      return;
    }

    let cancelled = false;

    const run = async () => {
      setStatus('loading');

      for (let attempt = 1; attempt <= STARTUP_MAX_RETRIES; attempt += 1) {
        try {
          await switchServer(candidate.id);
          const valid = await activateServer(candidate);
          if (cancelled) return;

          if (!valid) {
            setStatus('no-server');
            return;
          }

          setStatus('ready');
          void fetchWorkspaces(candidate.id);
          return;
        } catch (error) {
          console.warn('[startup] failed to connect to server', error);
        }

        if (attempt < STARTUP_MAX_RETRIES) {
          await wait(STARTUP_RETRY_DELAY_MS * attempt);
        }
      }

      if (!cancelled) {
        setStatus('offline');
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [
    serversLoaded,
    bootstrapReady,
    authLoaded,
    activeServerId,
    servers,
    hasToken,
    activateServer,
    switchServer,
    fetchWorkspaces,
    retryNonce,
  ]);

  if (!serversLoaded || !authLoaded || !bootstrapReady || status === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <MorphLoading size="lg" />
      </View>
    );
  }

  if (status === 'offline') {
    if (isServerRoute) {
      return <Slot />;
    }

    return (
      <StartupScreen
        title="Can’t reach server"
        description="The selected AiJee computer appears to be offline or unreachable. Check that AiJee is running, then retry, or open the Servers screen to switch to another computer."
        primaryLabel="Retry"
        onPrimaryPress={() => setRetryNonce((value) => value + 1)}
        secondaryLabel="Open Servers"
        onSecondaryPress={() => router.replace('/servers')}
      />
    );
  }

  const hasConnection = !!serverAddress && !!accessToken;
  const showNativePairing = status === 'no-server' && Platform.OS !== 'web';
  if (showNativePairing) return <Redirect href="/servers" />;

  return (
    <PiClientProvider key={serverAddress || 'unconnected'} config={hasConnection ? piClientConfig : undefined}>
      {hasConnection ? <><TaskEventSubscriber /><TurnEndNotifier /><PreviewEventSubscriber /><DesktopEventSubscriber /></> : null}
      <AdaptiveNavigation>
        {status === 'no-server' && !isServerRoute ? <UnconnectedNotice onAddDevice={() => router.push('/servers')} /> : <Slot />}
      </AdaptiveNavigation>
    </PiClientProvider>
  );
}
