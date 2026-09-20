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
  return <div className={"block"}>
      <div>
        <div className={"  opacity-100"}>
          <div />
          <div />
        </div>
      </div>
    </div>;
}
const styles = {
  wrap: {
    marginTop: -TOOLBAR_WRAP_OFFSET,
    paddingTop: TOOLBAR_WRAP_OFFSET,
    marginLeft: TOOLBAR_HORIZONTAL_MARGIN,
    marginRight: TOOLBAR_HORIZONTAL_MARGIN
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 4,
    paddingRight: 4,
    paddingTop: TOOLBAR_VERTICAL_PADDING,
    paddingBottom: TOOLBAR_VERTICAL_PADDING,
    borderWidth: TOOLBAR_BORDER_WIDTH,
    borderTopWidth: 0,
    borderBottomLeftRadius: TOOLBAR_CORNER_RADIUS,
    borderBottomRightRadius: TOOLBAR_CORNER_RADIUS,
    marginTop: TOOLBAR_ANDROID_MARGIN_TOP
  },
  track: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 4,
    paddingRight: 4,
    minHeight: TOOLBAR_MODE_TOGGLE_HEIGHT
  },
  pill: {
    height: TOOLBAR_CONTROL_HEIGHT,
    borderRadius: 6
  },
  inlineTrack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 4,
    paddingRight: 4
  },
  inlinePill: {
    height: 32,
    borderRadius: 6
  },
  pillWide: {
    width: 148
  },
  pillNarrow: {
    width: 92
  }
} as const;
