import { Text, View } from 'tamagui';
import { Ellipsis, FolderOpen } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { MobileHeaderActionsSheet } from '@/features/navigation/components/mobile-header-actions-sheet';
import { useMobileHeaderController } from '../../hooks/use-mobile-header-controller';
import { styles } from './styles';
import type { MobileHeaderBarProps } from './types';

export function MobileHeaderBar(props: MobileHeaderBarProps) {
  const { colors, textPrimary, borderColor, buttonBg, appMode, workspace, actionItems, moreVisible, setMoreVisible, closeMore } = useMobileHeaderController(props);
  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: borderColor }]}>
        <View style={styles.leftSection}>
          <Pressable
            onPress={props.onWorkspacePress}
            style={({ pressed }) => [styles.workspaceButton, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Open workspace switcher"
          >
            {workspace && (
              <View style={[styles.avatar, { backgroundColor: workspace.color }]}>
                <Text style={styles.avatarInitial}>{workspace.title.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <Text style={[styles.workspaceName, { color: textPrimary }]} numberOfLines={1}>
              {workspace?.title ?? 'Workspace'}
            </Text>
          </Pressable>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={props.onFilesPress}
            style={({ pressed }) => [styles.iconButton, { backgroundColor: buttonBg }, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Files"
          >
            <FolderOpen size={16} color={textPrimary} strokeWidth={1.8} />
          </Pressable>
          {appMode === 'code' && actionItems.length > 0 && (
            <Pressable
              onPress={() => setMoreVisible(true)}
              style={({ pressed }) => [styles.iconButton, { backgroundColor: buttonBg }, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel="More actions"
            >
              <Ellipsis size={16} color={textPrimary} strokeWidth={1.8} />
            </Pressable>
          )}
        </View>
      </View>
      <MobileHeaderActionsSheet visible={moreVisible} onClose={closeMore} items={actionItems} />
    </>
  );
}
