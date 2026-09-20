import type { ReactNode } from "react";
interface AnimatedCollapseProps {
  expanded: boolean;
  maxHeight?: number;
  children: ReactNode;
}

/**
 * Height-animated disclosure built on CSS grid rows.
 *
 * The previous implementation drove a Reanimated shared value, but the motion
 * runtime here is a stub: `withTiming(value, config, callback)` returns the
 * value and drops the callback, so the collapse never completed and expanded
 * content could not be closed. A `grid-template-rows: 0fr -> 1fr` transition
 * collapses reliably in the DOM and keeps the open/close motion.
 */
export function AnimatedCollapse({
  expanded,
  children
}: AnimatedCollapseProps) {
  return <div className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
      <div className="min-h-0 overflow-hidden" inert={!expanded}>{children}</div>
    </div>;
}
