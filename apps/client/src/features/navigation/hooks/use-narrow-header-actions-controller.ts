import { useCallback, useEffect } from 'react';
import { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "@/components/dom";
import { Gesture } from "@/components/dom";
import { useSafeAreaInsets } from "@/components/dom";
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { NARROW_HEADER_ACTIONS_SHEET_HEIGHT } from '../utils/narrow-header-actions';
import type { NarrowHeaderActionsSheetProps, NarrowHeaderActionsSheetViewProps } from '../components/narrow-header-actions-sheet/types';

const TIMING_CONFIG = { duration: 280, easing: Easing.out(Easing.cubic) };

export function useNarrowHeaderActionsController({ visible, onClose, items }: NarrowHeaderActionsSheetProps): NarrowHeaderActionsSheetViewProps {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = useThemeTokens();
  const isDark = colorScheme === 'dark';
  const textPrimary = isDark ? '#fefdfd' : colors.text;
  const textSecondary = isDark ? '#a9a29f' : '#6f6a66';
  const rowBorder = isDark ? '#2f2d2c' : 'rgba(0,0,0,0.07)';
  const translateY = useSharedValue(NARROW_HEADER_ACTIONS_SHEET_HEIGHT);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, TIMING_CONFIG);
      overlayOpacity.value = withTiming(1, TIMING_CONFIG);
    } else {
      translateY.value = withTiming(NARROW_HEADER_ACTIONS_SHEET_HEIGHT, TIMING_CONFIG);
      overlayOpacity.value = withTiming(0, TIMING_CONFIG);
    }
  }, [overlayOpacity, translateY, visible]);

  const dismiss = useCallback(() => {
    translateY.value = withTiming(NARROW_HEADER_ACTIONS_SHEET_HEIGHT, TIMING_CONFIG);
    overlayOpacity.value = withTiming(0, TIMING_CONFIG, () => runOnJS(onClose)());
  }, [onClose, overlayOpacity, translateY]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) runOnJS(dismiss)();
      else translateY.value = withTiming(0, TIMING_CONFIG);
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    pointerEvents: overlayOpacity.value > 0 ? ('auto' as const) : ('none' as const),
  }));

  return {
    visible,
    items,
    bottomInset: insets.bottom,
    isDark,
    textPrimary,
    textSecondary,
    rowBorder,
    overlayColor: colors.overlay,
    handleColor: colors.sheetHandle,
    sheetStyle,
    overlayStyle,
    panGesture,
    onDismiss: dismiss,
  };
}
