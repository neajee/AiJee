import type { ReactNode } from 'react';
import { Animated } from "@/styles/motion";
import { ConnectionStatusBanner } from '@/features/agent/components/connection-status-banner';
import { ProjectSidebar, SettingsSidebar } from '../../components/project-sidebar';
import { TaskOutputPanel } from '@/features/tasks/components/task-output-panel';
import { SeamToggle, SEAM_TOGGLE_WIDTH } from '@/components/ui/seam-toggle';
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
  return <div className={" "} edges={['top']}>
      <div className={"block"}>
        {hasServer && showPersistentSidebar && <div className={"w-0 overflow-hidden h-full"}>
            <div className={"w-[280px] flex-1"}>{settingsMode ? <SettingsSidebar /> : <ProjectSidebar />}</div>
          </div>}
        <div className={" "}>
          <div className={"block"}>{children}</div>
          {isCodeMode && <TaskOutputPanel />}
          {hasServer && !isPersistent && <>
              <div {...webHoverProps} className={"block"} />
              <div className={"  opacity-100"} />
              <div {...webSidebarHoverProps} className={" "}>
                {settingsMode ? <SettingsSidebar /> : <ProjectSidebar />}
              </div>
            </>}
        </div>
        {hasServer && <div pointerEvents="box-none" className={" "}>
            <SeamToggle chevron={isPersistent ? 'left' : 'right'} onClick={handleToggleSidebar} label={isPersistent ? 'Collapse sidebar' : 'Expand sidebar'} onHoverIn={handleHoverZoneIn} onHoverOut={handleHoverZoneOut} />
          </div>}
      </div>
      {hasServer && <ConnectionStatusBanner />}
    </div>;
}
