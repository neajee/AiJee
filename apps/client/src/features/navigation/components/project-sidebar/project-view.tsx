import { useCallback } from "react";
import { PackageOpen, Plus, Settings, SquarePen } from "lucide-react";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { NewWorkspaceDialog } from "@/features/workspace/components/new-workspace-dialog";
import { EditWorkspaceDialog } from "@/features/workspace/components/edit-workspace-dialog";
import { WorkspaceContextMenu } from "../workspace-context-menu";
import { SidebarHeader } from "../sidebar-header";
import type { Workspace } from "@/features/workspace/types";
import { HeaderAction, SectionHeader, SidebarRow } from "./navigation-rows";
import { WorkspaceRow } from "./workspace-rows";
import { WorkspaceSessions } from "./workspace-sessions";
import { AppModal } from "@/components/ui";
import type { ProjectSidebarController } from "../../hooks/use-project-sidebar-controller";
export function ProjectSidebarView({
  controller
}: {
  controller: ProjectSidebarController;
}) {
  const colors = useThemeTokens();
  const {
    isDark,
    pathname,
    router,
    workspaces,
    selectedWorkspaceId,
    pinnedIds,
    pinned,
    rest,
    activityByWorkspace,
    selectedSessionId,
    sessionNotifications,
    showNewDialog,
    setShowNewDialog,
    editWorkspace,
    setEditWorkspace,
    deleteWorkspace,
    setDeleteWorkspace,
    contextMenu,
    setContextMenu,
    togglePinned,
    handleArchivedSession,
    handleToggleWorkspace,
    handleSelectSession,
    handleNewSessionIn,
    handleNewSession,
    handleContextMenu,
    handleLongPress,
    handleMenuAt,
    handleDelete,
    confirmDelete,
    overrides
  } = controller;
  const renderWorkspace = useCallback((workspace: Workspace) => {
    const isSelected = workspace.id === selectedWorkspaceId;
    const isOpen = overrides[workspace.id] ?? isSelected;
    return <div key={workspace.id}>
        <div {...{
        onContextMenu: (event: any) => handleContextMenu(workspace, event)
      } as any}>
          <WorkspaceRow workspace={workspace} isOpen={isOpen} isRunning={activityByWorkspace[workspace.id]?.running ?? false} hasUnread={(activityByWorkspace[workspace.id]?.unread ?? false) || workspace.hasNotifications} onClick={() => handleToggleWorkspace(workspace.id, isOpen)} onNewSession={() => handleNewSessionIn(workspace.id)} onMenu={(x, y) => handleMenuAt(workspace, x, y)} onLongPress={event => handleLongPress(workspace, event)} isDark={isDark} />
        </div>
        {isOpen && <WorkspaceSessions workspaceId={workspace.id} selectedSessionId={isSelected ? selectedSessionId : null} onSelect={handleSelectSession} onArchived={handleArchivedSession} isDark={isDark} />}
      </div>;
  }, [activityByWorkspace, handleArchivedSession, handleContextMenu, handleLongPress, handleMenuAt, handleNewSessionIn, handleSelectSession, handleToggleWorkspace, isDark, overrides, selectedSessionId, selectedWorkspaceId]);
  return <div className="flex h-full w-full flex-col overflow-y-auto bg-background text-body">
      <div className="shrink-0 border-b border-border"><SidebarHeader /></div>
      <div className="flex shrink-0 flex-col gap-1 px-2 pt-2">
        <SidebarRow icon={<SquarePen size={15} color={colors.text} strokeWidth={1.8} />} label="新对话" onClick={handleNewSession} isDark={isDark} />
        <SidebarRow icon={<PackageOpen size={15} color={colors.textSecondary} strokeWidth={1.8} />} label="插件" isActive={pathname.startsWith("/packages")} onClick={() => router.push("/packages" as any)} isDark={isDark} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {pinned.length > 0 && <><SectionHeader title="置顶" isDark={isDark} />{pinned.map(renderWorkspace)}</>}
        <SectionHeader title="项目" isDark={isDark} actions={<HeaderAction onClick={() => setShowNewDialog(true)} label="添加项目" isDark={isDark}><Plus size={13} color={colors.textTertiary} strokeWidth={2} /></HeaderAction>} />
        {rest.length === 0 && pinned.length === 0 ? <span className="px-2 py-3 text-caption text-text-tertiary">暂无项目</span> : rest.map(renderWorkspace)}
      </div>
      <div className="shrink-0 border-t border-border px-2 py-1.5">
        <SidebarRow icon={<Settings size={15} color={colors.textSecondary} strokeWidth={1.8} />} label="设置" isActive={pathname.startsWith("/settings")} onClick={() => router.push("/settings")} isDark={isDark} />
      </div>
      <NewWorkspaceDialog visible={showNewDialog} onClose={() => setShowNewDialog(false)} />
      <EditWorkspaceDialog visible={!!editWorkspace} workspace={editWorkspace} onClose={() => setEditWorkspace(null)} />
      <WorkspaceContextMenu visible={contextMenu.visible} x={contextMenu.x} y={contextMenu.y} pinned={!!contextMenu.workspace && pinnedIds.includes(contextMenu.workspace.id)} workspacePath={contextMenu.workspace?.path ?? null} onTogglePin={() => {
      if (contextMenu.workspace) togglePinned(contextMenu.workspace.id);
    }} onNewSession={() => {
      if (contextMenu.workspace) handleNewSessionIn(contextMenu.workspace.id);
    }} onEdit={() => setEditWorkspace(contextMenu.workspace)} onDelete={() => {
      if (contextMenu.workspace) handleDelete(contextMenu.workspace);
    }} onClose={() => setContextMenu(prev => ({
      ...prev,
      visible: false
    }))} />
      <AppModal visible={!!deleteWorkspace} onClose={() => setDeleteWorkspace(null)} title="删除项目？" showClose>
        <div className="flex flex-col gap-2">
          <p className="text-body text-foreground">“{deleteWorkspace?.title}” 将从 AiJee 移除。</p>
          <p className="text-caption text-muted-foreground">本地目录和其中的对话文件不会被删除。</p>
          <div className="mt-4 flex justify-end gap-2"><button className="rounded-md px-3 py-2 text-body hover:bg-hover" onClick={() => setDeleteWorkspace(null)}>取消</button><button className="rounded-md bg-error px-3 py-2 text-body text-error-content hover:opacity-90" onClick={confirmDelete}>删除项目</button></div>
        </div>
      </AppModal>
    </div>;
}
