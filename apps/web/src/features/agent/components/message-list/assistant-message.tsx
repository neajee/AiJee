import { memo, useCallback } from "react";
import { AlertCircle, Check, Copy } from "lucide-react";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
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
          <span className="text-caption leading-[18px] text-destructive">
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
  const { status, copy } = useCopyToClipboard();
  const handleCopy = useCallback(() => {
    void copy(message.text);
  }, [copy, message.text]);
  return <div className={`relative z-20 flex items-center gap-0.5 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}>
      <button onClick={handleCopy} className="flex size-[26px] items-center justify-center rounded-md hover:bg-hover" aria-label={status === 'copied' ? 'Copied' : status === 'error' ? 'Copy failed' : 'Copy'}>
        {status === 'copied' ? <Check size={13} color={colors.success} strokeWidth={1.8} /> : status === 'error' ? <AlertCircle size={13} color={colors.destructive} strokeWidth={1.8} /> : <Copy size={13} color={colors.textTertiary} strokeWidth={1.8} />}
      </button>
    </div>;
});
