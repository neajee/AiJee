import { memo, useCallback, useState } from "react";
import { FileText } from "lucide-react";
import type { ToolCallInfo } from "../../../component-types.ts";
import { basename, parseToolArguments } from "../../../utils/message-list";
import { CodePreview } from "../code-preview";
import { ToolBody, ToolHeader, TOOL_BODY_MAX_HEIGHT } from "./tool-disclosure";
import { ToolResultImages } from "./tool-result-images";
interface ReadToolCallProps {
  tc: ToolCallInfo;
  isDark: boolean;
}
export const ReadToolCall = memo(function ReadToolCall({
  tc,
  isDark
}: ReadToolCallProps) {
  // Results stay collapsed by default, even while the tool is running.
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded(p => !p), []);
  const parsed = parseToolArguments(tc.arguments);
  const filePath = parsed.path as string || "";
  const fileName = basename(filePath);
  const offset = parsed.offset as number || 1;
  const content = tc.result || "";
  const hasImages = !!(tc.resultImages && tc.resultImages.length > 0);
  return <div className="flex flex-col">
      <ToolHeader expanded={expanded} expandable={!!content} onToggle={toggle} isDark={isDark} icon={FileText} aria-label={`${expanded ? "Collapse" : "Expand"} contents of ${fileName || "file"}`}>
        <span className="block truncate text-text-secondary">Read <span className="font-mono text-foreground">{fileName || filePath || "file"}</span></span>
      </ToolHeader>
      {hasImages && <ToolResultImages images={tc.resultImages!} isDark={isDark} />}
      <ToolBody expanded={expanded && !!content}>
        <CodePreview code={content} isDark={isDark} startLine={offset} maxHeight={TOOL_BODY_MAX_HEIGHT} />
      </ToolBody>
    </div>;
});