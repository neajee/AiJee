import { toTailwind } from "@/styles/to-tailwind";
import { Files, GitBranch, Globe2 } from 'lucide-react';
import { Animated } from "@/platform/animation";
import { SeamToggle, SEAM_TOGGLE_HEIGHT, SEAM_TOGGLE_WIDTH } from '@/components/ui/seam-toggle';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { WorkspacePaneContext } from '../../hooks/workspace-pane-context';
import { RailButton } from './rail-button';
import { styles } from './style-tokens';
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
      <div className={toTailwind([styles.container, {
      width: widthAnim,
      borderLeftColor: locked ? 'transparent' : sidebarBorder
    }])}>
        {!collapsed && <div className={toTailwind(styles.clip)}>
            {contentMounted && <div className={toTailwind({
          width: Math.max(0, panelWidth - 38),
          flex: 1
        })}>{children}</div>}
          </div>}

        {!locked && <div className={toTailwind(styles.activityBar)}>
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

        {!locked && !collapsed && <div className={toTailwind([styles.seamToggleWrap, {
        left: -SEAM_TOGGLE_WIDTH / 2,
        marginTop: -SEAM_TOGGLE_HEIGHT / 2
      }])} pointerEvents="box-none">
            <SeamToggle chevron="right" onClick={toggleCollapsed} label="Close side panel" />
          </div>}

        {!collapsed && <div {...panelResizer.panHandlers} {...webSeamHoverProps} className={toTailwind(styles.seam)}>
            <div className={toTailwind([styles.seamBar, {
          backgroundColor: seamActive ? isResizing ? seamDragTint : seamTint : 'transparent'
        }])} />
          </div>}
      </div>
    </WorkspacePaneContext.Provider>;
}
