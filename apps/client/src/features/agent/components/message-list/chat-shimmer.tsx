import { useEffect, useRef } from "react";
import { Animated } from "@/styles/motion";
import { useColorScheme } from "@/hooks/use-color-scheme";
function ShimmerBar({
  width,
  delay = 0
}: {
  width: `${number}%`;
  delay?: number;
}) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([Animated.timing(opacity, {
      toValue: 0.7,
      duration: 800,
      delay,
      useNativeDriver: true
    }), Animated.timing(opacity, {
      toValue: 0.3,
      duration: 800,
      useNativeDriver: true
    })]));
    animation.start();
    return () => animation.stop();
  }, [delay, opacity]);
  return <div className={"  w-0 opacity-100"} />;
}
function UserShimmer() {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  return <div className={"block"}>
      <div>
        <ShimmerBar width="100%" delay={0} />
      </div>
    </div>;
}
function AssistantShimmer({
  lines
}: {
  lines: `${number}%`[];
}) {
  return <div className={"block"}>
      <div className={"block"}>
        {lines.map((w, i) => <ShimmerBar key={i} width={w} delay={i * 80} />)}
      </div>
    </div>;
}
export function ChatShimmer() {
  return <div className={"block"}>
      <UserShimmer />
      <AssistantShimmer lines={["92%", "100%", "78%", "55%"]} />
      <UserShimmer />
      <AssistantShimmer lines={["88%", "95%", "60%"]} />
    </div>;
}
const styles = {
  container: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 12,
    gap: 6,
    maxWidth: 1080,
    alignSelf: "center",
    width: "100%"
  },
  userRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 6,
    paddingBottom: 6
  },
  userBubble: {
    width: "40%",
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 14,
    paddingBottom: 14,
    borderRadius: 16,
    borderTopRightRadius: 4
  },
  assistantRow: {
    paddingTop: 8,
    paddingBottom: 4,
    paddingLeft: 16,
    paddingRight: 16
  },
  assistantBody: {
    gap: 10
  },
  bar: {
    height: 14,
    borderRadius: 7
  }
} as const;
