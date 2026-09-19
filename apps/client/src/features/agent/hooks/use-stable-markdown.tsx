import { marked } from "marked";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { JSX } from "react";
import type { useMarkdownHookOptions } from "@/platform/markdown";

const STREAMING_THROTTLE_MS = 100;

/** DOM markdown renderer with throttled updates while an assistant response streams. */
export function useStableMarkdown(text: string, options: useMarkdownHookOptions, isStreaming = false): JSX.Element[] {
  const textRef = useRef(text);
  textRef.current = text;
  const [throttledText, setThrottledText] = useState(text);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = useCallback((value: string) => setThrottledText(value), []);
  useEffect(() => {
    if (!isStreaming) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      update(text);
      return;
    }
    if (timerRef.current) return;
    update(text);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      update(textRef.current);
    }, STREAMING_THROTTLE_MS);
  }, [isStreaming, text, update]);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const source = isStreaming ? useDeferredValue(throttledText) : throttledText;
  return useMemo(() => [{
    key: "markdown",
    className: "prose prose-sm max-w-none dark:prose-invert",
    dangerouslySetInnerHTML: { __html: marked.parse(source, { gfm: true, breaks: true }) as string },
  } as JSX.Element], [source, options]);
}
