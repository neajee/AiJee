import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Minus } from "lucide-react-native";

import { useAgentSession } from "@pideck/client-sdk";

const DOT_COUNT = 3;
const DOT_SIZE = 3.5;

interface SessionActivityIndicatorProps {
  sessionId: string;
  color: string;
  /**
   * Draws a dash while the session is idle so lists stay aligned. Off for
   * layouts where the indicator trails the title and absence reads as "idle".
   */
  idlePlaceholder?: boolean;
}

export function SessionActivityIndicator({
  sessionId,
  color,
  idlePlaceholder = true,
}: SessionActivityIndicatorProps) {
  const { isStreaming } = useAgentSession(sessionId);
  // Reduced for every session, not just the one on screen, so a background
  // session mid-turn animates too. "Active" is deliberately not used here: a
  // live process that already answered is idle, and would spin forever.
  const isWorking = isStreaming;
  const dotAnims = useRef(
    Array.from({ length: DOT_COUNT }, () => new Animated.Value(0.35)),
  ).current;

  useEffect(() => {
    if (!isWorking) {
      dotAnims.forEach((anim) => {
        anim.stopAnimation();
        anim.setValue(0.35);
      });
      return;
    }

    const loops = dotAnims.map((anim, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 140),
          Animated.timing(anim, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.35,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.delay((DOT_COUNT - index - 1) * 140),
        ]),
      ),
    );

    loops.forEach((loop) => loop.start());

    return () => {
      loops.forEach((loop) => loop.stop());
      dotAnims.forEach((anim) => anim.stopAnimation());
    };
  }, [dotAnims, isWorking]);

  if (!isWorking) {
    return idlePlaceholder ? (
      <Minus size={14} color={color} strokeWidth={2} />
    ) : null;
  }

  return (
    <View style={styles.row}>
      {dotAnims.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: color,
              opacity: anim,
              transform: [
                {
                  scale: anim.interpolate({
                    inputRange: [0.35, 1],
                    outputRange: [0.75, 1],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: 16,
    height: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
