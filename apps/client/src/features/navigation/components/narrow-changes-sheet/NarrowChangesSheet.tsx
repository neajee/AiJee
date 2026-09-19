import { toTailwind } from "@/styles/to-tailwind";
import { useCallback, useEffect } from "react";
import { useSafeAreaInsets } from "@/platform/browser";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "@/platform/animation";
import { Gesture } from "@/platform/animation";
import { Colors } from "@/constants/theme";
import { ABSOLUTE_FILL_STYLE } from "@/constants/layout";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { ChangesPanel } from "@/features/workspace/components/changes-panel";
import { useSheetHeight } from "../../hooks/use-sheet-height";
const TIMING_CONFIG = {
  duration: 280,
  easing: Easing.out(Easing.cubic)
};
interface NarrowChangesSheetProps {
  visible: boolean;
  onClose: () => void;
}
export function NarrowChangesSheet({
  visible,
  onClose
}: NarrowChangesSheetProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const colors = useThemeTokens();
  const isDark = colorScheme === "dark";

  // Adapt to the viewport so the sheet never over-covers short screens nor
  // under-covers tall ones (the old fixed 520 px caused the layout anomaly).
  const sheetHeight = useSheetHeight({
    fraction: 0.68,
    min: 420,
    max: 560
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
  const dismiss = useCallback(() => {
    translateY.value = withTiming(sheetHeight, TIMING_CONFIG);
    overlayOpacity.value = withTiming(0, TIMING_CONFIG, () => {
      runOnJS(onClose)();
    });
  }, [translateY, overlayOpacity, onClose, sheetHeight]);
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
    pointerEvents: overlayOpacity.value > 0 ? "auto" as const : "none" as const
  }));
  return <div {...false ? {
    pointerEvents: visible ? "auto" as const : "none" as const
  } : {}} className={toTailwind([styles.root, true && {
    pointerEvents: visible ? "auto" : "none"
  } as any])}>
      <div className={toTailwind([styles.overlay, {
      backgroundColor: colors.overlay
    }, overlayStyle])}>
        <button className={toTailwind(ABSOLUTE_FILL_STYLE)} onClick={dismiss} />
      </div>

      <div className={toTailwind([styles.sheet, {
      backgroundColor: isDark ? "#1e1e1e" : "#FFFFFF",
      paddingBottom: insets.bottom,
      height: sheetHeight,
      maxHeight: sheetHeight
    }, sheetStyle])}>
        <div>
          <div className={toTailwind(styles.handleBar)}>
            <div className={toTailwind([styles.handle, {
            backgroundColor: colors.sheetHandle
          }])} />
          </div>
        </div>

        <div className={toTailwind(styles.content)}>
          <ChangesPanel />
        </div>
      </div>
    </div>;
}
const styles = {
  root: {
    ...ABSOLUTE_FILL_STYLE,
    zIndex: 100
  },
  overlay: {
    ...ABSOLUTE_FILL_STYLE
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14
  },
  handleBar: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 10
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2
  },
  content: {
    flex: 1,
    overflow: "hidden"
  }
} as const;
