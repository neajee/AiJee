import { useRef, useEffect, useMemo } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { Fonts } from "@/constants/theme";
import { AiJeeLogo } from "@/components/aijee-logo";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

const GREETINGS = [
  "What are we building?",
  "Ready when you are",
  "How can I help?",
  "Ask me anything",
  "What's on your mind?",
  "Let's ship something",
  "What needs fixing?",
  "Where were we?",
  "Let's figure it out",
  "What's the plan?",
  "Think it. Build it.",
  "Ideas welcome",
  "Your move",
  "What's next?",
  "Let's make progress",
  "Describe, and I'll build",
  "Say the word",
  "At your service",
  "Waiting for orders",
  "Fire away",
  "The most personal is the most creative.",
];

const TIME_GREETINGS: { start: number; end: number; messages: string[] }[] = [
  {
    start: 5,
    end: 12,
    messages: [
      "Good morning, let's build",
      "Fresh morning, fresh code",
      "Early start, let's go",
    ],
  },
  {
    start: 12,
    end: 17,
    messages: [
      "Good afternoon, what's up?",
      "Afternoon focus mode",
      "Post-lunch productivity?",
    ],
  },
  {
    start: 17,
    end: 21,
    messages: [
      "Good evening, still at it?",
      "Evening session, let's go",
      "Winding down or ramping up?",
    ],
  },
  {
    start: 21,
    end: 5,
    messages: [
      "Late night hacking?",
      "Burning the midnight oil",
      "Night owl mode activated",
    ],
  },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  const useTimeBased = Math.random() < 0.35;

  if (useTimeBased) {
    const slot = TIME_GREETINGS.find((s) =>
      s.start < s.end
        ? hour >= s.start && hour < s.end
        : hour >= s.start || hour < s.end,
    );
    if (slot) {
      return slot.messages[Math.floor(Math.random() * slot.messages.length)];
    }
  }

  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}

export function WorkspaceHero() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = useThemeTokens();
  const { isWideScreen } = useResponsiveLayout();

  const isDark = colorScheme === "dark";
  const textPrimary = colors.text;

  const greeting = useMemo(() => getGreeting(), []);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;
  const markScale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 120,
        friction: 14,
        useNativeDriver: true,
      }),
      Animated.spring(markScale, {
        toValue: 1,
        tension: 90,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, markScale]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: markScale }] }}>
          <AiJeeLogo
            size={isWideScreen ? 64 : 52}
            color={textPrimary}
            opacity={isDark ? 0.92 : 0.88}
          />
        </Animated.View>

        <Text
          style={[
            styles.title,
            {
              color: textPrimary,
              fontSize: isWideScreen ? 26 : 21,
              lineHeight: isWideScreen ? 34 : 29,
            },
          ]}
        >
          {greeting}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    // The hero and the composer are centred together as one group, so the hero
    // must give up space instead of pushing the composer off screen.
    flexShrink: 1,
  },
  content: {
    alignItems: "center",
    gap: 20,
    maxWidth: 620,
  },
  title: {
    fontFamily: Fonts.sansMedium,
    textAlign: "center",
    letterSpacing: -0.3,
  },
});
