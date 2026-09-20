import { useCallback, useState } from 'react';
import { usePathname, useRouter } from '@/hooks/router';
import { SquarePen, RefreshCw } from 'lucide-react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { useWorkspaceSessions as useSessions } from '@aijee/client-sdk';
import { SessionActivityIndicator } from '@/features/workspace/components/session-activity-indicator';
import { AnimatedListItem } from '@/components/ui/animated-list-item';
import type { SessionPageProps } from './component-types';
export function SessionPage({
  workspaceId,
  onSessionPress,
  onDismiss
}: SessionPageProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = useThemeTokens();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const pathname = usePathname();
  const selectedSessionId = pathname.match(new RegExp(`/workspace/${workspaceId}/s/([^/]+)`))?.[1] ?? null;
  const textPrimary = isDark ? '#fefdfd' : colors.text;
  const textMuted = isDark ? '#cdc8c5' : colors.textTertiary;
  const btnBg = isDark ? '#252525' : '#F0F0F0';
  const {
    sessions,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching
  } = useSessions(workspaceId);
  const [createPending, setCreatePending] = useState(false);
  const handleNewSession = useCallback(() => {
    if (createPending) return;
    setCreatePending(true);
    router.navigate(`/workspace/${workspaceId}`);
    onDismiss();
    setCreatePending(false);
  }, [createPending, onDismiss, router, workspaceId]);
  return <div className="flex flex-col">
      <div className="flex flex-col">
        <span>Sessions</span>
        <button onClick={() => refetch()} disabled={isRefetching}>
          {isRefetching ? <span className={"w-[13px] h-[13px]" + " size-3 animate-spin"} /> : <RefreshCw size={13} color={textMuted} strokeWidth={1.8} />}
        </button>
      </div>

      <div className="flex flex-col">
        <button onClick={handleNewSession} disabled={createPending}>
          {createPending ? <span className={"w-[14px] h-[14px]" + " size-3 animate-spin"} /> : <SquarePen size={14} color={textPrimary} strokeWidth={1.8} />}
          <span>New session</span>
        </button>
      </div>

      <div className="flex flex-col" nestedScrollEnabled>
        {isLoading ? <span className={"mt-[24px]"} /> : sessions.length === 0 ? <span>No sessions yet</span> : sessions.map(session => <AnimatedListItem key={session.id}>
              <button onClick={() => onSessionPress(session.id)}>
                <SessionActivityIndicator sessionId={session.id} color={textMuted} />
                <span>
                  {session.display_name ?? session.id}
                </span>
              </button>
            </AnimatedListItem>)}
        {hasNextPage && <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? <span className="size-3 animate-spin" /> : <span>Load more</span>}
          </button>}
      </div>
    </div>;
}
