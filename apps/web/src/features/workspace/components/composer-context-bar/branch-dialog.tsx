import { AppModal } from '@/components/ui';
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
  return <AppModal visible={visible} onClose={onClose} title="新建分支" showClose>
      <div className="flex flex-col gap-4">
        <p className="text-body text-muted-foreground">将从当前分支 {currentBranch ?? 'HEAD'} 创建并立即切换。</p>
        <input value={branchName} onChange={event => setBranchName(event.target.value)} onKeyDown={event => { if (event.key === "Enter") onCreate(); }} autoFocus placeholder="例如：feat/new-flow" className="w-full rounded-md border border-border bg-muted px-3 py-2 text-body outline-none focus:border-primary" />
        {error ? <p className="text-body text-error">{error}</p> : null}
        <div className="flex justify-end gap-2"><button className="rounded-md px-3 py-2 text-body hover:bg-hover" onClick={onClose}>取消</button><button className="rounded-md bg-primary px-3 py-2 text-body text-primary-content disabled:opacity-40" disabled={!branchName.trim() || busy === 'new-branch'} onClick={onCreate}>{busy === 'new-branch' ? '创建中…' : '创建并切换'}</button></div>
      </div>
    </AppModal>;
}
