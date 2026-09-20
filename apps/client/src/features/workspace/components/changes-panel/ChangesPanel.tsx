import { ChevronDown, ChevronUp, GitCompare } from 'lucide-react';
import { FileTree } from '../file-tree';
import { useChangesTheme } from '../../hooks/use-changes-theme';
import { BranchLabel } from './branch-label';
import { ChangesTab } from './changes-tab';
import { LogSection } from './history-tab';
import { CommitBar } from './commit-bar';
import { useChangesPanelController } from '../../hooks/use-changes-panel-controller';
import type { ChangesPanelProps } from './component-types';
export function ChangesPanel({
  renderExtraTab,
  ...props
}: ChangesPanelProps = {}) {
  const {
    textPrimary,
    textMuted,
    surfaceBg,
    dividerColor,
    hoverBg
  } = useChangesTheme();
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
    totalChanges,
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
  return <div className={" "}>
      {activeExtraTab ? <div className={"block"}>{renderExtraTab?.(activeExtraTab)}</div> : <div className={"block"}>
          <div {...false ? {
        pointerEvents: currentTab === 'files' ? 'auto' as const : 'none' as const
      } : {}} className={" "}>
            {cwd ? <FileTree rootPath={cwd} viewingFile={viewingFile} onViewFile={setViewingFile} expandedDirs={expandedDirs} onToggleDir={handleToggleDir} /> : <span className={" "}>No workspace selected</span>}
          </div>
          {isGitRepo && <div {...false ? {
        pointerEvents: currentTab === 'git' ? 'auto' as const : 'none' as const
      } : {}} className={" "}>
              <div className={" "}>
                <button onClick={() => setChangesOpen(open => !open)} role="button" accessibilityState={{
            expanded: changesOpen
          }} aria-label="Toggle changes">
                  <GitCompare size={12} color={textMuted} strokeWidth={2} />
                  <span className={" "}>Changes</span>
                  {totalChanges > 0 && <span className={" "}>{totalChanges}</span>}
                  <div className={"flex-1"} />
                  {gitData && <BranchLabel branch={gitData.branch} ahead={gitData.ahead} behind={gitData.behind} />}
                  {changesOpen ? <ChevronUp size={13} color={textMuted} strokeWidth={2} /> : <ChevronDown size={13} color={textMuted} strokeWidth={2} />}
                </button>
                {changesOpen && <div className={"block"}>
                    {isLoading ? <span className={"mt-[32px]"} /> : <ChangesTab staged={staged} unstaged={unstaged} untracked={untracked} selectedFile={selectedFile} diffContent={fileDiff} diffLoading={diffLoading} onFilePress={handleFilePress} onStage={stage} onUnstage={unstage} onDiscard={discard} />}
                  </div>}
              </div>
              <LogSection entries={logEntries} isLoading={logLoading} isOpen={logOpen} onToggle={() => setLogOpen(open => !open)} />
            </div>}
        </div>}
      {!activeExtraTab && currentTab === 'git' && staged.length > 0 && <CommitBar stagedCount={staged.length} commitMsg={commitMsg} onChangeCommitMsg={setCommitMsg} onCommit={handleCommit} isCommitting={isCommitting} />}
    </div>;
}
