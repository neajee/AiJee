import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Check,
  ChevronDown,
  FolderGit2,
  GitBranch,
  Globe,
} from "lucide-react-native";

import { Fonts } from "@/constants/theme";
import { usePromptTheme } from "@/features/workspace/components/prompt-input/use-theme-colors";
import { useWorkspaceStore } from "@/features/workspace/store";
import { useServersStore, type Server } from "@/features/servers/store";
import { useAuthStore } from "@/features/auth/store";
import { usePiClient, useGitStatus } from "@pideck/client-sdk";
import type { GitBranch as GitBranchInfo } from "@pideck/client-sdk";

type DropdownKind = null | "project" | "environment" | "branch";

/**
 * The three things a prompt is always implicitly scoped to: which project,
 * which machine it runs on, and which branch it lands on.
 *
 * These used to be read-only text under the greeting. They sit directly above
 * the composer instead because they are the preconditions of the message you
 * are about to send — you want to fix a wrong branch *before* hitting enter,
 * not discover it afterwards. Borderless on purpose: this is context, not
 * chrome, so it must not compete with the input card below it.
 */
export function ComposerContextBar() {
  const theme = usePromptTheme();
  const router = useRouter();
  const client = usePiClient();

  const [open, setOpen] = useState<DropdownKind>(null);
  const [branches, setBranches] = useState<GitBranchInfo[] | null>(null);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
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

  const localBranches = useMemo(
    () => (branches ?? []).filter((b) => !b.is_remote),
    [branches],
  );

  if (!workspace) return null;

  const popoverStyle = [
    styles.popover,
    {
      backgroundColor: theme.dropdownBg,
      borderColor: theme.dropdownBorder,
      opacity: anim,
      transform: [
        {
          translateY: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [4, 0],
          }),
        },
      ],
    },
  ];

  const renderControl = (
    kind: Exclude<DropdownKind, null>,
    icon: React.ReactNode,
    label: string,
    accessibilityLabel: string,
    disabled = false,
  ) => (
    <Pressable
      onPress={() => toggle(kind)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ expanded: open === kind, disabled }}
      style={({ pressed, hovered }: any) => [
        styles.control,
        (pressed || hovered) && !disabled && { backgroundColor: theme.hoverBg },
        disabled && { opacity: 0.5 },
      ]}
    >
      {icon}
      <Text
        style={[styles.controlText, { color: theme.textSecondary }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {!disabled && (
        <ChevronDown size={12} color={theme.textMuted} strokeWidth={1.8} />
      )}
    </Pressable>
  );

  return (
    <View style={styles.wrapper} {...({ "data-composer-context": true } as any)}>
      <View style={styles.bar}>
        {/* Project */}
        <View style={styles.anchor}>
          {renderControl(
            "project",
            <FolderGit2 size={13} color={theme.textMuted} strokeWidth={1.8} />,
            workspace.title,
            `Project: ${workspace.title}. Press to change.`,
          )}

          {open === "project" && (
            <Animated.View
              accessibilityRole="menu"
              accessibilityLabel="Project selection"
              style={popoverStyle}
            >
              <ScrollView
                style={styles.popoverScroll}
                showsVerticalScrollIndicator={false}
              >
                {workspaces.map((w) => {
                  const isActive = w.id === selectedWorkspaceId;
                  return (
                    <Pressable
                      key={w.id}
                      onPress={() => handleSelectProject(w.id)}
                      accessibilityRole="menuitem"
                      accessibilityState={{ selected: isActive }}
                      style={({ pressed, hovered }: any) => [
                        styles.item,
                        (pressed || hovered) && { backgroundColor: theme.hoverBg },
                      ]}
                    >
                      <View style={styles.itemMain}>
                        <View
                          style={[styles.colorDot, { backgroundColor: w.color }]}
                        />
                        <View style={styles.itemLabels}>
                          <Text
                            style={[
                              styles.itemText,
                              {
                                color: isActive
                                  ? theme.accentColor
                                  : theme.textPrimary,
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {w.title}
                          </Text>
                          <Text
                            style={[styles.itemSub, { color: theme.textMuted }]}
                            numberOfLines={1}
                          >
                            {w.path}
                          </Text>
                        </View>
                      </View>
                      {isActive && (
                        <Check
                          size={13}
                          color={theme.accentColor}
                          strokeWidth={2}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>
          )}
        </View>

        {/* Environment: which server the project actually runs on. */}
        <View style={styles.anchor}>
          {renderControl(
            "environment",
            <Globe size={13} color={theme.textMuted} strokeWidth={1.8} />,
            activeServer?.name ?? "Local",
            `Environment: ${activeServer?.name ?? "Local"}. Press to change.`,
            servers.length === 0,
          )}

          {open === "environment" && (
            <Animated.View
              accessibilityRole="menu"
              accessibilityLabel="Environment selection"
              style={popoverStyle}
            >
              <ScrollView
                style={styles.popoverScroll}
                showsVerticalScrollIndicator={false}
              >
                {servers.map((s) => {
                  const isActive = s.id === activeServerId;
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => void handleSelectServer(s)}
                      accessibilityRole="menuitem"
                      accessibilityState={{ selected: isActive }}
                      style={({ pressed, hovered }: any) => [
                        styles.item,
                        (pressed || hovered) && { backgroundColor: theme.hoverBg },
                      ]}
                    >
                      <View style={styles.itemMain}>
                        <Globe
                          size={13}
                          color={isActive ? theme.accentColor : theme.textMuted}
                          strokeWidth={1.8}
                        />
                        <View style={styles.itemLabels}>
                          <Text
                            style={[
                              styles.itemText,
                              {
                                color: isActive
                                  ? theme.accentColor
                                  : theme.textPrimary,
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {s.name}
                          </Text>
                          <Text
                            style={[styles.itemSub, { color: theme.textMuted }]}
                            numberOfLines={1}
                          >
                            {s.address}
                          </Text>
                        </View>
                      </View>
                      {busy === s.id ? (
                        <ActivityIndicator size="small" color={theme.textMuted} />
                      ) : (
                        isActive && (
                          <Check
                            size={13}
                            color={theme.accentColor}
                            strokeWidth={2}
                          />
                        )
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>
          )}
        </View>

        {/* Branch */}
        {git.isGitRepo && (
          <View style={styles.anchor}>
            {renderControl(
              "branch",
              <GitBranch size={13} color={theme.textMuted} strokeWidth={1.8} />,
              currentBranch ?? "—",
              `Branch: ${currentBranch ?? "unknown"}. Press to change.`,
            )}

            {open === "branch" && (
              <Animated.View
                accessibilityRole="menu"
                accessibilityLabel="Branch selection"
                style={popoverStyle}
              >
                {branchesLoading && !branches ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={theme.textMuted} />
                  </View>
                ) : localBranches.length === 0 ? (
                  <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                    No branches found
                  </Text>
                ) : (
                  <ScrollView
                    style={styles.popoverScroll}
                    showsVerticalScrollIndicator={false}
                  >
                    {localBranches.map((b) => (
                      <Pressable
                        key={b.name}
                        onPress={() => void handleSelectBranch(b)}
                        accessibilityRole="menuitem"
                        accessibilityState={{ selected: b.is_current }}
                        style={({ pressed, hovered }: any) => [
                          styles.item,
                          (pressed || hovered) && {
                            backgroundColor: theme.hoverBg,
                          },
                        ]}
                      >
                        <View style={styles.itemMain}>
                          <GitBranch
                            size={13}
                            color={
                              b.is_current ? theme.accentColor : theme.textMuted
                            }
                            strokeWidth={1.8}
                          />
                          <Text
                            style={[
                              styles.itemText,
                              {
                                color: b.is_current
                                  ? theme.accentColor
                                  : theme.textPrimary,
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {b.name}
                          </Text>
                        </View>
                        {busy === b.name ? (
                          <ActivityIndicator
                            size="small"
                            color={theme.textMuted}
                          />
                        ) : (
                          b.is_current && (
                            <Check
                              size={13}
                              color={theme.accentColor}
                              strokeWidth={2}
                            />
                          )
                        )}
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              </Animated.View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    maxWidth: 1080,
    alignSelf: "center",
    width: "100%",
    overflow: "visible",
    zIndex: Platform.OS === "android" ? 9 : 11,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 2,
    paddingHorizontal: 2,
    paddingBottom: 6,
  },
  anchor: {
    position: "relative",
  },
  control: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 26,
    maxWidth: 240,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  controlText: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
    flexShrink: 1,
  },
  popover: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    marginBottom: 6,
    minWidth: 240,
    maxWidth: 340,
    borderRadius: 10,
    borderWidth: 0.633,
    overflow: "hidden",
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
    elevation: 8,
    zIndex: 20,
  },
  popoverScroll: {
    maxHeight: 260,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  itemMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  itemLabels: {
    flexShrink: 1,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemText: {
    fontSize: 12.5,
    fontFamily: Fonts.sansMedium,
  },
  itemSub: {
    fontSize: 10.5,
    lineHeight: 14,
    fontFamily: Fonts.mono,
  },
  loadingRow: {
    paddingVertical: 16,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
});
