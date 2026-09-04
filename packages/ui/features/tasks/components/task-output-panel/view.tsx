import { useEffect, useRef, useCallback, useState } from 'react';
import {
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { X, Circle, Minus, Maximize2 } from 'lucide-react-native';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTasksStore } from '../../store';
import { useTaskOutputData } from '../../hooks/use-task-output-data';
import { styles } from './styles';

export function TaskOutputPanel() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const textPrimary = isDark ? '#fefdfd' : colors.text;
  const textMuted = isDark ? '#cdc8c5' : colors.textTertiary;
  const borderColor = isDark ? '#3b3a39' : 'rgba(0,0,0,0.12)';
  const logBg = isDark ? '#1a1a1a' : '#F5F5F5';
  const handleBg = isDark ? '#444' : '#ccc';

  const outputPanelVisible = useTasksStore((s) => s.outputPanelVisible);
  const outputPanelHeight = useTasksStore((s) => s.outputPanelHeight);
  const setOutputPanelHeight = useTasksStore((s) => s.setOutputPanelHeight);
  const setOutputPanelVisible = useTasksStore((s) => s.setOutputPanelVisible);
  const { selectedTaskId, selectedInstance, selectedLogs, logsById } = useTaskOutputData();
  const [minimized, setMinimized] = useState(false);

  const logScrollRef = useRef<ScrollView>(null);
  const startHeightRef = useRef(outputPanelHeight);

  useEffect(() => {
    if (selectedTaskId && logScrollRef.current && !minimized) {
      setTimeout(() => logScrollRef.current?.scrollToEnd({ animated: false }), 50);
    }
  }, [selectedTaskId, logsById, minimized]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startHeightRef.current = useTasksStore.getState().outputPanelHeight;
        if (Platform.OS === 'web') {
          document.body.style.cursor = 'row-resize';
          document.body.style.userSelect = 'none';
        }
      },
      onPanResponderMove: (_e, gestureState) => {
        const newHeight = startHeightRef.current - gestureState.dy;
        setOutputPanelHeight(newHeight);
      },
      onPanResponderRelease: () => {
        if (Platform.OS === 'web') {
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        }
      },
      onPanResponderTerminate: () => {
        if (Platform.OS === 'web') {
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        }
      },
    }),
  ).current;

  const handleClose = useCallback(() => {
    setOutputPanelVisible(false);
    setMinimized(false);
  }, [setOutputPanelVisible]);

  const handleToggleMinimize = useCallback(() => {
    setMinimized((v) => !v);
  }, []);

  if (!outputPanelVisible) return null;

  const statusColor =
    selectedInstance?.status === 'running'
      ? '#34C759'
      : selectedInstance?.status === 'failed'
        ? '#FF3B30'
        : '#8E8E93';

  if (minimized) {
    return (
      <View style={[styles.minimizedContainer, { borderTopColor: borderColor }]}>
        <Pressable onPress={handleToggleMinimize} style={styles.minimizedHeader}>
          <View style={styles.headerLeft}>
            {selectedInstance && (
              <>
                <Circle size={8} color={statusColor} fill={statusColor} strokeWidth={0} />
                <Text style={[styles.headerLabel, { color: textPrimary }]} numberOfLines={1}>
                  {selectedInstance.label}
                </Text>
              </>
            )}
            {!selectedInstance && (
              <Text style={[styles.headerLabel, { color: textMuted }]}>
                No task selected
              </Text>
            )}
          </View>
          <View style={styles.headerActions}>
            <Pressable onPress={handleToggleMinimize} style={styles.actionBtn} accessibilityLabel="Maximize panel">
              <Maximize2 size={12} color={textMuted} strokeWidth={2} />
            </Pressable>
            <Pressable onPress={handleClose} style={styles.actionBtn} accessibilityLabel="Close panel">
              <X size={12} color={textMuted} strokeWidth={2} />
            </Pressable>
          </View>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height: outputPanelHeight, borderTopColor: borderColor }]}>
      <View
        {...panResponder.panHandlers}
        style={styles.dragHandle}
      >
        <View style={[styles.dragBar, { backgroundColor: handleBg }]} />
      </View>

      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <View style={styles.headerLeft}>
          {selectedInstance && (
            <>
              <Circle size={8} color={statusColor} fill={statusColor} strokeWidth={0} />
              <Text style={[styles.headerLabel, { color: textPrimary }]} numberOfLines={1}>
                {selectedInstance.label}
              </Text>
              <Text style={[styles.headerCmd, { color: textMuted }]} numberOfLines={1}>
                {selectedInstance.command}
              </Text>
            </>
          )}
          {!selectedInstance && (
            <Text style={[styles.headerLabel, { color: textMuted }]}>
              No task selected
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={handleToggleMinimize} style={styles.actionBtn} accessibilityLabel="Minimize panel">
            <Minus size={12} color={textMuted} strokeWidth={2} />
          </Pressable>
          <Pressable onPress={handleClose} style={styles.actionBtn} accessibilityLabel="Close panel">
            <X size={12} color={textMuted} strokeWidth={2} />
          </Pressable>
        </View>
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
    </View>
  );
}
