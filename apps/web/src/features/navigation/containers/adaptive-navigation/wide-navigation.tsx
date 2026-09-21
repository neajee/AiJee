import type { ReactNode } from 'react';
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
    hoverVisible,
    handleHoverZoneIn,
    handleHoverZoneOut,
    handleToggleSidebar
  } = controller;
  return <div className="h-screen w-full overflow-hidden bg-background">
      <div className="relative flex h-full min-h-0 w-full flex-row">
        {hasServer && showPersistentSidebar && <div className="h-full shrink-0 overflow-hidden" style={{ width: animatedSidebarWidth }}>
            <div className={"h-full w-[280px]"}>{settingsMode ? <SettingsSidebar /> : <ProjectSidebar />}</div>
          </div>}
        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
          {isCodeMode && <TaskOutputPanel />}
          {hasServer && !isPersistent && <>
              <div onMouseEnter={handleHoverZoneIn} className="absolute inset-y-0 left-0 z-20 w-3" />
              <div
                onMouseEnter={handleHoverZoneIn}
                onMouseLeave={handleHoverZoneOut}
                style={{ transform: hoverVisible ? 'translateX(0)' : 'translateX(-100%)' }}
                className="absolute inset-y-0 left-0 z-30 w-[280px] transition-transform duration-200 ease-out"
              >
                {settingsMode ? <SettingsSidebar /> : <ProjectSidebar />}
              </div>
            </>}
        </div>
        {hasServer && <div className="pointer-events-none absolute top-1/2 z-40 h-16 w-[18px] -translate-y-1/2" style={{ left: Math.max(0, (isPersistent ? Number(animatedSidebarWidth) : 0) - SEAM_TOGGLE_WIDTH / 2) }}>
            <div className="pointer-events-auto"><SeamToggle chevron={isPersistent ? 'left' : 'right'} onClick={handleToggleSidebar} label={isPersistent ? 'Collapse sidebar' : 'Expand sidebar'} onPointerEnter={handleHoverZoneIn} onPointerLeave={handleHoverZoneOut} /></div>
          </div>}
      </div>
      {hasServer && <ConnectionStatusBanner />}
    </div>;
}
