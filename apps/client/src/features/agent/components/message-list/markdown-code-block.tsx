import { memo, useCallback, useEffect, useRef, useState } from "react";
import * as Clipboard from "@/platform/clipboard";
import { Check, Copy } from "lucide-react";
import { Colors, Fonts } from "@/constants/theme";
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
  return <div className={"  bg-surface-raised border-border"}>
      <div>
        <span className={"  text-text-tertiary"}>
          {label}
        </span>
        <button onClick={handleCopy} role="button" aria-label={copied ? "Code copied" : "Copy code"}>
          {copied ? <Check size={13} color={colors.textSecondary} strokeWidth={1.8} /> : <Copy size={13} color={colors.textTertiary} strokeWidth={1.8} />}
        </button>
      </div>

      <div className="flex flex-col">
        <CodePreview code={code} language={language} isDark={isDark} showLineNumbers={false} bare />
      </div>
    </div>;
});
const styles = {
  container: {
    marginTop: 6,
    marginBottom: 6,
    borderRadius: 8,
    borderWidth: 0.5,
    overflow: "hidden"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 28,
    paddingLeft: 12,
    paddingRight: 6,
    borderBottomWidth: 0.5
  },
  language: {
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: Fonts.mono,
    letterSpacing: 0.3
  },
  copyBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4
  },
  body: {
    paddingTop: 8,
    paddingBottom: 8
  }
} as const;
