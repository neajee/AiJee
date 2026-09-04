import { View } from 'tamagui';
import { Files, GitBranch, Globe2 } from 'lucide-react-native';
import { Animated } from 'react-native';

import {
  SeamToggle,
  SEAM_TOGGLE_HEIGHT,
  SEAM_TOGGLE_WIDTH,
} from '@/components/ui/seam-toggle';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { WorkspacePaneContext } from '../../hooks/workspace-pane-context';
import { RailButton } from './rail-button';
import { styles } from './styles';
import { useWorkspaceSidebarController } from '../../hooks/use-workspace-sidebar-controller';
import { type WorkspaceSidebarProps } from './types';

export function WorkspaceSidebar({
  children,
  storageScope,
  defaultCollapsed,
  locked,
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
    widthAnim,
  } = useWorkspaceSidebarController({ storageScope, defaultCollapsed, locked });
  const sidebarBorder = isDark ? '#323131' : 'rgba(0,0,0,0.08)';
  const seamTint = 'rgba(136,136,136,0.16)';
  const seamDragTint = 'rgba(136,136,136,0.26)';

  return (
    <WorkspacePaneContext.Provider
      value={{ request: paneRequest, activeTab: activePaneTab, setActiveTab: setActivePaneTab }}
    >
      <Animated.View
        style={[styles.container, { width: widthAnim, borderLeftColor: locked ? 'transparent' : sidebarBorder }]}
      >
        {!collapsed && (
          <View style={styles.clip}>
            {contentMounted && (
              <View style={{ width: Math.max(0, panelWidth - 38), flex: 1 }}>{children}</View>
            )}
          </View>
        )}

        {!locked && (
          <View style={styles.activityBar}>
            <RailButton
              label="Open files"
              active={activePaneTab === 'files'}
              onPress={() => openPane('files')}
            >
              <Files size={17} color={colors.textSecondary} strokeWidth={1.8} />
            </RailButton>
            {isGitRepo && (
              <RailButton
                label="Open Git"
                active={activePaneTab === 'git'}
                onPress={() => openPane('git')}
              >
                <GitBranch size={17} color={colors.textSecondary} strokeWidth={1.8} />
              </RailButton>
            )}
            {isDesktopShell && (
              <RailButton
                label="Open browser"
                active={activePaneTab === 'preview'}
                onPress={() => openPane('preview')}
              >
                <Globe2 size={17} color={colors.textSecondary} strokeWidth={1.8} />
              </RailButton>
            )}
          </View>
        )}

        {!locked && !collapsed && (
          <View
            style={[styles.seamToggleWrap, { left: -SEAM_TOGGLE_WIDTH / 2, marginTop: -SEAM_TOGGLE_HEIGHT / 2 }]}
            pointerEvents="box-none"
          >
            <SeamToggle chevron="right" onPress={toggleCollapsed} label="Close side panel" />
          </View>
        )}

        {!collapsed && (
          <View {...panelResizer.panHandlers} {...webSeamHoverProps} style={styles.seam}>
            <View
              style={[
                styles.seamBar,
                {
                  backgroundColor: seamActive
                    ? isResizing
                      ? seamDragTint
                      : seamTint
                    : 'transparent',
                },
              ]}
            />
          </View>
        )}
      </Animated.View>
    </WorkspacePaneContext.Provider>
  );
}
