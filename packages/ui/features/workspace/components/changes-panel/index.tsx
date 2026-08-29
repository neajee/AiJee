import { type ReactNode, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ChevronDown, ChevronUp, GitCompare } from "lucide-react-native";

import { useWorkspaceStore } from "@/features/workspace/store";
import { useGitStatus, useGitLog, useFileDiff } from "@aijee/client-sdk";
import { FileTree } from "../file-tree";

import type { Tab } from "./constants";
import { useChangesTheme } from "./use-theme-colors";
import { Fonts } from "@/constants/theme";
import type { TabItem } from "./tab-bar";
import { BranchLabel } from "./branch-label";
import { ChangesTab } from "./changes-tab";
import { LogSection } from "./history-tab";
import { CommitBar } from "./commit-bar";
import { useWorkspacePaneRequest } from "../workspace-sidebar/context";

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
  const { textPrimary, textMuted, surfaceBg, dividerColor, hoverBg } =
    useChangesTheme();

  const [activeTab, setActiveTab] = useState<Tab>("git");
  const [commitMsg, setCommitMsg] = useState("");
  // History is reference material: it waits at the foot of the card until asked
  // for, and its fetch waits with it.
  const [logOpen, setLogOpen] = useState(false);
  const [changesOpen, setChangesOpen] = useState(true);
  const [selectedFile, setSelectedFile] = useState<{
    path: string;
    staged: boolean;
  } | null>(null);
  const [viewingFile, setViewingFile] = useState<string | null>(null);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const paneContext = useWorkspacePaneRequest();
  const paneRequest = paneContext?.request;

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
    setChangesOpen(true);
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
  const extraKeys = new Set((extraTabs ?? []).map((tab) => tab.key));

  useEffect(() => {
    if (!paneRequest) return;
    if (paneRequest.tab === "preview" && extraKeys.has("preview")) {
      onExtraTabChange?.("preview");
      return;
    }
    onExtraTabChange?.(null);
    setActiveTab(paneRequest.tab as Tab);
  }, [paneRequest?.revision]);

  useEffect(() => {
    paneContext?.setActiveTab(
      activeExtraTab === "preview" ? "preview" : currentTab,
    );
  }, [activeExtraTab, currentTab, paneContext?.setActiveTab]);

  const handleCommit = useCallback(async () => {
    if (!commitMsg.trim() || staged.length === 0 || isCommitting) return;
    await commit(commitMsg.trim());
    setCommitMsg("");
  }, [commitMsg, staged.length, isCommitting, commit]);

  return (
    <View style={[styles.container, { backgroundColor: surfaceBg }]}>
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
              <View style={[styles.changesSection, { borderBottomColor: dividerColor }]}>
                <Pressable
                  onPress={() => setChangesOpen((open) => !open)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: changesOpen }}
                  accessibilityLabel="Toggle changes"
                  style={({ pressed, hovered }: any) => [
                    styles.sectionHeader,
                    (pressed || hovered) && { backgroundColor: hoverBg },
                  ]}
                >
                  <GitCompare size={12} color={textMuted} strokeWidth={2} />
                  <Text style={[styles.sectionHeaderText, { color: textPrimary }]}>Changes</Text>
                  {totalChanges > 0 && (
                    <Text style={[styles.sectionCount, { color: textMuted }]}>{totalChanges}</Text>
                  )}
                  <View style={{ flex: 1 }} />
                  {gitData && (
                    <BranchLabel
                      branch={gitData.branch}
                      ahead={gitData.ahead}
                      behind={gitData.behind}
                    />
                  )}
                  {changesOpen ? (
                    <ChevronUp size={13} color={textMuted} strokeWidth={2} />
                  ) : (
                    <ChevronDown size={13} color={textMuted} strokeWidth={2} />
                  )}
                </Pressable>

                {changesOpen && (
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
                )}
              </View>

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
  changesSection: {
    flex: 1,
    borderBottomWidth: 0.633,
  },
  sectionHeader: {
    height: 26,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  sectionHeaderText: {
    fontSize: 10.5,
    fontFamily: Fonts.sansSemiBold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: 10.5,
    fontFamily: Fonts.mono,
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
