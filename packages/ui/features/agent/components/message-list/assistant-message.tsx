import { memo, useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Copy } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Colors, Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import type { ChatMessage } from "../../types";
import { AssistantMarkdown } from "./assistant-markdown";
import { StreamingCursor } from "./streaming-cursor";

interface AssistantMessageProps {
  message: ChatMessage;
  isDark: boolean;
}

/**
 * Whether a message has settled into something worth offering actions on.
 *
 * The turn owns the action row (it has to come after the file-change card), so
 * the decision lives here next to the toolbar it gates.
 */
export function hasMessageActions(message: ChatMessage) {
  return (
    !message.isStreaming &&
    message.stopReason === "stop" &&
    (!!message.text || !!message.errorMessage)
  );
}

export const AssistantMessage = memo(function AssistantMessage({
  message,
  isDark,
}: AssistantMessageProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = useThemeTokens();

  const hasText = !!message.text;
  const hasError = !!message.errorMessage;
  const isStreaming = !!message.isStreaming;

  return (
    <View style={styles.container}>
      {hasText && (
        <View style={styles.textBlock}>
          <AssistantMarkdown text={message.text} isStreaming={isStreaming} />
        </View>
      )}

      {hasError && (
        <View
          style={[
            styles.errorBlock,
            { backgroundColor: isDark ? "rgba(255,69,58,0.08)" : "rgba(255,59,48,0.05)" },
          ]}
        >
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            {message.errorMessage}
          </Text>
        </View>
      )}

      {isStreaming && !hasText && (
        <StreamingCursor color={colors.textTertiary} />
      )}
    </View>
  );
});

const FADE = { duration: 150, easing: Easing.out(Easing.cubic) };

export const MessageToolbar = memo(function MessageToolbar({
  message,
  isDark,
  hovered,
}: {
  message: ChatMessage;
  isDark: boolean;
  hovered: boolean;
}) {
  const colors = useThemeTokens();
  const [copied, setCopied] = useState(false);

  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(hovered ? 1 : 0, FADE);
  }, [hovered, opacity]);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const handleCopy = useCallback(async () => {
    if (!message.text) return;
    await Clipboard.setStringAsync(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [message.text]);

  return (
    <>
      <View style={styles.toolbarWrap}>
        <Animated.View style={[styles.toolbar, animStyle]}>
          <View style={styles.toolbarBtns}>
            <Pressable
              onPress={handleCopy}
              style={[styles.toolbarBtn, copied && { backgroundColor: colors.surfaceRaised }]}
              hitSlop={4}
            >
              {copied ? (
                <Text style={[styles.copiedText, { color: colors.textTertiary }]}>✓</Text>
              ) : (
                <Copy size={13} color={colors.textTertiary} strokeWidth={1.8} />
              )}
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </>
  );
});


const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 12,
  },
  textBlock: {},
  errorBlock: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.sans,
  },
  toolbar: {},
  toolbarBtns: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  toolbarBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  copiedText: {
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  toolbarWrap: {
    position: "relative",
    zIndex: 20,
  },
});
