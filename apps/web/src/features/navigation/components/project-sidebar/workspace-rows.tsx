import { useCallback, useRef, useState, type ReactNode } from "react";
import { Folder, MoreHorizontal, SquarePen } from "lucide-react";
import { Fonts } from "@/constants/theme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import type { Workspace } from "@/features/workspace/types";
import { MENU_WIDTH } from "../workspace-context-menu";
export function WorkspaceRow({
  workspace,
  isOpen,
  isRunning,
  hasUnread,
  onClick,
  onNewSession,
  onMenu,
  onLongPress,
  isDark
}: {
  workspace: Workspace;
  isOpen: boolean;
  /** At least one session in this project is working right now. */
  isRunning: boolean;
  /** A turn finished here and hasn't been looked at. */
  hasUnread: boolean;
  /** Left click folds and unfolds; opening a project happens by session. */
  onClick: () => void;
  onNewSession: () => void;
  /** Viewport coordinates to anchor the actions menu to. */
  onMenu: (x: number, y: number) => void;
  onLongPress: (e: any) => void;
  isDark: boolean;
}) {
  const colors = useThemeTokens();
  const [hovered, setHovered] = useState(false);
  const hoverBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.035)";
  const moreRef = useRef<HTMLDivElement>(null);
  // Hovering swaps the status dot for the actions; both never fit at once.
  const showActions = hovered;
  const openMenu = useCallback(() => {
    const rect = moreRef.current?.getBoundingClientRect();
    if (!rect) {
      onMenu(24, 120);
      return;
    }
    // Anchor under the button, right edges aligned (viewport coordinates).
    onMenu(rect.right - MENU_WIDTH, rect.bottom + 4);
  }, [onMenu]);
  return (
    /*
     * Hover lives on a plain View using pointer events, not on the Pressable.
     * DOM Pressable hover "locks": entering a nested pressable
     * dispatches an event that ends the parent's hover, so the buttons that only
     * exist while hovering would vanish the moment the cursor reached them.
     * `pointerenter`/`pointerleave` don't fire for movement between children.
     */
    <div className="group flex w-full" onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
      <button className="flex h-[29px] min-w-0 flex-1 items-center gap-[7px] rounded-md px-[7px] text-left hover:bg-hover" onClick={onClick} aria-label={isOpen ? `收起 ${workspace.title}` : `展开 ${workspace.title}`}>
        <span className="flex size-5 shrink-0 items-center justify-center">
          <Folder size={15} color={colors.text} strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1 truncate font-sans">
          {workspace.title}
        </span>
      </button>

      <div className="flex items-center justify-end gap-1">
        {showActions && <RowAction label={`在 ${workspace.title} 中新建对话`} onClick={onNewSession} isDark={isDark}>
            <SquarePen size={13} color={colors.textTertiary} strokeWidth={1.8} />
          </RowAction>}
        {showActions && <div ref={moreRef}>
            <RowAction label={`${workspace.title} 的更多操作`} onClick={openMenu} isDark={isDark}>
              <MoreHorizontal size={14} color={colors.textTertiary} strokeWidth={1.8} />
            </RowAction>
          </div>}

        {!showActions && !isRunning && hasUnread && <div />}
      </div>
    </div>
  );
}

/** A small square button that sits beside a row's main pressable. */
export function RowAction({
  label,
  onClick,
  children,
  isDark
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  isDark: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const hoverBg = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)";
  return <button className="flex size-7 items-center justify-center rounded hover:bg-hover" onClick={e => {
    e.stopPropagation();
    onClick();
  }} aria-label={label} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
      {children}
    </button>;
}
