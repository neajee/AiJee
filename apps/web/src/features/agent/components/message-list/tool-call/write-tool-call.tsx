import { memo, useCallback, useState } from "react";
import { FilePlus } from "lucide-react";
import type { ToolCallInfo } from "../../../component-types.ts";
import { basename, isToolActive, parseToolArguments, countLines } from "../../../utils/message-list";
import { detectLanguage } from "../../../utils/diff";
import { DiffPreview } from "../code-preview";
import { ToolBody, ToolHeader, TOOL_BODY_MAX_HEIGHT } from "./tool-disclosure";
interface WriteToolCallProps {
  tc: ToolCallInfo;
  isDark: boolean;
}
export const WriteToolCall = memo(function WriteToolCall({
  tc,
  isDark
}: WriteToolCallProps) {
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
  return <div className="flex flex-col">
      <ToolHeader expanded={expanded} expandable={hasContent} onToggle={toggle} isDark={isDark} icon={FilePlus} aria-label={`${expanded ? "Collapse" : "Expand"} contents of ${fileName || "file"}`}>
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="min-w-0 flex-1 truncate text-text-secondary">{title} <span className="font-mono text-foreground">{fileName || filePath || "file"}</span></span>
          {addedLines > 0 && <span className="shrink-0 font-mono text-meta text-success">+{addedLines}</span>}
        </div>
      </ToolHeader>

      <ToolBody expanded={expanded && hasContent}>
        {/* A created file is a diff against nothing: every line is an addition. */}
        <DiffPreview oldValue="" newValue={content} isDark={isDark} maxHeight={TOOL_BODY_MAX_HEIGHT} language={detectLanguage(fileName, filePath)} />
      </ToolBody>
    </div>;
});