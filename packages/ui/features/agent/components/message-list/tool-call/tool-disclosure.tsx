import { View } from 'tamagui';
import { memo, type ReactNode } from "react";
import { Pressable } from "react-native";
import { ChevronRight } from "lucide-react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";
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
  children,
}: ToolHeaderProps) {
  const colors = useThemeTokens();
  const rotate = useDerivedValue(
    () =>
      withTiming(expanded ? 90 : 0, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
      }),
    [expanded],
  );
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  const row = [styles.header, alignTop && styles.headerTop];

  if (!expandable) {
    return <View style={row}>{children}</View>;
  }

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ expanded }}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 8 }}
      style={({ pressed }) => [...row, pressed && styles.headerPressed]}
    >
      {children}
      <Animated.View style={[styles.chevron, alignTop && styles.chevronTop, chevronStyle]}>
        <ChevronRight
          size={CHEVRON_SIZE}
          color={colors.textTertiary}
          strokeWidth={2}
        />
      </Animated.View>
    </Pressable>
  );
});

/**
 * The collapsing region under a tool header. Deliberately has no max height of
 * its own: whatever is inside is responsible for capping itself, which keeps
 * the open/close animation and the scroll cap from fighting each other.
 */
export function ToolBody({
  expanded,
  children,
}: {
  expanded: boolean;
  children: ReactNode;
}) {
  return (
    <AnimatedCollapse expanded={expanded}>
      <View style={styles.body}>{children}</View>
    </AnimatedCollapse>
  );
}

/**
 * The panel every tool result sits in. Matches CodePreview's surface so a bash
 * transcript, a diff and a subagent log all read as the same kind of object.
 */
export function ToolSurface({
  isDark,
  padded = true,
  children,
}: {
  isDark: boolean;
  padded?: boolean;
  children: ReactNode;
}) {
  const colors = useThemeTokens();
  return (
    <View
      style={[
        styles.surface,
        padded && styles.surfacePadded,
        { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
      ]}
    >
      {children}
    </View>
  );
}

const styles = {
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 4, paddingBottom: 4,
  },
  headerTop: {
    alignItems: "flex-start",
  },
  headerPressed: {
    opacity: 0.6,
  },
  chevron: {
    flexShrink: 0,
  },
  chevronTop: {
    marginTop: 3,
  },
  body: {
    paddingTop: 6,
  },
  surface: {
    borderRadius: 6,
    borderWidth: HAIRLINE_WIDTH,
    overflow: "hidden",
  },
  surfacePadded: {
    padding: 10,
  },
} as const;
