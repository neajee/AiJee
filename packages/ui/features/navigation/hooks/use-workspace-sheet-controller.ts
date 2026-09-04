import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';
import PagerView from 'react-native-pager-view';

import { useWorkspaceStore } from '@/features/workspace/store';
import { useSheetHeight } from './use-sheet-height';
import type { WorkspaceSheetProps } from '../components/workspace-sheet/types';

const TIMING_CONFIG = { duration: 280, easing: Easing.out(Easing.cubic) };

export function useWorkspaceSheetController({ visible, onClose }: WorkspaceSheetProps) {
  const router = useRouter();
  const sheetHeight = useSheetHeight({ fraction: 0.78, min: 480, max: 680 });
  const translateY = useSharedValue(sheetHeight);
  const overlayOpacity = useSharedValue(0);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const selectedWorkspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace);
  const getLastSession = useWorkspaceStore((s) => s.getLastSession);
  const pagerRef = useRef<PagerView>(null);
  const stripScrollRef = useRef<ScrollView>(null);
  const selectedIndex = workspaces.findIndex((w) => w.id === selectedWorkspaceId);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, TIMING_CONFIG);
      overlayOpacity.value = withTiming(1, TIMING_CONFIG);
    } else {
      translateY.value = withTiming(sheetHeight, TIMING_CONFIG);
      overlayOpacity.value = withTiming(0, TIMING_CONFIG);
    }
  }, [visible, translateY, overlayOpacity, sheetHeight]);

  const dismiss = useCallback(() => {
    translateY.value = withTiming(sheetHeight, TIMING_CONFIG);
    overlayOpacity.value = withTiming(0, TIMING_CONFIG, () => {
      runOnJS(onClose)();
    });
  }, [onClose, overlayOpacity, sheetHeight, translateY]);

  const scrollStripToIndex = useCallback((index: number) => {
    const itemWidth = 58 + 16;
    const offset = Math.max(0, index * itemWidth - 80);
    stripScrollRef.current?.scrollTo({ x: offset, animated: true });
  }, []);

  const navigateToWorkspace = useCallback(
    (id: string) => {
      const lastSession = getLastSession(id);
      router.replace(lastSession ? `/workspace/${id}/s/${lastSession}` : `/workspace/${id}`);
    },
    [getLastSession, router],
  );

  const handleWorkspacePress = useCallback(
    (id: string, index: number) => {
      selectWorkspace(id);
      navigateToWorkspace(id);
      pagerRef.current?.setPage(index);
      scrollStripToIndex(index);
    },
    [navigateToWorkspace, scrollStripToIndex, selectWorkspace],
  );

  const handlePageSelected = useCallback(
    (index: number) => {
      const workspace = workspaces[index];
      if (workspace && workspace.id !== selectedWorkspaceId) {
        selectWorkspace(workspace.id);
        navigateToWorkspace(workspace.id);
        scrollStripToIndex(index);
      }
    },
    [navigateToWorkspace, scrollStripToIndex, selectWorkspace, selectedWorkspaceId, workspaces],
  );

  const handleAddWorkspace = useCallback(() => {
    dismiss();
    setTimeout(() => setShowNewDialog(true), 300);
  }, [dismiss]);

  const handleServersPress = useCallback(() => {
    router.push('/settings/servers');
    dismiss();
  }, [dismiss, router]);

  const handleSettingsPress = useCallback(() => {
    router.push('/settings');
    dismiss();
  }, [dismiss, router]);

  const panGesture = Gesture.Pan()
    .activeOffsetY(10)
    .onUpdate((event) => {
      if (event.translationY > 0) translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        runOnJS(dismiss)();
      } else {
        translateY.value = withTiming(0, TIMING_CONFIG);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    pointerEvents: overlayOpacity.value > 0 ? ('auto' as const) : ('none' as const),
  }));

  return {
    router,
    sheetHeight,
    showNewDialog,
    setShowNewDialog,
    workspaces,
    selectedWorkspaceId,
    selectedIndex,
    pagerRef,
    stripScrollRef,
    dismiss,
    handleWorkspacePress,
    handlePageSelected,
    handleAddWorkspace,
    handleServersPress,
    handleSettingsPress,
    panGesture,
    sheetStyle,
    overlayStyle,
    isWeb: Platform.OS === 'web',
  };
}
