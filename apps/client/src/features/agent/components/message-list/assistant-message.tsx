import { memo, useCallback, useEffect, useState } from "react";
import * as Clipboard from "@/platform/clipboard";
import { Copy } from "lucide-react";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "@/styles/motion";
import { Colors, Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import type { ChatMessage } from "../agent-types";
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
  return !message.isStreaming && message.stopReason === "stop" && (!!message.text || !!message.errorMessage);
}
export const AssistantMessage = memo(function AssistantMessage({
  message,
  isDark
}: AssistantMessageProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = useThemeTokens();
  const hasText = !!message.text;
  const hasError = !!message.errorMessage;
  const isStreaming = !!message.isStreaming;
  return <div className="flex flex-col">
      {hasText && <div className="flex flex-col">
          <AssistantMarkdown text={message.text} isStreaming={isStreaming} />
        </div>}

      {hasError && <div>
          <span className={"  text-destructive"}>
            {message.errorMessage}
          </span>
        </div>}

      {isStreaming && !hasText && <StreamingCursor color={colors.textTertiary} />}
    </div>;
});
const FADE = {
  duration: 150,
  easing: Easing.out(Easing.cubic)
};
export const MessageToolbar = memo(function MessageToolbar({
  message,
  isDark,
  hovered
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
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value
  }));
  const handleCopy = useCallback(async () => {
    if (!message.text) return;
    await Clipboard.setStringAsync(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [message.text]);
  return <>
      <div className="flex flex-col">
        <div>
          <div className="flex flex-col">
            <button onClick={handleCopy} className={"  bg-surface-raised"}>
              {copied ? <span className={"  text-text-tertiary"}>✓</span> : <Copy size={13} color={colors.textTertiary} strokeWidth={1.8} />}
            </button>
          </div>
        </div>
      </div>
    </>;
});
const styles = {
  container: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 4,
    paddingBottom: 4,
    gap: 12
  },
  textBlock: {},
  errorBlock: {
    borderRadius: 6,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 6,
    paddingBottom: 6
  },
  errorText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.sans
  },
  toolbar: {},
  toolbarBtns: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2
  },
  toolbarBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center"
  },
  copiedText: {
    fontSize: 12,
    fontFamily: Fonts.sans
  },
  toolbarWrap: {
    position: "relative",
    zIndex: 20
  }
} as const;
