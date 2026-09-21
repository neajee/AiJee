import { Files, GitBranch, Globe2 } from 'lucide-react';
import { Animated } from "@/styles/motion";
import { SeamToggle, SEAM_TOGGLE_HEIGHT, SEAM_TOGGLE_WIDTH } from '@/components/ui/seam-toggle';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { WorkspacePaneContext } from '../../hooks/workspace-pane-context';
import { RailButton } from './rail-button';
import { useWorkspaceSidebarController } from '../../hooks/use-workspace-sidebar-controller';
import { type WorkspaceSidebarProps } from './component-types';
import { COLLAPSED_WIDTH } from '../../utils/workspace-sidebar';
export function WorkspaceSidebar({
  children,
  storageScope,
  defaultCollapsed,
  locked
}: WorkspaceSidebarProps) {
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const {
    collapsed,
    contentMounted,
    panelWidth,
    isResizing,
    seamActive,
    isGitRepo,
    activePaneTab,
    setActivePaneTab,
    paneRequest,
    panelResizer,
    webSeamHoverProps,
    toggleCollapsed,
    openPane,
    isDesktopShell,
    widthAnim
  } = useWorkspaceSidebarController({
    storageScope,
    defaultCollapsed,
    locked
  });
  const sidebarBorder = isDark ? '#323131' : 'rgba(0,0,0,0.08)';
  const seamTint = 'rgba(136,136,136,0.16)';
  const seamDragTint = 'rgba(136,136,136,0.26)';
  const sidebarWidth = locked ? 0 : collapsed ? COLLAPSED_WIDTH : panelWidth;
  return <WorkspacePaneContext.Provider value={{
    request: paneRequest,
    activeTab: activePaneTab,
    setActiveTab: setActivePaneTab
  }}>
      <div className={`relative flex h-full shrink-0 overflow-hidden bg-background ${locked ? '' : 'border-l border-border'}`} style={{ width: sidebarWidth, borderLeftColor: locked ? 'transparent' : sidebarBorder }}>
        {!collapsed && <div className="min-w-0 flex-1 overflow-hidden">
            {contentMounted && <div className="h-full min-w-0 overflow-hidden" style={{ width: Math.max(0, panelWidth - COLLAPSED_WIDTH) }}>{children}</div>}
          </div>}

        {!locked && <div className="flex w-[38px] shrink-0 flex-col items-center gap-1 pt-1.5">
            <RailButton label="Open files" active={activePaneTab === 'files'} onClick={() => openPane('files')}>
              <Files size={17} strokeWidth={1.8} />
            </RailButton>
            {isGitRepo && <RailButton label="Open Git" active={activePaneTab === 'git'} onClick={() => openPane('git')}>
                <GitBranch size={17} strokeWidth={1.8} />
              </RailButton>}
            {isDesktopShell && <RailButton label="Open browser" active={activePaneTab === 'preview'} onClick={() => openPane('preview')}>
                <Globe2 size={17} strokeWidth={1.8} />
              </RailButton>}
          </div>}

        {!locked && !collapsed && <div className="absolute left-[-9px] top-1/2 z-30 h-16 w-[18px] -translate-y-1/2">
            <SeamToggle chevron="right" onClick={toggleCollapsed} label="Close side panel" />
          </div>}

        {!locked && !collapsed && <div {...panelResizer} {...webSeamHoverProps} className="absolute inset-y-0 left-[-6px] z-20 flex w-3 touch-none cursor-col-resize justify-center">
            <div className="h-full w-1 rounded" style={{ backgroundColor: seamActive ? isResizing ? seamDragTint : seamTint : 'transparent' }} />
          </div>}
      </div>
    </WorkspacePaneContext.Provider>;
}
