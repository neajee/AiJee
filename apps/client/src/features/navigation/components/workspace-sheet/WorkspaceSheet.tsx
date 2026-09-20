import MaterialIcons from '@/platform/icons';
import { Plus } from 'lucide-react';
import { AppSheet } from '@/components/ui';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { NewWorkspaceDialog } from '@/features/workspace/components/new-workspace-dialog';
import { useWorkspaceSheetController } from '../../hooks/use-workspace-sheet-controller';
import { SessionPage } from './session-page';
import type { WorkspaceSheetProps } from './component-types';
export function WorkspaceSheet({
  visible,
  onClose
}: WorkspaceSheetProps) {
  const colors = useThemeTokens();
  const {
    router,
    sheetHeight,
    showNewDialog,
    setShowNewDialog,
    workspaces,
    selectedWorkspaceId,
    selectedIndex,
    pagerRef,
    stripScrollRef,
    dismiss,
    handleWorkspacePress,
    handlePageSelected,
    handleAddWorkspace,
    handleServersPress,
    handleSettingsPress
  } = useWorkspaceSheetController({
    visible,
    onClose
  });
  return <AppSheet visible={visible} onClose={dismiss} title="Workspaces" height={sheetHeight}>
        <div className="mx-auto my-3 h-1 w-9 shrink-0 rounded-full bg-muted" />
        <div ref={stripScrollRef} className="flex shrink-0 gap-3 overflow-x-auto border-y border-border px-4 py-3">
            {workspaces.map((workspace, index) => {
            const isActive = workspace.id === selectedWorkspaceId;
            return <button key={workspace.id} className="flex w-16 shrink-0 flex-col items-center gap-1" onClick={() => handleWorkspacePress(workspace.id, index)}>
                  <div className={`grid size-11 place-items-center rounded-full border-2 ${isActive ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'}`}>
                      <span className="text-sm font-semibold">
                        {workspace.title.charAt(0).toUpperCase()}
                      </span>
                    {workspace.hasNotifications && <span className="absolute size-2 rounded-full bg-primary" />}
                  </div>
                  <span className="w-full truncate text-xs font-medium">
                    {workspace.title}
                  </span>
                </button>;
          })}
            <button className="flex w-16 shrink-0 flex-col items-center gap-1" onClick={handleAddWorkspace}>
              <div className="grid size-11 place-items-center rounded-full border-2 border-dashed border-border"><Plus size={18} color={colors.icon} strokeWidth={1.8} />
              </div>
              <span className="text-xs">Add</span>
            </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          {workspaces.filter(workspace => workspace.id === selectedWorkspaceId).map(workspace => <div key={workspace.id} className="flex min-h-0 flex-col">
              <SessionPage workspaceId={workspace.id} onSessionPress={sessionId => {
            router.navigate(`/workspace/${workspace.id}/s/${sessionId}`);
            dismiss();
          }} onDismiss={dismiss} />
            </div>)}
        </div>
        <footer className="flex shrink-0 gap-2 border-t border-border p-3">
          <button className="flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 hover:bg-hover" onClick={handleServersPress}>
            <MaterialIcons name="dns" size={18} color={colors.icon} />
            <span>连接</span>
          </button>
          <button className="flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 hover:bg-hover" onClick={handleSettingsPress}>
            <MaterialIcons name="settings" size={18} color={colors.icon} />
            <span>Settings</span>
          </button>
        </footer>

      <NewWorkspaceDialog visible={showNewDialog} onClose={() => setShowNewDialog(false)} />
    </AppSheet>;
}
