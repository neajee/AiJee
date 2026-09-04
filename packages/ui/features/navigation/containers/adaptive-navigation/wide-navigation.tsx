import { View } from 'tamagui';
import type { ReactNode } from 'react';
import { Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConnectionStatusBanner } from '@/features/agent/components/connection-status-banner';
import { ProjectSidebar, SettingsSidebar } from '../../components/project-sidebar';
import { TaskOutputPanel } from '@/features/tasks/components/task-output-panel';
import { SeamToggle, SEAM_TOGGLE_WIDTH } from '@/components/ui/seam-toggle';
import { styles } from './styles';
import type { useAdaptiveNavigationController } from './use-adaptive-navigation-controller';

type Controller = ReturnType<typeof useAdaptiveNavigationController>;

export function WideNavigation({ children, colors, controller }: { children: ReactNode; colors: ReturnType<typeof import('@/hooks/use-theme-tokens').useThemeTokens>; controller: Controller }) {
  const {
    hasServer,
    settingsMode,
    isCodeMode,
    isPersistent,
    showPersistentSidebar,
    animatedSidebarWidth,
    hoverAnim,
    hoverTranslateX,
    hoverVisible,
    isWeb,
    handleHoverZoneIn,
    handleHoverZoneOut,
    handleToggleSidebar,
  } = controller;
  const webHoverProps = isWeb ? { onMouseEnter: handleHoverZoneIn, onMouseLeave: handleHoverZoneOut } : {};
  const webSidebarHoverProps = isWeb ? { onMouseEnter: handleHoverZoneIn, onMouseLeave: handleHoverZoneOut } : {};
  return (
    <SafeAreaView style={[styles.wideContainer, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.bodyRow}>
        {hasServer && showPersistentSidebar && (
          <Animated.View style={{ width: animatedSidebarWidth, overflow: 'hidden', height: '100%' }}>
            <View style={{ width: 280, flex: 1 }}>{settingsMode ? <SettingsSidebar /> : <ProjectSidebar />}</View>
          </Animated.View>
        )}
        <Animated.View
          style={[
            styles.content,
            hasServer && {
              borderLeftWidth: 0.633,
              borderTopWidth: 0.633,
              borderRightWidth: 0.633,
              borderLeftColor: colors.borderStrong,
              borderTopColor: colors.borderStrong,
              borderRightColor: colors.borderStrong,
            },
          ]}
        >
          <View style={styles.contentInner}>{children}</View>
          {isCodeMode && <TaskOutputPanel />}
          {hasServer && !isPersistent && (
            <>
              <View {...webHoverProps} style={styles.hoverZone} />
              <Animated.View style={[styles.overlay, { backgroundColor: colors.overlay, opacity: hoverAnim, pointerEvents: hoverVisible ? 'auto' : 'none' }]} />
              <Animated.View {...webSidebarHoverProps} style={[styles.hoverSidebar, { transform: [{ translateX: hoverTranslateX }] }]}>
                {settingsMode ? <SettingsSidebar /> : <ProjectSidebar />}
              </Animated.View>
            </>
          )}
        </Animated.View>
        {hasServer && (
          <Animated.View
            pointerEvents="box-none"
            style={[styles.seamPillWrap, { left: Animated.subtract(animatedSidebarWidth, SEAM_TOGGLE_WIDTH / 2) }]}
          >
            <SeamToggle
              chevron={isPersistent ? 'left' : 'right'}
              onPress={handleToggleSidebar}
              label={isPersistent ? 'Collapse sidebar' : 'Expand sidebar'}
              onHoverIn={handleHoverZoneIn}
              onHoverOut={handleHoverZoneOut}
            />
          </Animated.View>
        )}
      </View>
      {hasServer && <ConnectionStatusBanner />}
    </SafeAreaView>
  );
}
