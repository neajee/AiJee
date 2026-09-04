import { ScrollView, Spinner, Text, View } from 'tamagui';
import { Platform, Pressable } from 'react-native';
import { ChevronDown, ChevronUp, GitCompare } from 'lucide-react-native';

import { FileTree } from '../file-tree';
import { useChangesTheme } from '../../hooks/use-changes-theme';
import { BranchLabel } from './branch-label';
import { ChangesTab } from './changes-tab';
import { LogSection } from './history-tab';
import { CommitBar } from './commit-bar';
import { useChangesPanelController } from '../../hooks/use-changes-panel-controller';
import { styles } from './styles';
import type { ChangesPanelProps } from './types';

export function ChangesPanel({ renderExtraTab, ...props }: ChangesPanelProps = {}) {
  const { textPrimary, textMuted, surfaceBg, dividerColor, hoverBg } = useChangesTheme();
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
    discard,
  } = controller;
  return (
    <View style={[styles.container, { backgroundColor: surfaceBg }]}>
      {activeExtraTab ? (
        <View style={styles.content}>{renderExtraTab?.(activeExtraTab)}</View>
      ) : (
        <View style={styles.tabPanels}>
          <View
            {...(Platform.OS !== 'web' ? { pointerEvents: currentTab === 'files' ? ('auto' as const) : ('none' as const) } : {})}
            style={[styles.tabPanel, currentTab !== 'files' && styles.tabPanelHidden, Platform.OS === 'web' && ({ pointerEvents: currentTab === 'files' ? 'auto' : 'none' } as any)]}
          >
            {cwd ? (
              <FileTree rootPath={cwd} viewingFile={viewingFile} onViewFile={setViewingFile} expandedDirs={expandedDirs} onToggleDir={handleToggleDir} />
            ) : <Text style={[styles.emptyText, { color: textMuted }]}>No workspace selected</Text>}
          </View>
          {isGitRepo && (
            <View
              {...(Platform.OS !== 'web' ? { pointerEvents: currentTab === 'git' ? ('auto' as const) : ('none' as const) } : {})}
              style={[styles.tabPanel, currentTab !== 'git' && styles.tabPanelHidden, Platform.OS === 'web' && ({ pointerEvents: currentTab === 'git' ? 'auto' : 'none' } as any)]}
            >
              <View style={[styles.changesSection, { borderBottomColor: dividerColor }]}>
                <Pressable
                  onPress={() => setChangesOpen((open) => !open)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: changesOpen }}
                  accessibilityLabel="Toggle changes"
                  style={({ pressed, hovered }: any) => [styles.sectionHeader, (pressed || hovered) && { backgroundColor: hoverBg }]}
                >
                  <GitCompare size={12} color={textMuted} strokeWidth={2} />
                  <Text style={[styles.sectionHeaderText, { color: textPrimary }]}>Changes</Text>
                  {totalChanges > 0 && <Text style={[styles.sectionCount, { color: textMuted }]}>{totalChanges}</Text>}
                  <View style={{ flex: 1 }} />
                  {gitData && <BranchLabel branch={gitData.branch} ahead={gitData.ahead} behind={gitData.behind} />}
                  {changesOpen ? <ChevronUp size={13} color={textMuted} strokeWidth={2} /> : <ChevronDown size={13} color={textMuted} strokeWidth={2} />}
                </Pressable>
                {changesOpen && (
                  <ScrollView style={styles.gitChanges} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
                    {isLoading ? <Spinner style={{ marginTop: 32 }} /> : (
                      <ChangesTab
                        staged={staged}
                        unstaged={unstaged}
                        untracked={untracked}
                        selectedFile={selectedFile}
                        diffContent={fileDiff}
                        diffLoading={diffLoading}
                        onFilePress={handleFilePress}
                        onStage={stage}
                        onUnstage={unstage}
                        onDiscard={discard}
                      />
                    )}
                  </ScrollView>
                )}
              </View>
              <LogSection entries={logEntries} isLoading={logLoading} isOpen={logOpen} onToggle={() => setLogOpen((open) => !open)} />
            </View>
          )}
        </View>
      )}
      {!activeExtraTab && currentTab === 'git' && staged.length > 0 && (
        <CommitBar stagedCount={staged.length} commitMsg={commitMsg} onChangeCommitMsg={setCommitMsg} onCommit={handleCommit} isCommitting={isCommitting} />
      )}
    </View>
  );
}
