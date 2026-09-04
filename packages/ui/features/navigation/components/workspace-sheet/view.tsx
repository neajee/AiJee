import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import Animated from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import PagerView from 'react-native-pager-view';

import { Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { NewWorkspaceDialog } from '@/features/workspace/components/new-workspace-dialog';
import { useWorkspaceSheetController } from '../../hooks/use-workspace-sheet-controller';
import { SessionPage } from './session-page';
import { styles } from './styles';
import type { WorkspaceSheetProps } from './types';

export function WorkspaceSheet({ visible, onClose }: WorkspaceSheetProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeTokens();
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const {
    router,
    sheetHeight,
    showNewDialog,
    setShowNewDialog,
    workspaces,
    selectedWorkspaceId,
    selectedIndex,
    pagerRef,
    stripScrollRef,
    dismiss,
    handleWorkspacePress,
    handlePageSelected,
    handleAddWorkspace,
    handleServersPress,
    handleSettingsPress,
    panGesture,
    sheetStyle,
    overlayStyle,
    isWeb,
  } = useWorkspaceSheetController({ visible, onClose });
  const textPrimary = isDark ? '#fefdfd' : colors.text;
  const textMuted = isDark ? '#cdc8c5' : colors.textTertiary;
  const textSecondary = isDark ? '#f1ece8' : colors.textSecondary;
  const activeBorder = isDark ? '#ede8e4' : '#1A1A1A';
  const avatarScrollBg = isDark ? '#191919' : '#F8F8F8';

  return (
    <View
      {...(!isWeb ? { pointerEvents: visible ? ('auto' as const) : ('none' as const) } : {})}
      style={[styles.root, isWeb && ({ pointerEvents: visible ? 'auto' : 'none' } as any)]}
    >
      <Animated.View style={[styles.overlay, { backgroundColor: colors.overlay }, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.sheetBackground,
            paddingBottom: insets.bottom + 16,
            height: sheetHeight,
            maxHeight: sheetHeight,
          },
          sheetStyle,
        ]}
      >
        <GestureDetector gesture={panGesture}>
          <View style={styles.handleBar}>
            <View style={[styles.handle, { backgroundColor: colors.sheetHandle }]} />
          </View>
        </GestureDetector>

        <View style={[styles.workspaceStrip, { backgroundColor: avatarScrollBg }]}>
          <ScrollView
            ref={stripScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.workspaceScrollContent}
          >
            {workspaces.map((workspace, index) => {
              const isActive = workspace.id === selectedWorkspaceId;
              return (
                <Pressable
                  key={workspace.id}
                  onPress={() => handleWorkspacePress(workspace.id, index)}
                  style={({ pressed }) => [styles.workspaceItem, pressed && { opacity: 0.7 }]}
                >
                  <View
                    style={[
                      styles.avatarOuter,
                      isActive && { borderColor: activeBorder, borderWidth: 2 },
                    ]}
                  >
                    <View style={[styles.avatarInner, { backgroundColor: workspace.color }]}>
                      <Text style={styles.avatarInitial}>
                        {workspace.title.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    {workspace.hasNotifications && (
                      <View style={[styles.workspaceDot, { backgroundColor: colors.notificationDot }]} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.workspaceLabel,
                      { color: isActive ? textPrimary : textMuted },
                      isActive && { fontFamily: Fonts.sansMedium },
                    ]}
                    numberOfLines={1}
                  >
                    {workspace.title}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={handleAddWorkspace}
              style={({ pressed }) => [styles.workspaceItem, pressed && { opacity: 0.7 }]}
            >
              <View
                style={[
                  styles.avatarOuter,
                  {
                    borderColor: isDark ? '#3b3a39' : 'rgba(0,0,0,0.12)',
                    borderWidth: 1.5,
                    borderStyle: 'dashed',
                  },
                ]}
              >
                <Plus size={18} color={textMuted} strokeWidth={1.8} />
              </View>
              <Text style={[styles.workspaceLabel, { color: textMuted }]}>Add</Text>
            </Pressable>
          </ScrollView>
        </View>

        <PagerView
          ref={pagerRef}
          style={styles.pager}
          initialPage={Math.max(0, selectedIndex)}
          onPageSelected={(event) => handlePageSelected(event.nativeEvent.position)}
          overdrag
        >
          {workspaces.map((workspace) => (
            <View key={workspace.id} style={styles.page}>
              <SessionPage
                workspaceId={workspace.id}
                onSessionPress={(sessionId) => {
                  router.navigate(`/workspace/${workspace.id}/s/${sessionId}`);
                  dismiss();
                }}
                onDismiss={dismiss}
              />
            </View>
          ))}
        </PagerView>

        <View style={[styles.sheetFooter, { borderTopColor: colors.border }]}>
          <Pressable
            onPress={handleServersPress}
            style={({ pressed }) => [styles.footerItem, pressed && { opacity: 0.5 }]}
          >
            <MaterialIcons name="dns" size={18} color={colors.icon} />
            <Text style={[styles.footerLabel, { color: textSecondary }]}>连接</Text>
          </Pressable>
          <Pressable
            onPress={handleSettingsPress}
            style={({ pressed }) => [styles.footerItem, pressed && { opacity: 0.5 }]}
          >
            <MaterialIcons name="settings" size={18} color={colors.icon} />
            <Text style={[styles.footerLabel, { color: textSecondary }]}>Settings</Text>
          </Pressable>
        </View>
      </Animated.View>

      <NewWorkspaceDialog visible={showNewDialog} onClose={() => setShowNewDialog(false)} />
    </View>
  );
}
