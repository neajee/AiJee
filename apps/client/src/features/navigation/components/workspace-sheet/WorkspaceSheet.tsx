import MaterialIcons from '@/platform/icons';
import { useSafeAreaInsets } from "@/platform/browser";
import { Plus } from 'lucide-react';
import Animated from "@/platform/animation";
import { Pager } from '@/platform/pager';
import { Fonts } from '@/constants/theme';
import { ABSOLUTE_FILL_STYLE } from '@/constants/layout';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { NewWorkspaceDialog } from '@/features/workspace/components/new-workspace-dialog';
import { useWorkspaceSheetController } from '../../hooks/use-workspace-sheet-controller';
import { SessionPage } from './session-page';
import type { WorkspaceSheetProps } from './component-types';
export function WorkspaceSheet({
  visible,
  onClose
}: WorkspaceSheetProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeTokens();
  const isDark = (useColorScheme() ?? 'light') === 'dark';
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
    handleSettingsPress,
    panGesture,
    sheetStyle,
    overlayStyle,
    isWeb
  } = useWorkspaceSheetController({
    visible,
    onClose
  });
  const textPrimary = isDark ? '#fefdfd' : colors.text;
  const textMuted = isDark ? '#cdc8c5' : colors.textTertiary;
  const textSecondary = isDark ? '#f1ece8' : colors.textSecondary;
  const activeBorder = isDark ? '#ede8e4' : '#1A1A1A';
  const avatarScrollBg = isDark ? '#191919' : '#F8F8F8';
  return <div {...!isWeb ? {
    pointerEvents: visible ? 'auto' as const : 'none' as const
  } : {}} className={"" + " " + (isWeb ? "" : "")}>
      <div className={"" + " " + "" + " " + ""}>
        <button className={""} onClick={dismiss} />
      </div>

      <div className={"" + " " + "pb-[0] h-[0] max-h-[0]" + " " + ""}>
        <div>
          <div className={""}>
            <div className={"" + " " + ""} />
          </div>
        </div>

        <div className={"" + " " + ""}>
          <div ref={stripScrollRef} horizontal>
            {workspaces.map((workspace, index) => {
            const isActive = workspace.id === selectedWorkspaceId;
            return <button key={workspace.id} onClick={() => handleWorkspacePress(workspace.id, index)}>
                  <div className={"" + " " + (isActive ? "border-[2px]" : "")}>
                    <div className={"" + " " + ""}>
                      <span className={""}>
                        {workspace.title.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {workspace.hasNotifications && <div className={"" + " " + ""} />}
                  </div>
                  <span className={"" + " " + "" + " " + (isActive ? "font-sans" : "")}>
                    {workspace.title}
                  </span>
                </button>;
          })}
            <button onClick={handleAddWorkspace}>
              <div className={"" + " " + "border-[1.5px] border-dashed"}>
                <Plus size={18} color={textMuted} strokeWidth={1.8} />
              </div>
              <span className={"" + " " + ""}>Add</span>
            </button>
          </div>
        </div>

        <Pager ref={pagerRef} className={""} initialPage={Math.max(0, selectedIndex)} onPageSelected={event => handlePageSelected(event.nativeEvent.position)} overdrag>
          {workspaces.map(workspace => <div key={workspace.id} className={""}>
              <SessionPage workspaceId={workspace.id} onSessionPress={sessionId => {
            router.navigate(`/workspace/${workspace.id}/s/${sessionId}`);
            dismiss();
          }} onDismiss={dismiss} />
            </div>)}
        </Pager>

        <div className={"" + " " + ""}>
          <button onClick={handleServersPress}>
            <MaterialIcons name="dns" size={18} color={colors.icon} />
            <span className={"" + " " + ""}>连接</span>
          </button>
          <button onClick={handleSettingsPress}>
            <MaterialIcons name="settings" size={18} color={colors.icon} />
            <span className={"" + " " + ""}>Settings</span>
          </button>
        </div>
      </div>

      <NewWorkspaceDialog visible={showNewDialog} onClose={() => setShowNewDialog(false)} />
    </div>;
}
