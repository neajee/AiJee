import { ScrollView, View } from 'tamagui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, TextInput, type ScrollView as RNScrollView, type View as RNView } from 'react-native';
import { useRouter } from 'expo-router';
import { MessageSquare } from 'lucide-react-native';

import { useWorkspaceStore } from '@/features/workspace/store';
import { usePiClient, type SessionListItem } from '@aijee/client-sdk';
import type { CommandPaletteProps, CommandItem } from '../components/command-palette/types';

interface WorkspaceSession extends SessionListItem {
  workspaceId: string;
  workspaceTitle: string;
}

export function useCommandPaletteController({ visible, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { api } = usePiClient();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sessions, setSessions] = useState<WorkspaceSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<RNScrollView>(null);
  const itemRefs = useRef<Record<number, RNView | null>>({});
  const scrollContentRef = useRef<RNView>(null);
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(overlayAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      setSearch('');
      onClose();
    });
  }, [onClose, overlayAnim, scaleAnim]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setSessionsLoading(true);
    void Promise.all(
      workspaces.map(async (workspace) => {
        try {
          const page = await api.listWorkspaceSessions(workspace.id, { page: 1, limit: 100 });
          return (page.items ?? []).map((session) => ({
            ...session,
            workspaceId: workspace.id,
            workspaceTitle: workspace.title,
          }));
        } catch {
          return [];
        }
      }),
    )
      .then((pages) => {
        if (!cancelled) setSessions(pages.flat().sort((a, b) => b.last_active - a.last_active));
      })
      .finally(() => {
        if (!cancelled) setSessionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, visible, workspaces]);

  const query = search.trim().toLocaleLowerCase();
  const flatItems = useMemo<CommandItem[]>(() => {
    const matched = sessions.filter((session) =>
      !query || [session.display_name, session.cwd, session.workspaceTitle]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase().includes(query)),
    );
    return matched.slice(0, query ? 30 : 8).map((session) => ({
      id: session.id,
      label: session.display_name?.trim() || '未命名对话',
      description: session.workspaceTitle,
      icon: MessageSquare,
      section: query ? '搜索结果' : '最近对话',
      onSelect: () => {
        selectWorkspace(session.workspaceId);
        handleClose();
        router.navigate(`/workspace/${session.workspaceId}/s/${session.id}`);
      },
    }));
  }, [handleClose, query, router, selectWorkspace, sessions]);
  const sections = useMemo(
    () => (flatItems.length ? [{ title: flatItems[0].section, items: flatItems }] : []),
    [flatItems],
  );

  useEffect(() => setSelectedIndex(0), [search]);

  useEffect(() => {
    const itemView = itemRefs.current[selectedIndex];
    const container = scrollContentRef.current;
    if (itemView && container) {
      itemView.measureLayout(
        container as any,
        (_x, y) => scrollRef.current?.scrollTo({ y: Math.max(0, y - 80), animated: true }),
        () => {},
      );
    }
  }, [selectedIndex]);

  useEffect(() => {
    if (!visible) return;
    setSearch('');
    setSelectedIndex(0);
    Animated.parallel([
      Animated.timing(overlayAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 300, friction: 24, useNativeDriver: true }),
    ]).start();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [overlayAnim, scaleAnim, visible]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'p') {
        event.preventDefault();
        if (visible) handleClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleClose, visible]);

  const handleKeyPress = useCallback((event: any) => {
    const key = event.nativeEvent.key;
    if (flatItems.length === 0) {
      if (key === 'Escape') handleClose();
      return;
    }
    if (key === 'ArrowDown') {
      event.preventDefault?.();
      setSelectedIndex((previous) => (previous >= flatItems.length - 1 ? 0 : previous + 1));
    } else if (key === 'ArrowUp') {
      event.preventDefault?.();
      setSelectedIndex((previous) => (previous <= 0 ? flatItems.length - 1 : previous - 1));
    } else if (key === 'Enter') {
      event.preventDefault?.();
      flatItems[selectedIndex]?.onSelect();
    } else if (key === 'Escape') {
      handleClose();
    }
  }, [flatItems, handleClose, selectedIndex]);

  return {
    search,
    setSearch,
    selectedIndex,
    sessionsLoading,
    sections,
    inputRef,
    scrollRef,
    itemRefs,
    scrollContentRef,
    overlayAnim,
    scaleAnim,
    handleClose,
    handleKeyPress,
  };
}
