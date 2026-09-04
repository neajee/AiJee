import { useCallback, useEffect, useState } from 'react';

import { useWorkspaceStore } from '../store';
import { useGitStatus, useGitLog, useFileDiff } from '@aijee/client-sdk';
import { useWorkspacePaneRequest } from './workspace-pane-context';
import type { Tab } from '../utils/changes-panel';
import type { ChangesPanelProps, SelectedFile } from '../components/changes-panel/types';

export function useChangesPanelController({
  extraTabs,
  activeExtraTab = null,
  onExtraTabChange,
}: Pick<ChangesPanelProps, 'extraTabs' | 'activeExtraTab' | 'onExtraTabChange'> = {}) {
  const [activeTab, setActiveTab] = useState<Tab>('git');
  const [commitMsg, setCommitMsg] = useState('');
  const [logOpen, setLogOpen] = useState(false);
  const [changesOpen, setChangesOpen] = useState(true);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [viewingFile, setViewingFile] = useState<string | null>(null);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const paneContext = useWorkspacePaneRequest();
  const paneRequest = paneContext?.request;
  const workspace = useWorkspaceStore((s) => s.workspaces.find((w) => w.id === s.selectedWorkspaceId));
  const cwd = workspace?.path ?? null;
  const { data: gitData, isLoading, isGitRepo, stage, unstage, discard, commit, isCommitting } = useGitStatus(cwd);
  const { entries: logEntries, isLoading: logLoading } = useGitLog(isGitRepo && activeTab === 'git' && logOpen ? cwd : null);
  const { data: fileDiffData, isLoading: diffLoading } = useFileDiff(isGitRepo ? cwd : null, selectedFile?.path ?? null, selectedFile?.staged ?? false);

  useEffect(() => {
    setActiveTab('git');
    setCommitMsg('');
    setLogOpen(false);
    setChangesOpen(true);
    setSelectedFile(null);
    setViewingFile(null);
    setExpandedDirs(new Set());
  }, [cwd]);
  useEffect(() => {
    if (!isGitRepo) setSelectedFile(null);
  }, [isGitRepo]);

  const handleToggleDir = useCallback((dirPath: string) => {
    setExpandedDirs((previous) => {
      const next = new Set(previous);
      if (next.has(dirPath)) next.delete(dirPath);
      else next.add(dirPath);
      return next;
    });
  }, []);
  const handleFilePress = useCallback((path: string, staged: boolean) => {
    setSelectedFile((previous) => previous?.path === path && previous.staged === staged ? null : { path, staged });
  }, []);
  const staged = gitData?.staged ?? [];
  const unstaged = gitData?.unstaged ?? [];
  const untracked = gitData?.untracked ?? [];
  const totalChanges = staged.length + unstaged.length + untracked.length;
  const currentTab: Tab = isGitRepo ? activeTab : 'files';
  const extraKeys = new Set((extraTabs ?? []).map((tab) => tab.key));

  useEffect(() => {
    if (!paneRequest) return;
    if (paneRequest.tab === 'preview' && extraKeys.has('preview')) {
      onExtraTabChange?.('preview');
      return;
    }
    onExtraTabChange?.(null);
    setActiveTab(paneRequest.tab as Tab);
  }, [paneRequest?.revision]);
  useEffect(() => {
    paneContext?.setActiveTab(activeExtraTab === 'preview' ? 'preview' : currentTab);
  }, [activeExtraTab, currentTab, paneContext?.setActiveTab]);

  const handleCommit = useCallback(async () => {
    if (!commitMsg.trim() || staged.length === 0 || isCommitting) return;
    await commit(commitMsg.trim());
    setCommitMsg('');
  }, [commit, commitMsg, isCommitting, staged.length]);

  return {
    activeExtraTab,
    activeTab,
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
    logEntries: logEntries ?? [],
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
    fileDiff: fileDiffData?.diff,
    extraTabs,
    renderExtraTab: undefined,
    handleCommit,
    handleFilePress,
    handleToggleDir,
    stage,
    unstage,
    discard,
  };
}
