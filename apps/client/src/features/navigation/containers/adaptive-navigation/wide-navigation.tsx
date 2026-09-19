import { toTailwind } from "@/styles/to-tailwind";
import type { ReactNode } from 'react';
import { Animated } from "@/platform/animation";
import { ConnectionStatusBanner } from '@/features/agent/components/connection-status-banner';
import { ProjectSidebar, SettingsSidebar } from '../../components/project-sidebar';
import { TaskOutputPanel } from '@/features/tasks/components/task-output-panel';
import { SeamToggle, SEAM_TOGGLE_WIDTH } from '@/components/ui/seam-toggle';
import { styles } from './style-tokens';
import type { useAdaptiveNavigationController } from './use-adaptive-navigation-controller';
type Controller = ReturnType<typeof useAdaptiveNavigationController>;
export function WideNavigation({
  children,
  colors,
  controller
}: {
  children: ReactNode;
  colors: ReturnType<typeof import('@/hooks/use-theme-tokens').useThemeTokens>;
  controller: Controller;
}) {
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
    handleToggleSidebar
  } = controller;
  const webHoverProps = isWeb ? {
    onMouseEnter: handleHoverZoneIn,
    onMouseLeave: handleHoverZoneOut
  } : {};
  const webSidebarHoverProps = isWeb ? {
    onMouseEnter: handleHoverZoneIn,
    onMouseLeave: handleHoverZoneOut
  } : {};
  return <div className={toTailwind([styles.wideContainer, {
    backgroundColor: colors.background
  }])} edges={['top']}>
      <div className={toTailwind(styles.bodyRow)}>
        {hasServer && showPersistentSidebar && <div className={toTailwind({
        width: animatedSidebarWidth,
        overflow: 'hidden',
        height: '100%'
      })}>
            <div className={toTailwind({
          width: 280,
          flex: 1
        })}>{settingsMode ? <SettingsSidebar /> : <ProjectSidebar />}</div>
          </div>}
        <div className={toTailwind([styles.content, hasServer && {
        borderLeftWidth: 0.633,
        borderTopWidth: 0.633,
        borderRightWidth: 0.633,
        borderLeftColor: colors.borderStrong,
        borderTopColor: colors.borderStrong,
        borderRightColor: colors.borderStrong
      }])}>
          <div className={toTailwind(styles.contentInner)}>{children}</div>
          {isCodeMode && <TaskOutputPanel />}
          {hasServer && !isPersistent && <>
              <div {...webHoverProps} className={toTailwind(styles.hoverZone)} />
              <div className={toTailwind([styles.overlay, {
            backgroundColor: colors.overlay,
            opacity: hoverAnim,
            pointerEvents: hoverVisible ? 'auto' : 'none'
          }])} />
              <div {...webSidebarHoverProps} className={toTailwind([styles.hoverSidebar, {
            transform: [{
              translateX: hoverTranslateX
            }]
          }])}>
                {settingsMode ? <SettingsSidebar /> : <ProjectSidebar />}
              </div>
            </>}
        </div>
        {hasServer && <div pointerEvents="box-none" className={toTailwind([styles.seamPillWrap, {
        left: Animated.subtract(animatedSidebarWidth, SEAM_TOGGLE_WIDTH / 2)
      }])}>
            <SeamToggle chevron={isPersistent ? 'left' : 'right'} onClick={handleToggleSidebar} label={isPersistent ? 'Collapse sidebar' : 'Expand sidebar'} onHoverIn={handleHoverZoneIn} onHoverOut={handleHoverZoneOut} />
          </div>}
      </div>
      {hasServer && <ConnectionStatusBanner />}
    </div>;
}
