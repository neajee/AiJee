import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import {
  Archive as ArchiveIcon,
  ChevronLeft,
  Folder,
  MoreHorizontal,
  Plus,
  Settings,
  PackageOpen,
  Pencil,
  SquarePen,
} from "lucide-react-native";

import { Colors, Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { useWorkspaceStore } from "@/features/workspace/store";
import {
  useWorkspaceSessions as useSessions,
  useIsSessionStreaming,
  useStreamingSessions,
} from "@aijee/client-sdk";
import type { SessionListItem } from "@aijee/client-sdk";
import { requestBrowserNotificationPermission } from "@/features/agent/browser-notifications";
import { SessionActivityIndicator } from "@/features/workspace/components/session-activity-indicator";
import { AnimatedListItem } from "@/components/ui/animated-list-item";
import { NewWorkspaceDialog } from "@/features/workspace/components/new-workspace-dialog";
import { EditWorkspaceDialog } from "@/features/workspace/components/edit-workspace-dialog";
import { WorkspaceContextMenu, MENU_WIDTH } from "../workspace-context-menu";
import { SidebarHeader } from "../sidebar-header";
import type { Workspace } from "@/features/workspace/types";
import { SETTINGS_SECTIONS } from "@/features/settings/sections";

/** Sessions sit under their project, indented to clear the folder icon. */
const SESSION_INDENT = 28;
/** Longer session lists fold: a project is recognised by its recent work. */
const SESSION_PREVIEW_COUNT = 5;

/**
 * The single left sidebar: every project in one list, the pinned ones first,
 * each expanding to show its sessions.
 *
 * This replaces the older split of a 64px icon rail for switching projects and
 * a separate panel listing only the current project's sessions — switching and
 * browsing were the same intent spread across two surfaces.
 */
export function ProjectSidebar() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = useThemeTokens();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const pathname = usePathname();

  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const selectedWorkspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const pinnedIds = useWorkspaceStore((s) => s.pinnedWorkspaceIds);
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace);
  const togglePinned = useWorkspaceStore((s) => s.togglePinnedWorkspace);
  const removeWorkspace = useWorkspaceStore((s) => s.removeWorkspace);
  const getLastSession = useWorkspaceStore((s) => s.getLastSession);
  const clearLastSession = useWorkspaceStore((s) => s.clearLastSession);
  const clearSessionNotification = useWorkspaceStore(
    (s) => s.clearSessionNotification,
  );
  const sessionWorkspaceById = useWorkspaceStore((s) => s.sessionWorkspaceById);
  const sessionNotifications = useWorkspaceStore((s) => s.sessionNotifications);
  const streamingSessions = useStreamingSessions();

  /**
   * Which projects have something working or something finished-but-unseen.
   *
   * `workspace.runningSessions` is never populated by the server, so activity is
   * derived from the sessions currently mid-turn, mapped back to projects — a
   * mapping the session lists and turn-end events fill in as they load.
   */
  const activityByWorkspace = useMemo(() => {
    const activity: Record<string, { running: boolean; unread: boolean }> = {};
    const touch = (id: string) =>
      (activity[id] ??= { running: false, unread: false });
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
  // Only holds projects whose state differs from the default (selected = open).
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    workspace: Workspace | null;
  }>({ visible: false, x: 0, y: 0, workspace: null });

  const sessionMatch = pathname.match(/\/workspace\/[^/]+\/s\/([^/]+)/);
  const selectedSessionId = sessionMatch?.[1] ?? null;

  const handleArchivedSession = useCallback(
    (workspaceId: string, sessionId: string) => {
      if (getLastSession(workspaceId) === sessionId) {
        clearLastSession(workspaceId);
      }
      clearSessionNotification(sessionId);
      if (selectedSessionId === sessionId) {
        router.replace(`/workspace/${workspaceId}`);
      }
    },
    [
      clearLastSession,
      clearSessionNotification,
      getLastSession,
      router,
      selectedSessionId,
    ],
  );

  const { pinned, rest } = useMemo(() => {
    const pinnedSet = new Set(pinnedIds);
    return {
      // Pinned order follows the order they were pinned in, not the list order.
      pinned: pinnedIds
        .map((id) => workspaces.find((w) => w.id === id))
        .filter((w): w is Workspace => !!w),
      rest: workspaces.filter((w) => !pinnedSet.has(w.id)),
    };
  }, [workspaces, pinnedIds]);

  const handleToggleWorkspace = useCallback(
    (id: string, isOpen: boolean) => {
      setOverrides((prev) => ({ ...prev, [id]: !isOpen }));
    },
    [],
  );

  const handleSelectSession = useCallback(
    (workspaceId: string, sessionId: string) => {
      if (workspaceId !== selectedWorkspaceId) selectWorkspace(workspaceId);
      router.navigate(`/workspace/${workspaceId}/s/${sessionId}`);
    },
    [selectedWorkspaceId, selectWorkspace, router],
  );

  const handleNewSessionIn = useCallback(
    (workspaceId: string) => {
      selectWorkspace(workspaceId);
      requestBrowserNotificationPermission();
      router.navigate(`/workspace/${workspaceId}`);
    },
    [selectWorkspace, router],
  );

  const handleNewSession = useCallback(() => {
    requestBrowserNotificationPermission();
    router.navigate((selectedWorkspaceId ? `/workspace/${selectedWorkspaceId}` : "/work") as any);
  }, [selectedWorkspaceId, router]);

  const handleContextMenu = useCallback((ws: Workspace, e: any) => {
    if (Platform.OS !== "web") return;
    e.preventDefault?.();
    const nativeEvent = e.nativeEvent ?? e;
    setContextMenu({
      visible: true,
      // The menu is a modal over the viewport, so viewport coordinates are the
      // right frame of reference — page coordinates drift once anything scrolls.
      x: nativeEvent.clientX ?? nativeEvent.pageX ?? 0,
      y: nativeEvent.clientY ?? nativeEvent.pageY ?? 0,
      workspace: ws,
    });
  }, []);

  /** Touch has no right button, so a long press opens the same menu. */
  const handleLongPress = useCallback((ws: Workspace, e: any) => {
    const nativeEvent = e?.nativeEvent ?? {};
    setContextMenu({
      visible: true,
      x: nativeEvent.pageX ?? 24,
      y: nativeEvent.pageY ?? 120,
      workspace: ws,
    });
  }, []);

  /**
   * Opens the menu anchored to the row's ⋯ button rather than to a cursor, so
   * touch and keyboard users get the same actions as a right-click.
   */
  const handleMenuAt = useCallback(
    (ws: Workspace, x: number, y: number) => {
      setContextMenu({ visible: true, x, y, workspace: ws });
    },
    [],
  );

  const handleDelete = useCallback(
    (ws: Workspace) => {
      setDeleteWorkspace(ws);
    },
    [],
  );

  const confirmDelete = useCallback(() => {
    if (!deleteWorkspace) return;
    void removeWorkspace(deleteWorkspace.id);
    setDeleteWorkspace(null);
  }, [deleteWorkspace, removeWorkspace]);

  const renderWorkspace = (ws: Workspace) => {
    const isSelected = ws.id === selectedWorkspaceId;
    const isOpen = overrides[ws.id] ?? isSelected;

    return (
      <View key={ws.id}>
        <View
          {...({ onContextMenu: (e: any) => handleContextMenu(ws, e) } as any)}
        >
          <WorkspaceRow
            workspace={ws}
            isSelected={isSelected}
            isOpen={isOpen}
            isRunning={activityByWorkspace[ws.id]?.running ?? false}
            hasUnread={
              (activityByWorkspace[ws.id]?.unread ?? false) ||
              ws.hasNotifications
            }
            onPress={() => handleToggleWorkspace(ws.id, isOpen)}
            onNewSession={() => handleNewSessionIn(ws.id)}
            onMenu={(x, y) => handleMenuAt(ws, x, y)}
            onLongPress={(e) => handleLongPress(ws, e)}
            isDark={isDark}
          />
        </View>
        {isOpen && (
          <WorkspaceSessions
            workspaceId={ws.id}
            selectedSessionId={isSelected ? selectedSessionId : null}
            onSelect={handleSelectSession}
            onArchived={handleArchivedSession}
            isDark={isDark}
          />
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Server and search in one row; collapsing lives on the seam. */}
      <View style={[styles.serverRow, { borderBottomColor: colors.border }]}>
        <SidebarHeader />
      </View>

      <View style={styles.top}>
        <SidebarRow
          icon={<SquarePen size={15} color={colors.text} strokeWidth={1.8} />}
          label="新对话"
          onPress={handleNewSession}
          isDark={isDark}
        />
        <SidebarRow
          icon={<PackageOpen size={15} color={colors.textSecondary} strokeWidth={1.8} />}
          label="插件"
          isActive={pathname.startsWith("/packages")}
          onPress={() => router.push("/packages" as any)}
          isDark={isDark}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {pinned.length > 0 && (
          <>
            <SectionHeader title="置顶" isDark={isDark} />
            {pinned.map(renderWorkspace)}
          </>
        )}

        <SectionHeader
          title="项目"
          isDark={isDark}
          actions={
            <>
              <HeaderAction
                onPress={() => setShowNewDialog(true)}
                label="添加项目"
                isDark={isDark}
              >
                <Plus size={13} color={colors.textTertiary} strokeWidth={2} />
              </HeaderAction>
            </>
          }
        />

        {rest.length === 0 && pinned.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textTertiary }]}>
            暂无项目
          </Text>
        ) : (
          rest.map(renderWorkspace)
        )}
      </ScrollView>

      <View
        style={[styles.footer, { borderTopColor: colors.border }]}
      >
        <SidebarRow
          icon={<Settings size={15} color={colors.textSecondary} strokeWidth={1.8} />}
          label="设置"
          isActive={pathname.startsWith("/settings")}
          onPress={() => router.push("/settings")}
          isDark={isDark}
        />
      </View>

      <NewWorkspaceDialog
        visible={showNewDialog}
        onClose={() => setShowNewDialog(false)}
      />
      <EditWorkspaceDialog
        visible={!!editWorkspace}
        workspace={editWorkspace}
        onClose={() => setEditWorkspace(null)}
      />
      <WorkspaceContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        pinned={
          !!contextMenu.workspace && pinnedIds.includes(contextMenu.workspace.id)
        }
        workspacePath={contextMenu.workspace?.path ?? null}
        onTogglePin={() => {
          if (contextMenu.workspace) togglePinned(contextMenu.workspace.id);
        }}
        onNewSession={() => {
          if (contextMenu.workspace) handleNewSessionIn(contextMenu.workspace.id);
        }}
        onEdit={() => setEditWorkspace(contextMenu.workspace)}
        onDelete={() => {
          if (contextMenu.workspace) handleDelete(contextMenu.workspace);
        }}
        onClose={() => setContextMenu((prev) => ({ ...prev, visible: false }))}
      />
      <Modal
        visible={!!deleteWorkspace}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteWorkspace(null)}
      >
        <Pressable style={styles.deleteOverlay} onPress={() => setDeleteWorkspace(null)}>
          <Pressable
            accessibilityRole="alert"
            style={[styles.deleteDialog, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong }]}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={[styles.deleteTitle, { color: colors.text }]}>删除项目？</Text>
            <Text style={[styles.deleteDescription, { color: colors.textSecondary }]}>“{deleteWorkspace?.title}” 将从 AiJee 移除。</Text>
            <Text style={[styles.deleteHint, { color: colors.textTertiary }]}>本地目录和其中的对话文件不会被删除。</Text>
            <View style={styles.deleteActions}>
              <Pressable
                onPress={() => setDeleteWorkspace(null)}
                style={({ pressed }) => [styles.deleteCancel, { borderColor: colors.borderStrong }, pressed && { opacity: 0.7 }]}
              >
                <Text style={[styles.deleteCancelText, { color: colors.text }]}>取消</Text>
              </Pressable>
              <Pressable
                onPress={confirmDelete}
                style={({ pressed }) => [styles.deleteConfirm, { backgroundColor: colors.destructive }, pressed && { opacity: 0.78 }]}
              >
                <Text style={styles.deleteConfirmText}>删除项目</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export function SettingsSidebar() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = useThemeTokens();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const pathname = usePathname();
  const selectedWorkspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const routeSlug = pathname.match(/^\/settings\/([^/]+)/)?.[1];
  const activeSlug = routeSlug ?? SETTINGS_SECTIONS[0]?.slug;

  const handleBack = () => {
    if (selectedWorkspaceId) {
      router.replace(`/workspace/${selectedWorkspaceId}`);
      return;
    }
    router.replace("/");
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.serverRow, { borderBottomColor: colors.border }]}>
        <SidebarHeader />
      </View>
      <View style={styles.top}>
        <SidebarRow
          icon={<ChevronLeft size={15} color={colors.textSecondary} strokeWidth={1.8} />}
          label="返回"
          onPress={handleBack}
          isDark={isDark}
        />
      </View>
      <View style={styles.settingsHeader}>
        <Text style={[styles.settingsTitle, { color: colors.text }]}>设置</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.settingsContent}
        showsVerticalScrollIndicator={false}
      >
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <SidebarRow
              key={section.slug}
              icon={
                <Icon
                  size={15}
                  color={section.slug === activeSlug ? colors.text : colors.textSecondary}
                  strokeWidth={1.8}
                />
              }
              label={section.title}
              isActive={section.slug === activeSlug}
              onPress={() => router.push(`/settings/${section.slug}` as any)}
              isDark={isDark}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

function SectionHeader({
  title,
  actions,
  isDark,
}: {
  title: string;
  actions?: React.ReactNode;
  isDark: boolean;
}) {
  const colors = useThemeTokens();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
        {title}
      </Text>
      {actions}
    </View>
  );
}

function HeaderAction({
  onPress,
  label,
  disabled,
  children,
  isDark,
}: {
  onPress: () => void;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
  isDark: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const hoverBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.headerAction,
        hovered && { backgroundColor: hoverBg },
        pressed && { opacity: 0.6 },
      ]}
    >
      {children}
    </Pressable>
  );
}

/** A flat icon + label row, used for the actions above and below the list. */
function SidebarRow({
  icon,
  label,
  onPress,
  isActive = false,
  disabled = false,
  isDark,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  isActive?: boolean;
  disabled?: boolean;
  isDark: boolean;
}) {
  const colors = useThemeTokens();
  const [hovered, setHovered] = useState(false);
  const hoverBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.035)";
  const activeBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.row,
        isActive
          ? { backgroundColor: activeBg }
          : hovered && { backgroundColor: hoverBg },
        disabled && { opacity: 0.4 },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={styles.rowIcon}>{icon}</View>
      <Text
        style={[
          styles.rowLabel,
          { color: isActive ? colors.text : colors.textSecondary },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}


function WorkspaceRow({
  workspace,
  isSelected,
  isOpen,
  isRunning,
  hasUnread,
  onPress,
  onNewSession,
  onMenu,
  onLongPress,
  isDark,
}: {
  workspace: Workspace;
  isSelected: boolean;
  isOpen: boolean;
  /** At least one session in this project is working right now. */
  isRunning: boolean;
  /** A turn finished here and hasn't been looked at. */
  hasUnread: boolean;
  /** Left click folds and unfolds; opening a project happens by session. */
  onPress: () => void;
  onNewSession: () => void;
  /** Viewport coordinates to anchor the actions menu to. */
  onMenu: (x: number, y: number) => void;
  onLongPress: (e: any) => void;
  isDark: boolean;
}) {
  const colors = useThemeTokens();
  const [hovered, setHovered] = useState(false);
  const hoverBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.035)";
  const moreRef = useRef<View>(null);
  // Hovering swaps the status dot for the actions; both never fit at once.
  const showActions = hovered;

  const openMenu = useCallback(() => {
    const node = moreRef.current;
    if (!node?.measureInWindow) {
      onMenu(24, 120);
      return;
    }
    // Anchor under the button, right edges aligned.
    node.measureInWindow((x, y, width, height) => {
      onMenu(x + width - MENU_WIDTH, y + height + 4);
    });
  }, [onMenu]);

  return (
    /*
     * Hover lives on a plain View using pointer events, not on the Pressable.
     * react-native-web's Pressable hover "locks": entering a nested pressable
     * dispatches an event that ends the parent's hover, so the buttons that only
     * exist while hovering would vanish the moment the cursor reached them.
     * `pointerenter`/`pointerleave` don't fire for movement between children.
     */
    <View
      style={[styles.row, hovered && { backgroundColor: hoverBg }]}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={400}
        accessibilityLabel={
          isOpen ? `收起 ${workspace.title}` : `展开 ${workspace.title}`
        }
        style={({ pressed }) => [styles.rowMain, pressed && { opacity: 0.7 }]}
      >
        <View style={styles.rowIcon}>
          <Folder size={15} color={colors.text} strokeWidth={1.8} />
        </View>
        <Text
          style={[
            styles.rowLabel,
            {
              color: isSelected ? colors.text : colors.textSecondary,
              fontFamily: isSelected ? Fonts.sansMedium : Fonts.sans,
            },
          ]}
          numberOfLines={1}
        >
          {workspace.title}
        </Text>
      </Pressable>

      <View style={styles.rowActions}>
        {showActions && (
          <RowAction
            label={`在 ${workspace.title} 中新建对话`}
            onPress={onNewSession}
            isDark={isDark}
          >
            <SquarePen
              size={13}
              color={colors.textTertiary}
              strokeWidth={1.8}
            />
          </RowAction>
        )}
        {showActions && (
          <View ref={moreRef} collapsable={false}>
            <RowAction
              label={`${workspace.title} 的更多操作`}
              onPress={openMenu}
              isDark={isDark}
            >
              <MoreHorizontal
                size={14}
                color={colors.textTertiary}
                strokeWidth={1.8}
              />
            </RowAction>
          </View>
        )}

        {!showActions && !isRunning && hasUnread && (
          <View
            style={[
              styles.dot,
              { backgroundColor: isDark ? "#3FB950" : "#1A7F37" },
            ]}
          />
        )}
      </View>
    </View>
  );
}

/** A small square button that sits beside a row's main pressable. */function RowAction({
  label,
  onPress,
  children,
  isDark,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
  isDark: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const hoverBg = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)";

  return (
    <Pressable
      onPress={(e) => {
        e.stopPropagation();
        onPress();
      }}
      accessibilityLabel={label}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.rowAction,
        hovered && { backgroundColor: hoverBg },
        pressed && { opacity: 0.6 },
      ]}
    >
      {children}
    </Pressable>
  );
}

function WorkspaceSessions({
  workspaceId,
  selectedSessionId,
  onSelect,
  onArchived,
  isDark,
}: {
  workspaceId: string;
  selectedSessionId: string | null;
  onSelect: (workspaceId: string, sessionId: string) => void;
  onArchived: (workspaceId: string, sessionId: string) => void;
  isDark: boolean;
}) {
  const colors = useThemeTokens();
  const [showAll, setShowAll] = useState(false);
  const {
    sessions,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    renameSession,
    archiveSession,
  } = useSessions(workspaceId);

  // Teaches the store which project each session belongs to, so a finished turn
  // can badge the right project even while it is folded.
  const registerWorkspaceSessions = useWorkspaceStore(
    (s) => s.registerWorkspaceSessions,
  );
  const sessionNotifications = useWorkspaceStore((s) => s.sessionNotifications);
  useEffect(() => {
    if (sessions.length === 0) return;
    registerWorkspaceSessions(
      workspaceId,
      sessions.map((session) => session.id),
    );
  }, [workspaceId, sessions, registerWorkspaceSessions]);

  // A folded list must never hide the session being read.
  const selectedIndex = selectedSessionId
    ? sessions.findIndex((s) => s.id === selectedSessionId)
    : -1;
  const forcedOpen = selectedIndex >= SESSION_PREVIEW_COUNT;
  useEffect(() => {
    if (forcedOpen) setShowAll(true);
  }, [forcedOpen]);

  if (isLoading) {
    return <ActivityIndicator size="small" style={styles.sessionLoading} />;
  }

  if (sessions.length === 0) {
    return (
      <Text style={[styles.sessionEmpty, { color: colors.textTertiary }]}>
        暂无对话
      </Text>
    );
  }

  const expanded = showAll || forcedOpen;
  const visible = expanded ? sessions : sessions.slice(0, SESSION_PREVIEW_COUNT);
  const foldedCount = sessions.length - visible.length;

  return (
    <View>
      {visible.map((session) => (
        <AnimatedListItem key={session.id}>
          <SessionRow
            session={session}
            isSelected={session.id === selectedSessionId}
            hasUnread={!!sessionNotifications[session.id]}
            onPress={() => onSelect(workspaceId, session.id)}
            onRename={(name) => renameSession(session.id, name)}
            onArchive={async () => {
              await archiveSession(session.id);
              onArchived(workspaceId, session.id);
            }}
            isDark={isDark}
          />
        </AnimatedListItem>
      ))}

      {foldedCount > 0 && (
        <MoreRow label={`展开显示 ${foldedCount} 个`} onPress={() => setShowAll(true)} isDark={isDark} />
      )}
      {expanded && !forcedOpen && sessions.length > SESSION_PREVIEW_COUNT && (
        <MoreRow label="收起" onPress={() => setShowAll(false)} isDark={isDark} />
      )}
      {expanded && hasNextPage && (
        <MoreRow
          label={isFetchingNextPage ? "加载中…" : "加载更多"}
          onPress={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          isDark={isDark}
        />
      )}
    </View>
  );
}

/** The quiet text-only row that folds and unfolds a session list. */
function MoreRow({
  label,
  onPress,
  disabled,
  isDark,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  isDark: boolean;
}) {
  const colors = useThemeTokens();
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [styles.moreRow, pressed && { opacity: 0.6 }]}
    >
      <Text
        style={[
          styles.moreText,
          { color: hovered ? colors.textSecondary : colors.textTertiary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SessionRow({
  session,
  isSelected,
  hasUnread,
  onPress,
  onRename,
  onArchive,
  isDark,
}: {
  session: SessionListItem;
  isSelected: boolean;
  hasUnread: boolean;
  onPress: () => void;
  onRename: (name: string) => Promise<void>;
  onArchive: () => Promise<void>;
  isDark: boolean;
}) {
  const colors = useThemeTokens();
  const isWorking = useIsSessionStreaming(session.id);
  const [hovered, setHovered] = useState(false);
  const title = session.display_name ?? session.id;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [busy, setBusy] = useState<"rename" | "archive" | null>(null);
  const hoverBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.035)";
  const selectedBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const showActions = hovered || isSelected;

  useEffect(() => {
    if (!editing) setDraft(title);
  }, [editing, title]);

  const commitRename = useCallback(async () => {
    const name = draft.trim();
    if (!name || name === title) {
      setEditing(false);
      setDraft(title);
      return;
    }
    setBusy("rename");
    try {
      await onRename(name);
      setEditing(false);
    } catch {
      Alert.alert("重命名失败", "无法保存对话名称，请重试。");
    } finally {
      setBusy(null);
    }
  }, [draft, onRename, title]);

  const handleArchive = useCallback(async () => {
    if (busy) return;
    setBusy("archive");
    try {
      await onArchive();
    } catch {
      setBusy(null);
      Alert.alert("归档失败", "无法归档该对话，请重试。");
    }
  }, [busy, onArchive]);

  const status = (
    <View style={styles.sessionLead}>
      {isWorking ? (
        <SessionActivityIndicator
          sessionId={session.id}
          color={colors.textSecondary}
          idlePlaceholder={false}
        />
      ) : hasUnread ? (
        <View
          style={[
            styles.dot,
            { backgroundColor: isDark ? "#3FB950" : "#1A7F37" },
          ]}
        />
      ) : null}
    </View>
  );

  return (
    <View
      style={[
        styles.sessionRow,
        isSelected
          ? { backgroundColor: selectedBg }
          : hovered && { backgroundColor: hoverBg },
      ]}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {editing ? (
        <View style={styles.sessionMain}>
          {status}
          <TextInput
            autoFocus
            selectTextOnFocus
            underlineColorAndroid="transparent"
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={() => void commitRename()}
            onKeyPress={(event) => {
              if (event.nativeEvent.key === "Escape") setEditing(false);
            }}
            editable={busy !== "rename"}
            maxLength={200}
            selectionColor={colors.tint}
            style={[
              styles.sessionInput,
              { color: colors.text, fontFamily: Fonts.sansMedium },
            ]}
          />
        </View>
      ) : (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [styles.sessionMain, pressed && { opacity: 0.7 }]}
        >
          {status}
          <Text
            style={[
              styles.sessionLabel,
              {
                color: isSelected ? colors.text : colors.textSecondary,
                fontFamily: isSelected ? Fonts.sansMedium : Fonts.sans,
              },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </Pressable>
      )}
      {showActions && !editing && (
        <View style={styles.sessionActions}>
          <RowAction
            label="重命名对话"
            onPress={() => setEditing(true)}
            isDark={isDark}
          >
            <Pencil size={11} color={colors.textTertiary} strokeWidth={1.8} />
          </RowAction>
          <RowAction label="归档对话" onPress={() => void handleArchive()} isDark={isDark}>
            {busy === "archive" ? (
              <ActivityIndicator size={10} color={colors.textTertiary} />
            ) : (
              <ArchiveIcon size={11} color={colors.textTertiary} strokeWidth={1.8} />
            )}
          </RowAction>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: "100%",
  },
  deleteOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.48)",
  },
  deleteDialog: {
    width: "100%",
    maxWidth: 360,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 20,
    boxShadow: "0px 12px 32px rgba(0, 0, 0, 0.24)",
    elevation: 12,
  } as any,
  deleteTitle: {
    fontSize: 16,
    fontFamily: Fonts.sansSemiBold,
  },
  deleteDescription: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: Fonts.sans,
  },
  deleteHint: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  deleteActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 20,
  },
  deleteCancel: {
    height: 32,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 7,
    paddingHorizontal: 13,
    justifyContent: "center",
  },
  deleteCancelText: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
  },
  deleteConfirm: {
    height: 32,
    borderRadius: 7,
    paddingHorizontal: 13,
    justifyContent: "center",
  },
  deleteConfirmText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
  },
  serverRow: {
    borderBottomWidth: 0.633,
    zIndex: 20,
  },
  top: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  settingsHeader: {
    paddingHorizontal: 15,
    paddingTop: 14,
    paddingBottom: 10,
  },
  settingsTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: Fonts.sansSemiBold,
  },
  settingsContent: {
    gap: 3,
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
    paddingLeft: 8,
    paddingRight: 1,
    paddingTop: 16,
    paddingBottom: 2,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.4,
    fontFamily: Fonts.sansMedium,
  },
  headerAction: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    height: 29,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    height: "100%",
    minWidth: 0,
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  rowIcon: {
    width: 16,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 19,
    fontFamily: Fonts.sans,
  },
  pinMark: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    opacity: 0.7,
  },
  rowAction: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 26,
    paddingLeft: 8,
    paddingRight: 7,
    borderRadius: 6,
  },
  sessionMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: "100%",
    minWidth: 0,
  },
  sessionLead: {
    width: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionLabel: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
  },
  sessionInput: {
    flex: 1,
    minWidth: 0,
    height: 22,
    paddingHorizontal: 0,
    paddingVertical: 0,
    fontSize: 12.5,
    lineHeight: 18,
  },
  sessionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  sessionLoading: {
    alignSelf: "flex-start",
    marginLeft: SESSION_INDENT,
    marginVertical: 5,
  },
  sessionEmpty: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.sans,
    paddingLeft: SESSION_INDENT,
    paddingVertical: 5,
  },
  moreRow: {
    height: 24,
    justifyContent: "center",
    paddingLeft: SESSION_INDENT,
  },
  moreText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.sans,
  },
  empty: {
    fontSize: 12.5,
    lineHeight: 18,
    fontFamily: Fonts.sans,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
});
