import { memo, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import Animated, { Easing, useAnimatedStyle, useDerivedValue, withTiming } from "@/styles/motion";
import { Colors } from "@/constants/theme";
import { HAIRLINE_WIDTH } from "@/constants/layout";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { AnimatedCollapse } from "../animated-collapse";

/**
 * Single source of truth for how tall an expanded tool result may get. Bodies
 * cap themselves at this height (usually via their own ScrollView), so the
 * surrounding collapse never needs a second, drifting magic number.
 */
export const TOOL_BODY_MAX_HEIGHT = 260;
const CHEVRON_SIZE = 11;
interface ToolHeaderProps {
  expanded: boolean;
  /** When false the row renders inert: no chevron, no press feedback. */
  expandable: boolean;
  onToggle: () => void;
  isDark: boolean;
  accessibilityLabel: string;
  /** Multi-line headers (subagent) need the chevron pinned to the first line. */
  alignTop?: boolean;
  children: ReactNode;
}

/**
 * The tappable summary line of a tool call. Owns the disclosure affordance so
 * every tool gets the same chevron, touch target and press feedback.
 */
export const ToolHeader = memo(function ToolHeader({
  expanded,
  expandable,
  onToggle,
  isDark,
  accessibilityLabel,
  alignTop = false,
  children
}: ToolHeaderProps) {
  const colors = useThemeTokens();
  const rotate = useDerivedValue(() => withTiming(expanded ? 90 : 0, {
    duration: 180,
    easing: Easing.out(Easing.cubic)
  }), [expanded]);
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{
      rotate: `${rotate.value}deg`
    }]
  }));
  const row = [styles.header, alignTop && styles.headerTop];
  if (!expandable) {
    return <div className="flex flex-col">{children}</div>;
  }
  return <button onClick={onToggle} role="button" aria-label={accessibilityLabel}>
      {children}
      <div>
        <ChevronRight size={CHEVRON_SIZE} color={colors.textTertiary} strokeWidth={2} />
      </div>
    </button>;
});

/**
 * The collapsing region under a tool header. Deliberately has no max height of
 * its own: whatever is inside is responsible for capping itself, which keeps
 * the open/close animation and the scroll cap from fighting each other.
 */
export function ToolBody({
  expanded,
  children
}: {
  expanded: boolean;
  children: ReactNode;
}) {
  return <AnimatedCollapse expanded={expanded}>
      <div className="flex flex-col">{children}</div>
    </AnimatedCollapse>;
}

/**
 * The panel every tool result sits in. Matches CodePreview's surface so a bash
 * transcript, a diff and a subagent log all read as the same kind of object.
 */
export function ToolSurface({
  isDark,
  padded = true,
  children
}: {
  isDark: boolean;
  padded?: boolean;
  children: ReactNode;
}) {
  const colors = useThemeTokens();
  return <div className={"  bg-surface-raised border-border"}>
      {children}
    </div>;
}
const styles = {
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 4,
    paddingBottom: 4
  },
  headerTop: {
    alignItems: "flex-start"
  },
  headerPressed: {
    opacity: 0.6
  },
  chevron: {
    flexShrink: 0
  },
  chevronTop: {
    marginTop: 3
  },
  body: {
    paddingTop: 6
  },
  surface: {
    borderRadius: 6,
    borderWidth: HAIRLINE_WIDTH,
    overflow: "hidden"
  },
  surfacePadded: {
    padding: 10
  }
} as const;
