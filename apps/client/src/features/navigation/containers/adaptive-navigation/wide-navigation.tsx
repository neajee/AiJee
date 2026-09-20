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
  return <div className="h-screen w-full overflow-hidden bg-background">
      <div className="flex h-full min-h-0 w-full flex-row">
        {hasServer && showPersistentSidebar && <div className="h-full shrink-0 overflow-hidden" style={{ width: animatedSidebarWidth }}>
            <div className={"h-full w-[280px]"}>{settingsMode ? <SettingsSidebar /> : <ProjectSidebar />}</div>
          </div>}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
          {isCodeMode && <TaskOutputPanel />}
          {hasServer && !isPersistent && <>
              <div {...webHoverProps} className="absolute inset-y-0 left-0 z-20 w-3" />
              <div className={"  opacity-100"} />
              <div {...webSidebarHoverProps} className="absolute inset-y-0 left-0 z-10 w-[280px] -translate-x-full">
                {settingsMode ? <SettingsSidebar /> : <ProjectSidebar />}
              </div>
            </>}
        </div>
        {hasServer && <div>
            <SeamToggle chevron={isPersistent ? 'left' : 'right'} onClick={handleToggleSidebar} label={isPersistent ? 'Collapse sidebar' : 'Expand sidebar'} onPointerEnter={handleHoverZoneIn} onPointerLeave={handleHoverZoneOut} />
          </div>}
      </div>
      {hasServer && <ConnectionStatusBanner />}
    </div>;
}
