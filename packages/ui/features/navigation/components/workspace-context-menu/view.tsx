import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ExternalLink, Github, Gitlab, Pencil, Pin, PinOff, SquarePen, Trash2 } from 'lucide-react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { useWorkspaceContextMenuController, MENU_WIDTH } from '../../hooks/use-workspace-context-menu-controller';
import { styles } from './styles';
import type { MenuIcon, WorkspaceContextMenuProps } from './types';

export { MENU_WIDTH };

export function WorkspaceContextMenu(props: WorkspaceContextMenuProps) {
  const colors = useThemeTokens();
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const { repoLinks, top, left } = useWorkspaceContextMenuController(props);
  if (!props.visible) return null;
  const textPrimary = colors.text;
  const textDanger = '#E5484D';
  const menuBg = isDark ? '#252525' : '#FFFFFF';
  const menuBorder = isDark ? '#3b3a39' : 'rgba(0,0,0,0.12)';
  const hoverBg = isDark ? '#333' : '#F0F0F0';
  const separator = <View style={[styles.separator, { backgroundColor: menuBorder }]} />;
  return (
    <Modal visible transparent animationType="none" onRequestClose={props.onClose} statusBarTranslucent>
      <Pressable style={StyleSheet.absoluteFill} onPress={props.onClose} accessibilityLabel="关闭菜单" />
      <View style={[styles.menu, { top, left, backgroundColor: menuBg, borderColor: menuBorder }]}>
        {props.onNewSession && (
          <MenuItem icon={SquarePen} label="新对话" color={textPrimary} hoverBg={hoverBg} onPress={() => { props.onClose(); props.onNewSession?.(); }} />
        )}
        {props.onNewSession && separator}
        {repoLinks.length > 0 && (
          <>
            {repoLinks.map((link, index) => (
              <MenuItem
                key={`${link.browserUrl}-${index}`}
                icon={link.host === 'github' ? Github : link.host === 'gitlab' ? Gitlab : ExternalLink}
                label={link.repoPath ? `${link.label}: ${link.repoPath.split('/').pop()}` : `在 ${link.label} 打开`}
                color={textPrimary}
                hoverBg={hoverBg}
                onPress={() => { props.onClose(); void Linking.openURL(link.browserUrl); }}
              />
            ))}
            {separator}
          </>
        )}
        {props.onTogglePin && (
          <MenuItem icon={props.pinned ? PinOff : Pin} label={props.pinned ? '取消置顶' : '置顶'} color={textPrimary} hoverBg={hoverBg} onPress={() => { props.onClose(); props.onTogglePin?.(); }} />
        )}
        <MenuItem icon={Pencil} label="编辑" color={textPrimary} hoverBg={hoverBg} onPress={() => { props.onClose(); props.onEdit(); }} />
        {separator}
        <MenuItem icon={Trash2} label="删除" color={textDanger} hoverBg={hoverBg} onPress={() => { props.onClose(); props.onDelete(); }} />
      </View>
    </Modal>
  );
}

function MenuItem({ icon: Icon, label, color, hoverBg, onPress }: { icon: MenuIcon; label: string; color: string; hoverBg: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} style={({ pressed, hovered }: any) => [styles.menuItem, (pressed || hovered) && { backgroundColor: hoverBg }]}>
      <Icon size={14} color={color} strokeWidth={1.8} />
      <Text style={[styles.menuText, { color }]}>{label}</Text>
    </Pressable>
  );
}
