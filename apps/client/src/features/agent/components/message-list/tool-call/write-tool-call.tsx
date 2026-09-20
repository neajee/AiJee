import { memo, useCallback, useState } from "react";
import { Colors, Fonts } from "@/constants/theme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import type { ToolCallInfo } from "../agent-types";
import { basename, isToolActive, parseToolArguments, countLines } from "../../../utils/message-list";
import { CodePreview } from "../code-preview";
import { ToolBody, ToolHeader, TOOL_BODY_MAX_HEIGHT } from "./tool-disclosure";
interface WriteToolCallProps {
  tc: ToolCallInfo;
  isDark: boolean;
}
export const WriteToolCall = memo(function WriteToolCall({
  tc,
  isDark
}: WriteToolCallProps) {
  const colors = useThemeTokens();
  const active = isToolActive(tc);
  // Results stay collapsed by default, even while the tool is running.
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded(p => !p), []);
  const parsed = parseToolArguments(tc.arguments);
  const filePath = parsed.path as string || "";
  const fileName = basename(filePath);
  const content = parsed.content as string || "";
  const addedLines = countLines(content);
  const hasContent = !!content;
  const title = active ? "Writing" : "Wrote";
  return <div>
      <ToolHeader expanded={expanded} expandable={hasContent} onToggle={toggle} isDark={isDark} aria-label={`${expanded ? "Collapse" : "Expand"} contents of ${fileName || "file"}`}>
        <span className={"  text-text-secondary"}>
          {title} {fileName || filePath || "file"}
        </span>
        {addedLines > 0 && <span className={" "}>
            +{addedLines}
          </span>}
      </ToolHeader>

      <ToolBody expanded={expanded && hasContent}>
        <CodePreview code={content} isDark={isDark} maxHeight={TOOL_BODY_MAX_HEIGHT} />
      </ToolBody>
    </div>;
});
const styles = {
  fileName: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
    fontWeight: "500",
    flexShrink: 1
  },
  metaAdd: {
    fontSize: 10,
    fontFamily: Fonts.mono,
    flexShrink: 0
  }
} as const;
