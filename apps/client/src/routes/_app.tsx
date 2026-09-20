import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState } from "@/platform/browser";
import { Slot, usePathname, useRouter } from '@/hooks/router';
import { Fonts } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { PiClientProvider, type PiClientConfig } from '@aijee/client-sdk';
import { AdaptiveNavigation } from '@/features/navigation/containers/adaptive-navigation';
import { TaskEventSubscriber } from '@/features/tasks/components/task-event-subscriber';
import { TurnEndNotifier } from '@/features/agent/components/turn-end-notifier';
import { PreviewEventSubscriber } from '@/features/preview/components/preview-event-subscriber';
import { usePreviewServiceWorker, usePreviewTokenSync } from '@/features/preview/service-worker';
import { useAuthStore } from '@/features/auth/store';
import { useServersStore } from '@/features/servers/store';
import { useWorkspaceStore } from '@/features/workspace/store';
import MorphLoading from '@/components/ui/morph-loading';
type StartupStatus = 'loading' | 'ready' | 'no-server' | 'offline';
const STARTUP_MAX_RETRIES = 3;
const STARTUP_RETRY_DELAY_MS = 1200;
function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function StartupScreen({
  title,
  description,
  primaryLabel,
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress
}: {
  title: string;
  description: string;
  primaryLabel?: string;
  onPrimaryPress?: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
}) {
  const colors = useThemeTokens();
  return <div className={"flex-1 justify-center items-center p-[24px]"}>
      <div className={"w-full max-w-[420px] pl-[24px] pr-[24px] pt-[28px] pb-[28px] rounded-[24px] border"}>
        <span className={"font-sans text-[24px] leading-[30px]"}>
          {title}
        </span>
        <span className={"mt-[10px] font-sans text-[15px] leading-[22px]"}>
          {description}
        </span>

        {primaryLabel && onPrimaryPress ? <button onClick={onPrimaryPress}>
            <span className={"font-sans text-[15px]"}>
              {primaryLabel}
            </span>
          </button> : null}

        {secondaryLabel && onSecondaryPress ? <button onClick={onSecondaryPress}>
            <span className={"font-sans text-[15px]"}>
              {secondaryLabel}
            </span>
          </button> : null}
      </div>
    </div>;
}
function UnconnectedNotice({
  onAddDevice
}: {
  onAddDevice: () => void;
}) {
  const colors = useThemeTokens();
  return <div className={"flex-1 p-[16px]"}>
      <div className={"self-center w-full max-w-[760px] flex-row items-center justify-between gap-[16px] pl-[18px] pr-[18px] pt-[14px] pb-[14px] rounded-[12px]"}>
        <span className={"flex-1 font-sans text-[14px]"}>
          未连接 AiJee 设备。连接后即可同步工作区与会话。
        </span>
        <button onClick={onAddDevice}>
          <span className={"font-sans text-[14px]"}>添加设备</span>
        </button>
      </div>
    </div>;
}
export default function AppLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const colors = useThemeTokens();
  const serversLoaded = useServersStore(s => s.loaded);
  const bootstrapReady = useServersStore(s => s.bootstrapReady);
  const servers = useServersStore(s => s.servers);
  const authLoaded = useAuthStore(s => s.loaded);
  const activeServerId = useAuthStore(s => s.activeServerId);
  const hasToken = useAuthStore(s => s.hasToken);
  const activateServer = useAuthStore(s => s.activateServer);
  const fetchWorkspaces = useWorkspaceStore(s => s.fetchWorkspaces);
  const switchServer = useWorkspaceStore(s => s.switchServer);
  const accessToken = useAuthStore(s => s.activeServerId ? s.tokens[s.activeServerId]?.accessToken ?? '' : '');
  const serverAddress = useServersStore(s => activeServerId ? s.servers.find(srv => srv.id === activeServerId)?.address ?? '' : '');
  const [status, setStatus] = useState<StartupStatus>('loading');
  const [retryNonce, setRetryNonce] = useState(0);
  const isServerRoute = pathname === '/servers';
  const ensureActiveServerSession = useAuthStore(s => s.ensureActiveServerSession);
  const refreshActiveServerSession = useAuthStore(s => s.refreshActiveServerSession);
  usePreviewServiceWorker();
  usePreviewTokenSync(accessToken || undefined);
  const onAuthError = useCallback(() => {
    // Token expired on the SSE stream — try to refresh silently
    refreshActiveServerSession().then(ok => {
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
  const piClientConfig = useMemo<PiClientConfig>(() => ({
    serverUrl: serverAddress,
    accessToken,
    onAuthError,
    onApiAuthError
  }), [serverAddress, accessToken, onAuthError, onApiAuthError]);
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
    const appStateSubscription = AppState.addEventListener('change', (nextState: "active" | "background" | "inactive") => {
      if (nextState === 'active') {
        syncSessionInBackground();
      }
    });
    if (false) {
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
    const candidate = activeServerId ? servers.find(s => s.id === activeServerId && hasToken(s.id)) : servers.find(s => hasToken(s.id));
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
  }, [serversLoaded, bootstrapReady, authLoaded, activeServerId, servers, hasToken, activateServer, switchServer, fetchWorkspaces, retryNonce]);
  if (!serversLoaded || !authLoaded || !bootstrapReady || status === 'loading') {
    return <div className={"flex-1 justify-center items-center"}>
        <MorphLoading size="lg" />
      </div>;
  }
  if (status === 'offline') {
    if (isServerRoute) {
      return <Slot />;
    }
    return <StartupScreen title="Can’t reach server" description="The selected AiJee computer appears to be offline or unreachable. Check that AiJee is running, then retry, or open the Servers screen to switch to another computer." primaryLabel="Retry" onPrimaryPress={() => setRetryNonce(value => value + 1)} secondaryLabel="Open Servers" onSecondaryPress={() => router.replace('/servers')} />;
  }
  const hasConnection = !!serverAddress && !!accessToken;
  return <PiClientProvider key={serverAddress || 'unconnected'} config={hasConnection ? piClientConfig : undefined}>
      {hasConnection ? <><TaskEventSubscriber /><TurnEndNotifier /><PreviewEventSubscriber /></> : null}
      <AdaptiveNavigation>
        {status === 'no-server' && !isServerRoute ? <UnconnectedNotice onAddDevice={() => router.push('/servers')} /> : <Slot />}
      </AdaptiveNavigation>
    </PiClientProvider>;
}
export const Route = createFileRoute("/_app")({
  component: AppLayout
});
