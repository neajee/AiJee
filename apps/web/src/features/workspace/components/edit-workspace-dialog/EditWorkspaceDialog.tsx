import { X } from 'lucide-react';
import { useSafeAreaInsets } from "@/platform/browser";
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useEditWorkspaceController } from '../../hooks/use-edit-workspace-controller';
import { EditWorkspaceForm } from './form-content';
import type { EditWorkspaceDialogProps } from './component-types';
import { AppModal } from '@/components/ui/app-modal';
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
  return <AppModal visible={visible} onClose={onClose} contentStyle={!isWideScreen ? { alignSelf: 'end', marginBottom: 0 } : undefined}>
      <div className="flex flex-col gap-4"><header className="flex items-center justify-between"><h2 className="text-title font-semibold">Edit Workspace</h2><button className="rounded p-1 hover:bg-hover" onClick={onClose} aria-label="Close"><X size={18} color={textMuted} strokeWidth={2} /></button></header><EditWorkspaceForm {...formProps} /></div>
    </AppModal>;
}
