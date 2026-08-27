import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  SeamToggle,
  SEAM_TOGGLE_HEIGHT,
  SEAM_TOGGLE_WIDTH,
} from "@/components/ui/seam-toggle";

const PANEL_DEFAULT = 280;
const PANEL_MIN = 180;
const PANEL_MAX = 480;
/**
 * Closed, the panel takes no width at all: a leftover rail showed up as a bare
 * strip of the screen's own background next to the editor. The pill moves
 * inside the content instead, so nothing is left behind.
 */
const COLLAPSED_WIDTH = 0;
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

let sidebarWidthCache = PANEL_DEFAULT;
let sidebarWidthLoaded = false;
let sidebarCollapsedCache = false;
let sidebarCollapsedLoaded = false;

function clampWidth(width: number) {
  return Math.max(PANEL_MIN, Math.min(PANEL_MAX, Math.round(width)));
}

function parseStoredWidth(value: string | null | undefined) {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return clampWidth(parsed);
}

async function loadStoredWidth() {
  try {
    if (Platform.OS === "web") {
      if (typeof localStorage === "undefined") return null;
      return parseStoredWidth(localStorage.getItem(SIDEBAR_WIDTH_KEY));
    }

    return parseStoredWidth(
      await SecureStore.getItemAsync(SIDEBAR_WIDTH_KEY),
    );
  } catch {
    return null;
  }
}

async function saveStoredWidth(width: number) {
  const value = String(clampWidth(width));

  try {
    if (Platform.OS === "web") {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(SIDEBAR_WIDTH_KEY, value);
      return;
    }

    await SecureStore.setItemAsync(SIDEBAR_WIDTH_KEY, value);
  } catch {}
}

async function loadStoredCollapsed(): Promise<boolean | null> {
  try {
    let value: string | null = null;
    if (Platform.OS === "web") {
      if (typeof localStorage === "undefined") return null;
      value = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    } else {
      value = await SecureStore.getItemAsync(SIDEBAR_COLLAPSED_KEY);
    }
    if (value === "true") return true;
    if (value === "false") return false;
    return null;
  } catch {
    return null;
  }
}

async function saveStoredCollapsed(collapsed: boolean) {
  try {
    if (Platform.OS === "web") {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
      return;
    }
    await SecureStore.setItemAsync(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  } catch {}
}

interface WorkspaceSidebarProps {
  children: ReactNode;
}

export function WorkspaceSidebar({ children }: WorkspaceSidebarProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const sidebarBorder = isDark ? "#323131" : "rgba(0,0,0,0.08)";
  // bolt tints the seam with a single translucent grey for hover and drag.
  const seamTint = "rgba(136,136,136,0.16)";
  const seamDragTint = "rgba(136,136,136,0.26)";

  const [isCollapsed, setIsCollapsed] = useState(sidebarCollapsedCache);
  const [isResizing, setIsResizing] = useState(false);
  const [isSeamHovered, setIsSeamHovered] = useState(false);
  const [panelWidth, setPanelWidth] = useState(sidebarWidthCache);
  const panelWidthRef = useRef(sidebarWidthCache);
  const panelStartRef = useRef(sidebarWidthCache);
  const isResizingRef = useRef(false);
  const widthAnim = useRef(
    new Animated.Value(
      sidebarCollapsedCache ? COLLAPSED_WIDTH : sidebarWidthCache,
    ),
  ).current;
  const [contentMounted, setContentMounted] = useState(!sidebarCollapsedCache);

  useEffect(() => {
    let cancelled = false;

    const promises: Promise<void>[] = [];

    if (sidebarWidthLoaded) {
      const nextWidth = clampWidth(sidebarWidthCache);
      panelWidthRef.current = nextWidth;
      setPanelWidth(nextWidth);
    } else {
      promises.push(
        loadStoredWidth().then((storedWidth) => {
          if (cancelled) return;
          const nextWidth = storedWidth ?? PANEL_DEFAULT;
          sidebarWidthCache = nextWidth;
          sidebarWidthLoaded = true;
          panelWidthRef.current = nextWidth;
          setPanelWidth(nextWidth);
          if (!sidebarCollapsedCache) widthAnim.setValue(nextWidth);
        }),
      );
    }

    if (!sidebarCollapsedLoaded) {
      promises.push(
        loadStoredCollapsed().then((stored) => {
          if (cancelled) return;
          const collapsed = stored ?? false;
          sidebarCollapsedCache = collapsed;
          sidebarCollapsedLoaded = true;
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
  }, []);

  // Width is animated on collapse only; dragging drives it imperatively so the
  // panel tracks the pointer without a queued animation per move.
  useEffect(() => {
    if (isResizingRef.current) return;

    if (!isCollapsed) setContentMounted(true);

    Animated.timing(widthAnim, {
      toValue: isCollapsed ? COLLAPSED_WIDTH : panelWidth,
      duration: COLLAPSE_DURATION,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && isCollapsed) setContentMounted(false);
    });
  }, [isCollapsed, panelWidth, widthAnim]);

  const persistWidth = (width: number) => {
    const nextWidth = clampWidth(width);
    sidebarWidthCache = nextWidth;
    sidebarWidthLoaded = true;
    panelWidthRef.current = nextWidth;
    void saveStoredWidth(nextWidth);
  };

  const panelResizer = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isCollapsed,
      onMoveShouldSetPanResponder: () => !isCollapsed,
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
          Math.min(PANEL_MAX, panelStartRef.current - gs.dx),
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
    setIsCollapsed((prev) => {
      const next = !prev;
      sidebarCollapsedCache = next;
      void saveStoredCollapsed(next);
      return next;
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: widthAnim,
          borderLeftColor: isCollapsed ? "transparent" : sidebarBorder,
        },
      ]}
    >
      <View style={styles.clip}>
        {contentMounted && (
          <View style={{ width: panelWidth, flex: 1 }}>{children}</View>
        )}
      </View>

      {/* Same control as the left sidebar's, on this panel's own seam. Closed,
          it tucks just inside the window edge instead of hanging off it. */}
      <View
        style={[
          styles.seamToggleWrap,
          {
            left: isCollapsed
              ? -(SEAM_TOGGLE_WIDTH + 8)
              : -SEAM_TOGGLE_WIDTH / 2,
          },
        ]}
        pointerEvents="box-none"
      >
        <SeamToggle
          chevron={isCollapsed ? "left" : "right"}
          onPress={toggleCollapsed}
          label={isCollapsed ? "Open side panel" : "Close side panel"}
        />
      </View>

      {!isCollapsed && (
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
