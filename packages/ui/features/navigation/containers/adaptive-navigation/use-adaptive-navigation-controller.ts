import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform } from 'react-native';
import { usePathname } from 'expo-router';

import { useResponsiveLayout } from '../../hooks/use-responsive-layout';
import { useAuthStore } from '@/features/auth/store';
import { useWorkspaceStore } from '@/features/workspace/store';
import { useAppMode } from '@/hooks/use-app-mode';
import { usePanelCoordination } from '../../store/panel-coordination';

const SIDEBAR_DEFAULT = 280;

export function useAdaptiveNavigationController() {
  const { isWideScreen } = useResponsiveLayout();
  const activeServerId = useAuthStore((s) => s.activeServerId);
  const hasServer = Boolean(activeServerId);
  const hasWorkspaces = useWorkspaceStore((s) => s.workspaces.length > 0);
  const appMode = useAppMode();
  const isCodeMode = appMode === 'code';
  const [sheetVisible, setSheetVisible] = useState(false);
  const [changesSheetVisible, setChangesSheetVisible] = useState(false);
  const [filesSheetVisible, setFilesSheetVisible] = useState(false);
  const [previewSheetVisible, setPreviewSheetVisible] = useState(false);
  const [tasksSheetVisible, setTasksSheetVisible] = useState(false);
  const [taskOutputSheetVisible, setTaskOutputSheetVisible] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<'persistent' | 'hover'>('persistent');
  const [hoverVisible, setHoverVisible] = useState(false);
  const [showPersistentSidebar, setShowPersistentSidebar] = useState(true);
  const openedSide = usePanelCoordination((state) => state.openedSide);
  const panelRevision = usePanelCoordination((state) => state.revision);
  const notifyPanelOpened = usePanelCoordination((state) => state.notifyOpened);
  const persistentAnim = useRef(new Animated.Value(1)).current;
  const hoverAnim = useRef(new Animated.Value(0)).current;
  const isPersistent = sidebarMode === 'persistent';
  const pathname = usePathname();
  const settingsMode = pathname.startsWith('/settings');
  const openSessionId = pathname.match(/^\/workspace\/[^/]+\/s\/([^/]+)$/)?.[1] ?? null;

  useEffect(() => {
    if (isPersistent) setShowPersistentSidebar(true);
    Animated.spring(persistentAnim, {
      toValue: isPersistent ? 1 : 0,
      tension: 180,
      friction: 22,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !isPersistent) setShowPersistentSidebar(false);
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
    setSidebarMode((previous) => {
      if (previous === 'hover') notifyPanelOpened('left');
      return previous === 'persistent' ? 'hover' : 'persistent';
    });
    setHoverVisible(false);
  }, [notifyPanelOpened]);

  useEffect(() => {
    if (panelRevision === 0 || openedSide !== 'right') return;
    setSidebarMode('hover');
    setHoverVisible(false);
  }, [openedSide, panelRevision]);

  const handleHoverZoneIn = useCallback(() => {
    if (!isPersistent) setHoverVisible(true);
  }, [isPersistent]);
  const handleHoverZoneOut = useCallback(() => {
    if (!isPersistent) setHoverVisible(false);
  }, [isPersistent]);

  useEffect(() => {
    if (!settingsMode) return;
    setSidebarMode('persistent');
    setHoverVisible(false);
  }, [settingsMode]);

  const openFiles = useCallback(() => {
    setChangesSheetVisible(false);
    setPreviewSheetVisible(false);
    setFilesSheetVisible(true);
  }, []);
  const openGit = useCallback(() => {
    setFilesSheetVisible(false);
    setPreviewSheetVisible(false);
    setChangesSheetVisible(true);
  }, []);
  const openPreview = useCallback(() => {
    setChangesSheetVisible(false);
    setPreviewSheetVisible(true);
  }, []);

  const animatedSidebarWidth = Animated.multiply(persistentAnim, SIDEBAR_DEFAULT);
  const hoverTranslateX = hoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SIDEBAR_DEFAULT, 0],
  });

  return {
    isWideScreen,
    hasServer,
    hasWorkspaces,
    isCodeMode,
    settingsMode,
    openSessionId,
    sheetVisible,
    setSheetVisible,
    changesSheetVisible,
    setChangesSheetVisible,
    filesSheetVisible,
    setFilesSheetVisible,
    previewSheetVisible,
    setPreviewSheetVisible,
    tasksSheetVisible,
    setTasksSheetVisible,
    taskOutputSheetVisible,
    setTaskOutputSheetVisible,
    isPersistent,
    hoverVisible,
    showPersistentSidebar,
    animatedSidebarWidth,
    hoverAnim,
    hoverTranslateX,
    handleToggleSidebar,
    handleHoverZoneIn,
    handleHoverZoneOut,
    openFiles,
    openGit,
    openPreview,
    isWeb: Platform.OS === 'web',
  };
}
