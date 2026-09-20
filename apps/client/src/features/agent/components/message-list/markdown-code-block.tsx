import { memo, useCallback, useEffect, useRef, useState } from "react";
import * as Clipboard from "@/platform/clipboard";
import { Check, Copy } from "lucide-react";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { CodePreview } from "./code-preview";
interface MarkdownCodeBlockProps {
  code: string;
  language?: string;
  isDark: boolean;
}

/**
 * A fenced code block inside assistant prose.
 *
 * Deliberately different from the tool-call previews: a snippet in a reply is
 * read as prose, not inspected line by line, so there is no line-number
 * gutter. The header carries the language and a copy action, which is the only
 * thing anyone actually wants to do with a snippet in chat.
 */
export const MarkdownCodeBlock = memo(function MarkdownCodeBlock({
  code,
  language,
  isDark
}: MarkdownCodeBlockProps) {
  const colors = useThemeTokens();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);
  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 1500);
  }, [code]);
  const label = (language || "").trim().toLowerCase();
  return <div className="my-3 overflow-hidden rounded-md border border-border bg-surface-raised">
      <div className="flex h-8 items-center justify-between border-b border-border px-3">
        <span className="truncate font-mono text-meta text-text-tertiary">{label}</span>
        <button className="flex size-6 items-center justify-center rounded hover:bg-hover" onClick={handleCopy} role="button" aria-label={copied ? "Code copied" : "Copy code"}>
          {copied ? <Check size={13} color={colors.textSecondary} strokeWidth={1.8} /> : <Copy size={13} color={colors.textTertiary} strokeWidth={1.8} />}
        </button>
      </div>

      <div className="overflow-x-auto py-2">
        <CodePreview code={code} language={language} isDark={isDark} showLineNumbers={false} bare />
      </div>
    </div>;
});