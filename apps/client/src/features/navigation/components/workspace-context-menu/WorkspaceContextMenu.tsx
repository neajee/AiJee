import { Linking } from "@/platform/browser";
import { ExternalLink, Pencil, Pin, PinOff, SquarePen, Trash2 } from 'lucide-react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ABSOLUTE_FILL_STYLE } from '@/constants/layout';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { useWorkspaceContextMenuController, MENU_WIDTH } from '../../hooks/use-workspace-context-menu-controller';
import type { MenuIcon, WorkspaceContextMenuProps } from './component-types';
export { MENU_WIDTH };
export function WorkspaceContextMenu(props: WorkspaceContextMenuProps) {
  const colors = useThemeTokens();
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const {
    repoLinks,
    top,
    left
  } = useWorkspaceContextMenuController(props);
  if (!props.visible) return null;
  const textPrimary = colors.text;
  const textDanger = '#E5484D';
  const menuBg = isDark ? '#252525' : '#FFFFFF';
  const menuBorder = isDark ? '#3b3a39' : 'rgba(0,0,0,0.12)';
  const hoverBg = isDark ? '#333' : '#F0F0F0';
  const separator = <div className={"" + " " + ""} />;
  return <div visible transparent animationType="none" onRequestClose={props.onClose} statusBarTranslucent>
      <button className={""} onClick={props.onClose} aria-label="关闭菜单" />
      <div className={"" + " " + ""}>
        {props.onNewSession && <MenuItem icon={SquarePen} label="新对话" color={textPrimary} hoverBg={hoverBg} onClick={() => {
        props.onClose();
        props.onNewSession?.();
      }} />}
        {props.onNewSession && separator}
        {repoLinks.length > 0 && <>
            {repoLinks.map((link, index) => <MenuItem key={`${link.browserUrl}-${index}`} icon={ExternalLink} label={link.repoPath ? `${link.label}: ${link.repoPath.split('/').pop()}` : `在 ${link.label} 打开`} color={textPrimary} hoverBg={hoverBg} onClick={() => {
          props.onClose();
          void Linking.openURL(link.browserUrl);
        }} />)}
            {separator}
          </>}
        {props.onTogglePin && <MenuItem icon={props.pinned ? PinOff : Pin} label={props.pinned ? '取消置顶' : '置顶'} color={textPrimary} hoverBg={hoverBg} onClick={() => {
        props.onClose();
        props.onTogglePin?.();
      }} />}
        <MenuItem icon={Pencil} label="编辑" color={textPrimary} hoverBg={hoverBg} onClick={() => {
        props.onClose();
        props.onEdit();
      }} />
        {separator}
        <MenuItem icon={Trash2} label="删除" color={textDanger} hoverBg={hoverBg} onClick={() => {
        props.onClose();
        props.onDelete();
      }} />
      </div>
    </div>;
}
function MenuItem({
  icon: Icon,
  label,
  color,
  hoverBg,
  onPress
}: {
  icon: MenuIcon;
  label: string;
  color: string;
  hoverBg: string;
  onPress: () => void;
}) {
  return <button onClick={onPress} aria-label={label}>
      <Icon size={14} color={color} strokeWidth={1.8} />
      <span className={"" + " " + ""}>{label}</span>
    </button>;
}
