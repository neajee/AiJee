import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Search,
  MessageSquare,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { useWorkspaceStore } from '@/features/workspace/store';
import { usePiClient, type SessionListItem } from '@aijee/client-sdk';

interface CommandPaletteProps {
  visible: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<any>;
  section: string;
  onSelect: () => void;
}

interface WorkspaceSession extends SessionListItem {
  workspaceId: string;
  workspaceTitle: string;
}

export function CommandPalette({ visible, onClose }: CommandPaletteProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = useThemeTokens();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { api } = usePiClient();

  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sessions, setSessions] = useState<WorkspaceSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const itemRefs = useRef<Record<number, View | null>>({});
  const scrollContentRef = useRef<View>(null);
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;

  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace);

  const bg = isDark ? '#1e1e1e' : '#FFFFFF';
  const borderColor = isDark ? '#3b3a39' : 'rgba(0,0,0,0.12)';
  const textPrimary = isDark ? '#fefdfd' : colors.text;
  const textMuted = isDark ? '#cdc8c5' : colors.textTertiary;
  const textDim = isDark ? '#888' : '#999';
  const hoverBg = isDark ? '#2a2a2a' : '#F0F0F0';
  const selectedBg = isDark ? '#333' : '#E8E8E8';

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
        if (cancelled) return;
        setSessions(
          pages.flat().sort((a, b) => b.last_active - a.last_active),
        );
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

  const sections = useMemo(() => (
    flatItems.length ? [{ title: flatItems[0].section, items: flatItems }] : []
  ), [flatItems]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    const itemView = itemRefs.current[selectedIndex];
    const container = scrollContentRef.current;
    if (itemView && container) {
      itemView.measureLayout(
        container as any,
        (_x, y, _w, h) => {
          scrollRef.current?.scrollTo({ y: Math.max(0, y - 80), animated: true });
        },
        () => {}
      );
    }
  }, [selectedIndex]);

  useEffect(() => {
    if (visible) {
      setSearch('');
      setSelectedIndex(0);
      Animated.parallel([
        Animated.timing(overlayAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 300, friction: 24, useNativeDriver: true }),
      ]).start();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible, overlayAnim, scaleAnim]);

  // Keyboard shortcut (Ctrl+P / Cmd+P)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        if (visible) {
          handleClose();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [visible, handleClose]);

  const handleKeyPress = useCallback(
    (e: any) => {
      const key = e.nativeEvent.key;
      if (flatItems.length === 0) {
        if (key === 'Escape') handleClose();
        return;
      }
      if (key === 'ArrowDown') {
        e.preventDefault?.();
        setSelectedIndex((prev) => (prev >= flatItems.length - 1 ? 0 : prev + 1));
      } else if (key === 'ArrowUp') {
        e.preventDefault?.();
        setSelectedIndex((prev) => (prev <= 0 ? flatItems.length - 1 : prev - 1));
      } else if (key === 'Enter') {
        e.preventDefault?.();
        flatItems[selectedIndex]?.onSelect();
      } else if (key === 'Escape') {
        handleClose();
      }
    },
    [flatItems, selectedIndex, handleClose]
  );

  if (!visible) return null;

  let flatIdx = 0;

  return (
    <Modal visible transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.palette,
            {
              backgroundColor: bg,
              borderColor,
              transform: [{ scale: scaleAnim }],
              opacity: overlayAnim,
            },
          ]}
        >
          {/* Search input */}
          <View style={[styles.searchRow, { borderBottomColor: borderColor }]}>
            <Search size={16} color={textMuted} strokeWidth={2} />
            <TextInput
              ref={inputRef}
              style={[styles.searchInput, { color: textPrimary }]}
              value={search}
              onChangeText={setSearch}
              onKeyPress={handleKeyPress}
              placeholder="搜索对话…"
              placeholderTextColor={textDim}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
            />
          </View>

          {/* Results */}
          <ScrollView
            ref={scrollRef}
            style={styles.results}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View ref={scrollContentRef}>
            {sessionsLoading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="small" color={textMuted} />
              </View>
            ) : sections.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: textDim }]}>
                  {query ? '没有匹配的对话' : '暂无最近对话'}
                </Text>
              </View>
            )}
            {sections.map((section) => (
              <View key={section.title}>
                <Text style={[styles.sectionHeader, { color: textDim }]}>
                  {section.title}
                </Text>
                {section.items.map((item) => {
                  const idx = flatIdx++;
                  const isSelected = idx === selectedIndex;
                  const Icon = item.icon;
                  return (
                    <Pressable
                      key={item.id}
                      ref={(ref) => { itemRefs.current[idx] = ref as any; }}
                      onPress={item.onSelect}
                      style={({ pressed, hovered }: any) => [
                        styles.item,
                        isSelected && { backgroundColor: selectedBg },
                        !isSelected && (pressed || hovered) && { backgroundColor: hoverBg },
                      ]}
                    >
                      <Icon size={15} color={isSelected ? textPrimary : textMuted} strokeWidth={1.8} />
                      <View style={styles.itemText}>
                        <Text
                          style={[styles.itemLabel, { color: textPrimary }]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                        {item.description && (
                          <Text
                            style={[styles.itemDesc, { color: textMuted }]}
                            numberOfLines={1}
                          >
                            {item.description}
                          </Text>
                        )}
                      </View>
                      {isSelected && (
                        <Text style={[styles.enterHint, { color: textDim }]}>
                          {'\u21B5'}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ))}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  palette: {
    width: '90%',
    maxWidth: 560,
    borderRadius: 12,
    borderWidth: 0.633,
    overflow: 'hidden',
    maxHeight: 420,
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
    elevation: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    gap: 10,
    borderBottomWidth: 0.633,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.sans,
    outlineStyle: 'none',
  } as any,
  results: {
    maxHeight: 370,
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: Fonts.sansMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  itemText: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 13,
    fontFamily: Fonts.sans,
  },
  itemDesc: {
    fontSize: 11,
    fontFamily: Fonts.sans,
    marginTop: 1,
  },
  enterHint: {
    fontSize: 14,
    fontFamily: Fonts.mono,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontFamily: Fonts.sans,
  },
});
