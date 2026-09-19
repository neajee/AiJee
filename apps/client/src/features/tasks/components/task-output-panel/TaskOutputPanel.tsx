import { useEffect, useRef, useCallback, useState } from 'react';
import { PanResponder } from "@/platform/animation";
import { X, Circle, Minus, Maximize2 } from 'lucide-react';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTasksStore } from '../../store';
import { useTaskOutputData } from '../../hooks/use-task-output-data';
import { styles } from './style-tokens';
export function TaskOutputPanel() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const textPrimary = isDark ? '#fefdfd' : colors.text;
  const textMuted = isDark ? '#cdc8c5' : colors.textTertiary;
  const borderColor = isDark ? '#3b3a39' : 'rgba(0,0,0,0.12)';
  const logBg = isDark ? '#1a1a1a' : '#F5F5F5';
  const handleBg = isDark ? '#444' : '#ccc';
  const outputPanelVisible = useTasksStore(s => s.outputPanelVisible);
  const outputPanelHeight = useTasksStore(s => s.outputPanelHeight);
  const setOutputPanelHeight = useTasksStore(s => s.setOutputPanelHeight);
  const setOutputPanelVisible = useTasksStore(s => s.setOutputPanelVisible);
  const {
    selectedTaskId,
    selectedInstance,
    selectedLogs,
    logsById
  } = useTaskOutputData();
  const [minimized, setMinimized] = useState(false);
  const logScrollRef = useRef<HTMLDivElement>(null);
  const startHeightRef = useRef(outputPanelHeight);
  useEffect(() => {
    if (selectedTaskId && logScrollRef.current && !minimized) {
      setTimeout(() => logScrollRef.current?.scrollToEnd({
        animated: false
      }), 50);
    }
  }, [selectedTaskId, logsById, minimized]);
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      startHeightRef.current = useTasksStore.getState().outputPanelHeight;
      if (true) {
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
      }
    },
    onPanResponderMove: (_e, gestureState) => {
      const newHeight = startHeightRef.current - gestureState.dy;
      setOutputPanelHeight(newHeight);
    },
    onPanResponderRelease: () => {
      if (true) {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    },
    onPanResponderTerminate: () => {
      if (true) {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    }
  })).current;
  const handleClose = useCallback(() => {
    setOutputPanelVisible(false);
    setMinimized(false);
  }, [setOutputPanelVisible]);
  const handleToggleMinimize = useCallback(() => {
    setMinimized(v => !v);
  }, []);
  if (!outputPanelVisible) return null;
  const statusColor = selectedInstance?.status === 'running' ? '#34C759' : selectedInstance?.status === 'failed' ? '#FF3B30' : '#8E8E93';
  if (minimized) {
    return <div style={[styles.minimizedContainer, {
      borderTopColor: borderColor
    }]}>
        <button onClick={handleToggleMinimize} style={styles.minimizedHeader}>
          <div style={styles.headerLeft}>
            {selectedInstance && <>
                <Circle size={8} color={statusColor} fill={statusColor} strokeWidth={0} />
                <span style={[styles.headerLabel, {
              color: textPrimary
            }]}>
                  {selectedInstance.label}
                </span>
              </>}
            {!selectedInstance && <span style={[styles.headerLabel, {
            color: textMuted
          }]}>
                No task selected
              </span>}
          </div>
          <div style={styles.headerActions}>
            <button onClick={handleToggleMinimize} style={styles.actionBtn} aria-label="Maximize panel">
              <Maximize2 size={12} color={textMuted} strokeWidth={2} />
            </button>
            <button onClick={handleClose} style={styles.actionBtn} aria-label="Close panel">
              <X size={12} color={textMuted} strokeWidth={2} />
            </button>
          </div>
        </button>
      </div>;
  }
  return <div style={[styles.container, {
    height: outputPanelHeight,
    borderTopColor: borderColor
  }]}>
      <div {...panResponder.panHandlers} style={styles.dragHandle}>
        <div style={[styles.dragBar, {
        backgroundColor: handleBg
      }]} />
      </div>

      <div style={[styles.header, {
      borderBottomColor: borderColor
    }]}>
        <div style={styles.headerLeft}>
          {selectedInstance && <>
              <Circle size={8} color={statusColor} fill={statusColor} strokeWidth={0} />
              <span style={[styles.headerLabel, {
            color: textPrimary
          }]}>
                {selectedInstance.label}
              </span>
              <span style={[styles.headerCmd, {
            color: textMuted
          }]}>
                {selectedInstance.command}
              </span>
            </>}
          {!selectedInstance && <span style={[styles.headerLabel, {
          color: textMuted
        }]}>
              No task selected
            </span>}
        </div>
        <div style={styles.headerActions}>
          <button onClick={handleToggleMinimize} style={styles.actionBtn} aria-label="Minimize panel">
            <Minus size={12} color={textMuted} strokeWidth={2} />
          </button>
          <button onClick={handleClose} style={styles.actionBtn} aria-label="Close panel">
            <X size={12} color={textMuted} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div ref={logScrollRef} style={[styles.logContent, {
      backgroundColor: logBg
    }]}>
        {selectedLogs.length === 0 ? <span style={[styles.logLine, {
        color: textMuted
      }]}>
            {selectedInstance ? 'No output yet...' : 'Select a running task to view output'}
          </span> : selectedLogs.map((line, i) => <span key={i} style={[styles.logLine, {
        color: textPrimary
      }]} selectable>
              {line}
            </span>)}
      </div>
    </div>;
}
