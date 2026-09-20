import { Linking } from "@/platform/browser";
import { ExternalLink, Pencil, Pin, PinOff, SquarePen, Trash2 } from 'lucide-react';
import { AppMenu, AppMenuItem, AppMenuSeparator } from '@/components/ui';
import { useWorkspaceContextMenuController, MENU_WIDTH } from '../../hooks/use-workspace-context-menu-controller';
import type { WorkspaceContextMenuProps } from './component-types';
export { MENU_WIDTH };
export function WorkspaceContextMenu(props: WorkspaceContextMenuProps) {
  const {
    repoLinks,
    top,
    left
  } = useWorkspaceContextMenuController(props);
  if (!props.visible) return null;
  return <AppMenu visible={props.visible} top={top} left={left} width={MENU_WIDTH} onClose={props.onClose}>
        {props.onNewSession && <AppMenuItem icon={SquarePen} onClick={() => {
        props.onClose();
        props.onNewSession?.();
      }}>新对话</AppMenuItem>}
        {props.onNewSession && <AppMenuSeparator />}
        {repoLinks.length > 0 && <>
            {repoLinks.map((link, index) => <AppMenuItem key={`${link.browserUrl}-${index}`} icon={ExternalLink} onClick={() => {
          props.onClose();
          void Linking.openURL(link.browserUrl);
        }}>{link.repoPath ? `${link.label}: ${link.repoPath.split('/').pop()}` : `在 ${link.label} 打开`}</AppMenuItem>)}
            <AppMenuSeparator />
          </>}
        {props.onTogglePin && <AppMenuItem icon={props.pinned ? PinOff : Pin} onClick={() => {
        props.onClose();
        props.onTogglePin?.();
      }}>{props.pinned ? '取消置顶' : '置顶'}</AppMenuItem>}
        <AppMenuItem icon={Pencil} onClick={() => {
        props.onClose();
        props.onEdit();
      }}>编辑</AppMenuItem>
        <AppMenuSeparator />
        <AppMenuItem icon={Trash2} danger onClick={() => {
        props.onClose();
        props.onDelete();
      }}>删除</AppMenuItem>
    </AppMenu>;
}
