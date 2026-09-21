import { FileTree } from '../file-tree';
import { BranchLabel } from './branch-label';
import { ChangesTab } from './changes-tab';
import { HistoryTab } from './history-tab';
import { CommitBar } from './commit-bar';
import { ChevronDown, ChevronUp, GitCompare, History } from 'lucide-react';
import { useChangesPanelController } from '../../hooks/use-changes-panel-controller';
import type { ChangesPanelProps } from './component-types';
export function ChangesPanel({
  renderExtraTab,
  ...props
}: ChangesPanelProps = {}) {
  const controller = useChangesPanelController(props);
  const {
    activeExtraTab,
    changesOpen,
    setChangesOpen,
    commitMsg,
    setCommitMsg,
    currentTab,
    cwd,
    diffLoading,
    expandedDirs,
    gitData,
    isCommitting,
    isGitRepo,
    isLoading,
    logEntries,
    logLoading,
    logOpen,
    setLogOpen,
    selectedFile,
    staged,
    untracked,
    unstaged,
    viewingFile,
    setViewingFile,
    fileDiff,
    handleCommit,
    handleFilePress,
    handleToggleDir,
    stage,
    unstage,
    discard
  } = controller;
  if (activeExtraTab) return <div className="flex min-h-0 flex-1 flex-col">{renderExtraTab?.(activeExtraTab)}</div>;
  if (currentTab === 'files') return <div className="flex min-h-0 flex-1 flex-col">
    {cwd ? <FileTree rootPath={cwd} viewingFile={viewingFile} onViewFile={setViewingFile} expandedDirs={expandedDirs} onToggleDir={handleToggleDir} /> : <span className="p-3 text-caption text-text-tertiary">No workspace selected</span>}
  </div>;
  return <div className="flex min-h-0 flex-1 flex-col">
    {isGitRepo && <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <button className="flex h-9 shrink-0 w-full items-center gap-2 px-3 text-left text-caption hover:bg-hover" onClick={() => setChangesOpen(value => { const next = !value; if (next) setLogOpen(false); return next; })} aria-label="Toggle changes"><GitCompare size={14} className="text-text-tertiary" strokeWidth={2} /><span className="font-medium text-foreground">Changes</span><span className="flex-1" />{gitData && <BranchLabel branch={gitData.branch} ahead={gitData.ahead} behind={gitData.behind} />}{changesOpen ? <ChevronUp size={13} className="text-text-tertiary" /> : <ChevronDown size={13} className="text-text-tertiary" />}</button>
      {changesOpen && <div className="min-h-0 flex-1 overflow-y-auto">{isLoading ? <div className="flex justify-center py-6"><span className="size-4 animate-spin rounded-full border-2 border-border border-t-text-tertiary" /></div> : <ChangesTab staged={staged} unstaged={unstaged} untracked={untracked} selectedFile={selectedFile} diffContent={fileDiff} diffLoading={diffLoading} onFilePress={handleFilePress} onStage={stage} onUnstage={unstage} onDiscard={discard} />}</div>}
      <button className="flex h-8 shrink-0 w-full items-center gap-2 border-t border-border px-3 text-left text-caption hover:bg-hover" onClick={() => setLogOpen(value => { const next = !value; if (next) setChangesOpen(false); return next; })} aria-label="Toggle log"><History size={13} className="text-text-tertiary" /><span className="font-medium text-foreground">Log</span><span className="flex-1" />{logOpen ? <ChevronUp size={13} className="text-text-tertiary" /> : <ChevronDown size={13} className="text-text-tertiary" />}</button>
      {logOpen && <div className="min-h-0 flex-1 overflow-y-auto p-2">{logLoading ? <div className="flex justify-center py-4"><span className="size-3 animate-spin rounded-full border-2 border-border border-t-text-tertiary" /></div> : <HistoryTab entries={logEntries} />}</div>}
    </div>}
    {currentTab === 'git' && staged.length > 0 && <CommitBar stagedCount={staged.length} commitMsg={commitMsg} onChangeCommitMsg={setCommitMsg} onCommit={handleCommit} isCommitting={isCommitting} />}
  </div>;
}
