import { useCallback, useMemo, useState } from "react";
import { Platform } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useStreamingSessions } from "@aijee/client-sdk";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useWorkspaceStore } from "@/features/workspace/store";
import { requestBrowserNotificationPermission } from "@/features/agent/browser-notifications";
import type { Workspace } from "@/features/workspace/types";

export function useProjectSidebarController() {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const selectedWorkspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const pinnedIds = useWorkspaceStore((s) => s.pinnedWorkspaceIds);
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace);
  const togglePinned = useWorkspaceStore((s) => s.togglePinnedWorkspace);
  const removeWorkspace = useWorkspaceStore((s) => s.removeWorkspace);
  const getLastSession = useWorkspaceStore((s) => s.getLastSession);
  const clearLastSession = useWorkspaceStore((s) => s.clearLastSession);
  const clearSessionNotification = useWorkspaceStore((s) => s.clearSessionNotification);
  const sessionWorkspaceById = useWorkspaceStore((s) => s.sessionWorkspaceById);
  const sessionNotifications = useWorkspaceStore((s) => s.sessionNotifications);
  const streamingSessions = useStreamingSessions();
  const activityByWorkspace = useMemo(() => {
    const activity: Record<string, { running: boolean; unread: boolean }> = {};
    const touch = (id: string) => (activity[id] ??= { running: false, unread: false });
    streamingSessions.forEach((sessionId) => {
      const workspaceId = sessionWorkspaceById[sessionId];
      if (workspaceId) touch(workspaceId).running = true;
    });
    Object.keys(sessionNotifications).forEach((sessionId) => {
      const workspaceId = sessionWorkspaceById[sessionId];
      if (workspaceId) touch(workspaceId).unread = true;
    });
    return activity;
  }, [streamingSessions, sessionWorkspaceById, sessionNotifications]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [editWorkspace, setEditWorkspace] = useState<Workspace | null>(null);
  const [deleteWorkspace, setDeleteWorkspace] = useState<Workspace | null>(null);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; workspace: Workspace | null }>({ visible: false, x: 0, y: 0, workspace: null });
  const selectedSessionId = pathname.match(/\/workspace\/[^/]+\/s\/([^/]+)/)?.[1] ?? null;
  const handleArchivedSession = useCallback((workspaceId: string, sessionId: string) => {
    if (getLastSession(workspaceId) === sessionId) clearLastSession(workspaceId);
    clearSessionNotification(sessionId);
    if (selectedSessionId === sessionId) router.replace(`/workspace/${workspaceId}`);
  }, [clearLastSession, clearSessionNotification, getLastSession, router, selectedSessionId]);
  const { pinned, rest } = useMemo(() => {
    const pinnedSet = new Set(pinnedIds);
    return {
      pinned: pinnedIds.map((id) => workspaces.find((workspace) => workspace.id === id)).filter((workspace): workspace is Workspace => !!workspace),
      rest: workspaces.filter((workspace) => !pinnedSet.has(workspace.id)),
    };
  }, [workspaces, pinnedIds]);
  const handleToggleWorkspace = useCallback((id: string, isOpen: boolean) => setOverrides((prev) => ({ ...prev, [id]: !isOpen })), []);
  const handleSelectSession = useCallback((workspaceId: string, sessionId: string) => {
    if (workspaceId !== selectedWorkspaceId) selectWorkspace(workspaceId);
    router.navigate(`/workspace/${workspaceId}/s/${sessionId}`);
  }, [selectedWorkspaceId, selectWorkspace, router]);
  const handleNewSessionIn = useCallback((workspaceId: string) => {
    selectWorkspace(workspaceId);
    requestBrowserNotificationPermission();
    router.navigate(`/workspace/${workspaceId}`);
  }, [selectWorkspace, router]);
  const handleNewSession = useCallback(() => {
    requestBrowserNotificationPermission();
    router.navigate((selectedWorkspaceId ? `/workspace/${selectedWorkspaceId}` : "/work") as any);
  }, [selectedWorkspaceId, router]);
  const handleContextMenu = useCallback((workspace: Workspace, event: any) => {
    if (Platform.OS !== "web") return;
    event.preventDefault?.();
    const nativeEvent = event.nativeEvent ?? event;
    setContextMenu({ visible: true, x: nativeEvent.clientX ?? nativeEvent.pageX ?? 0, y: nativeEvent.clientY ?? nativeEvent.pageY ?? 0, workspace });
  }, []);
  const handleLongPress = useCallback((workspace: Workspace, event: any) => {
    const nativeEvent = event?.nativeEvent ?? {};
    setContextMenu({ visible: true, x: nativeEvent.pageX ?? 24, y: nativeEvent.pageY ?? 120, workspace });
  }, []);
  const handleMenuAt = useCallback((workspace: Workspace, x: number, y: number) => setContextMenu({ visible: true, x, y, workspace }), []);
  const handleDelete = useCallback((workspace: Workspace) => setDeleteWorkspace(workspace), []);
  const confirmDelete = useCallback(() => {
    if (!deleteWorkspace) return;
    void removeWorkspace(deleteWorkspace.id);
    setDeleteWorkspace(null);
  }, [deleteWorkspace, removeWorkspace]);
  return {
    isDark, pathname, router, workspaces, selectedWorkspaceId, pinnedIds, pinned, rest, activityByWorkspace, sessionNotifications, selectedSessionId,
    showNewDialog, setShowNewDialog, editWorkspace, setEditWorkspace, deleteWorkspace, setDeleteWorkspace, contextMenu, setContextMenu, togglePinned,
    handleArchivedSession, handleToggleWorkspace, handleSelectSession, handleNewSessionIn, handleNewSession, handleContextMenu, handleLongPress, handleMenuAt, handleDelete, confirmDelete, overrides,
  };
}

export type ProjectSidebarController = ReturnType<typeof useProjectSidebarController>;
