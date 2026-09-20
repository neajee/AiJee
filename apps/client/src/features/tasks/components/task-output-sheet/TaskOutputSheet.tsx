import { useCallback, useEffect, useRef } from 'react';
import { useSafeAreaInsets } from "@/platform/browser";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "@/platform/animation";
import { Gesture } from "@/platform/animation";
import { Circle, X } from 'lucide-react';
import { Colors, Fonts } from '@/constants/theme';
import { ABSOLUTE_FILL_STYLE } from '@/constants/layout';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTaskOutputData } from '../../hooks/use-task-output-data';
import { useSheetHeight } from '@/features/navigation/hooks/use-sheet-height';
const TIMING_CONFIG = {
  duration: 280,
  easing: Easing.out(Easing.cubic)
};
interface TaskOutputSheetProps {
  visible: boolean;
  onClose: () => void;
}
export function TaskOutputSheet({
  visible,
  onClose
}: TaskOutputSheetProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const textPrimary = isDark ? '#fefdfd' : '#1a1a1a';
  const textMuted = isDark ? '#cdc8c5' : colors.textTertiary;
  const borderColor = isDark ? '#3b3a39' : 'rgba(0,0,0,0.12)';
  const logBg = isDark ? '#1a1a1a' : '#F5F5F5';
  const {
    selectedTaskId,
    selectedInstance,
    selectedLogs,
    logsById
  } = useTaskOutputData();
  const logScrollRef = useRef<HTMLDivElement>(null);

  // Adapt to the viewport so the sheet never over-covers short screens nor
  // under-covers tall ones (the old fixed 400 px caused the layout anomaly).
  const sheetHeight = useSheetHeight({
    fraction: 0.55,
    min: 320,
    max: 440
  });
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
      setTimeout(() => logScrollRef.current?.scrollToEnd({
        animated: false
      }), 50);
    }
  }, [selectedTaskId, logsById]);
  const dismiss = useCallback(() => {
    translateY.value = withTiming(sheetHeight, TIMING_CONFIG);
    overlayOpacity.value = withTiming(0, TIMING_CONFIG, () => {
      runOnJS(onClose)();
    });
  }, [translateY, overlayOpacity, onClose]);
  const panGesture = Gesture.Pan().onUpdate(e => {
    if (e.translationY > 0) {
      translateY.value = e.translationY;
    }
  }).onEnd(e => {
    if (e.translationY > 100 || e.velocityY > 500) {
      runOnJS(dismiss)();
    } else {
      translateY.value = withTiming(0, TIMING_CONFIG);
    }
  });
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{
      translateY: translateY.value
    }]
  }));
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    pointerEvents: overlayOpacity.value > 0 ? 'auto' as const : 'none' as const
  }));
  const statusColor = selectedInstance?.status === 'running' ? '#34C759' : selectedInstance?.status === 'failed' ? '#FF3B30' : '#8E8E93';
  return <div {...false ? {
    pointerEvents: visible ? 'auto' as const : 'none' as const
  } : {}} className={"" + " " + (true ? "" : "")}>
      <div className={"" + " " + "" + " " + ""}>
        <button className={""} onClick={dismiss} />
      </div>

      <div className={"" + " " + "pb-[bottom] h-[0] max-h-[0]" + " " + ""}>
        <div>
          <div className={""}>
            <div className={"" + " " + ""} />
          </div>
        </div>

        <div className={"" + " " + ""}>
          <div className={""}>
            {selectedInstance ? <>
                <Circle size={8} color={statusColor} fill={statusColor} strokeWidth={0} />
                <span className={"" + " " + ""}>
                  {selectedInstance.label}
                </span>
                <span className={"" + " " + ""}>
                  {selectedInstance.command}
                </span>
              </> : <span className={"" + " " + ""}>Task Output</span>}
          </div>
          <button onClick={dismiss} className={""}>
            <X size={14} color={textMuted} strokeWidth={2} />
          </button>
        </div>

        <div ref={logScrollRef} className={"" + " " + ""}>
          {selectedLogs.length === 0 ? <span className={"" + " " + ""}>
              {selectedInstance ? 'No output yet...' : 'Select a running task to view output'}
            </span> : selectedLogs.map((line, i) => <span key={i} className={"" + " " + ""} selectable>
                {line}
              </span>)}
        </div>
      </div>
    </div>;
}
