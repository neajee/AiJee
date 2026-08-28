import { type ReactNode, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useWorkspaceStore } from "@/features/workspace/store";
import { useGitStatus, useGitLog, useFileDiff } from "@pideck/client-sdk";
import { FileTree } from "../file-tree";

import type { Tab } from "./constants";
import { useChangesTheme } from "./use-theme-colors";
import { TabBar, type TabItem } from "./tab-bar";
import { BranchLabel } from "./branch-label";
import { ChangesTab } from "./changes-tab";
import { LogSection } from "./history-tab";
import { CommitBar } from "./commit-bar";

interface ChangesPanelProps {
  /**
   * Tabs contributed by the pane around this card, shown after Git and Files.
   * Their content comes back through `renderExtraTab`, so a parent can add a
   * view without adding a second row of tabs.
   */
  extraTabs?: TabItem[];
  activeExtraTab?: string | null;
  onExtraTabChange?: (key: string | null) => void;
  renderExtraTab?: (key: string) => ReactNode;
}

export function ChangesPanel({
  extraTabs,
  activeExtraTab = null,
  onExtraTabChange,
  renderExtraTab,
}: ChangesPanelProps = {}) {
  const { textMuted, surfaceBg } = useChangesTheme();

  const [activeTab, setActiveTab] = useState<Tab>("git");
  const [commitMsg, setCommitMsg] = useState("");
  // History is reference material: it waits at the foot of the card until asked
  // for, and its fetch waits with it.
  const [logOpen, setLogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    path: string;
    staged: boolean;
  } | null>(null);
  const [viewingFile, setViewingFile] = useState<string | null>(null);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  const handleToggleDir = useCallback((dirPath: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(dirPath)) next.delete(dirPath);
      else next.add(dirPath);
      return next;
    });
  }, []);

  const workspace = useWorkspaceStore((s) => {
    const id = s.selectedWorkspaceId;
    return s.workspaces.find((w) => w.id === id);
  });
  const cwd = workspace?.path ?? null;

  const {
    data: gitData,
    isLoading,
    isGitRepo,
    stage,
    unstage,
    discard,
    commit,
    isCommitting,
  } = useGitStatus(cwd);

  const { entries: logEntries, isLoading: logLoading } = useGitLog(
    isGitRepo && activeTab === "git" && logOpen ? cwd : null,
  );

  const { data: fileDiffData, isLoading: diffLoading } = useFileDiff(
    isGitRepo ? cwd : null,
    selectedFile?.path ?? null,
    selectedFile?.staged ?? false,
  );

  useEffect(() => {
    setActiveTab("git");
    setCommitMsg("");
    setLogOpen(false);
    setSelectedFile(null);
    setViewingFile(null);
    setExpandedDirs(new Set());
  }, [cwd]);

  useEffect(() => {
    if (!isGitRepo) {
      setSelectedFile(null);
    }
  }, [isGitRepo]);

  const handleFilePress = useCallback(
    (path: string, staged: boolean) => {
      if (selectedFile?.path === path && selectedFile?.staged === staged) {
        setSelectedFile(null);
      } else {
        setSelectedFile({ path, staged });
      }
    },
    [selectedFile],
  );

  const staged = gitData?.staged ?? [];
  const unstaged = gitData?.unstaged ?? [];
  const untracked = gitData?.untracked ?? [];
  const totalChanges = staged.length + unstaged.length + untracked.length;
  const currentTab: Tab = isGitRepo ? activeTab : "files";
  const tabItems: TabItem[] = [
    ...(isGitRepo
      ? [{ key: "git", label: "Git", count: totalChanges } as TabItem]
      : []),
    { key: "files", label: "Files" },
    ...(extraTabs ?? []),
  ];
  const extraKeys = new Set((extraTabs ?? []).map((tab) => tab.key));
  const activeKey = activeExtraTab ?? currentTab;

  const handleSelectTab = (key: string) => {
    if (extraKeys.has(key)) {
      onExtraTabChange?.(key);
      return;
    }
    // Picking Git or Files means leaving whatever the parent had open.
    onExtraTabChange?.(null);
    setActiveTab(key as Tab);
  };

  const handleCommit = useCallback(async () => {
    if (!commitMsg.trim() || staged.length === 0 || isCommitting) return;
    await commit(commitMsg.trim());
    setCommitMsg("");
  }, [commitMsg, staged.length, isCommitting, commit]);

  return (
    <View style={[styles.container, { backgroundColor: surfaceBg }]}>
      <TabBar
        items={tabItems}
        activeKey={activeKey}
        onSelect={handleSelectTab}
        right={
          isGitRepo && gitData ? (
            <BranchLabel
              branch={gitData.branch}
              ahead={gitData.ahead}
              behind={gitData.behind}
            />
          ) : null
        }
      />

      {activeExtraTab ? (
        <View style={styles.content}>{renderExtraTab?.(activeExtraTab)}</View>
      ) : (
        <View style={styles.tabPanels}>
          <View
            {...(Platform.OS !== "web"
              ? {
                  pointerEvents:
                    currentTab === "files"
                      ? ("auto" as const)
                      : ("none" as const),
                }
              : {})}
            style={[
              styles.tabPanel,
              currentTab !== "files" && styles.tabPanelHidden,
              Platform.OS === "web" &&
                ({
                  pointerEvents: currentTab === "files" ? "auto" : "none",
                } as any),
            ]}
          >
            {cwd ? (
              <FileTree
                rootPath={cwd}
                viewingFile={viewingFile}
                onViewFile={setViewingFile}
                expandedDirs={expandedDirs}
                onToggleDir={handleToggleDir}
              />
            ) : (
              <Text style={[styles.emptyText, { color: textMuted }]}>
                No workspace selected
              </Text>
            )}
          </View>

          {isGitRepo && (
            <View
              {...(Platform.OS !== "web"
                ? {
                    pointerEvents:
                      currentTab === "git"
                        ? ("auto" as const)
                        : ("none" as const),
                  }
                : {})}
              style={[
                styles.tabPanel,
                currentTab !== "git" && styles.tabPanelHidden,
                Platform.OS === "web" &&
                  ({
                    pointerEvents: currentTab === "git" ? "auto" : "none",
                  } as any),
              ]}
            >
              <ScrollView
                style={styles.gitChanges}
                contentContainerStyle={styles.contentInner}
                showsVerticalScrollIndicator={false}
              >
                {isLoading ? (
                  <ActivityIndicator style={{ marginTop: 32 }} />
                ) : (
                  <ChangesTab
                    staged={staged}
                    unstaged={unstaged}
                    untracked={untracked}
                    selectedFile={selectedFile}
                    diffContent={fileDiffData?.diff}
                    diffLoading={diffLoading}
                    onFilePress={handleFilePress}
                    onStage={stage}
                    onUnstage={unstage}
                    onDiscard={discard}
                  />
                )}
              </ScrollView>

              <LogSection
                entries={logEntries ?? []}
                isLoading={logLoading}
                isOpen={logOpen}
                onToggle={() => setLogOpen((open) => !open)}
              />
            </View>
          )}
        </View>
      )}

      {!activeExtraTab && currentTab === "git" && staged.length > 0 && (
        <CommitBar
          stagedCount={staged.length}
          commitMsg={commitMsg}
          onChangeCommitMsg={setCommitMsg}
          onCommit={handleCommit}
          isCommitting={isCommitting}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  tabPanels: {
    flex: 1,
    position: "relative",
  },
  tabPanel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  tabPanelHidden: {
    opacity: 0,
    zIndex: 0,
  },
  gitChanges: {
    flex: 1,
  },
  contentInner: {
    paddingBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 32,
  },
});
