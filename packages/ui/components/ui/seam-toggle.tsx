import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";

/** Both panel seams size their control from here, so the two stay identical. */
export const SEAM_TOGGLE_WIDTH = 18;
export const SEAM_TOGGLE_HEIGHT = 64;

/** At rest: the same short bar the resize handle uses. */
const REST_WIDTH = 3;
const REST_HEIGHT = 30;
/** Hovered: just enough box to hold the chevron, not a tall empty capsule. */
const ACTIVE_WIDTH = SEAM_TOGGLE_WIDTH;
const ACTIVE_HEIGHT = 38;
const MORPH_MS = 140;

interface SeamToggleProps {
  /** Which way the panel moves when pressed. */
  chevron: "left" | "right";
  onPress: () => void;
  label: string;
  /** Web only: lets the pill count as part of the seam's hover target. */
  onHoverIn?: () => void;
  onHoverOut?: () => void;
}

/**
 * The control that rides a panel seam, centred on it.
 *
 * One shape throughout: at rest it is the seam's own short bar, and on hover
 * that bar thickens into a pill holding the chevron. Cross-fading two separate
 * shapes read as a box appearing out of nowhere, and a pill tall enough to span
 * the whole hit area read as mostly empty.
 *
 * The pressable stays full size in both states, so the small resting mark is
 * never what you have to hit. Touch platforms have no hover, so they get the
 * pill outright.
 */
export function SeamToggle({
  chevron,
  onPress,
  label,
  onHoverIn,
  onHoverOut,
}: SeamToggleProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = useThemeTokens();
  const isDark = colorScheme === "dark";
  const isWeb = Platform.OS === "web";

  const [active, setActive] = useState(!isWeb);
  const anim = useRef(new Animated.Value(isWeb ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: active ? 1 : 0,
      duration: MORPH_MS,
      easing: Easing.out(Easing.cubic),
      // Width, height and colours are layout and paint props.
      useNativeDriver: false,
    }).start();
  }, [active, anim]);

  const Chevron = chevron === "left" ? ChevronLeft : ChevronRight;

  const restColor = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.16)";
  const activeColor = isDark ? "#242424" : "#FFFFFF";
  const activeBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";

  const handleIn = () => {
    if (isWeb) setActive(true);
    onHoverIn?.();
  };
  const handleOut = () => {
    if (isWeb) setActive(false);
    onHoverOut?.();
  };

  const webHoverProps = isWeb
    ? { onMouseEnter: handleIn, onMouseLeave: handleOut }
    : {};

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      {...{ title: label }}
      {...webHoverProps}
      // The mark is small; the hit area is the whole seam segment plus slop.
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={styles.hit}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.mark,
          {
            width: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [REST_WIDTH, ACTIVE_WIDTH],
            }),
            height: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [REST_HEIGHT, ACTIVE_HEIGHT],
            }),
            borderRadius: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [REST_WIDTH / 2, ACTIVE_WIDTH / 2],
            }),
            backgroundColor: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [restColor, activeColor],
            }),
            borderColor: anim.interpolate({
              inputRange: [0, 1],
              outputRange: ["rgba(0,0,0,0)", activeBorder],
            }),
          },
        ]}
      >
        {/* Held back until the bar has some width to hold it. */}
        <Animated.View
          style={{
            opacity: anim.interpolate({
              inputRange: [0, 0.55, 1],
              outputRange: [0, 0, 1],
            }),
          }}
        >
          <Chevron size={13} color={colors.text} strokeWidth={2} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    width: SEAM_TOGGLE_WIDTH,
    height: SEAM_TOGGLE_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  } as any,
  mark: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.633,
    overflow: "hidden",
  },
});
