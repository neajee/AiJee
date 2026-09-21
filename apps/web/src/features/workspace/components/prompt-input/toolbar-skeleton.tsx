import { useEffect, useRef } from "react";
import { Animated } from "@/styles/motion";
import { TOOLBAR_ANDROID_MARGIN_TOP, TOOLBAR_BORDER_WIDTH, TOOLBAR_CONTROL_HEIGHT, TOOLBAR_CORNER_RADIUS, TOOLBAR_HORIZONTAL_MARGIN, TOOLBAR_MODE_TOGGLE_HEIGHT, TOOLBAR_VERTICAL_PADDING, TOOLBAR_WRAP_OFFSET } from "../../utils/toolbar-styles";
export function ToolbarSkeleton({
  isDark,
  inline = false
}: {
  isDark: boolean;
  /**
   * Inline skeletons stand in for the controls inside the input card's action
   * row, so they carry no strip chrome and match the 32px control height.
   */
  inline?: boolean;
}) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([Animated.timing(opacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true
    }), Animated.timing(opacity, {
      toValue: 0.4,
      duration: 800,
      useNativeDriver: true
    })]));
    animation.start();
    return () => animation.stop();
  }, [opacity]);
  const fill = isDark ? "#2A2A28" : "#E2E2DF";
  const bg = isDark ? "#1a1a1a" : "#F6F6F6";
  const border = isDark ? "#3b3a39" : "rgba(0,0,0,0.12)";
  if (inline) {
    return <div className={"  opacity-100"}>
        <div />
        <div />
      </div>;
  }
  return <div className="flex flex-col">
      <div>
        <div className={"  opacity-100"}>
          <div />
          <div />
        </div>
      </div>
    </div>;
}