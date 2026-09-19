import { toTailwind } from "@/styles/to-tailwind";
import { X } from 'lucide-react';
import { useSafeAreaInsets } from "@/platform/browser";
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useEditWorkspaceController } from '../../hooks/use-edit-workspace-controller';
import { EditWorkspaceForm } from './form-content';
import { styles } from './style-tokens';
import type { EditWorkspaceDialogProps } from './component-types';
export function EditWorkspaceDialog({
  visible,
  workspace,
  onClose
}: EditWorkspaceDialogProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const {
    isWideScreen
  } = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const controller = useEditWorkspaceController(visible, workspace, onClose);
  const textPrimary = isDark ? '#fefdfd' : colors.text;
  const textMuted = isDark ? '#cdc8c5' : colors.textTertiary;
  const inputBg = isDark ? '#1a1a1a' : '#F6F6F6';
  const inputBorder = isDark ? '#3b3a39' : 'rgba(0,0,0,0.12)';
  const formProps = {
    workspace,
    isDark,
    colors,
    textPrimary,
    textMuted,
    inputBg,
    inputBorder,
    ...controller,
    onClose
  };
  if (!isWideScreen) {
    return <div visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <div className={toTailwind({
        flex: 1
      })} behavior={false ? 'padding' : undefined}>
          <button className={toTailwind(styles.sheetOverlay)} onClick={onClose}>
            <button className={toTailwind([styles.sheetContainer, {
            backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF',
            paddingBottom: insets.bottom + 20
          }])} onClick={event => event.stopPropagation()}>
              <div className={toTailwind(styles.sheetHandle)}><div className={toTailwind([styles.sheetHandleBar, {
                backgroundColor: isDark ? '#555' : '#CCC'
              }])} /></div>
              <span className={toTailwind([styles.sheetTitle, {
              color: textPrimary
            }])}>Edit Workspace</span>
              <div className={toTailwind(styles.sheetBody)} keyboardShouldPersistTaps="handled">
                <EditWorkspaceForm {...formProps} />
              </div>
            </button>
          </button>
        </div>
      </div>;
  }
  return <div visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <button className={toTailwind(styles.overlay)} onClick={onClose}>
        <button className={toTailwind([styles.dialog, {
        backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF'
      }])} onClick={event => event.stopPropagation()}>
          <div className={toTailwind(styles.header)}>
            <span className={toTailwind([styles.title, {
            color: textPrimary
          }])}>Edit Workspace</span>
            <button onClick={onClose}>
              <X size={18} color={textMuted} strokeWidth={2} />
            </button>
          </div>
          <EditWorkspaceForm {...formProps} />
        </button>
      </button>
    </div>;
}
