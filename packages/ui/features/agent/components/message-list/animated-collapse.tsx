import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { View } from "tamagui";
import type { LayoutChangeEvent } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface AnimatedCollapseProps {
  expanded: boolean;
  maxHeight?: number;
  children: ReactNode;
}

export function AnimatedCollapse({
  expanded,
  maxHeight,
  children,
}: AnimatedCollapseProps) {
  const [mounted, setMounted] = useState(expanded);
  // Once an unbounded collapse finishes opening it hands height back to the
  // layout, so content that keeps growing (streaming text) is not re-animated
  // on every chunk.
  const [settled, setSettled] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const height = useSharedValue(0);
  const opacity = useSharedValue(expanded ? 1 : 0);

  const targetHeight = useMemo(() => {
    if (!contentHeight) return 0;
    return maxHeight ? Math.min(contentHeight, maxHeight) : contentHeight;
  }, [contentHeight, maxHeight]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;
    setContentHeight((prev) => (Math.abs(prev - nextHeight) < 1 ? prev : nextHeight));
  }, []);

  useEffect(() => {
    if (expanded) setMounted(true);
  }, [expanded]);

  useEffect(() => {
    if (!mounted) return;

    if (expanded) {
      if (settled) return;
      height.value = withTiming(
        targetHeight,
        {
          duration: 220,
          easing: Easing.out(Easing.cubic),
        },
        (finished) => {
          if (finished && !maxHeight) runOnJS(setSettled)(true);
        },
      );
      opacity.value = withTiming(1, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
      });
      return;
    }

    setSettled(false);
    height.value = targetHeight;
    height.value = withTiming(0, {
      duration: 280,
      easing: Easing.inOut(Easing.cubic),
    }, (finished) => {
      if (finished) runOnJS(setMounted)(false);
    });
    opacity.value = withTiming(0, {
      duration: 200,
      easing: Easing.in(Easing.cubic),
    });
  }, [expanded, mounted, settled, maxHeight, targetHeight, height, opacity]);

  const style = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
  }));

  if (!mounted) return null;

  // Reanimated cannot reliably clear an animated height on RN Web. Once the
  // opening motion has finished, hand the subtree back to a normal View so
  // nested disclosures grow the parent layout instead of being clipped.
  if (expanded && settled) {
    return (
      <View style={styles.container}>
        <View onLayout={handleLayout} style={styles.content}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, style]}>
      <View onLayout={handleLayout} style={styles.content}>
        {children}
      </View>
    </Animated.View>
  );
}

const styles = {
  container: {
    overflow: "hidden",
  },
  content: {
    width: "100%",
  },
} as const;
