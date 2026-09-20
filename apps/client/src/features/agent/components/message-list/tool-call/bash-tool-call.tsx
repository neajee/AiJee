import { memo, useCallback, useRef, useState } from "react";
import { Terminal } from "lucide-react";
import type { ToolCallInfo } from "../../../component-types.ts";
import { parseToolArguments, truncateOutput } from "../../../utils/message-list";
import { ToolBody, ToolHeader, ToolSurface } from "./tool-disclosure";
import { ToolResultImages } from "./tool-result-images";
interface BashToolCallProps {
  tc: ToolCallInfo;
  isDark: boolean;
}

/**
 * Command output is the turn's primary artifact, so it gets more room than the
 * generic tool body cap: ~26 lines instead of ~16, and anything longer scrolls
 * with a visible indicator. The data layer still truncates at 50 lines so a
 * runaway `cat` cannot render megabytes into the list.
 */
export const BashToolCall = memo(function BashToolCall({
  tc,
  isDark
}: BashToolCallProps) {
  // Results stay collapsed by default, even while the tool is running.
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded(p => !p), []);
  const scrollRef = useRef<HTMLDivElement>(null);
  const parsed = parseToolArguments(tc.arguments);
  const rawCommand = parsed.command as string || "";
  const cdMatch = rawCommand.match(/^cd\s+(.+?)\s*&&\s*(.+)/);
  const command = cdMatch ? cdMatch[2]!.trim() : rawCommand;
  const cdPath = cdMatch ? cdMatch[1]!.trim() : undefined;
  const output = tc.result || tc.partialResult || "";
  const {
    text: displayOutput,
    truncated
  } = truncateOutput(output);
  const hasOutput = !!displayOutput;
  return <div className="flex flex-col">
      <ToolHeader expanded={expanded} expandable={hasOutput} onToggle={toggle} isDark={isDark} icon={Terminal} aria-label={`${expanded ? "Collapse" : "Expand"} output of ${command || "bash"}`}>
        <span className="block truncate text-text-secondary">
          Ran <span className="font-mono text-foreground">{command || "bash"}</span>
          {cdPath ? <span>
              {" in "}
              <span className="font-mono text-foreground">{cdPath}</span>
            </span> : null}
        </span>
      </ToolHeader>

      {hasOutput && <ToolBody expanded={expanded}>
          <ToolSurface isDark={isDark}>
            <div ref={scrollRef} className="max-h-[420px] overflow-auto"><pre className="whitespace-pre-wrap break-words font-mono text-meta leading-4 text-text-secondary">{displayOutput}</pre>{truncated && <p className="mt-1 font-mono text-[10px] italic text-text-tertiary">… output truncated</p>}</div>
          </ToolSurface>
        </ToolBody>}

      {tc.resultImages && tc.resultImages.length > 0 && <ToolResultImages images={tc.resultImages} isDark={isDark} />}
    </div>;
});