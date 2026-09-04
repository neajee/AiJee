import { ScrollView, Spinner, Text, View } from 'tamagui';
import { useCallback, useState } from 'react';
import { Pressable } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { SquarePen, RefreshCw } from 'lucide-react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { useWorkspaceSessions as useSessions } from '@aijee/client-sdk';
import { SessionActivityIndicator } from '@/features/workspace/components/session-activity-indicator';
import { AnimatedListItem } from '@/components/ui/animated-list-item';
import { styles } from './styles';
import type { SessionPageProps } from './types';

export function SessionPage({ workspaceId, onSessionPress, onDismiss }: SessionPageProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = useThemeTokens();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const pathname = usePathname();
  const selectedSessionId =
    pathname.match(new RegExp(`/workspace/${workspaceId}/s/([^/]+)`))?.[1] ?? null;
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
    isRefetching,
  } = useSessions(workspaceId);
  const [createPending, setCreatePending] = useState(false);

  const handleNewSession = useCallback(() => {
    if (createPending) return;
    setCreatePending(true);
    router.navigate(`/workspace/${workspaceId}`);
    onDismiss();
    setCreatePending(false);
  }, [createPending, onDismiss, router, workspaceId]);

  return (
    <View style={styles.pageContent}>
      <View style={styles.sessionsHeader}>
        <Text style={[styles.sessionsTitle, { color: textPrimary }]}>Sessions</Text>
        <Pressable
          onPress={() => refetch()}
          disabled={isRefetching}
          style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
        >
          {isRefetching ? (
            <Spinner size="small" color={textMuted} style={{ width: 13, height: 13 }} />
          ) : (
            <RefreshCw size={13} color={textMuted} strokeWidth={1.8} />
          )}
        </Pressable>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={handleNewSession}
          disabled={createPending}
          style={({ pressed }) => [
            styles.newSessionButton,
            { backgroundColor: btnBg },
            pressed && { opacity: 0.8 },
          ]}
        >
          {createPending ? (
            <Spinner size="small" color={textPrimary} style={{ width: 14, height: 14 }} />
          ) : (
            <SquarePen size={14} color={textPrimary} strokeWidth={1.8} />
          )}
          <Text style={[styles.newSessionText, { color: textPrimary }]}>New session</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.sessionList}
        contentContainerStyle={styles.sessionListContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {isLoading ? (
          <Spinner style={{ marginTop: 24 }} />
        ) : sessions.length === 0 ? (
          <Text style={[styles.emptyText, { color: textMuted }]}>No sessions yet</Text>
        ) : (
          sessions.map((session) => (
            <AnimatedListItem key={session.id}>
              <Pressable
                onPress={() => onSessionPress(session.id)}
                style={({ pressed }) => [
                  styles.sessionItem,
                  session.id === selectedSessionId && {
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.06)',
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <SessionActivityIndicator sessionId={session.id} color={textMuted} />
                <Text style={[styles.sessionTitle, { color: textPrimary }]} numberOfLines={1}>
                  {session.display_name ?? session.id}
                </Text>
              </Pressable>
            </AnimatedListItem>
          ))
        )}
        {hasNextPage && (
          <Pressable
            onPress={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            style={({ pressed }) => [
              styles.loadMoreButton,
              { backgroundColor: btnBg },
              pressed && { opacity: 0.8 },
            ]}
          >
            {isFetchingNextPage ? (
              <Spinner size="small" />
            ) : (
              <Text style={[styles.loadMoreText, { color: textMuted }]}>Load more</Text>
            )}
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
