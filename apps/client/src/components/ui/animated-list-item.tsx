import type { ReactNode } from "react";
import Animated, { FadeIn, FadeOut, LinearTransition } from "@/styles/motion";
const ITEM_LAYOUT = LinearTransition.springify().damping(18).stiffness(180).mass(0.7);
export function AnimatedListItem({
  children
}: {
  children: ReactNode;
}) {
  return <div layout={ITEM_LAYOUT}>
      {children}
    </div>;
}
