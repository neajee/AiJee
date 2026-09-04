import { useEffect } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

import { useGitStatus, useNestedRepos } from '@aijee/client-sdk';
import { remotesToLinks, type RemoteLink } from '@/features/workspace/utils/git-remote-url';
import type { WorkspaceContextMenuProps } from '../components/workspace-context-menu/types';

export const MENU_WIDTH = 170;
const ITEM_HEIGHT = 33;
const MENU_PADDING = 8;
const SCREEN_MARGIN = 8;

export function useWorkspaceContextMenuController({
  visible,
  x,
  y,
  workspacePath,
  onTogglePin,
  onNewSession,
  onClose,
}: Pick<WorkspaceContextMenuProps, 'visible' | 'x' | 'y' | 'workspacePath' | 'onTogglePin' | 'onNewSession' | 'onClose'>) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const cwd = visible ? workspacePath ?? null : null;
  const { data: gitData } = useGitStatus(cwd);
  const { repos: nestedRepos } = useNestedRepos(cwd);
  const repoLinks: (RemoteLink & { repoPath?: string })[] = [
    ...remotesToLinks(gitData?.remotes),
    ...(nestedRepos ?? []).flatMap((repo) => remotesToLinks(repo.remotes).map((link) => ({ ...link, repoPath: repo.path }))),
  ];

  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;
    const handler = (event: Event) => {
      event.preventDefault();
      onClose();
    };
    document.addEventListener('contextmenu', handler);
    return () => document.removeEventListener('contextmenu', handler);
  }, [onClose, visible]);

  const itemCount = 2 + (onTogglePin ? 1 : 0) + (onNewSession ? 1 : 0) + repoLinks.length;
  const menuHeight = itemCount * ITEM_HEIGHT + MENU_PADDING * 2;
  return {
    repoLinks,
    top: Math.max(SCREEN_MARGIN, Math.min(y, screenHeight - menuHeight - SCREEN_MARGIN)),
    left: Math.max(SCREEN_MARGIN, Math.min(x, screenWidth - MENU_WIDTH - SCREEN_MARGIN)),
  };
}
