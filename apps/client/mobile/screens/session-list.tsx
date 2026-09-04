import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, MessageSquarePlus, MoreHorizontal } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, View } from 'tamagui';

import { Fonts } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { useWorkspaceStore } from '@/features/workspace/store';
import { usePiClient, useIsSessionStreaming, useWorkspaceSessions } from '@aijee/client-sdk';
import type { SessionListItem } from '@aijee/client-sdk';
import { mobileLayout, mobileRadius } from '../styles/tokens';

export default function SessionListScreen() {
  const { workspaceId: rawWorkspaceId } = useLocalSearchParams<{ workspaceId?: string }>();
  const workspaceId = typeof rawWorkspaceId === 'string' ? rawWorkspaceId : rawWorkspaceId?.[0] ?? null;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeTokens();
  const workspace = useWorkspaceStore((state) => state.workspaces.find((item) => item.id === workspaceId));
  const selectWorkspace = useWorkspaceStore((state) => state.selectWorkspace);
  const registerWorkspaceSessions = useWorkspaceStore((state) => state.registerWorkspaceSessions);
  const notifications = useWorkspaceStore((state) => state.sessionNotifications);
  const client = usePiClient();
  const sessionsState = useWorkspaceSessions(workspaceId);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (workspaceId) selectWorkspace(workspaceId);
  }, [selectWorkspace, workspaceId]);

  useEffect(() => {
    if (workspaceId && sessionsState.sessions.length > 0) {
      registerWorkspaceSessions(workspaceId, sessionsState.sessions.map((session) => session.id));
    }
  }, [registerWorkspaceSessions, sessionsState.sessions, workspaceId]);

  const openSession = useCallback((session: SessionListItem) => {
    if (!workspaceId) return;
    router.push({
      pathname: '/workspace/[workspaceId]/s/[sessionId]',
      params: { workspaceId, sessionId: session.id, sessionFile: session.file_path },
    });
  }, [router, workspaceId]);

  const createSession = useCallback(async () => {
    if (!workspaceId || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const info = await client.createAgentSession({ workspaceId, draft: true });
      router.push({
        pathname: '/workspace/[workspaceId]/s/[sessionId]',
        params: { workspaceId, sessionId: info.session_id, sessionFile: info.session_file },
      });
    } catch (cause) {
      setCreateError(cause instanceof Error ? cause.message : '无法创建新对话，请重试。');
    } finally {
      setCreating(false);
    }
  }, [client, creating, router, workspaceId]);

  const refresh = useCallback(() => sessionsState.refetch(), [sessionsState]);
  const title = workspace?.title ?? '项目对话';
  const sessions = useMemo(() => sessionsState.sessions, [sessionsState.sessions]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl colors={[colors.accent]} onRefresh={refresh} refreshing={sessionsState.isRefetching} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable accessibilityLabel="返回项目列表" accessibilityRole="button" onPress={() => router.replace('/')} style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong }, pressed && styles.pressed]}>
            <ArrowLeft color={colors.text} size={19} strokeWidth={1.8} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: colors.textTertiary }]}>PROJECT</Text>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          </View>
          <Pressable accessibilityLabel="开始新对话" accessibilityRole="button" disabled={creating} onPress={() => void createSession()} style={({ pressed }) => [styles.newButton, { backgroundColor: colors.accent, opacity: creating ? 0.55 : 1 }, pressed && styles.pressed]}>
            {creating ? <ActivityIndicator color={colors.onAccent} /> : <MessageSquarePlus color={colors.onAccent} size={18} strokeWidth={1.9} />}
            <Text style={[styles.newButtonText, { color: colors.onAccent }]}>新对话</Text>
          </Pressable>
        </View>

        <View style={styles.headingRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>最近对话</Text>
            <Text style={[styles.sectionMeta, { color: colors.textTertiary }]}>{sessionsState.total} 个会话</Text>
          </View>
          <MoreHorizontal color={colors.textTertiary} size={21} strokeWidth={1.8} />
        </View>

        {createError ? <Text style={[styles.errorText, { color: colors.destructive }]}>{createError}</Text> : null}
        {sessionsState.isLoading ? (
          <View style={styles.loadingState}><ActivityIndicator color={colors.accent} /></View>
        ) : sessionsState.error ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong }]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>对话加载失败</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{sessionsState.error}</Text>
            <Pressable onPress={refresh} style={({ pressed }) => [styles.outlineButton, { borderColor: colors.borderStrong }, pressed && styles.pressed]}><Text style={[styles.outlineButtonText, { color: colors.text }]}>重试</Text></Pressable>
          </View>
        ) : sessions.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong }]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>还没有对话</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>从一个新对话开始，让 AiJee 在这个项目里工作。</Text>
            <Pressable onPress={() => void createSession()} style={({ pressed }) => [styles.outlineButton, { borderColor: colors.borderStrong }, pressed && styles.pressed]}><Text style={[styles.outlineButtonText, { color: colors.text }]}>开始对话</Text></Pressable>
          </View>
        ) : (
          <View style={styles.sessionList}>
            {sessions.map((session) => <SessionRow key={session.id} colors={colors} hasUnread={Boolean(notifications[session.id])} session={session} onPress={() => openSession(session)} />)}
            {sessionsState.hasNextPage ? <Pressable disabled={sessionsState.isFetchingNextPage} onPress={sessionsState.fetchNextPage} style={({ pressed }) => [styles.loadMore, { borderColor: colors.borderStrong }, pressed && styles.pressed]}>{sessionsState.isFetchingNextPage ? <ActivityIndicator color={colors.accent} /> : <Text style={[styles.loadMoreText, { color: colors.textSecondary }]}>加载更多</Text>}</Pressable> : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function SessionRow({
  colors,
  session,
  hasUnread,
  onPress,
}: {
  colors: ReturnType<typeof useThemeTokens>;
  session: SessionListItem;
  hasUnread: boolean;
  onPress: () => void;
}) {
  const isStreaming = useIsSessionStreaming(session.id);
  const label = session.display_name?.trim() || '未命名对话';
  const detail = session.message_count > 0 ? `${session.message_count} 条消息` : '尚未发送消息';
  return (
    <Pressable accessibilityLabel={`打开对话 ${label}`} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.sessionRow, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }, pressed && styles.pressed]}>
      <View style={[styles.sessionIcon, { backgroundColor: colors.background }]}><View style={[styles.sessionDot, { backgroundColor: isStreaming ? colors.accent : hasUnread ? colors.success : colors.textTertiary }]} /></View>
      <View style={styles.sessionCopy}>
        <Text style={[styles.sessionTitle, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.sessionMeta, { color: colors.textTertiary }]}>{detail} · {formatDate(session.last_active)}</Text>
      </View>
      <ChevronRight color={colors.textTertiary} size={18} strokeWidth={1.7} />
    </Pressable>
  );
}

function formatDate(timestamp: number) {
  if (!timestamp) return '暂无记录';
  return new Date(timestamp).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: mobileLayout.pageHorizontal, paddingTop: 10, gap: 20 },
  header: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 11 },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 14 },
  headerCopy: { flex: 1, gap: 1 },
  eyebrow: { fontFamily: Fonts.sansSemiBold, fontSize: 10, letterSpacing: 1.2 },
  title: { fontFamily: Fonts.sansSemiBold, fontSize: 21, lineHeight: 27 },
  newButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, borderRadius: mobileRadius.control },
  newButtonText: { fontFamily: Fonts.sansSemiBold, fontSize: 13 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 7 },
  sectionTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 17 },
  sectionMeta: { marginTop: 3, fontFamily: Fonts.sans, fontSize: 12 },
  sessionList: { gap: 8 },
  sessionRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 13, paddingVertical: 12, borderWidth: 1, borderRadius: 18 },
  sessionIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  sessionDot: { width: 9, height: 9, borderRadius: 5 },
  sessionCopy: { flex: 1, gap: 4 },
  sessionTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 15, lineHeight: 20 },
  sessionMeta: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17 },
  loadingState: { minHeight: 220, alignItems: 'center', justifyContent: 'center' },
  emptyCard: { minHeight: 220, alignItems: 'center', justifyContent: 'center', padding: 24, borderWidth: 1, borderRadius: mobileRadius.card, gap: 8 },
  emptyTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 17 },
  emptyText: { maxWidth: 290, fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  outlineButton: { minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, borderWidth: 1, borderRadius: mobileRadius.control, marginTop: 7 },
  outlineButtonText: { fontFamily: Fonts.sansMedium, fontSize: 13 },
  loadMore: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: mobileRadius.control },
  loadMoreText: { fontFamily: Fonts.sansMedium, fontSize: 13 },
  errorText: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 18 },
  pressed: { opacity: 0.68 },
});
