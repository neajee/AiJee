import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Brain, ChevronRight } from "lucide-react";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { AnimatedCollapse } from "./animated-collapse";
import { formatDuration } from "../../utils/turns";
interface ThinkingBlockProps {
  text: string;
  isStreaming?: boolean;
  isDark: boolean;
}
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
  isStreaming
}: ThinkingBlockProps) {
  const colors = useThemeTokens();
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

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
  const peek = useMemo(() => isStreaming && !expanded ? lastLineOf(text) : "", [isStreaming, expanded, text]);
  if (!text && !isStreaming) return null;
  const label = isStreaming ? "Thinking" : durationMs && durationMs >= 1000 ? `Thought for ${formatDuration(durationMs)}` : "Thought";

  // While streaming and folded, the row *is* the live tail: icon, the line the
  // model is on, and the disclosure. Two rows (a label plus a preview) spent a
  // whole line saying "Thinking", which the moving text already says.
  const headline = peek || label;
  return <div>
      <button onClick={toggle} disabled={!text} role="button" aria-label={expanded ? "Collapse thinking" : "Expand thinking"} className="flex min-h-7 w-full items-center gap-1.5 py-1 text-left text-xs hover:bg-hover disabled:cursor-default">
        <Brain size={12} color={colors.textTertiary} strokeWidth={1.8} className="shrink-0" />
        <span className={`text-xs text-text-tertiary ${peek ? "min-w-0 flex-1 truncate font-normal leading-[18px] opacity-[0.85]" : "font-semibold"}`}>
          {headline}
        </span>
        {!!text && <ChevronRight className={`shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`} size={11} color={colors.textTertiary} strokeWidth={2} />}
      </button>

      <AnimatedCollapse expanded={expanded}>
        <span className="block whitespace-pre-wrap pb-1.5 pt-0.5 text-xs leading-[18px] text-text-secondary">
          {text}
        </span>
      </AnimatedCollapse>
    </div>;
});
