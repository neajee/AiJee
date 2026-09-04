import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  useWindowDimensions,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { usePanelCoordination } from '@/features/navigation/store/panel-coordination';
import { useWorkspaceStore } from '@/features/workspace/store';
import { useGitStatus } from '@aijee/client-sdk';
import type { WorkspacePaneTab } from './workspace-pane-context';
import {
  COLLAPSED_WIDTH,
  COLLAPSE_DURATION,
  DEFAULT_SCOPE,
  PANEL_DEFAULT,
  PANEL_MAX,
  PANEL_MAX_FRACTION,
  PANEL_MIN,
  SIDEBAR_COLLAPSED_KEY,
  SIDEBAR_WIDTH_KEY,
  clampWidth,
  getScope,
  parseStoredWidth,
  scopedKey,
} from '../utils/workspace-sidebar';
import type { WorkspaceSidebarProps } from '../components/workspace-sidebar/types';

async function loadStoredWidth(scope: string) {
  const key = scopedKey(SIDEBAR_WIDTH_KEY, scope);
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') return null;
      return parseStoredWidth(localStorage.getItem(key));
    }
    return parseStoredWidth(await SecureStore.getItemAsync(key));
  } catch {
    return null;
  }
}

async function saveStoredWidth(width: number, scope: string) {
  const key = scopedKey(SIDEBAR_WIDTH_KEY, scope);
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(key, String(clampWidth(width)));
      return;
    }
    await SecureStore.setItemAsync(key, String(clampWidth(width)));
  } catch {}
}

async function loadStoredCollapsed(scope: string): Promise<boolean | null> {
  const key = scopedKey(SIDEBAR_COLLAPSED_KEY, scope);
  try {
    const value = Platform.OS === 'web'
      ? typeof localStorage === 'undefined' ? null : localStorage.getItem(key)
      : await SecureStore.getItemAsync(key);
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
  } catch {
    return null;
  }
}

async function saveStoredCollapsed(collapsed: boolean, scope: string) {
  const key = scopedKey(SIDEBAR_COLLAPSED_KEY, scope);
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(key, String(collapsed));
      return;
    }
    await SecureStore.setItemAsync(key, String(collapsed));
  } catch {}
}

export function useWorkspaceSidebarController({
  storageScope = DEFAULT_SCOPE,
  defaultCollapsed = false,
  locked = false,
}: Omit<WorkspaceSidebarProps, 'children'>) {
  const workspace = useWorkspaceStore((s) =>
    s.workspaces.find((w) => w.id === s.selectedWorkspaceId),
  );
  const { isGitRepo } = useGitStatus(workspace?.path ?? null);
  const scope = getScope(storageScope, defaultCollapsed);
  const { width: windowWidth } = useWindowDimensions();
  const maxWidth = Math.max(PANEL_MIN, Math.min(PANEL_MAX, Math.round(windowWidth * PANEL_MAX_FRACTION)));
  const maxWidthRef = useRef(maxWidth);
  maxWidthRef.current = maxWidth;
  const [isCollapsed, setIsCollapsed] = useState(scope.collapsed);
  const collapsed = locked ? true : isCollapsed;
  const [isResizing, setIsResizing] = useState(false);
  const [isSeamHovered, setIsSeamHovered] = useState(false);
  const [panelWidth, setPanelWidth] = useState(scope.width);
  const panelWidthRef = useRef(scope.width);
  const panelStartRef = useRef(scope.width);
  const isResizingRef = useRef(false);
  const widthAnim = useRef(
    new Animated.Value(locked ? 0 : scope.collapsed ? COLLAPSED_WIDTH : scope.width),
  ).current;
  const [contentMounted, setContentMounted] = useState(locked ? false : !scope.collapsed);
  const [paneRequest, setPaneRequest] = useState<{ tab: WorkspacePaneTab; revision: number } | null>(null);
  const [activePaneTab, setActivePaneTab] = useState<WorkspacePaneTab>('git');
  const openedSide = usePanelCoordination((state) => state.openedSide);
  const panelRevision = usePanelCoordination((state) => state.revision);
  const notifyPanelOpened = usePanelCoordination((state) => state.notifyOpened);

  const updateCollapsed = (next: boolean) => {
    scope.collapsed = next;
    scope.collapsedLoaded = true;
    setIsCollapsed(next);
    void saveStoredCollapsed(next, storageScope);
  };

  useEffect(() => {
    if (locked || panelRevision === 0 || openedSide !== 'left') return;
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
          const nextCollapsed = stored ?? defaultCollapsed;
          scope.collapsed = nextCollapsed;
          scope.collapsedLoaded = true;
          setIsCollapsed(nextCollapsed);
        }),
      );
    }
    if (promises.length > 0) void Promise.all(promises);
    return () => {
      cancelled = true;
    };
  }, [defaultCollapsed, scope, storageScope, widthAnim]);

  useEffect(() => {
    if (isResizingRef.current) return;
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
        if (Platform.OS === 'web') {
          document.body.style.cursor = 'col-resize';
          document.body.style.userSelect = 'none';
        }
      },
      onPanResponderMove: (_event, gestureState) => {
        const nextWidth = Math.max(PANEL_MIN, Math.min(maxWidthRef.current, panelStartRef.current - gestureState.dx));
        panelWidthRef.current = nextWidth;
        widthAnim.setValue(nextWidth);
        setPanelWidth(nextWidth);
      },
      onPanResponderRelease: () => {
        isResizingRef.current = false;
        setIsResizing(false);
        persistWidth(panelWidthRef.current);
        if (Platform.OS === 'web') {
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        }
      },
      onPanResponderTerminate: () => {
        isResizingRef.current = false;
        setIsResizing(false);
        persistWidth(panelWidthRef.current);
        if (Platform.OS === 'web') {
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        }
      },
    }),
  ).current;

  const seamActive = isSeamHovered || isResizing;
  const webSeamHoverProps = Platform.OS === 'web'
    ? {
        onMouseEnter: () => setIsSeamHovered(true),
        onMouseLeave: () => setIsSeamHovered(false),
      }
    : {};

  const toggleCollapsed = () => {
    if (locked) return;
    const next = !isCollapsed;
    updateCollapsed(next);
    if (!next) notifyPanelOpened('right');
  };

  const openPane = (tab: WorkspacePaneTab) => {
    if (!collapsed && activePaneTab === tab) {
      updateCollapsed(true);
      return;
    }
    setActivePaneTab(tab);
    setPaneRequest((current) => ({ tab, revision: (current?.revision ?? 0) + 1 }));
    updateCollapsed(false);
    notifyPanelOpened('right');
  };

  return {
    collapsed,
    contentMounted,
    panelWidth,
    isResizing,
    seamActive,
    isGitRepo,
    activePaneTab,
    setActivePaneTab,
    paneRequest,
    panelResizer,
    webSeamHoverProps,
    toggleCollapsed,
    openPane,
    isDesktopShell: Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.userAgent.includes('AiJeeDesktop/'),
    widthAnim,
  };
}
