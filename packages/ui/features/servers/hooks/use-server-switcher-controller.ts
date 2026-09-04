import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuthStore } from '@/features/auth/store';
import { useWorkspaceStore } from '@/features/workspace/store';
import { useServersStore, type Server } from '../store';

export function useServerSwitcherController() {
  const router = useRouter();
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const activeServerId = useAuthStore((s) => s.activeServerId);
  const activateServer = useAuthStore((s) => s.activateServer);
  const servers = useServersStore((s) => s.servers);
  const activeServer = servers.find((server) => server.id === activeServerId);
  const fetchWorkspaces = useWorkspaceStore((s) => s.fetchWorkspaces);
  const switchServer = useWorkspaceStore((s) => s.switchServer);

  useEffect(() => {
    if (!popoverVisible || Platform.OS !== 'web') return;
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-server-popover]')) setPopoverVisible(false);
    };
    const id = setTimeout(() => document.addEventListener('click', handler), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('click', handler);
    };
  }, [popoverVisible]);

  const handleSwitchServer = useCallback(async (server: Server) => {
    if (server.id === activeServerId) {
      setPopoverVisible(false);
      return;
    }
    setSwitchingId(server.id);
    await switchServer(server.id);
    const ok = await activateServer(server);
    if (ok) {
      await fetchWorkspaces(server.id);
      router.replace('/');
    }
    setSwitchingId(null);
    setPopoverVisible(false);
  }, [activateServer, activeServerId, fetchWorkspaces, router, switchServer]);

  return {
    router,
    servers,
    activeServer,
    activeServerId,
    popoverVisible,
    setPopoverVisible,
    switchingId,
    handleSwitchServer,
  };
}
