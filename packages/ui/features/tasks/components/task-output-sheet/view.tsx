import { useCallback, useEffect, useRef } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Circle, X } from 'lucide-react-native';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTaskOutputData } from '../../hooks/use-task-output-data';
import { styles } from './styles';
import { useSheetHeight } from '@/features/navigation/hooks/use-sheet-height';

const TIMING_CONFIG = { duration: 280, easing: Easing.out(Easing.cubic) };

interface TaskOutputSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function TaskOutputSheet({ visible, onClose }: TaskOutputSheetProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const textPrimary = isDark ? '#fefdfd' : '#1a1a1a';
  const textMuted = isDark ? '#cdc8c5' : colors.textTertiary;
  const borderColor = isDark ? '#3b3a39' : 'rgba(0,0,0,0.12)';
  const logBg = isDark ? '#1a1a1a' : '#F5F5F5';

  const { selectedTaskId, selectedInstance, selectedLogs, logsById } = useTaskOutputData();

  const logScrollRef = useRef<ScrollView>(null);

  // Adapt to the viewport so the sheet never over-covers short screens nor
  // under-covers tall ones (the old fixed 400 px caused the layout anomaly).
  const sheetHeight = useSheetHeight({ fraction: 0.55, min: 320, max: 440 });

  const translateY = useSharedValue(sheetHeight);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, TIMING_CONFIG);
      overlayOpacity.value = withTiming(1, TIMING_CONFIG);
    } else {
      translateY.value = withTiming(sheetHeight, TIMING_CONFIG);
      overlayOpacity.value = withTiming(0, TIMING_CONFIG);
    }
  }, [visible, translateY, overlayOpacity, sheetHeight]);

  useEffect(() => {
    if (selectedTaskId && logScrollRef.current) {
      setTimeout(() => logScrollRef.current?.scrollToEnd({ animated: false }), 50);
    }
  }, [selectedTaskId, logsById]);

  const dismiss = useCallback(() => {
    translateY.value = withTiming(sheetHeight, TIMING_CONFIG);
    overlayOpacity.value = withTiming(0, TIMING_CONFIG, () => {
      runOnJS(onClose)();
    });
  }, [translateY, overlayOpacity, onClose]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 100 || e.velocityY > 500) {
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
    pointerEvents:
      overlayOpacity.value > 0 ? ('auto' as const) : ('none' as const),
  }));

  const statusColor =
    selectedInstance?.status === 'running'
      ? '#34C759'
      : selectedInstance?.status === 'failed'
        ? '#FF3B30'
        : '#8E8E93';

  return (
    <View
      {...(Platform.OS !== 'web'
        ? { pointerEvents: visible ? ('auto' as const) : ('none' as const) }
        : {})}
      style={[
        styles.root,
        Platform.OS === 'web' && ({ pointerEvents: visible ? 'auto' : 'none' } as any),
      ]}
    >
      <Animated.View
        style={[styles.overlay, { backgroundColor: colors.overlay }, overlayStyle]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF',
            paddingBottom: insets.bottom,
            height: sheetHeight,
            maxHeight: sheetHeight,
          },
          sheetStyle,
        ]}
      >
        <GestureDetector gesture={panGesture}>
          <View style={styles.handleBar}>
            <View style={[styles.handle, { backgroundColor: colors.sheetHandle }]} />
          </View>
        </GestureDetector>

        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <View style={styles.headerLeft}>
            {selectedInstance ? (
              <>
                <Circle size={8} color={statusColor} fill={statusColor} strokeWidth={0} />
                <Text style={[styles.headerLabel, { color: textPrimary }]} numberOfLines={1}>
                  {selectedInstance.label}
                </Text>
                <Text style={[styles.headerCmd, { color: textMuted }]} numberOfLines={1}>
                  {selectedInstance.command}
                </Text>
              </>
            ) : (
              <Text style={[styles.headerLabel, { color: textMuted }]}>Task Output</Text>
            )}
          </View>
          <Pressable onPress={dismiss} style={styles.closeBtn}>
            <X size={14} color={textMuted} strokeWidth={2} />
          </Pressable>
        </View>

        <ScrollView
          ref={logScrollRef}
          style={[styles.logContent, { backgroundColor: logBg }]}
          bounces={false}
        >
          {selectedLogs.length === 0 ? (
            <Text style={[styles.logLine, { color: textMuted }]}>
              {selectedInstance ? 'No output yet...' : 'Select a running task to view output'}
            </Text>
          ) : (
            selectedLogs.map((line, i) => (
              <Text key={i} style={[styles.logLine, { color: textPrimary }]} selectable>
                {line}
              </Text>
            ))
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}
