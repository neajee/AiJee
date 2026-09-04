import { View } from 'tamagui';

import { usePromptTheme } from '@/components/surface-theme/use-prompt-theme';
import { NewWorkspaceDialog } from '@/features/workspace/components/new-workspace-dialog';
import { useComposerContextController } from '../../hooks/use-composer-context-controller';
import { BranchDialog } from './branch-dialog';
import { ContextDropdown } from './context-dropdown';
import { styles } from '../../utils/composer-context-bar-styles';

export function ComposerContextBar() {
  const theme = usePromptTheme();
  const controller = useComposerContextController();
  const {
    open,
    setOpen,
    branches,
    branchesLoading,
    busy,
    newWorkspaceVisible,
    setNewWorkspaceVisible,
    newBranchVisible,
    setNewBranchVisible,
    newBranchName,
    setNewBranchName,
    branchError,
    setBranchError,
    anim,
    workspaces,
    selectedWorkspaceId,
    activeServer,
    servers,
    activeServerId,
    workspace,
    currentBranch,
    git,
    toggle,
    handleSelectProject,
    handleSelectServer,
    handleSelectBranch,
    handleCreateBranch,
    localBranches,
  } = controller;
  if (!workspace) return null;

  return (
    <>
      <View style={styles.wrapper} {...({ 'data-composer-context': true } as any)}>
        <ContextDropdown
          theme={theme}
          open={open}
          anim={anim}
          branches={branches}
          branchesLoading={branchesLoading}
          busy={busy}
          workspaces={workspaces}
          selectedWorkspaceId={selectedWorkspaceId}
          activeServer={activeServer}
          servers={servers}
          activeServerId={activeServerId}
          currentBranch={currentBranch}
          isGitRepo={git.isGitRepo}
          localBranches={localBranches}
          onToggle={toggle}
          onSelectProject={handleSelectProject}
          onSelectServer={handleSelectServer}
          onSelectBranch={handleSelectBranch}
          onAddWorkspace={() => {
            setOpen(null);
            setNewWorkspaceVisible(true);
          }}
          onAddBranch={() => {
            setOpen(null);
            setBranchError(null);
            setNewBranchName('');
            setNewBranchVisible(true);
          }}
        />
      </View>
      <NewWorkspaceDialog visible={newWorkspaceVisible} onClose={() => setNewWorkspaceVisible(false)} />
      <BranchDialog
        visible={newBranchVisible}
        currentBranch={currentBranch}
        branchName={newBranchName}
        busy={busy}
        error={branchError}
        setBranchName={setNewBranchName}
        onClose={() => setNewBranchVisible(false)}
        onCreate={() => void handleCreateBranch()}
      />
    </>
  );
}
