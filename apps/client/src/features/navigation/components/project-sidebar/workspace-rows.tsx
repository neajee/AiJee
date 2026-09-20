import { useCallback, useRef, useState, type ReactNode } from "react";
import { Folder, MoreHorizontal, SquarePen } from "lucide-react";
import { Fonts } from "@/constants/theme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import type { Workspace } from "@/features/workspace/types";
import { MENU_WIDTH } from "../workspace-context-menu";
export function WorkspaceRow({
  workspace,
  isSelected,
  isOpen,
  isRunning,
  hasUnread,
  onPress,
  onNewSession,
  onMenu,
  onLongPress,
  isDark
}: {
  workspace: Workspace;
  isSelected: boolean;
  isOpen: boolean;
  /** At least one session in this project is working right now. */
  isRunning: boolean;
  /** A turn finished here and hasn't been looked at. */
  hasUnread: boolean;
  /** Left click folds and unfolds; opening a project happens by session. */
  onPress: () => void;
  onNewSession: () => void;
  /** Viewport coordinates to anchor the actions menu to. */
  onMenu: (x: number, y: number) => void;
  onLongPress: (e: any) => void;
  isDark: boolean;
}) {
  const colors = useThemeTokens();
  const [hovered, setHovered] = useState(false);
  const hoverBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.035)";
  const moreRef = useRef<RNView>(null);
  // Hovering swaps the status dot for the actions; both never fit at once.
  const showActions = hovered;
  const openMenu = useCallback(() => {
    const node = moreRef.current;
    if (!node?.measureInWindow) {
      onMenu(24, 120);
      return;
    }
    // Anchor under the button, right edges aligned.
    node.measureInWindow((x, y, width, height) => {
      onMenu(x + width - MENU_WIDTH, y + height + 4);
    });
  }, [onMenu]);
  return (
    /*
     * Hover lives on a plain View using pointer events, not on the Pressable.
     * DOM Pressable hover "locks": entering a nested pressable
     * dispatches an event that ends the parent's hover, so the buttons that only
     * exist while hovering would vanish the moment the cursor reached them.
     * `pointerenter`/`pointerleave` don't fire for movement between children.
     */
    <div className={" "} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
      <button onClick={onPress} onLongPress={onLongPress} delayLongPress={400} aria-label={isOpen ? `收起 ${workspace.title}` : `展开 ${workspace.title}`}>
        <div className={"block"}>
          <Folder size={15} color={colors.text} strokeWidth={1.8} />
        </div>
        <span className={"  font-sans"}>
          {workspace.title}
        </span>
      </button>

      <div className={"block"}>
        {showActions && <RowAction label={`在 ${workspace.title} 中新建对话`} onClick={onNewSession} isDark={isDark}>
            <SquarePen size={13} color={colors.textTertiary} strokeWidth={1.8} />
          </RowAction>}
        {showActions && <div ref={moreRef} collapsable={false}>
            <RowAction label={`${workspace.title} 的更多操作`} onClick={openMenu} isDark={isDark}>
              <MoreHorizontal size={14} color={colors.textTertiary} strokeWidth={1.8} />
            </RowAction>
          </div>}

        {!showActions && !isRunning && hasUnread && <div className={" "} />}
      </div>
    </div>
  );
}

/** A small square button that sits beside a row's main pressable. */
export function RowAction({
  label,
  onPress,
  children,
  isDark
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
  isDark: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const hoverBg = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)";
  return <button onClick={e => {
    e.stopPropagation();
    onPress();
  }} aria-label={label} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}>
      {children}
    </button>;
}
