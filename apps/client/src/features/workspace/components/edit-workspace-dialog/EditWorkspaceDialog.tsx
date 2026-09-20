import { X } from 'lucide-react';
import { useSafeAreaInsets } from "@/platform/browser";
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useEditWorkspaceController } from '../../hooks/use-edit-workspace-controller';
import { EditWorkspaceForm } from './form-content';
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
    return <div hidden={!visible}>
        <div className={"flex-1"} behavior={false ? 'padding' : undefined}>
          <button className="inline-flex items-center" onClick={onClose}>
            <button className={"  pb-0"} onClick={event => event.stopPropagation()}>
              <div className="flex flex-col"><div /></div>
              <span>Edit Workspace</span>
              <div className="flex flex-col">
                <EditWorkspaceForm {...formProps} />
              </div>
            </button>
          </button>
        </div>
      </div>;
  }
  return <div hidden={!visible}>
      <button className="inline-flex items-center" onClick={onClose}>
        <button onClick={event => event.stopPropagation()}>
          <div className="flex flex-col">
            <span>Edit Workspace</span>
            <button onClick={onClose}>
              <X size={18} color={textMuted} strokeWidth={2} />
            </button>
          </div>
          <EditWorkspaceForm {...formProps} />
        </button>
      </button>
    </div>;
}
