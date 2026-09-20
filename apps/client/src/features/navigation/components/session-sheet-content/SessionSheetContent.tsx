import { type ReactNode } from 'react';
import { SquarePen, RefreshCw } from 'lucide-react';
import { Fonts } from '@/constants/theme';
import { SessionActivityIndicator } from '@/features/workspace/components/session-activity-indicator';
import { AnimatedListItem } from '@/components/ui/animated-list-item';
export interface SessionItem {
  id: string;
  display_name?: string | null;
}
interface SessionSheetContentProps {
  title: string;
  subtitle?: string | null;
  sessions: SessionItem[];
  selectedSessionId: string | null;
  isLoading: boolean;
  isRefetching: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  createPending?: boolean;
  newButtonLabel?: string;
  emptyLabel?: string;
  isDark: boolean;
  onNew: () => void;
  onSelect: (id: string) => void;
  onRefresh: () => void;
  onLoadMore: () => void;
  footer?: ReactNode;
}
export function SessionSheetContent({
  title,
  subtitle,
  sessions,
  selectedSessionId,
  isLoading,
  isRefetching,
  hasNextPage,
  isFetchingNextPage,
  createPending = false,
  newButtonLabel = 'New session',
  emptyLabel = 'No sessions yet',
  isDark,
  onNew,
  onSelect,
  onRefresh,
  onLoadMore,
  footer
}: SessionSheetContentProps) {
  const textPrimary = isDark ? '#fefdfd' : '#1a1a1a';
  const textMuted = isDark ? '#cdc8c5' : '#999999';
  const textSecondary = isDark ? '#f1ece8' : '#666666';
  const btnBg = isDark ? '#252525' : '#F0F0F0';
  return <div className="flex flex-col">
      <div className="flex flex-col">
        <div className="flex flex-col">
          <div className="flex flex-col">
            <span>{title}</span>
            {subtitle ? <span>
                {subtitle}
              </span> : null}
          </div>
          <button onClick={onRefresh} disabled={isRefetching}>
            {isRefetching ? <span className="size-3 animate-spin" /> : <RefreshCw size={13} color={textMuted} strokeWidth={1.8} />}
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        <button onClick={onNew} disabled={createPending}>
          {createPending ? <span className="size-3 animate-spin" /> : <SquarePen size={14 as any} color={textPrimary} strokeWidth={1.8} />}
          <span>{newButtonLabel}</span>
        </button>
      </div>

      <div className="flex flex-col">
        {isLoading ? <span className={"mt-[24px]"} /> : sessions.length === 0 ? <span>{emptyLabel}</span> : sessions.map(session => <AnimatedListItem key={session.id}>
              <button onClick={() => onSelect(session.id)}>
                <SessionActivityIndicator sessionId={session.id} color={textMuted} />
                <span>
                  {session.display_name ?? session.id}
                </span>
              </button>
            </AnimatedListItem>)}
        {hasNextPage && <button onClick={onLoadMore} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? <span className="size-3 animate-spin" /> : <span>Load more</span>}
          </button>}
      </div>

      {footer}
    </div>;
}
const styles = {
  container: {
    flex: 1
  },
  header: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 8
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerText: {
    flex: 1
  },
  iconButton: {
    padding: 6
  },
  title: {
    fontSize: 15,
    fontFamily: Fonts.sansSemiBold
  },
  subtitle: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    marginTop: 2
  },
  actions: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 12
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 36,
    borderRadius: 8
  },
  newButtonText: {
    fontSize: 14,
    fontFamily: Fonts.sansMedium
  },
  list: {
    flex: 1
  },
  listContent: {
    paddingLeft: 12,
    paddingRight: 12,
    gap: 2
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 8
  },
  sessionTitle: {
    fontSize: 14,
    fontFamily: Fonts.sans,
    flex: 1
  },
  emptyText: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    textAlign: 'center',
    marginTop: 24
  },
  loadMoreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    borderRadius: 8,
    marginTop: 8
  },
  loadMoreText: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium
  }
} as const;
