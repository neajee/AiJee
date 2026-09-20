import { useEffect, useRef } from "react";
import { Animated } from "@/styles/motion";
function ShimmerBar({
  delay = 0
}: {
  width: `${number}%`;
  delay?: number;
}) {
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
  return <div className="flex flex-col">
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
  return <div className="flex flex-col">
      <div className="flex flex-col">
        {lines.map((w, i) => <ShimmerBar key={i} width={w} delay={i * 80} />)}
      </div>
    </div>;
}
export function ChatShimmer() {
  return <div className="flex flex-col">
      <UserShimmer />
      <AssistantShimmer lines={["92%", "100%", "78%", "55%"]} />
      <UserShimmer />
      <AssistantShimmer lines={["88%", "95%", "60%"]} />
    </div>;
}