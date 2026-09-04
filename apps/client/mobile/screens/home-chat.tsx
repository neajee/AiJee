import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, View } from 'tamagui';

import { useWorkspaceSessions } from '@aijee/client-sdk';
import { Fonts } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { useWorkspaceStore } from '@/features/workspace/store';
import WorkspaceListScreen from './workspace-list';

export default function HomeChatScreen() {
  const router = useRouter();
  const colors = useThemeTokens();
  const workspace = useWorkspaceStore((state) => state.workspaces[0]);
  const sessionsState = useWorkspaceSessions(workspace?.id ?? '');
  const session = sessionsState.sessions[0];

  useEffect(() => {
    if (workspace && session) {
      router.replace({
        pathname: '/workspace/[workspaceId]/s/[sessionId]',
        params: { workspaceId: workspace.id, sessionId: session.id, sessionFile: session.file_path },
      });
    }
  }, [router, session, workspace]);

  if (!workspace || (!session && !sessionsState.isLoading)) {
    return <WorkspaceListScreen />;
  }

  return (
    <View style={[styles.loading, { backgroundColor: colors.background }]}>
      <ActivityIndicator color={colors.accent} />
      <Text style={[styles.loadingText, { color: colors.textTertiary }]}>打开最近对话…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontFamily: Fonts.sans, fontSize: 13 },
});
