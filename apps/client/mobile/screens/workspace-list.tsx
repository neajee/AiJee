import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronRight,
  Folder,
  MessageSquarePlus,
  Monitor,
  Plus,
  Settings,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, View } from 'tamagui';

import { Fonts } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { useAuthStore } from '@/features/auth/store';
import { useServersStore } from '@/features/servers/store';
import { useWorkspaceStore } from '@/features/workspace/store';
import type { Workspace } from '@/features/workspace/types';
import { mobileLayout, mobileRadius } from '../styles/tokens';

export default function WorkspaceListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeTokens();
  const activeServerId = useAuthStore((state) => state.activeServerId);
  const servers = useServersStore((state) => state.servers);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const loading = useWorkspaceStore((state) => state.loading);
  const error = useWorkspaceStore((state) => state.error);
  const fetchWorkspaces = useWorkspaceStore((state) => state.fetchWorkspaces);
  const selectWorkspace = useWorkspaceStore((state) => state.selectWorkspace);
  const addWorkspace = useWorkspaceStore((state) => state.addWorkspace);
  const activeServer = servers.find((server) => server.id === activeServerId);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openWorkspace = useCallback((workspace: Workspace) => {
    selectWorkspace(workspace.id);
    router.push(`/workspace/${workspace.id}`);
  }, [router, selectWorkspace]);

  const openNewChat = useCallback(() => {
    const workspaceId = selectedWorkspaceId ?? workspaces[0]?.id;
    if (workspaceId) {
      router.push(`/workspace/${workspaceId}`);
      return;
    }
    router.push('/servers');
  }, [router, selectedWorkspaceId, workspaces]);

  const refresh = useCallback(() => {
    if (activeServerId) void fetchWorkspaces(activeServerId);
  }, [activeServerId, fetchWorkspaces]);

  const handleAdd = useCallback(async () => {
    const nextName = name.trim();
    const nextPath = path.trim();
    if (!nextName || !nextPath || adding) {
      setFormError('请填写项目名称和路径。');
      return;
    }
    setAdding(true);
    setFormError(null);
    try {
      await addWorkspace({ title: nextName, path: nextPath });
      setName('');
      setPath('');
      setShowAddForm(false);
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : '项目创建失败，请重试。');
    } finally {
      setAdding(false);
    }
  }, [addWorkspace, adding, name, path]);

  const serverLabel = activeServer?.name ?? '未连接设备';
  const hasConnection = Boolean(activeServerId && activeServer);
  const listContent = useMemo(() => workspaces, [workspaces]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            colors={[colors.accent]}
            enabled={hasConnection}
            onRefresh={refresh}
            refreshing={loading && listContent.length > 0}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.serverIdentity}>
            <View style={[styles.serverIcon, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong }]}>
              <Monitor color={colors.text} size={18} strokeWidth={1.8} />
            </View>
            <View style={styles.serverCopy}>
              <Text style={[styles.serverName, { color: colors.text }]}>{serverLabel}</Text>
              <View style={styles.serverStatus}>
                <View style={[styles.statusDot, { backgroundColor: hasConnection ? colors.success : colors.textTertiary }]} />
                <Text style={[styles.serverStatusText, { color: colors.textTertiary }]}>{hasConnection ? '已连接' : '等待连接'}</Text>
              </View>
            </View>
          </View>
          <Pressable
            accessibilityLabel="设置"
            accessibilityRole="button"
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong }, pressed && styles.pressed]}
          >
            <Settings color={colors.textSecondary} size={19} strokeWidth={1.8} />
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={openNewChat}
          style={({ pressed }) => [styles.newChatButton, { backgroundColor: colors.accent }, pressed && styles.pressed]}
        >
          <MessageSquarePlus color={colors.onAccent} size={19} strokeWidth={1.9} />
          <Text style={[styles.newChatLabel, { color: colors.onAccent }]}>新对话</Text>
          <ChevronRight color={colors.onAccent} size={18} strokeWidth={1.8} />
        </Pressable>

        {!hasConnection ? (
          <View style={[styles.noticeCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong }]}>
            <Text style={[styles.noticeTitle, { color: colors.text }]}>连接一台 AiJee 电脑</Text>
            <Text style={[styles.noticeText, { color: colors.textSecondary }]}>扫码后即可同步项目、查看进度并继续对话。</Text>
            <Pressable onPress={() => router.push('/servers')} style={({ pressed }) => [styles.noticeButton, { backgroundColor: colors.accent }, pressed && styles.pressed]}>
              <Text style={[styles.noticeButtonText, { color: colors.onAccent }]}>扫码连接</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>项目</Text>
          <Pressable
            accessibilityLabel={showAddForm ? '关闭添加项目' : '添加项目'}
            accessibilityRole="button"
            onPress={() => { setShowAddForm((value) => !value); setFormError(null); }}
            style={({ pressed }) => [styles.sectionAction, { backgroundColor: colors.surfaceRaised }, pressed && styles.pressed]}
          >
            {showAddForm ? <X color={colors.textSecondary} size={18} strokeWidth={1.8} /> : <Plus color={colors.textSecondary} size={18} strokeWidth={1.8} />}
          </Pressable>
        </View>

        {showAddForm ? (
          <View style={[styles.addCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong }]}>
            <TextInput autoCapitalize="words" onChangeText={setName} placeholder="项目名称" placeholderTextColor={colors.textTertiary} style={[styles.formInput, { color: colors.text, borderColor: colors.border }]} value={name} />
            <TextInput autoCapitalize="none" autoCorrect={false} onChangeText={setPath} placeholder="本地路径，例如 /workspace/app" placeholderTextColor={colors.textTertiary} style={[styles.formInput, { color: colors.text, borderColor: colors.border }]} value={path} />
            {formError ? <Text style={[styles.formError, { color: colors.destructive }]}>{formError}</Text> : null}
            <Pressable disabled={adding} onPress={() => void handleAdd()} style={({ pressed }) => [styles.noticeButton, { backgroundColor: colors.accent, opacity: adding ? 0.55 : 1 }, pressed && styles.pressed]}>
              {adding ? <ActivityIndicator color={colors.onAccent} /> : <Text style={[styles.noticeButtonText, { color: colors.onAccent }]}>添加项目</Text>}
            </Pressable>
          </View>
        ) : null}

        {loading && listContent.length === 0 ? (
          <View style={styles.loadingState}><ActivityIndicator color={colors.accent} /></View>
        ) : listContent.length > 0 ? (
          <View style={styles.workspaceList}>
            {listContent.map((workspace) => (
              <WorkspaceRow key={workspace.id} colors={colors} selected={workspace.id === selectedWorkspaceId} workspace={workspace} onPress={() => openWorkspace(workspace)} />
            ))}
          </View>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong }]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{error ? '项目加载失败' : '还没有项目'}</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{error ?? '添加一个本地项目，开始你的第一段工作。'}</Text>
            {error ? <Pressable onPress={refresh} style={({ pressed }) => [styles.outlineButton, { borderColor: colors.borderStrong }, pressed && styles.pressed]}><Text style={[styles.outlineButtonText, { color: colors.text }]}>{'重试'}</Text></Pressable> : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function WorkspaceRow({
  colors,
  workspace,
  selected,
  onPress,
}: {
  colors: ReturnType<typeof useThemeTokens>;
  workspace: Workspace;
  selected: boolean;
  onPress: () => void;
}) {
  const statusColor = workspace.status === 'active' ? colors.success : colors.textTertiary;
  return (
    <Pressable
      accessibilityLabel={`打开项目 ${workspace.title}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.workspaceRow, { backgroundColor: selected ? colors.surfaceRaised : 'transparent' }, pressed && styles.pressed]}
    >
      <Folder color={workspace.color || colors.textSecondary} size={22} strokeWidth={1.7} />
      <View style={styles.workspaceCopy}>
        <Text style={[styles.workspaceTitle, { color: colors.text }]}>{workspace.title}</Text>
        <Text style={[styles.workspacePath, { color: colors.textTertiary }]}>{workspace.path}</Text>
      </View>
      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      <ChevronRight color={colors.textTertiary} size={18} strokeWidth={1.7} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: mobileLayout.pageHorizontal, paddingTop: 10, gap: 20 },
  topBar: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  serverIdentity: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  serverIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 13 },
  serverCopy: { gap: 3 },
  serverName: { fontFamily: Fonts.sansSemiBold, fontSize: 16 },
  serverStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  serverStatusText: { fontFamily: Fonts.sans, fontSize: 11 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 14 },
  newChatButton: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, borderRadius: mobileRadius.control },
  newChatLabel: { flex: 1, fontFamily: Fonts.sansSemiBold, fontSize: 15 },
  noticeCard: { padding: 18, borderWidth: 1, borderRadius: mobileRadius.card, gap: 9 },
  noticeTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 16 },
  noticeText: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  noticeButton: { minHeight: 42, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, borderRadius: mobileRadius.control },
  noticeButtonText: { fontFamily: Fonts.sansSemiBold, fontSize: 14 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  sectionTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 13, letterSpacing: 0.5 },
  sectionAction: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15 },
  addCard: { padding: 14, borderWidth: 1, borderRadius: mobileRadius.card, gap: 10 },
  formInput: { minHeight: 44, paddingHorizontal: 12, borderWidth: 1, borderRadius: 13, fontFamily: Fonts.sans, fontSize: 14 },
  formError: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17 },
  workspaceList: { gap: 4, paddingTop: 2 },
  workspaceRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 16 },
  workspaceCopy: { flex: 1, gap: 4 },
  workspaceTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 16, lineHeight: 21 },
  workspacePath: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17 },
  emptyCard: { minHeight: 180, alignItems: 'center', justifyContent: 'center', padding: 22, borderWidth: 1, borderRadius: mobileRadius.card, gap: 8 },
  emptyTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 17 },
  emptyText: { maxWidth: 280, fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  outlineButton: { minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, borderWidth: 1, borderRadius: mobileRadius.control, marginTop: 6 },
  outlineButtonText: { fontFamily: Fonts.sansMedium, fontSize: 13 },
  loadingState: { minHeight: 220, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.68 },
});
