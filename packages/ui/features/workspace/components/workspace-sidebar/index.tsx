import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { Files, GitBranch, Globe2 } from "lucide-react-native";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  SeamToggle,
  SEAM_TOGGLE_HEIGHT,
  SEAM_TOGGLE_WIDTH,
} from "@/components/ui/seam-toggle";
import { usePanelCoordination } from "@/features/navigation/store/panel-coordination";
import { useWorkspaceStore } from "@/features/workspace/store";
import { useGitStatus } from "@aijee/client-sdk";
import {
  WorkspacePaneContext,
  type WorkspacePaneTab,
} from "./context";

const PANEL_DEFAULT = 280;
const PANEL_MIN = 180;
/**
 * A hard ceiling, and a share of the window that the panel may never exceed.
 * Reading a file or a wide diff wants room, but the conversation has to keep a
 * usable column whatever the window size.
 */
const PANEL_MAX = 1000;
const PANEL_MAX_FRACTION = 0.72;
const COLLAPSED_WIDTH = 38;
/**
 * Invisible grab strip straddling the panel seam, bolt-style.
 *
 * Wide enough to catch a hurried pointer; what lights up inside it is a narrow
 * bar, so the target being generous never shows as a broad grey band.
 */
const SEAM_HIT_WIDTH = 22;
const SEAM_BAR_WIDTH = 4;
const COLLAPSE_DURATION = 200;
const SIDEBAR_WIDTH_KEY = "workspace_sidebar_width";
const SIDEBAR_COLLAPSED_KEY = "workspace_sidebar_collapsed";
/**
 * The default scope keeps the original unsuffixed keys, so an existing
 * preference is not silently discarded by the introduction of scopes.
 */
const DEFAULT_SCOPE = "session";

interface ScopeState {
  width: number;
  widthLoaded: boolean;
  collapsed: boolean;
  collapsedLoaded: boolean;
}

/**
 * Per-scope state, so the start page and an open session remember their panel
 * independently: the start page wants the composer full width, a session wants
 * the file tree and preview at hand.
 */
const scopes = new Map<string, ScopeState>();

function getScope(scope: string, defaultCollapsed: boolean): ScopeState {
  let state = scopes.get(scope);
  if (!state) {
    state = {
      width: PANEL_DEFAULT,
      widthLoaded: false,
      collapsed: defaultCollapsed,
      collapsedLoaded: false,
    };
    scopes.set(scope, state);
  }
  return state;
}

function scopedKey(base: string, scope: string) {
  return scope === DEFAULT_SCOPE ? base : `${base}:${scope}`;
}

function clampWidth(width: number) {
  return Math.max(PANEL_MIN, Math.min(PANEL_MAX, Math.round(width)));
}

function parseStoredWidth(value: string | null | undefined) {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return clampWidth(parsed);
}

async function loadStoredWidth(scope: string) {
  const key = scopedKey(SIDEBAR_WIDTH_KEY, scope);
  try {
    if (Platform.OS === "web") {
      if (typeof localStorage === "undefined") return null;
      return parseStoredWidth(localStorage.getItem(key));
    }

    return parseStoredWidth(await SecureStore.getItemAsync(key));
  } catch {
    return null;
  }
}

async function saveStoredWidth(width: number, scope: string) {
  const key = scopedKey(SIDEBAR_WIDTH_KEY, scope);
  const value = String(clampWidth(width));

  try {
    if (Platform.OS === "web") {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(key, value);
      return;
    }

    await SecureStore.setItemAsync(key, value);
  } catch {}
}

async function loadStoredCollapsed(scope: string): Promise<boolean | null> {
  const key = scopedKey(SIDEBAR_COLLAPSED_KEY, scope);
  try {
    let value: string | null = null;
    if (Platform.OS === "web") {
      if (typeof localStorage === "undefined") return null;
      value = localStorage.getItem(key);
    } else {
      value = await SecureStore.getItemAsync(key);
    }
    if (value === "true") return true;
    if (value === "false") return false;
    return null;
  } catch {
    return null;
  }
}

async function saveStoredCollapsed(collapsed: boolean, scope: string) {
  const key = scopedKey(SIDEBAR_COLLAPSED_KEY, scope);
  try {
    if (Platform.OS === "web") {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(key, String(collapsed));
      return;
    }
    await SecureStore.setItemAsync(key, String(collapsed));
  } catch {}
}

interface WorkspaceSidebarProps {
  children: ReactNode;
  /**
   * Which persisted preference this panel belongs to. Screens that want their
   * own memory pass their own scope.
   */
  storageScope?: string;
  /** Applied only when the scope has no stored preference yet. */
  defaultCollapsed?: boolean;
  /**
   * When true the panel stays collapsed and cannot be expanded, resized or
   * restored from storage: it effectively hides itself and keeps out of the
   * way (used on the new-session start page, where the composer should get
   * the whole width while a session is still being prepared).
   */
  locked?: boolean;
  /** Hide Git controls when the workspace is not a repository. */
}

export function WorkspaceSidebar({
  children,
  storageScope = DEFAULT_SCOPE,
  defaultCollapsed = false,
  locked = false,
}: WorkspaceSidebarProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const isDark = colorScheme === "dark";
  const workspace = useWorkspaceStore((s) => s.workspaces.find((w) => w.id === s.selectedWorkspaceId));
  const { isGitRepo } = useGitStatus(workspace?.path ?? null);

  const scope = getScope(storageScope, defaultCollapsed);

  const { width: windowWidth } = useWindowDimensions();
  const maxWidth = Math.max(
    PANEL_MIN,
    Math.min(PANEL_MAX, Math.round(windowWidth * PANEL_MAX_FRACTION)),
  );
  // The gesture is created once, so it reads the ceiling through a ref rather
  // than closing over the value it saw on mount.
  const maxWidthRef = useRef(maxWidth);
  maxWidthRef.current = maxWidth;

  const sidebarBorder = isDark ? "#323131" : "rgba(0,0,0,0.08)";
  // bolt tints the seam with a single translucent grey for hover and drag.
  const seamTint = "rgba(136,136,136,0.16)";
  const seamDragTint = "rgba(136,136,136,0.26)";

  const [isCollapsed, setIsCollapsed] = useState(scope.collapsed);
  // A locked panel is always treated as collapsed, regardless of what the
  // store remembered, so it can never be shown on the new-session page.
  const collapsed = locked ? true : isCollapsed;
  const [isResizing, setIsResizing] = useState(false);
  const [isSeamHovered, setIsSeamHovered] = useState(false);
  const [panelWidth, setPanelWidth] = useState(scope.width);
  const panelWidthRef = useRef(scope.width);
  const panelStartRef = useRef(scope.width);
  const isResizingRef = useRef(false);
  const widthAnim = useRef(
    new Animated.Value(
      locked ? 0 : scope.collapsed ? COLLAPSED_WIDTH : scope.width,
    ),
  ).current;
  const [contentMounted, setContentMounted] = useState(
    locked ? false : !scope.collapsed,
  );
  const [paneRequest, setPaneRequest] = useState<{
    tab: WorkspacePaneTab;
    revision: number;
  } | null>(null);
  const [activePaneTab, setActivePaneTab] = useState<WorkspacePaneTab>("git");
  const openedSide = usePanelCoordination((state) => state.openedSide);
  const panelRevision = usePanelCoordination((state) => state.revision);
  const notifyPanelOpened = usePanelCoordination(
    (state) => state.notifyOpened,
  );

  const updateCollapsed = (next: boolean) => {
    scope.collapsed = next;
    scope.collapsedLoaded = true;
    setIsCollapsed(next);
    void saveStoredCollapsed(next, storageScope);
  };

  useEffect(() => {
    if (locked || panelRevision === 0 || openedSide !== "left") return;
    updateCollapsed(true);
  }, [locked, openedSide, panelRevision]);

  useEffect(() => {
    let cancelled = false;

    const promises: Promise<void>[] = [];

    if (scope.widthLoaded) {
      const nextWidth = clampWidth(scope.width);
      panelWidthRef.current = nextWidth;
      setPanelWidth(nextWidth);
    } else {
      promises.push(
        loadStoredWidth(storageScope).then((storedWidth) => {
          if (cancelled) return;
          const nextWidth = storedWidth ?? PANEL_DEFAULT;
          scope.width = nextWidth;
          scope.widthLoaded = true;
          panelWidthRef.current = nextWidth;
          setPanelWidth(nextWidth);
          if (!scope.collapsed && !locked) widthAnim.setValue(nextWidth);
        }),
      );
    }

    if (scope.collapsedLoaded) {
      setIsCollapsed(scope.collapsed);
    } else {
      promises.push(
        loadStoredCollapsed(storageScope).then((stored) => {
          if (cancelled) return;
          const collapsed = stored ?? defaultCollapsed;
          scope.collapsed = collapsed;
          scope.collapsedLoaded = true;
          setIsCollapsed(collapsed);
        }),
      );
    }

    if (promises.length > 0) {
      void Promise.all(promises);
    }

    return () => {
      cancelled = true;
    };
  }, [defaultCollapsed, scope, storageScope, widthAnim]);

  // Width is animated on collapse only; dragging drives it imperatively so the
  // panel tracks the pointer without a queued animation per move.
  useEffect(() => {    if (isResizingRef.current) return;

    if (!collapsed) setContentMounted(true);

    Animated.timing(widthAnim, {
      toValue: locked ? 0 : collapsed ? COLLAPSED_WIDTH : panelWidth,
      duration: COLLAPSE_DURATION,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && collapsed) setContentMounted(false);
    });
  }, [collapsed, panelWidth, widthAnim]);

  // A window that shrank past the ceiling would otherwise leave the panel
  // covering the conversation; the stored preference is left untouched so the
  // panel returns to its width once there is room again.
  useEffect(() => {
    if (isResizingRef.current || panelWidth <= maxWidth) return;
    panelWidthRef.current = maxWidth;
    setPanelWidth(maxWidth);
    if (!collapsed) widthAnim.setValue(maxWidth);
  }, [collapsed, maxWidth, panelWidth, widthAnim]);

  const persistWidth = (width: number) => {
    const nextWidth = clampWidth(width);
    scope.width = nextWidth;
    scope.widthLoaded = true;
    panelWidthRef.current = nextWidth;
    void saveStoredWidth(nextWidth, storageScope);
  };

  const panelResizer = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !collapsed && !locked,
      onMoveShouldSetPanResponder: () => !collapsed && !locked,
      onPanResponderGrant: () => {
        panelStartRef.current = panelWidthRef.current;
        isResizingRef.current = true;
        setIsResizing(true);
        if (Platform.OS === "web") {
          document.body.style.cursor = "col-resize";
          document.body.style.userSelect = "none";
        }
      },
      onPanResponderMove: (_e, gs) => {
        const newWidth = Math.max(
          PANEL_MIN,
          Math.min(maxWidthRef.current, panelStartRef.current - gs.dx),
        );
        panelWidthRef.current = newWidth;
        widthAnim.setValue(newWidth);
        setPanelWidth(newWidth);
      },
      onPanResponderRelease: () => {
        isResizingRef.current = false;
        setIsResizing(false);
        persistWidth(panelWidthRef.current);
        if (Platform.OS === "web") {
          document.body.style.cursor = "";
          document.body.style.userSelect = "";
        }
      },
      onPanResponderTerminate: () => {
        isResizingRef.current = false;
        setIsResizing(false);
        persistWidth(panelWidthRef.current);
        if (Platform.OS === "web") {
          document.body.style.cursor = "";
          document.body.style.userSelect = "";
        }
      },
    }),
  ).current;

  const seamActive = isSeamHovered || isResizing;

  const webSeamHoverProps =
    Platform.OS === "web"
      ? {
          onMouseEnter: () => setIsSeamHovered(true),
          onMouseLeave: () => setIsSeamHovered(false),
        }
      : {};

  const toggleCollapsed = () => {
    if (locked) return;
    const next = !isCollapsed;
    updateCollapsed(next);
    if (!next) notifyPanelOpened("right");
  };

  const openPane = (tab: WorkspacePaneTab) => {
    if (!collapsed && activePaneTab === tab) {
      updateCollapsed(true);
      return;
    }
    setActivePaneTab(tab);
    setPaneRequest((current) => ({ tab, revision: (current?.revision ?? 0) + 1 }));
    updateCollapsed(false);
    notifyPanelOpened("right");
  };

  const isDesktopShell =
    Platform.OS === "web" &&
    typeof navigator !== "undefined" &&
    navigator.userAgent.includes("AiJeeDesktop/");

  return (
    <WorkspacePaneContext.Provider
      value={{
        request: paneRequest,
        activeTab: activePaneTab,
        setActiveTab: setActivePaneTab,
      }}
    >
      <Animated.View
        style={[
          styles.container,
          {
            width: widthAnim,
            borderLeftColor: locked ? "transparent" : sidebarBorder,
          },
        ]}
      >
        {!collapsed && (
          <View style={styles.clip}>
            {contentMounted && (
              <View
                style={{
                  width: Math.max(0, panelWidth - COLLAPSED_WIDTH),
                  flex: 1,
                }}
              >
                {children}
              </View>
            )}
          </View>
        )}

        {!locked && (
          <View style={styles.activityBar}>
            <RailButton
              label="Open files"
              active={activePaneTab === "files"}
              onPress={() => openPane("files")}
            >
              <Files size={17} color={colors.textSecondary} strokeWidth={1.8} />
            </RailButton>
            {isGitRepo && <RailButton
              label="Open Git"
              active={activePaneTab === "git"}
              onPress={() => openPane("git")}
            >
              <GitBranch size={17} color={colors.textSecondary} strokeWidth={1.8} />
            </RailButton>}
            {isDesktopShell && (
              <RailButton
                label="Open browser"
                active={activePaneTab === "preview"}
                onPress={() => openPane("preview")}
              >
                <Globe2 size={17} color={colors.textSecondary} strokeWidth={1.8} />
              </RailButton>
            )}
          </View>
        )}

        {!locked && !collapsed && (
          <View
            style={[
              styles.seamToggleWrap,
              {
                left: -SEAM_TOGGLE_WIDTH / 2,
              },
            ]}
            pointerEvents="box-none"
          >
            <SeamToggle
              chevron="right"
              onPress={toggleCollapsed}
              label="Close side panel"
            />
          </View>
        )}

        {!collapsed && (
          <View
            {...panelResizer.panHandlers}
            {...webSeamHoverProps}
            style={styles.seam}
          >
            <View
              style={[
                styles.seamBar,
                {
                  backgroundColor: seamActive
                    ? isResizing
                      ? seamDragTint
                      : seamTint
                    : "transparent",
                },
              ]}
            />
          </View>
        )}
      </Animated.View>
    </WorkspacePaneContext.Provider>
  );
}

function RailButton({
  label,
  active,
  onPress,
  children,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed, hovered }: any) => [
        styles.railButton,
        active && styles.railButtonActive,
        (pressed || hovered) && styles.railButtonActive,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderLeftWidth: 0.633,
    flexDirection: "row",
    position: "relative",
  },
  clip: {
    flex: 1,
    overflow: "hidden",
  },
  activityBar: {
    width: COLLAPSED_WIDTH,
    alignItems: "center",
    paddingTop: 6,
    gap: 2,
  },
  railButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  railButtonActive: {
    backgroundColor: "rgba(136,136,136,0.16)",
  },
  seam: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: -(SEAM_HIT_WIDTH / 2),
    width: SEAM_HIT_WIDTH,
    alignItems: "center",
    zIndex: 20,
    cursor: "col-resize",
  } as any,
  seamBar: {
    width: SEAM_BAR_WIDTH,
    height: "100%",
    borderRadius: SEAM_BAR_WIDTH / 2,
  },
  seamToggleWrap: {
    position: "absolute",
    top: "50%",
    marginTop: -SEAM_TOGGLE_HEIGHT / 2,
    width: SEAM_TOGGLE_WIDTH,
    height: SEAM_TOGGLE_HEIGHT,
    zIndex: 30,
  },
});
