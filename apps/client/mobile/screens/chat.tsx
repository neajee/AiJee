import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, FilePenLine, MessageSquare, SquarePen, Wrench } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, View } from 'tamagui';

import type { ChatMessage, ToolCallInfo } from '@aijee/client-sdk';
import { useAgentSession, useConnection, useWorkspaceSessions } from '@aijee/client-sdk';
import { Fonts } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { useWorkspaceStore } from '@/features/workspace/store';
import { ChatComposer } from '../components/chat-composer';
import { mobileLayout, mobileRadius } from '../styles/tokens';

export default function ChatScreen() {
  const { workspaceId: rawWorkspaceId, sessionId: rawSessionId, sessionFile: rawSessionFile } = useLocalSearchParams<{
    workspaceId?: string;
    sessionId?: string;
    sessionFile?: string;
  }>();
  const workspaceId = normalizeParam(rawWorkspaceId);
  const sessionId = normalizeParam(rawSessionId);
  const sessionFileParam = normalizeParam(rawSessionFile);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeTokens();
  const scrollRef = useRef<ScrollView | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workspace = useWorkspaceStore((state) => state.workspaces.find((item) => item.id === workspaceId));
  const sessionsState = useWorkspaceSessions(workspaceId);
  const session = sessionsState.sessions.find((item) => item.id === sessionId);
  const sessionFile = session?.file_path ?? sessionFileParam ?? '';
  const agentSession = useAgentSession(sessionId, { workspaceId: workspaceId ?? '', sessionFile });
  const connection = useConnection();
  const messages = agentSession.messages as ChatMessage[];
  const connectionBlocked = connection.status === 'reconnecting' || connection.status === 'disconnected';
  const extensionPending = Boolean(agentSession.pendingExtensionUiRequest);
  const currentStatus = getStatusLabel(agentSession.isStreaming, agentSession.agentState?.isCompacting, messages, extensionPending);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length, agentSession.isStreaming]);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || !sessionId || !sessionFile || connectionBlocked || extensionPending || sending) return;
    setDraft('');
    setError(null);
    setSending(true);
    try {
      await agentSession.prompt(text, { streamingBehavior: 'steer' });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '发送失败，请重试。');
    } finally {
      setSending(false);
    }
  }, [agentSession, connectionBlocked, draft, extensionPending, sending, sessionFile, sessionId]);

  const abort = useCallback(async () => {
    try {
      await agentSession.abort();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '停止生成失败。');
    }
  }, [agentSession]);

  const headerTitle = session?.display_name?.trim() || workspace?.title || '新对话';
  const keyboardBehavior = process.env.EXPO_OS === 'ios' ? 'padding' : process.env.EXPO_OS === 'android' ? 'height' : undefined;

  return (
    <KeyboardAvoidingView behavior={keyboardBehavior} style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="返回对话列表" accessibilityRole="button" onPress={() => router.replace(`/workspace/${workspaceId}`)} style={({ pressed }) => [styles.headerButton, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong }, pressed && styles.pressed]}>
          <ArrowLeft color={colors.text} size={19} strokeWidth={1.8} />
        </Pressable>
        <View style={styles.segmented}>
          <View style={[styles.segment, { backgroundColor: colors.surfaceRaised }]}><MessageSquare color={colors.text} size={14} strokeWidth={1.9} /><Text style={[styles.segmentText, { color: colors.text }]}>聊天</Text></View>
          <Text style={[styles.inactiveSegment, { color: colors.textTertiary }]}>工作</Text>
        </View>
        <Pressable accessibilityLabel="返回项目对话" accessibilityRole="button" onPress={() => router.replace(`/workspace/${workspaceId}`)} style={({ pressed }) => [styles.headerButton, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong }, pressed && styles.pressed]}>
          <SquarePen color={colors.textSecondary} size={18} strokeWidth={1.8} />
        </Pressable>
      </View>

      <View style={styles.statusLine}>
        <StatusBadge colors={colors} label={currentStatus} tone={agentSession.isStreaming ? 'accent' : extensionPending ? 'warning' : 'neutral'} />
        <Text style={[styles.statusContext, { color: colors.textTertiary }]}>{headerTitle}</Text>
        {connection.status !== 'connected' ? <Text style={[styles.statusContext, { color: colors.destructive }]}>{connectionLabel(connection.status)}</Text> : null}
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.messageContent, { paddingBottom: insets.bottom + 18 }]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
      >
        {agentSession.isLoading && messages.length === 0 ? (
          <View style={styles.loadingState}><ActivityIndicator color={colors.accent} /><Text style={[styles.loadingText, { color: colors.textTertiary }]}>正在打开对话…</Text></View>
        ) : messages.length > 0 ? (
          messages.map((message) => <MessageBubble key={message.id} colors={colors} message={message} />)
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceRaised }]}><MessageSquare color={colors.textSecondary} size={22} strokeWidth={1.7} /></View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>开始一段对话</Text>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>消息会在这里实时出现，进度和工具调用保持简洁可见。</Text>
          </View>
        )}
        {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}
        {extensionPending ? <View style={[styles.extensionNotice, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong }]}><Text style={[styles.extensionTitle, { color: colors.text }]}>需要确认</Text><Text style={[styles.extensionText, { color: colors.textSecondary }]}>此操作需要在桌面端完成确认。</Text></View> : null}
      </ScrollView>

      <ChatComposer
        colors={colors}
        disabled={connectionBlocked || extensionPending || !sessionFile}
        isStreaming={agentSession.isStreaming}
        onAbort={() => void abort()}
        onChangeText={setDraft}
        onSend={() => void send()}
        sending={sending}
        value={draft}
      />
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ colors, message }: { colors: ReturnType<typeof useThemeTokens>; message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const activeTools = (message.toolCalls ?? []).filter((tool) => !['complete', 'error', 'cancelled'].includes(tool.status));
  const hasEditedFiles = (message.turnFileStats?.filesEdited ?? 0) > 0;
  const editingTools = activeTools.filter((tool) => isEditingTool(tool.name));
  const badges = [
    message.thinking ? '思考中' : null,
    activeTools.length > 0 && editingTools.length === 0 ? '调用工具' : null,
    editingTools.length > 0 ? '编辑中' : null,
    hasEditedFiles ? `编辑了 ${message.turnFileStats?.filesEdited} 个文件` : null,
  ].filter((value): value is string => Boolean(value));
  const bubbleColor = isUser ? colors.accent : isSystem ? 'transparent' : colors.surfaceRaised;
  const textColor = isUser ? colors.onAccent : isSystem ? colors.textTertiary : colors.text;

  return (
    <View style={[styles.messageBlock, isUser ? styles.userMessage : styles.assistantMessage]}>
      {badges.length > 0 ? <View style={styles.badgeRow}>{badges.map((badge) => <StatusBadge key={badge} colors={colors} label={badge} tone={badge === '思考中' ? 'accent' : 'neutral'} />)}</View> : null}
      <View style={[styles.bubble, { backgroundColor: bubbleColor, borderColor: isSystem ? 'transparent' : colors.borderStrong }, isUser && styles.userBubble]}>
        {message.text ? <Text selectable style={[styles.messageText, { color: textColor }]}>{message.text}</Text> : null}
        {message.attachments?.length ? <Text style={[styles.attachmentText, { color: isUser ? colors.onAccent : colors.textTertiary }]}>{message.attachments.length} 个图片附件</Text> : null}
        {(message.toolCalls ?? []).map((tool) => <ToolStatus key={tool.id} colors={colors} tool={tool} />)}
        {!message.text && !message.toolCalls?.length && message.isStreaming ? <Text style={[styles.cursor, { color: colors.accent }]}>▌</Text> : null}
        {message.errorMessage ? <Text style={[styles.errorText, { color: colors.destructive }]}>{message.errorMessage}</Text> : null}
      </View>
    </View>
  );
}

function ToolStatus({ colors, tool }: { colors: ReturnType<typeof useThemeTokens>; tool: ToolCallInfo }) {
  const active = !['complete', 'error', 'cancelled'].includes(tool.status);
  const label = tool.status === 'complete' ? '已完成' : tool.status === 'error' ? '失败' : tool.status === 'cancelled' ? '已取消' : '进行中';
  return (
    <View style={[styles.toolStatus, { borderTopColor: colors.border }]}>
      {isEditingTool(tool.name) ? <FilePenLine color={active ? colors.accent : colors.textTertiary} size={15} strokeWidth={1.8} /> : <Wrench color={active ? colors.accent : colors.textTertiary} size={15} strokeWidth={1.8} />}
      <Text style={[styles.toolName, { color: colors.textSecondary }]}>{tool.name}</Text>
      <Text style={[styles.toolState, { color: active ? colors.accent : colors.textTertiary }]}>{label}</Text>
    </View>
  );
}

function StatusBadge({ colors, label, tone }: { colors: ReturnType<typeof useThemeTokens>; label: string; tone: 'accent' | 'warning' | 'neutral' }) {
  const color = tone === 'accent' ? colors.accent : tone === 'warning' ? colors.destructive : colors.textSecondary;
  return <View style={[styles.badge, { backgroundColor: tone === 'neutral' ? colors.surfaceRaised : `${color}22` }]}><View style={[styles.badgeDot, { backgroundColor: color }]} /><Text style={[styles.badgeText, { color }]}>{label}</Text></View>;
}

function getStatusLabel(isStreaming: boolean, isCompacting: boolean | undefined, messages: ChatMessage[], hasPendingUi: boolean) {
  if (hasPendingUi) return '等待确认';
  if (isCompacting) return '整理上下文';
  const last = messages[messages.length - 1];
  if (last?.toolCalls?.some((tool) => !['complete', 'error', 'cancelled'].includes(tool.status) && isEditingTool(tool.name))) return '编辑文件';
  if (last?.toolCalls?.some((tool) => !['complete', 'error', 'cancelled'].includes(tool.status))) return '调用工具';
  return isStreaming ? '思考中' : '已就绪';
}

function isEditingTool(name: string) {
  const normalized = name.toLowerCase();
  return normalized.includes('edit') || normalized.includes('write') || normalized.includes('patch') || normalized.includes('file');
}

function connectionLabel(status: string) {
  if (status === 'reconnecting') return '重连中';
  if (status === 'disconnected') return '连接断开';
  if (status === 'connecting') return '连接中';
  return status;
}

function normalizeParam(value?: string | string[]) {
  return typeof value === 'string' ? value : value?.[0] ?? null;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 55, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: mobileLayout.pageHorizontal, paddingTop: 5 },
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 14 },
  segmented: { height: 36, flexDirection: 'row', alignItems: 'center', padding: 3, borderRadius: mobileRadius.pill },
  segment: { height: 30, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, borderRadius: 15 },
  segmentText: { fontFamily: Fonts.sansSemiBold, fontSize: 13 },
  inactiveSegment: { paddingHorizontal: 12, fontFamily: Fonts.sansMedium, fontSize: 13 },
  statusLine: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: mobileLayout.pageHorizontal },
  statusContext: { flex: 1, fontFamily: Fonts.sans, fontSize: 12 },
  messageContent: { flexGrow: 1, paddingHorizontal: mobileLayout.pageHorizontal, paddingTop: 12, gap: 14 },
  messageBlock: { maxWidth: '92%', gap: 7 },
  userMessage: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  assistantMessage: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { maxWidth: '100%', paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderRadius: 18, gap: 8 },
  userBubble: { borderWidth: 0, borderBottomRightRadius: 6 },
  messageText: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 23 },
  attachmentText: { fontFamily: Fonts.sans, fontSize: 12 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { minHeight: 23, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, borderRadius: 12 },
  badgeDot: { width: 5, height: 5, borderRadius: 3 },
  badgeText: { fontFamily: Fonts.sansMedium, fontSize: 11 },
  toolStatus: { minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: 7, paddingTop: 8, borderTopWidth: 1 },
  toolName: { flex: 1, fontFamily: Fonts.mono, fontSize: 12 },
  toolState: { fontFamily: Fonts.sansMedium, fontSize: 11 },
  cursor: { fontFamily: Fonts.mono, fontSize: 16 },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontFamily: Fonts.sans, fontSize: 13 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 9 },
  emptyIcon: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 18, marginBottom: 3 },
  emptyTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 17 },
  emptyText: { maxWidth: 270, fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  extensionNotice: { padding: 13, borderWidth: 1, borderRadius: 15, gap: 3 },
  extensionTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 13 },
  extensionText: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17 },
  errorText: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  pressed: { opacity: 0.68 },
});
