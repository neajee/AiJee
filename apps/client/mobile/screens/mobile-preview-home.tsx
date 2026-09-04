import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuthStore } from '@/features/auth/store';
import { useServersStore } from '@/features/servers/store';
import { useWorkspaceStore } from '@/features/workspace/store';

export default function MobilePreviewHomeScreen() {
  const router = useRouter();
  const activeServerId = useAuthStore((state) => state.activeServerId);
  const server = useServersStore((state) => state.servers.find((item) => item.id === activeServerId));
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  return <View style={styles.screen}>
    <View style={styles.header}><View><Text style={styles.server}>{server?.name ?? 'AiJee'}</Text><Text style={styles.connected}>● 已连接</Text></View><Pressable onPress={() => router.replace('/mobile-preview')}><Text style={styles.menu}>•••</Text></Pressable></View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Pressable style={styles.newChat}><Text style={styles.newChatText}>＋ 新对话</Text></Pressable>
      <Text style={styles.sectionTitle}>项目</Text>
      {workspaces.length > 0 ? workspaces.map((workspace) => <Pressable key={workspace.id} style={styles.row} onPress={() => router.push(`/workspace/${workspace.id}` as never)}><Text style={styles.folder}>□</Text><Text style={styles.workspace}>{workspace.title}</Text><Text style={styles.chevron}>›</Text></Pressable>) : <Text style={styles.empty}>暂无工作区</Text>}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  header: { minHeight: 76, paddingHorizontal: 24, paddingTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  server: { color: '#F7F7F8', fontSize: 17, fontWeight: '700' },
  connected: { color: '#42D77D', fontSize: 11, marginTop: 4 },
  menu: { color: '#A7A7AD', fontSize: 20, letterSpacing: 2 },
  content: { padding: 20, gap: 20 },
  newChat: { minHeight: 52, justifyContent: 'center', paddingHorizontal: 18, backgroundColor: '#333', borderRadius: 16 },
  newChatText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  sectionTitle: { color: '#A7A7AD', fontSize: 13, fontWeight: '600', marginTop: 6 },
  row: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 10, borderRadius: 14 },
  folder: { color: '#D8D8DC', fontSize: 24 },
  workspace: { flex: 1, color: '#F7F7F8', fontSize: 16, fontWeight: '600' },
  chevron: { color: '#77777E', fontSize: 25 },
  empty: { color: '#77777E', fontSize: 14 },
});
