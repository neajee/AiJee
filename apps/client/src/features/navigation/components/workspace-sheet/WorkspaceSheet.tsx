import { toTailwind } from "@/styles/to-tailwind";
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
import { styles } from './style-tokens';
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
  } : {}} className={toTailwind([styles.root, isWeb && {
    pointerEvents: visible ? 'auto' : 'none'
  } as any])}>
      <div className={toTailwind([styles.overlay, {
      backgroundColor: colors.overlay
    }, overlayStyle])}>
        <button className={toTailwind(ABSOLUTE_FILL_STYLE)} onClick={dismiss} />
      </div>

      <div className={toTailwind([styles.sheet, {
      backgroundColor: colors.sheetBackground,
      paddingBottom: insets.bottom + 16,
      height: sheetHeight,
      maxHeight: sheetHeight
    }, sheetStyle])}>
        <div>
          <div className={toTailwind(styles.handleBar)}>
            <div className={toTailwind([styles.handle, {
            backgroundColor: colors.sheetHandle
          }])} />
          </div>
        </div>

        <div className={toTailwind([styles.workspaceStrip, {
        backgroundColor: avatarScrollBg
      }])}>
          <div ref={stripScrollRef} horizontal>
            {workspaces.map((workspace, index) => {
            const isActive = workspace.id === selectedWorkspaceId;
            return <button key={workspace.id} onClick={() => handleWorkspacePress(workspace.id, index)}>
                  <div className={toTailwind([styles.avatarOuter, isActive && {
                borderColor: activeBorder,
                borderWidth: 2
              }])}>
                    <div className={toTailwind([styles.avatarInner, {
                  backgroundColor: workspace.color
                }])}>
                      <span className={toTailwind(styles.avatarInitial)}>
                        {workspace.title.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {workspace.hasNotifications && <div className={toTailwind([styles.workspaceDot, {
                  backgroundColor: colors.notificationDot
                }])} />}
                  </div>
                  <span className={toTailwind([styles.workspaceLabel, {
                color: isActive ? textPrimary : textMuted
              }, isActive && {
                fontFamily: Fonts.sansMedium
              }])}>
                    {workspace.title}
                  </span>
                </button>;
          })}
            <button onClick={handleAddWorkspace}>
              <div className={toTailwind([styles.avatarOuter, {
              borderColor: isDark ? '#3b3a39' : 'rgba(0,0,0,0.12)',
              borderWidth: 1.5,
              borderStyle: 'dashed'
            }])}>
                <Plus size={18} color={textMuted} strokeWidth={1.8} />
              </div>
              <span className={toTailwind([styles.workspaceLabel, {
              color: textMuted
            }])}>Add</span>
            </button>
          </div>
        </div>

        <Pager ref={pagerRef} className={toTailwind(styles.pager)} initialPage={Math.max(0, selectedIndex)} onPageSelected={event => handlePageSelected(event.nativeEvent.position)} overdrag>
          {workspaces.map(workspace => <div key={workspace.id} className={toTailwind(styles.page)}>
              <SessionPage workspaceId={workspace.id} onSessionPress={sessionId => {
            router.navigate(`/workspace/${workspace.id}/s/${sessionId}`);
            dismiss();
          }} onDismiss={dismiss} />
            </div>)}
        </Pager>

        <div className={toTailwind([styles.sheetFooter, {
        borderTopColor: colors.border
      }])}>
          <button onClick={handleServersPress}>
            <MaterialIcons name="dns" size={18} color={colors.icon} />
            <span className={toTailwind([styles.footerLabel, {
            color: textSecondary
          }])}>连接</span>
          </button>
          <button onClick={handleSettingsPress}>
            <MaterialIcons name="settings" size={18} color={colors.icon} />
            <span className={toTailwind([styles.footerLabel, {
            color: textSecondary
          }])}>Settings</span>
          </button>
        </div>
      </div>

      <NewWorkspaceDialog visible={showNewDialog} onClose={() => setShowNewDialog(false)} />
    </div>;
}
