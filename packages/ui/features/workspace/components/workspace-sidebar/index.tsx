import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { PanelRight, PanelRightClose } from "lucide-react-native";
import * as SecureStore from "expo-secure-store";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const PANEL_DEFAULT = 280;
const PANEL_MIN = 180;
const PANEL_MAX = 480;
/** Rail left behind when the panel is closed — room for the toggle only. */
const COLLAPSED_WIDTH = 32;
/** Invisible grab strip straddling the panel seam, bolt-style. */
const SEAM_HIT_WIDTH = 12;
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
  const buttonHoverBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const iconColor = colors.textSecondary;
  const iconHoverColor = colors.text;

  const [isCollapsed, setIsCollapsed] = useState(sidebarCollapsedCache);
  const [isResizing, setIsResizing] = useState(false);
  const [isSeamHovered, setIsSeamHovered] = useState(false);
  const [isToggleHovered, setIsToggleHovered] = useState(false);
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

  const webToggleHoverProps =
    Platform.OS === "web"
      ? {
          onMouseEnter: () => setIsToggleHovered(true),
          onMouseLeave: () => setIsToggleHovered(false),
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

      {/* Toggle sits in the pane's own 44px header row, flush right. */}
      <Pressable
        onPress={toggleCollapsed}
        accessibilityRole="button"
        accessibilityLabel={isCollapsed ? "Open side panel" : "Close side panel"}
        {...{ title: isCollapsed ? "Open side panel" : "Close side panel" }}
        {...webToggleHoverProps}
        hitSlop={4}
        style={({ pressed }: any) => [
          styles.toggleButton,
          isCollapsed ? styles.toggleCollapsed : styles.toggleExpanded,
          (isToggleHovered || pressed) && { backgroundColor: buttonHoverBg },
        ]}
      >
        {isCollapsed ? (
          <PanelRight
            size={16}
            color={isToggleHovered ? iconHoverColor : iconColor}
            strokeWidth={1.75}
          />
        ) : (
          <PanelRightClose
            size={16}
            color={isToggleHovered ? iconHoverColor : iconColor}
            strokeWidth={1.75}
          />
        )}
      </Pressable>

      {!isCollapsed && (
        <View
          {...panelResizer.panHandlers}
          {...webSeamHoverProps}
          style={[
            styles.seam,
            {
              backgroundColor: seamActive
                ? isResizing
                  ? seamDragTint
                  : seamTint
                : "transparent",
            },
          ]}
        />
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
    zIndex: 20,
    cursor: "col-resize",
  } as any,
  toggleButton: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 21,
    cursor: "pointer",
  } as any,
  toggleExpanded: {
    top: 10,
    right: 8,
  },
  toggleCollapsed: {
    top: 10,
    left: (COLLAPSED_WIDTH - 24) / 2,
  },
});
