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
      <button className={"block"} onClick={onClose}>
        <button className={"  bg-surface border-border"} onClick={event => event.stopPropagation()}>
          <span className={"  text-foreground"}>新建分支</span>
          <span className={"  text-text-secondary"}>将从当前分支 {currentBranch ?? 'HEAD'} 创建并立即切换。</span>
          <input value={branchName} onChangeText={setBranchName} onSubmitEditing={onCreate} autoFocus autoCapitalize="none" autoCorrect={false} placeholder="例如：feat/new-flow" placeholderTextColor={theme.textMuted} className={"  text-foreground border-border bg-muted"} />
          {error ? <span className={"  text-destructive"}>{error}</span> : null}
          <div className={"block"}>
            <button onClick={onClose}><span className={"text-foreground"}>取消</span></button>
            <button disabled={!branchName.trim() || busy === 'new-branch'} onClick={onCreate}><span className={"  text-accent"}>{busy === 'new-branch' ? '创建中…' : '创建并切换'}</span></button>
          </div>
        </button>
      </button>
    </div>;
}
