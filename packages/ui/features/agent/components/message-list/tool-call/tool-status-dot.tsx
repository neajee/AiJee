import { Spinner, View } from 'tamagui';
import { memo, useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import type { ToolCallInfo } from "../../../types";

interface ToolStatusDotProps {
  status: ToolCallInfo["status"];
  size?: number;
}

export const ToolStatusDot = memo(function ToolStatusDot({
  status,
  size = 6,
}: ToolStatusDotProps) {
  const isActive = status === "streaming" || status === "pending" || status === "running";

  if (status === "running") {
    return (
      <View style={{ width: size + 6, height: size + 6, alignItems: "center", justifyContent: "center" }}>
        <Spinner size="small" color="#999" style={{ width: size + 4, height: size + 4 }} />
      </View>
    );
  }

  if (!isActive) return null;

  return <PulseDot size={size} />;
});

function PulseDot({ size }: { size: number }) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) }),
        withTiming(0.4, { duration: 500, easing: Easing.in(Easing.ease) }),
      ),
      -1,
    );
  }, [opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#999",
        },
        style,
      ]}
    />
  );
}
