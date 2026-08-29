import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useWorkspaceStore } from '@/features/workspace/store';
import { useServersStore } from '@/features/servers/store';
import { useAuthStore } from '@/features/auth/store';
import MorphLoading from '@/components/ui/morph-loading';
import { NewWorkspaceDialog } from '@/features/workspace/components/new-workspace-dialog';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AppIndex() {
  const [newWorkspaceVisible, setNewWorkspaceVisible] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const serversLoaded = useServersStore((s) => s.loaded);
  const bootstrapReady = useServersStore((s) => s.bootstrapReady);
  const authLoaded = useAuthStore((s) => s.loaded);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const selectedWorkspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const workspaceLoading = useWorkspaceStore((s) => s.loading);

  if (!serversLoaded || !bootstrapReady || !authLoaded || workspaceLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <MorphLoading size="lg" />
      </View>
    );
  }

  const targetId = selectedWorkspaceId ?? workspaces[0]?.id;
  if (targetId) {
    const lastSession = useWorkspaceStore.getState().getLastSession(targetId);
    if (lastSession) {
      return <Redirect href={`/workspace/${targetId}/s/${lastSession}`} />;
    }
    return <Redirect href={`/workspace/${targetId}`} />;
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: isDark ? '#121212' : Colors[colorScheme].background }}>
      <Text style={{ fontFamily: Fonts.sansSemiBold, fontSize: 22, color: isDark ? '#fefdfd' : Colors[colorScheme].text }}>创建第一个工作区</Text>
      <Text style={{ marginTop: 8, fontFamily: Fonts.sans, fontSize: 14, color: isDark ? '#cdc8c5' : Colors[colorScheme].textSecondary }}>选择本机上的一个项目目录后即可开始。</Text>
      <Pressable onPress={() => setNewWorkspaceVisible(true)} style={({ pressed }) => ({ marginTop: 24, borderRadius: 9, paddingHorizontal: 18, paddingVertical: 12, backgroundColor: isDark ? '#fefdfd' : '#1a1a1a', opacity: pressed ? 0.7 : 1 })}>
        <Text style={{ fontFamily: Fonts.sansSemiBold, fontSize: 15, color: isDark ? '#1a1a1a' : '#fff' }}>添加工作区</Text>
      </Pressable>
      <NewWorkspaceDialog visible={newWorkspaceVisible} onClose={() => setNewWorkspaceVisible(false)} />
    </View>
  );
}
