import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Brain, ChevronRight } from "lucide-react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Colors, Fonts } from "@/constants/theme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { AnimatedCollapse } from "./animated-collapse";
import { formatDuration } from "../../utils/turns";

interface ThinkingBlockProps {
  text: string;
  isStreaming?: boolean;
  isDark: boolean;
}

const BREATH_DURATION = 900;
const BREATH_MIN_OPACITY = 0.45;

/** The tail of the thinking stream, used as the collapsed one-line preview. */
function lastLineOf(text: string): string {
  if (!text) return "";
  const lines = text.split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]!.trim();
    if (line) return line;
  }
  return "";
}

export const ThinkingBlock = memo(function ThinkingBlock({
  text,
  isStreaming,
  isDark,
}: ThinkingBlockProps) {
  const colors = useThemeTokens();
  const [expanded, setExpanded] = useState(false);

  const toggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  // Breathing label instead of animated dots: runs on the UI thread, so
  // streaming never re-renders this block just to move the animation on.
  const breath = useSharedValue(1);
  useEffect(() => {
    if (!isStreaming) {
      breath.value = withTiming(1, { duration: 200 });
      return;
    }
    breath.value = withRepeat(
      withSequence(
        withTiming(BREATH_MIN_OPACITY, {
          duration: BREATH_DURATION,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: BREATH_DURATION,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
    );
  }, [isStreaming, breath]);
  const breathStyle = useAnimatedStyle(() => ({ opacity: breath.value }));

  const chevronRotate = useSharedValue(expanded ? 90 : 0);
  useEffect(() => {
    chevronRotate.value = withTiming(expanded ? 90 : 0, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });
  }, [expanded, chevronRotate]);
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotate.value}deg` }],
  }));

  // Only report a duration we actually observed: history loaded from the
  // server never streams, so guessing there would invent numbers.
  const startedAt = useRef<number | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  useEffect(() => {
    if (isStreaming) {
      if (startedAt.current === null) startedAt.current = Date.now();
      return;
    }
    if (startedAt.current !== null) {
      setDurationMs(Date.now() - startedAt.current);
      startedAt.current = null;
    }
  }, [isStreaming]);

  const peek = useMemo(
    () => (isStreaming && !expanded ? lastLineOf(text) : ""),
    [isStreaming, expanded, text],
  );

  if (!text && !isStreaming) return null;

  const label = isStreaming
    ? "Thinking"
    : durationMs && durationMs >= 1000
      ? `Thought for ${formatDuration(durationMs)}`
      : "Thought";

  // While streaming and folded, the row *is* the live tail: icon, the line the
  // model is on, and the disclosure. Two rows (a label plus a preview) spent a
  // whole line saying "Thinking", which the moving text already says.
  const headline = peek || label;

  return (
    <View>
      <Pressable
        onPress={toggle}
        disabled={!text}
        accessibilityRole="button"
        accessibilityLabel={expanded ? "Collapse thinking" : "Expand thinking"}
        accessibilityState={{ expanded }}
        style={styles.header}
      >
        <Animated.View style={breathStyle}>
          <Brain size={12} color={colors.textTertiary} strokeWidth={1.8} />
        </Animated.View>
        <Animated.Text
          style={[
            styles.label,
            peek ? styles.peekText : null,
            { color: colors.textTertiary },
            peek ? null : breathStyle,
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {headline}
        </Animated.Text>
        {!!text && (
          <Animated.View style={chevronStyle}>
            <ChevronRight size={11} color={colors.textTertiary} strokeWidth={2} />
          </Animated.View>
        )}
      </Pressable>

      <AnimatedCollapse expanded={expanded}>
        <Text style={[styles.text, { color: colors.textSecondary }]} selectable>
          {text}
        </Text>
      </AnimatedCollapse>
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
  },
  label: {
    fontSize: 12,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: "600",
  },
  /** The live tail reads as prose, so it drops the label's weight. */
  peekText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontWeight: "400",
    lineHeight: 18,
    opacity: 0.85,
  },
  text: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.sans,
    paddingTop: 2,
    paddingBottom: 6,
  },
});
