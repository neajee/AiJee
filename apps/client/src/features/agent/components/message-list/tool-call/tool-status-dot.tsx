import { toTailwind } from "@/styles/to-tailwind";
import { memo, useEffect } from "react";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from "@/platform/animation";
import type { ToolCallInfo } from "../agent-types";
interface ToolStatusDotProps {
  status: ToolCallInfo["status"];
  size?: number;
}
export const ToolStatusDot = memo(function ToolStatusDot({
  status,
  size = 6
}: ToolStatusDotProps) {
  const isActive = status === "streaming" || status === "pending" || status === "running";
  if (status === "running") {
    return <div className={toTailwind({
      width: size + 6,
      height: size + 6,
      alignItems: "center",
      justifyContent: "center"
    })}>
        <span size="small" color="#999" className={toTailwind({
        width: size + 4,
        height: size + 4
      })} />
      </div>;
  }
  if (!isActive) return null;
  return <PulseDot size={size} />;
});
function PulseDot({
  size
}: {
  size: number;
}) {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(withSequence(withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.ease)
    }), withTiming(0.4, {
      duration: 500,
      easing: Easing.in(Easing.ease)
    })), -1);
  }, [opacity]);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value
  }));
  return <div className={toTailwind([{
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: "#999"
  }, style])} />;
}
