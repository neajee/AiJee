import { toTailwind } from "@/styles/to-tailwind";
import { useEffect, useRef } from "react";
import { Animated } from "@/platform/animation";
const BAR_COUNT = 5;
const BAR_SCALES = [0.6, 0.85, 1, 0.85, 0.6];
export function WaveformBars({
  audioLevel
}: {
  audioLevel: number;
}) {
  const anims = useRef(Array.from({
    length: BAR_COUNT
  }, () => new Animated.Value(0))).current;
  useEffect(() => {
    anims.forEach((anim, i) => {
      const scale = BAR_SCALES[i];
      const target = Math.max(0.15, audioLevel * scale);
      Animated.timing(anim, {
        toValue: target,
        duration: 80,
        useNativeDriver: false
      }).start();
    });
  }, [anims, audioLevel]);
  return <div className={toTailwind(styles.container)}>
      {anims.map((anim, i) => <div key={i} className={toTailwind([styles.bar, {
      backgroundColor: "#EF4444",
      height: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [3, 18]
      })
    }])} />)}
    </div>;
}
const styles = {
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 18
  },
  bar: {
    width: 3,
    borderRadius: 1.5
  }
} as const;
