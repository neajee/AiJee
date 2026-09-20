import { memo, useCallback, useState } from "react";
import * as Clipboard from "@/platform/clipboard";
import { Copy } from "lucide-react";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import type { ChatMessage } from "../../component-types.ts";
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
  message
}: AssistantMessageProps) {
  const colors = useThemeTokens();
  const hasText = !!message.text;
  const hasError = !!message.errorMessage;
  const isStreaming = !!message.isStreaming;
  return <div className="flex flex-col gap-3 px-4 py-1">
      {hasText && <div className="min-w-0">
          <AssistantMarkdown text={message.text} isStreaming={isStreaming} />
        </div>}

      {hasError && <div className="rounded-md bg-destructive/10 px-2.5 py-1.5">
          <span className="text-xs leading-[18px] text-destructive">
            {message.errorMessage}
          </span>
        </div>}

      {isStreaming && !hasText && <StreamingCursor color={colors.textTertiary} />}
    </div>;
});
export const MessageToolbar = memo(function MessageToolbar({
  message,
  hovered
}: {
  message: ChatMessage;
  isDark: boolean;
  hovered: boolean;
}) {
  const colors = useThemeTokens();
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    if (!message.text) return;
    await Clipboard.setStringAsync(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [message.text]);
  return <div className={`relative z-20 flex items-center gap-0.5 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}>
      <button onClick={handleCopy} className="flex size-[26px] items-center justify-center rounded-md hover:bg-hover" aria-label={copied ? 'Copied' : 'Copy'}>
        {copied ? <span className="text-xs text-text-tertiary">✓</span> : <Copy size={13} color={colors.textTertiary} strokeWidth={1.8} />}
      </button>
    </div>;
});
