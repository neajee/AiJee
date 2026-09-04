import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useWorkspaceStore } from '@/features/workspace/store';
import { useServersStore, type Server } from '@/features/servers/store';
import { useAuthStore } from '@/features/auth/store';
import { usePiClient, useGitStatus } from '@aijee/client-sdk';
import type { GitBranch as GitBranchInfo } from '@aijee/client-sdk';
import type { DropdownKind } from '../components/composer-context-bar/types';

export function useComposerContextController() {
  const router = useRouter();
  const client = usePiClient();
  const [open, setOpen] = useState<DropdownKind>(null);
  const [branches, setBranches] = useState<GitBranchInfo[] | null>(null);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [newWorkspaceVisible, setNewWorkspaceVisible] = useState(false);
  const [newBranchVisible, setNewBranchVisible] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [branchError, setBranchError] = useState<string | null>(null);
  const anim = useRef(new Animated.Value(0)).current;

  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const selectedWorkspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace);
  const switchServer = useWorkspaceStore((s) => s.switchServer);
  const fetchWorkspaces = useWorkspaceStore((s) => s.fetchWorkspaces);

  const servers = useServersStore((s) => s.servers);
  const activeServerId = useAuthStore((s) => s.activeServerId);
  const activateServer = useAuthStore((s) => s.activateServer);

  const workspace = useMemo(
    () => workspaces.find((w) => w.id === selectedWorkspaceId) ?? null,
    [workspaces, selectedWorkspaceId],
  );
  const cwd = workspace?.path ?? null;
  const git = useGitStatus(cwd);

  const activeServer = servers.find((s) => s.id === activeServerId) ?? null;
  const currentBranch = git.data?.branch ?? null;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: open ? 1 : 0,
      tension: 300,
      friction: 26,
      useNativeDriver: true,
    }).start();
  }, [anim, open]);

  // Web has no backdrop press, so close on any click outside the bar.
  useEffect(() => {
    if (!open || Platform.OS !== "web") return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest?.("[data-composer-context]")) setOpen(null);
    };
    const id = setTimeout(() => document.addEventListener("click", handler), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("click", handler);
    };
  }, [open]);

  const toggle = useCallback(
    (kind: Exclude<DropdownKind, null>) => {
      setOpen((prev) => (prev === kind ? null : kind));
    },
    [],
  );

  // Branches are only fetched when the picker is opened: the list is a git
  // subprocess call, not something to poll behind an unopened dropdown.
  useEffect(() => {
    if (open !== "branch" || !cwd) return;
    let cancelled = false;
    setBranchesLoading(true);
    client.api
      .gitBranches(cwd)
      .then((list) => {
        if (!cancelled) setBranches(list);
      })
      .catch(() => {
        if (!cancelled) setBranches([]);
      })
      .finally(() => {
        if (!cancelled) setBranchesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [client, cwd, open]);

  const handleSelectProject = useCallback(
    (id: string) => {
      setOpen(null);
      if (id === selectedWorkspaceId) return;
      selectWorkspace(id);
      router.replace(`/workspace/${id}`);
    },
    [router, selectWorkspace, selectedWorkspaceId],
  );

  const handleSelectServer = useCallback(
    async (server: Server) => {
      if (server.id === activeServerId) {
        setOpen(null);
        return;
      }
      setBusy(server.id);
      try {
        await switchServer(server.id);
        const ok = await activateServer(server);
        if (ok) {
          await fetchWorkspaces(server.id);
          const { workspaces: next, selectedWorkspaceId: nextId } =
            useWorkspaceStore.getState();
          const targetId = nextId ?? next[0]?.id;
          if (targetId) router.replace(`/workspace/${targetId}`);
        }
      } finally {
        setBusy(null);
        setOpen(null);
      }
    },
    [activateServer, activeServerId, fetchWorkspaces, router, switchServer],
  );

  const handleSelectBranch = useCallback(
    async (branch: GitBranchInfo) => {
      if (!cwd || branch.is_current) {
        setOpen(null);
        return;
      }
      setBusy(branch.name);
      try {
        await client.api.gitCheckout(cwd, { branch: branch.name });
        git.refresh();
      } catch {
        // Checkout can legitimately fail (dirty tree); the branch label simply
        // stays on the old value rather than lying about the switch.
      } finally {
        setBusy(null);
        setOpen(null);
      }
    },
    [client, cwd, git],
  );

  const handleCreateBranch = useCallback(async () => {
    const branch = newBranchName.trim();
    if (!cwd || !branch) return;
    setBusy("new-branch");
    setBranchError(null);
    try {
      await client.api.gitCheckout(cwd, { branch, create: true });
      await git.refresh();
      setBranches(null);
      setNewBranchVisible(false);
      setNewBranchName("");
    } catch (error) {
      setBranchError(error instanceof Error ? error.message : "无法创建分支");
    } finally {
      setBusy(null);
    }
  }, [client, cwd, git, newBranchName]);

  const localBranches = useMemo(
    () => (branches ?? []).filter((b) => !b.is_remote),
    [branches],
  );
  return {
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
  };
}
