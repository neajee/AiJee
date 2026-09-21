import { memo, useCallback, useState } from "react";
import { Wrench } from "lucide-react";
import type { ToolCallInfo } from "../../../component-types.ts";
import { toolDisplayName } from "../../../utils/message-list";
import { ToolBody, ToolHeader, ToolSurface } from "./tool-disclosure";
import { ToolResultImages } from "./tool-result-images";
interface GenericToolCallProps {
  tc: ToolCallInfo;
  isDark: boolean;
}
export const GenericToolCall = memo(function GenericToolCall({
  tc,
  isDark
}: GenericToolCallProps) {
  // Results stay collapsed by default, even while the tool is running.
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded(p => !p), []);
  const hasImages = !!(tc.resultImages && tc.resultImages.length > 0);
  const resultText = tc.result || tc.partialResult || "";
  const hasResult = !!resultText;
  const name = toolDisplayName(tc.name);
  return <div className="flex flex-col">
      <ToolHeader expanded={expanded} expandable={hasResult || hasImages} onToggle={toggle} isDark={isDark} icon={Wrench} aria-label={`${expanded ? "Collapse" : "Expand"} result of ${name}`}>
        <span className="block truncate text-text-secondary">{name}</span>
      </ToolHeader>

      {hasImages && <ToolResultImages images={tc.resultImages!} isDark={isDark} />}

      <ToolBody expanded={expanded && hasResult}>
        <ToolSurface isDark={isDark}>
          <pre className="max-h-[260px] overflow-auto whitespace-pre-wrap break-words font-mono text-meta leading-4 text-text-secondary">{resultText}</pre>
        </ToolSurface>
      </ToolBody>
    </div>;
});