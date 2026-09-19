import { toTailwind } from "@/styles/to-tailwind";
import { usePromptTheme } from '@/components/surface-theme/use-prompt-theme';
import { styles } from '../../utils/composer-context-bar-styles';
interface BranchDialogProps {
  visible: boolean;
  currentBranch: string | null;
  branchName: string;
  busy: string | null;
  error: string | null;
  setBranchName: (value: string) => void;
  onClose: () => void;
  onCreate: () => void;
}
export function BranchDialog({
  visible,
  currentBranch,
  branchName,
  busy,
  error,
  setBranchName,
  onClose,
  onCreate
}: BranchDialogProps) {
  const theme = usePromptTheme();
  return <div visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <button className={toTailwind(styles.branchOverlay)} onClick={onClose}>
        <button className={toTailwind([styles.branchDialog, {
        backgroundColor: theme.dropdownBg,
        borderColor: theme.dropdownBorder
      }])} onClick={event => event.stopPropagation()}>
          <span className={toTailwind([styles.branchTitle, {
          color: theme.textPrimary
        }])}>新建分支</span>
          <span className={toTailwind([styles.branchHint, {
          color: theme.textMuted
        }])}>将从当前分支 {currentBranch ?? 'HEAD'} 创建并立即切换。</span>
          <input value={branchName} onChangeText={setBranchName} onSubmitEditing={onCreate} autoFocus autoCapitalize="none" autoCorrect={false} placeholder="例如：feat/new-flow" placeholderTextColor={theme.textMuted} className={toTailwind([styles.branchInput, {
          color: theme.textPrimary,
          borderColor: theme.dropdownBorder,
          backgroundColor: theme.hoverBg
        }])} />
          {error ? <span className={toTailwind([styles.branchError, {
          color: theme.colors.destructive
        }])}>{error}</span> : null}
          <div className={toTailwind(styles.branchActions)}>
            <button onClick={onClose}><span className={toTailwind({
              color: theme.textPrimary
            })}>取消</span></button>
            <button disabled={!branchName.trim() || busy === 'new-branch'} onClick={onCreate}><span className={toTailwind([styles.branchCreateText, {
              color: theme.colors.onAccent
            }])}>{busy === 'new-branch' ? '创建中…' : '创建并切换'}</span></button>
          </div>
        </button>
      </button>
    </div>;
}
