import { useCallback, useMemo, useState } from 'react';
import { Linking } from 'react-native';
import { usePathname } from 'expo-router';
import { ExternalLink, GitBranch, Github, Gitlab, Globe, Play } from 'lucide-react-native';

import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppMode } from '@/hooks/use-app-mode';
import { useWorkspaceStore } from '@/features/workspace/store';
import { usePreviewStore } from '@/features/preview/store';
import { useTasksStore } from '@/features/tasks/store';
import { useGitStatus, useNestedRepos } from '@aijee/client-sdk';
import { remotesToLinks, type RemoteLink } from '@/features/workspace/utils/git-remote-url';
import type { MobileHeaderBarProps } from '../components/mobile-header-bar/types';
import type { MobileHeaderActionItem } from '@/features/navigation/components/mobile-header-actions-sheet';

const EMPTY_TARGETS: never[] = [];

export function useMobileHeaderController(props: MobileHeaderBarProps) {
  const colors = useThemeTokens();
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const appMode = useAppMode();
  const pathname = usePathname();
  const hasTaskConfig = useTasksStore((s) => s.hasConfig);
  const taskInstances = useTasksStore((s) => s.instances);
  const selectedTaskId = useTasksStore((s) => s.selectedTaskId);
  const [moreVisible, setMoreVisible] = useState(false);
  const currentSessionId = pathname.match(/^\/workspace\/[^/]+\/s\/([^/]+)$/)?.[1] ?? null;
  const previewTargets = usePreviewStore((state) =>
    currentSessionId ? state.targetsBySession[currentSessionId] ?? EMPTY_TARGETS : EMPTY_TARGETS,
  );
  const workspace = useWorkspaceStore((s) => s.workspaces.find((w) => w.id === s.selectedWorkspaceId));
  const cwd = appMode === 'code' ? workspace?.path ?? null : null;
  const { data: gitData } = useGitStatus(cwd);
  const { repos: nestedRepos } = useNestedRepos(cwd);
  const allLinks: (RemoteLink & { repoPath?: string })[] = remotesToLinks(gitData?.remotes);
  for (const repo of nestedRepos ?? []) {
    for (const link of remotesToLinks(repo.remotes)) allLinks.push({ ...link, repoPath: repo.path });
  }
  const firstLink = allLinks[0] ?? null;
  const textPrimary = isDark ? '#fefdfd' : colors.text;
  const hasPreview = appMode === 'code' && Boolean(currentSessionId) && previewTargets.length > 0;
  const hasTasks = appMode === 'code' && (hasTaskConfig || taskInstances.length > 0);
  const hasTaskOutput = appMode === 'code' && (Boolean(selectedTaskId) || taskInstances.length > 0);
  const closeMore = useCallback(() => setMoreVisible(false), []);

  const actionItems = useMemo<MobileHeaderActionItem[]>(() => {
    if (appMode !== 'code') return [];
    const items: MobileHeaderActionItem[] = [
      {
        key: 'git',
        label: 'Git changes',
        icon: <GitBranch size={18} color={textPrimary} strokeWidth={1.8} />,
        onPress: () => { closeMore(); props.onGitPress(); },
      },
    ];
    if (hasPreview && props.onPreviewPress) {
      items.push({ key: 'preview', label: 'Preview', icon: <Globe size={18} color={textPrimary} strokeWidth={1.8} />, onPress: () => { closeMore(); props.onPreviewPress?.(); } });
    }
    if (hasTasks && props.onTasksPress) {
      items.push({ key: 'tasks', label: 'Tasks', icon: <Play size={18} color={textPrimary} strokeWidth={1.8} />, onPress: () => { closeMore(); props.onTasksPress?.(); } });
    }
    if (hasTaskOutput && props.onTaskOutputPress) {
      items.push({ key: 'task-output', label: 'Task output', icon: <Play size={18} color={textPrimary} strokeWidth={1.8} />, onPress: () => { closeMore(); props.onTaskOutputPress?.(); } });
    }
    if (firstLink) {
      items.push({
        key: 'remote',
        label: `Open in ${firstLink.label}`,
        icon: firstLink.host === 'github'
          ? <Github size={18} color={textPrimary} strokeWidth={1.8} />
          : firstLink.host === 'gitlab'
            ? <Gitlab size={18} color={textPrimary} strokeWidth={1.8} />
            : <ExternalLink size={18} color={textPrimary} strokeWidth={1.8} />,
        onPress: () => { closeMore(); void Linking.openURL(firstLink.browserUrl); },
      });
    }
    return items;
  }, [appMode, closeMore, firstLink, hasPreview, hasTaskOutput, hasTasks, props, textPrimary]);

  return {
    colors,
    textPrimary,
    borderColor: isDark ? '#323131' : 'rgba(0,0,0,0.08)',
    buttonBg: isDark ? '#2F2D2C' : '#F7F4EE',
    appMode,
    workspace,
    actionItems,
    moreVisible,
    setMoreVisible,
    closeMore,
  };
}
