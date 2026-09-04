import { Text, View } from 'tamagui';
import { useEffect, useState } from 'react';
import { Spinner } from 'tamagui';

import { useWorkspaceStore } from '@/features/workspace/store';
import { useWorkspaceSessions as useSessions } from '@aijee/client-sdk';
import { AnimatedListItem } from '@/components/ui/animated-list-item';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { SessionRow } from './session-row';
import { MoreRow } from './more-row';
import { SESSION_PREVIEW_COUNT } from '../constants';
import { styles } from '../styles';

export function WorkspaceSessions({ workspaceId, selectedSessionId, onSelect, onArchived, isDark }: { workspaceId: string; selectedSessionId: string | null; onSelect: (workspaceId: string, sessionId: string) => void; onArchived: (workspaceId: string, sessionId: string) => void; isDark: boolean }) {
  const colors = useThemeTokens();
  const [showAll, setShowAll] = useState(false);
  const { sessions, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, renameSession, archiveSession } = useSessions(workspaceId);
  const registerWorkspaceSessions = useWorkspaceStore((s) => s.registerWorkspaceSessions);
  const sessionNotifications = useWorkspaceStore((s) => s.sessionNotifications);
  useEffect(() => {
    if (sessions.length > 0) registerWorkspaceSessions(workspaceId, sessions.map((session) => session.id));
  }, [registerWorkspaceSessions, sessions, workspaceId]);
  const selectedIndex = selectedSessionId ? sessions.findIndex((session) => session.id === selectedSessionId) : -1;
  const forcedOpen = selectedIndex >= SESSION_PREVIEW_COUNT;
  useEffect(() => {
    if (forcedOpen) setShowAll(true);
  }, [forcedOpen]);
  if (isLoading) return <Spinner size="small" style={styles.sessionLoading} />;
  if (sessions.length === 0) return <Text style={[styles.sessionEmpty, { color: colors.textTertiary }]}>暂无对话</Text>;
  const expanded = showAll || forcedOpen;
  const visible = expanded ? sessions : sessions.slice(0, SESSION_PREVIEW_COUNT);
  const foldedCount = sessions.length - visible.length;
  return <View>
    {visible.map((session) => <AnimatedListItem key={session.id}><SessionRow session={session} isSelected={session.id === selectedSessionId} hasUnread={!!sessionNotifications[session.id]} onPress={() => onSelect(workspaceId, session.id)} onRename={(name) => renameSession(session.id, name)} onArchive={async () => { await archiveSession(session.id); onArchived(workspaceId, session.id); }} isDark={isDark} /></AnimatedListItem>)}
    {foldedCount > 0 && <MoreRow label={`展开显示 ${foldedCount} 个`} onPress={() => setShowAll(true)} />}
    {expanded && !forcedOpen && sessions.length > SESSION_PREVIEW_COUNT && <MoreRow label="收起" onPress={() => setShowAll(false)} />}
    {expanded && hasNextPage && <MoreRow label={isFetchingNextPage ? '加载中…' : '加载更多'} onPress={() => void fetchNextPage()} disabled={isFetchingNextPage} />}
  </View>;
}
