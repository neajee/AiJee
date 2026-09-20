import { Files, GitBranch, Globe2 } from 'lucide-react';
import { Animated } from "@/styles/motion";
import { SeamToggle, SEAM_TOGGLE_HEIGHT, SEAM_TOGGLE_WIDTH } from '@/components/ui/seam-toggle';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { WorkspacePaneContext } from '../../hooks/workspace-pane-context';
import { RailButton } from './rail-button';
import { useWorkspaceSidebarController } from '../../hooks/use-workspace-sidebar-controller';
import { type WorkspaceSidebarProps } from './component-types';
export function WorkspaceSidebar({
  children,
  storageScope,
  defaultCollapsed,
  locked
}: WorkspaceSidebarProps) {
  const colors = useThemeTokens();
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
  return <WorkspacePaneContext.Provider value={{
    request: paneRequest,
    activeTab: activePaneTab,
    setActiveTab: setActivePaneTab
  }}>
      <div className={"  w-0"}>
        {!collapsed && <div className="flex flex-col">
            {contentMounted && <div className={"w-0 flex-1"}>{children}</div>}
          </div>}

        {!locked && <div className="flex flex-col">
            <RailButton label="Open files" active={activePaneTab === 'files'} onClick={() => openPane('files')}>
              <Files size={17} color={colors.textSecondary} strokeWidth={1.8} />
            </RailButton>
            {isGitRepo && <RailButton label="Open Git" active={activePaneTab === 'git'} onClick={() => openPane('git')}>
                <GitBranch size={17} color={colors.textSecondary} strokeWidth={1.8} />
              </RailButton>}
            {isDesktopShell && <RailButton label="Open browser" active={activePaneTab === 'preview'} onClick={() => openPane('preview')}>
                <Globe2 size={17} color={colors.textSecondary} strokeWidth={1.8} />
              </RailButton>}
          </div>}

        {!locked && !collapsed && <div className={"  mt-[0]"}>
            <SeamToggle chevron="right" onClick={toggleCollapsed} label="Close side panel" />
          </div>}

        {!collapsed && <div {...panelResizer.panHandlers} {...webSeamHoverProps} className="flex flex-col">
            <div />
          </div>}
      </div>
    </WorkspacePaneContext.Provider>;
}
