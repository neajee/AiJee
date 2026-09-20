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
          <WorkspaceRow workspace={workspace} isSelected={isSelected} isOpen={isOpen} isRunning={activityByWorkspace[workspace.id]?.running ?? false} hasUnread={(activityByWorkspace[workspace.id]?.unread ?? false) || workspace.hasNotifications} onClick={() => handleToggleWorkspace(workspace.id, isOpen)} onNewSession={() => handleNewSessionIn(workspace.id)} onMenu={(x, y) => handleMenuAt(workspace, x, y)} onLongPress={event => handleLongPress(workspace, event)} isDark={isDark} />
        </div>
        {isOpen && <WorkspaceSessions workspaceId={workspace.id} selectedSessionId={isSelected ? selectedSessionId : null} onSelect={handleSelectSession} onArchived={handleArchivedSession} isDark={isDark} />}
      </div>;
  }, [activityByWorkspace, handleArchivedSession, handleContextMenu, handleLongPress, handleMenuAt, handleNewSessionIn, handleSelectSession, handleToggleWorkspace, isDark, overrides, selectedSessionId, selectedWorkspaceId]);
  return <div className={"  bg-background"}>
      <div><SidebarHeader /></div>
      <div className={"block"}>
        <SidebarRow icon={<SquarePen size={15} color={colors.text} strokeWidth={1.8} />} label="新对话" onClick={handleNewSession} isDark={isDark} />
        <SidebarRow icon={<PackageOpen size={15} color={colors.textSecondary} strokeWidth={1.8} />} label="插件" isActive={pathname.startsWith("/packages")} onClick={() => router.push("/packages" as any)} isDark={isDark} />
      </div>
      <div className={"block"}>
        {pinned.length > 0 && <><SectionHeader title="置顶" isDark={isDark} />{pinned.map(renderWorkspace)}</>}
        <SectionHeader title="项目" isDark={isDark} actions={<HeaderAction onClick={() => setShowNewDialog(true)} label="添加项目" isDark={isDark}><Plus size={13} color={colors.textTertiary} strokeWidth={2} /></HeaderAction>} />
        {rest.length === 0 && pinned.length === 0 ? <span className={"  text-text-tertiary"}>暂无项目</span> : rest.map(renderWorkspace)}
      </div>
      <div>
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
      <div visible={!!deleteWorkspace} transparent animationType="fade" onRequestClose={() => setDeleteWorkspace(null)}>
        <button className={"block"} onClick={() => setDeleteWorkspace(null)}>
          <button role="alert" className={"  bg-surface-raised border-border"} onClick={event => event.stopPropagation()}>
            <span className={"  text-foreground"}>删除项目？</span>
            <span className={"  text-text-secondary"}>“{deleteWorkspace?.title}” 将从 AiJee 移除。</span>
            <span className={"  text-text-tertiary"}>本地目录和其中的对话文件不会被删除。</span>
            <div className={"block"}>
              <button onClick={() => setDeleteWorkspace(null)}><span className={"  text-foreground"}>取消</span></button>
              <button onClick={confirmDelete}><span className={"block"}>删除项目</span></button>
            </div>
          </button>
        </button>
      </div>
    </div>;
}
