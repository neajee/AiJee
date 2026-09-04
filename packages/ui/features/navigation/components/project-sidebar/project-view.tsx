import { ScrollView, Text, View } from 'tamagui';
import { useCallback } from "react";
import { Modal, Pressable } from "react-native";
import { PackageOpen, Plus, Settings, SquarePen } from "lucide-react-native";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { NewWorkspaceDialog } from "@/features/workspace/components/new-workspace-dialog";
import { EditWorkspaceDialog } from "@/features/workspace/components/edit-workspace-dialog";
import { WorkspaceContextMenu } from "../workspace-context-menu";
import { SidebarHeader } from "../sidebar-header";
import type { Workspace } from "@/features/workspace/types";
import { HeaderAction, SectionHeader, SidebarRow } from "./navigation-rows";
import { WorkspaceRow } from "./workspace-rows";
import { WorkspaceSessions } from "./workspace-sessions";
import { styles } from "./styles";
import type { ProjectSidebarController } from "../../hooks/use-project-sidebar-controller";

export function ProjectSidebarView({ controller }: { controller: ProjectSidebarController }) {
  const colors = useThemeTokens();
  const {
    isDark, pathname, router, workspaces, selectedWorkspaceId, pinnedIds, pinned, rest,
    activityByWorkspace, selectedSessionId, sessionNotifications, showNewDialog, setShowNewDialog,
    editWorkspace, setEditWorkspace, deleteWorkspace, setDeleteWorkspace, contextMenu, setContextMenu,
    togglePinned, handleArchivedSession, handleToggleWorkspace, handleSelectSession, handleNewSessionIn,
    handleNewSession, handleContextMenu, handleLongPress, handleMenuAt, handleDelete, confirmDelete, overrides,
  } = controller;

  const renderWorkspace = useCallback((workspace: Workspace) => {
    const isSelected = workspace.id === selectedWorkspaceId;
    const isOpen = overrides[workspace.id] ?? isSelected;
    return (
      <View key={workspace.id}>
        <View {...({ onContextMenu: (event: any) => handleContextMenu(workspace, event) } as any)}>
          <WorkspaceRow
            workspace={workspace}
            isSelected={isSelected}
            isOpen={isOpen}
            isRunning={activityByWorkspace[workspace.id]?.running ?? false}
            hasUnread={(activityByWorkspace[workspace.id]?.unread ?? false) || workspace.hasNotifications}
            onPress={() => handleToggleWorkspace(workspace.id, isOpen)}
            onNewSession={() => handleNewSessionIn(workspace.id)}
            onMenu={(x, y) => handleMenuAt(workspace, x, y)}
            onLongPress={(event) => handleLongPress(workspace, event)}
            isDark={isDark}
          />
        </View>
        {isOpen && (
          <WorkspaceSessions
            workspaceId={workspace.id}
            selectedSessionId={isSelected ? selectedSessionId : null}
            onSelect={handleSelectSession}
            onArchived={handleArchivedSession}
            isDark={isDark}
          />
        )}
      </View>
    );
  }, [activityByWorkspace, handleArchivedSession, handleContextMenu, handleLongPress, handleMenuAt, handleNewSessionIn, handleSelectSession, handleToggleWorkspace, isDark, overrides, selectedSessionId, selectedWorkspaceId]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.serverRow, { borderBottomColor: colors.border }]}><SidebarHeader /></View>
      <View style={styles.top}>
        <SidebarRow icon={<SquarePen size={15} color={colors.text} strokeWidth={1.8} />} label="新对话" onPress={handleNewSession} isDark={isDark} />
        <SidebarRow icon={<PackageOpen size={15} color={colors.textSecondary} strokeWidth={1.8} />} label="插件" isActive={pathname.startsWith("/packages")} onPress={() => router.push("/packages" as any)} isDark={isDark} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {pinned.length > 0 && <><SectionHeader title="置顶" isDark={isDark} />{pinned.map(renderWorkspace)}</>}
        <SectionHeader
          title="项目"
          isDark={isDark}
          actions={<HeaderAction onPress={() => setShowNewDialog(true)} label="添加项目" isDark={isDark}><Plus size={13} color={colors.textTertiary} strokeWidth={2} /></HeaderAction>}
        />
        {rest.length === 0 && pinned.length === 0 ? <Text style={[styles.empty, { color: colors.textTertiary }]}>暂无项目</Text> : rest.map(renderWorkspace)}
      </ScrollView>
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <SidebarRow icon={<Settings size={15} color={colors.textSecondary} strokeWidth={1.8} />} label="设置" isActive={pathname.startsWith("/settings")} onPress={() => router.push("/settings")} isDark={isDark} />
      </View>
      <NewWorkspaceDialog visible={showNewDialog} onClose={() => setShowNewDialog(false)} />
      <EditWorkspaceDialog visible={!!editWorkspace} workspace={editWorkspace} onClose={() => setEditWorkspace(null)} />
      <WorkspaceContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        pinned={!!contextMenu.workspace && pinnedIds.includes(contextMenu.workspace.id)}
        workspacePath={contextMenu.workspace?.path ?? null}
        onTogglePin={() => { if (contextMenu.workspace) togglePinned(contextMenu.workspace.id); }}
        onNewSession={() => { if (contextMenu.workspace) handleNewSessionIn(contextMenu.workspace.id); }}
        onEdit={() => setEditWorkspace(contextMenu.workspace)}
        onDelete={() => { if (contextMenu.workspace) handleDelete(contextMenu.workspace); }}
        onClose={() => setContextMenu((prev) => ({ ...prev, visible: false }))}
      />
      <Modal visible={!!deleteWorkspace} transparent animationType="fade" onRequestClose={() => setDeleteWorkspace(null)}>
        <Pressable style={styles.deleteOverlay} onPress={() => setDeleteWorkspace(null)}>
          <Pressable accessibilityRole="alert" style={[styles.deleteDialog, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong }]} onPress={(event) => event.stopPropagation()}>
            <Text style={[styles.deleteTitle, { color: colors.text }]}>删除项目？</Text>
            <Text style={[styles.deleteDescription, { color: colors.textSecondary }]}>“{deleteWorkspace?.title}” 将从 AiJee 移除。</Text>
            <Text style={[styles.deleteHint, { color: colors.textTertiary }]}>本地目录和其中的对话文件不会被删除。</Text>
            <View style={styles.deleteActions}>
              <Pressable onPress={() => setDeleteWorkspace(null)} style={({ pressed }) => [styles.deleteCancel, { borderColor: colors.borderStrong }, pressed && { opacity: 0.7 }]}><Text style={[styles.deleteCancelText, { color: colors.text }]}>取消</Text></Pressable>
              <Pressable onPress={confirmDelete} style={({ pressed }) => [styles.deleteConfirm, { backgroundColor: colors.destructive }, pressed && { opacity: 0.78 }]}><Text style={styles.deleteConfirmText}>删除项目</Text></Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
