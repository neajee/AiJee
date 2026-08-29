import {
  ReactNode,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePathname } from "expo-router";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "../../hooks/use-responsive-layout";
import { MobileHeaderBar } from "../../components/mobile-header-bar";
import { WorkspaceSheet } from "../../components/workspace-sheet";
import { MobileChangesSheet } from "../../components/mobile-changes-sheet";
import { MobileFilesSheet } from "../../components/mobile-files-sheet";
import { MobilePreviewSheet } from "../../components/mobile-preview-sheet";
import { ProjectSidebar, SettingsSidebar } from "../../components/project-sidebar";
import { useAuthStore } from "@/features/auth/store";
import { useWorkspaceStore } from "@/features/workspace/store";
import { useAppMode } from "@/hooks/use-app-mode";
import { useDesktopStore } from "@/features/desktop/store";
import { ConnectionStatusBanner } from "@/features/agent/components/connection-status-banner";
import { TasksSheet } from "@/features/tasks/components/tasks-sheet";
import { TaskOutputSheet } from "@/features/tasks/components/task-output-sheet";
import { TaskOutputPanel } from "@/features/tasks/components/task-output-panel";
import {
  SeamToggle,
  SEAM_TOGGLE_HEIGHT,
  SEAM_TOGGLE_WIDTH,
} from "@/components/ui/seam-toggle";

const SIDEBAR_DEFAULT = 280;
/** Width of the invisible left-edge strip that reveals a hidden sidebar. */
const HOVER_ZONE_WIDTH = 12;

type SidebarMode = "persistent" | "hover";

interface AdaptiveNavigationProps {
  children: ReactNode;
}

export function AdaptiveNavigation({ children }: AdaptiveNavigationProps) {
  const { isWideScreen } = useResponsiveLayout();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const activeServerId = useAuthStore((s) => s.activeServerId);
  const hasServer = !!activeServerId;
  const hasWorkspaces = useWorkspaceStore((s) => s.workspaces.length > 0);
  const appMode = useAppMode();
  const isCodeMode = appMode === "code";
  const isDesktopMode = appMode === "desktop";
  const desktopImmersive = useDesktopStore((s) => s.immersive);
  // The sidebar is also where a first project gets added, so it stays even
  // when there is nothing in it yet.
  const showSidebar = hasServer;
  const [sheetVisible, setSheetVisible] = useState(false);
  const [changesSheetVisible, setChangesSheetVisible] = useState(false);
  const [filesSheetVisible, setFilesSheetVisible] = useState(false);
  const [previewSheetVisible, setPreviewSheetVisible] = useState(false);
  const [tasksSheetVisible, setTasksSheetVisible] = useState(false);
  const [taskOutputSheetVisible, setTaskOutputSheetVisible] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("persistent");
  const [hoverVisible, setHoverVisible] = useState(false);
  const [showPersistentSidebar, setShowPersistentSidebar] = useState(true);
  const [sidebarWidth] = useState(SIDEBAR_DEFAULT);

  const isDark = colorScheme === "dark";
  const contentBorder = isDark ? "#3b3a39" : "rgba(0,0,0,0.12)";
  const overlayBg = isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.08)";

  const persistentAnim = useRef(new Animated.Value(1)).current;
  const hoverAnim = useRef(new Animated.Value(0)).current;
  const codeModeAnim = useRef(new Animated.Value(isCodeMode ? 1 : 0)).current;
  const [sidebarMounted, setSidebarMounted] = useState(isCodeMode);

  const isPersistent = sidebarMode === "persistent";

  useEffect(() => {
    if (isCodeMode) {
      setSidebarMounted(true);
    }
    Animated.spring(codeModeAnim, {
      toValue: isCodeMode ? 1 : 0,
      tension: 200,
      friction: 24,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !isCodeMode) {
        setSidebarMounted(false);
      }
    });
  }, [isCodeMode, codeModeAnim]);

  useEffect(() => {
    if (isPersistent) {
      setShowPersistentSidebar(true);
    }
    Animated.spring(persistentAnim, {
      toValue: isPersistent ? 1 : 0,
      tension: 180,
      friction: 22,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !isPersistent) {
        setShowPersistentSidebar(false);
      }
    });
  }, [isPersistent, persistentAnim]);

  useEffect(() => {
    Animated.spring(hoverAnim, {
      toValue: hoverVisible && !isPersistent ? 1 : 0,
      tension: 200,
      friction: 24,
      useNativeDriver: true,
    }).start();
  }, [hoverAnim, hoverVisible, isPersistent]);

  const handleToggleSidebar = useCallback(() => {
    setSidebarMode((prev) => (prev === "persistent" ? "hover" : "persistent"));
    setHoverVisible(false);
  }, []);

  const handleHoverZoneIn = useCallback(() => {
    if (!isPersistent) setHoverVisible(true);
  }, [isPersistent]);

  const handleHoverZoneOut = useCallback(() => {
    if (!isPersistent) setHoverVisible(false);
  }, [isPersistent]);

  const handleSidebarHoverIn = useCallback(() => {
    if (!isPersistent) setHoverVisible(true);
  }, [isPersistent]);

  const handleSidebarHoverOut = useCallback(() => {
    if (!isPersistent) setHoverVisible(false);
  }, [isPersistent]);

  const pathname = usePathname();
  const settingsMode = pathname.startsWith("/settings");
  const sessionRouteMatch = pathname.match(/^\/workspace\/[^/]+\/s\/([^/]+)$/);
  const openSessionId = sessionRouteMatch?.[1] ?? null;
  const mobilePreviewSessionId = openSessionId;

  useEffect(() => {
    if (!settingsMode) return;
    setSidebarMode("persistent");
    setHoverVisible(false);
  }, [settingsMode]);

  if (isWideScreen) {
    const animatedSidebarWidth = Animated.multiply(
      persistentAnim,
      Animated.multiply(codeModeAnim, sidebarWidth),
    );

    const contentBorderWidth = codeModeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.633],
    });

    const contentBorderRadius = Animated.multiply(
      persistentAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [12, 10],
      }),
      codeModeAnim,
    );

    const hoverTranslateX = hoverAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-sidebarWidth, 0],
    });

    const webHoverProps =
      Platform.OS === "web"
        ? { onMouseEnter: handleHoverZoneIn, onMouseLeave: handleHoverZoneOut }
        : {};

    const webSidebarHoverProps =
      Platform.OS === "web"
        ? {
            onMouseEnter: handleSidebarHoverIn,
            onMouseLeave: handleSidebarHoverOut,
          }
        : {};

    return (
      <SafeAreaView
        style={[styles.wideContainer, { backgroundColor: isDesktopMode && desktopImmersive ? '#000' : colors.background }]}
        edges={isDesktopMode && desktopImmersive ? [] : ["top"]}
      >
        <View style={styles.bodyRow}>
          {showSidebar && showPersistentSidebar && sidebarMounted && (
            <Animated.View
              style={{
                width: animatedSidebarWidth,
                overflow: "hidden",
                height: "100%",
              }}
            >
              <View
                style={{ width: sidebarWidth, flex: 1 }}
              >
                {settingsMode ? <SettingsSidebar /> : <ProjectSidebar />}
              </View>
            </Animated.View>
          )}

          <Animated.View
            style={[
              styles.content,
              hasServer && isCodeMode
                ? {
                    borderLeftWidth: contentBorderWidth,
                    borderTopWidth: contentBorderWidth,
                    borderRightWidth: contentBorderWidth,
                    borderLeftColor: contentBorder,
                    borderTopColor: contentBorder,
                    borderRightColor: contentBorder,
                    borderTopLeftRadius: contentBorderRadius,
                    borderTopRightRadius: contentBorderRadius,
                  }
                : {},
            ]}
          >
            <View style={styles.contentInner}>
              {children}
            </View>

            {isCodeMode && <TaskOutputPanel />}

            {showSidebar && !isPersistent && isCodeMode && (
              <>
                {/* With no rail left to hover, the window edge is the trigger. */}
                <View
                  {...webHoverProps}
                  style={styles.hoverZone}
                />
                <Animated.View
                  style={[
                    styles.overlay,
                    {
                      backgroundColor: overlayBg,
                      opacity: hoverAnim,
                      pointerEvents: hoverVisible ? "auto" : "none",
                    },
                  ]}
                />
                <Animated.View
                  {...webSidebarHoverProps}
                  style={[
                    styles.hoverSidebar,
                    {
                      transform: [{ translateX: hoverTranslateX }],
                    },
                  ]}
                >
                  {settingsMode ? <SettingsSidebar /> : <ProjectSidebar />}
                </Animated.View>
              </>
            )}
          </Animated.View>

          {/* One control on the seam, always reachable: its position doubles as
              the sidebar's state, so a collapsed sidebar is never a dead edge. */}
          {showSidebar && isCodeMode && (
            <Animated.View
              pointerEvents="box-none"
              style={[
                styles.seamPillWrap,
                {
                  left: Animated.subtract(
                    animatedSidebarWidth,
                    SEAM_TOGGLE_WIDTH / 2,
                  ),
                },
              ]}
            >
              <SeamToggle
                chevron={isPersistent ? "left" : "right"}
                onPress={handleToggleSidebar}
                label={isPersistent ? "Collapse sidebar" : "Expand sidebar"}
                // Hovering the pill peeks the hidden sidebar too, so the whole
                // left edge behaves the same way.
                onHoverIn={handleHoverZoneIn}
                onHoverOut={handleHoverZoneOut}
              />
            </Animated.View>
          )}
        </View>
        {hasServer && <ConnectionStatusBanner />}
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView
      style={[styles.narrowContainer, { backgroundColor: colors.background }]}
    >
      <SafeAreaView
        style={[styles.narrowSafeArea, { backgroundColor: isDesktopMode && desktopImmersive ? '#000' : colors.background }]}
        edges={isDesktopMode && desktopImmersive ? [] : ["top"]}
      >
        {hasServer && !isDesktopMode && (
          <MobileHeaderBar
            onWorkspacePress={() => setSheetVisible(true)}
            onFilesPress={() => {
              setChangesSheetVisible(false);
              setPreviewSheetVisible(false);
              setFilesSheetVisible(true);
            }}
            onGitPress={() => {
              setFilesSheetVisible(false);
              setPreviewSheetVisible(false);
              setChangesSheetVisible(true);
            }}
            onPreviewPress={() => {
              setChangesSheetVisible(false);
              setPreviewSheetVisible(true);
            }}
            onTasksPress={() => setTasksSheetVisible(true)}
            onTaskOutputPress={() => setTaskOutputSheetVisible(true)}
          />
        )}
        <View style={styles.mobileContent}>
          {children}
        </View>
        {hasServer && <ConnectionStatusBanner />}
      </SafeAreaView>
      {hasServer && isCodeMode && (
        <>
          <WorkspaceSheet
            visible={sheetVisible}
            onClose={() => setSheetVisible(false)}
          />
          {hasWorkspaces && (
            <>
              <MobileChangesSheet
                visible={changesSheetVisible}
                onClose={() => setChangesSheetVisible(false)}
              />
              <MobilePreviewSheet
                visible={previewSheetVisible}
                onClose={() => setPreviewSheetVisible(false)}
                sessionId={mobilePreviewSessionId}
              />
            </>
          )}
        </>
      )}
      {isCodeMode && (
        <>
          <TasksSheet
            visible={tasksSheetVisible}
            onClose={() => setTasksSheetVisible(false)}
          />
          <TaskOutputSheet
            visible={taskOutputSheetVisible}
            onClose={() => setTaskOutputSheetVisible(false)}
          />
        </>
      )}
      {hasServer && (
        <MobileFilesSheet
          visible={filesSheetVisible}
          onClose={() => setFilesSheetVisible(false)}
        />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  wideContainer: {
    flex: 1,
  },
  bodyRow: {
    flex: 1,
    flexDirection: "row",
  },
  narrowContainer: {
    flex: 1,
  },
  narrowSafeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    overflow: "hidden",
  },
  contentInner: {
    flex: 1,
  },
  mobileContent: {
    flex: 1,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  hoverZone: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: HOVER_ZONE_WIDTH,
    zIndex: 12,
  },
  hoverSidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_DEFAULT,
    zIndex: 11,
  },
  seamPillWrap: {
    position: "absolute",
    top: "50%",
    marginTop: -SEAM_TOGGLE_HEIGHT / 2,
    width: SEAM_TOGGLE_WIDTH,
    height: SEAM_TOGGLE_HEIGHT,
    zIndex: 30,
  },
});
