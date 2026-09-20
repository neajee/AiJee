import { memo, useEffect } from "react";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from "@/styles/motion";
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
    return <div className={"w-0 h-0 items-center justify-center"}>
        <span size="small" color="#999" className={"w-0 h-0"} />
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
  return <div className={"w-0 h-0 rounded-none  "} />;
}
