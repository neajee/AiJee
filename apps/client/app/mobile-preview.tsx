import { Stack } from 'expo-router';

import { useAuthStore } from '@/features/auth/store';
import { useServersStore } from '@/features/servers/store';
import MobileServersScreen from '../mobile/screens/servers';
import MobilePreviewHomeScreen from '../mobile/screens/mobile-preview-home';

export default function MobilePreviewRoute() {
  const loaded = useAuthStore((state) => state.loaded);
  const activeServerId = useAuthStore((state) => state.activeServerId);
  const hasServer = useServersStore((state) => state.servers.some((server) => server.id === activeServerId));
  return <>
    <Stack.Screen options={{ headerShown: false }} />
    {loaded && hasServer ? <MobilePreviewHomeScreen /> : <MobileServersScreen />}
  </>;
}
