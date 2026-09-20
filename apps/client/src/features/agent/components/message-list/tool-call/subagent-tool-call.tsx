import { memo, useCallback, useMemo, useState } from "react";
import { Bot } from "lucide-react";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { useAppSettingsStore } from "@/features/settings/store";
import type { ToolCallInfo } from "../../../component-types.ts";
import { useStableMarkdown } from "../../../hooks/use-stable-markdown";
import { createMarkedOptions } from "../../../theme";
import { isToolActive, parseToolArguments } from "../../../utils/message-list";
import { ToolBody, ToolHeader, ToolSurface } from "./tool-disclosure";
interface SubagentToolCallProps {
  tc: ToolCallInfo;
  isDark: boolean;
}

export const SubagentToolCall = memo(function SubagentToolCall({
  tc,
  isDark
}: SubagentToolCallProps) {
  const active = isToolActive(tc);
  // Results stay collapsed by default, even while the tool is running.
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded(p => !p), []);
  const transcript = tc.result || tc.partialResult || "";
  const parsed = parseToolArguments(tc.arguments);
  const task = parsed.task as string || "";
  const agentName = parsed.agent as string || tc.progress?.agent || "agent";
  const recentTools = tc.progress?.recentTools ?? [];
  const recentOutput = tc.progress?.recentOutput ?? [];
  const hasProgressMeta = !!tc.progress?.status || !!tc.progress?.toolCount || !!tc.progress?.durationMs;
  const hasDetail = !!transcript || recentTools.length > 0 || recentOutput.length > 0 || hasProgressMeta;
  const markdownOptions = createMarkedOptions(useThemeTokens(), isDark ? 'dark' : 'light', useAppSettingsStore(s => s.codeFontSize));
  const markdownElements = useStableMarkdown(transcript, markdownOptions, active && !tc.result);
  const meta = tc.subagentMeta;
  const metaItems = useMemo(() => {
    const items: string[] = [];
    if (meta?.model) items.push(meta.model);
    const status = tc.progress?.status || (active ? "running" : undefined);
    if (status) items.push(status);
    const toolCount = meta?.toolCount ?? tc.progress?.toolCount;
    if (typeof toolCount === "number" && toolCount > 0) items.push(`${toolCount} tools`);
    const durationMs = meta?.durationMs ?? tc.progress?.durationMs;
    if (typeof durationMs === "number" && durationMs > 0) {
      const seconds = durationMs / 1000;
      items.push(seconds >= 10 ? `${Math.round(seconds)}s` : `${seconds.toFixed(1)}s`);
    }
    if (typeof meta?.cost === "number" && meta.cost > 0) {
      items.push(`$${meta.cost < 0.01 ? meta.cost.toFixed(4) : meta.cost.toFixed(2)}`);
    }
    return items;
  }, [active, meta, tc.progress, tc.status]);
  return <div>
      <ToolHeader expanded={expanded} expandable={hasDetail} onToggle={toggle} isDark={isDark} icon={Bot} alignTop aria-label={`${expanded ? "Collapse" : "Expand"} details of ${agentName}`}>
        <div className="flex flex-col">
          <div className="flex flex-col">
            <span className={"  text-text-secondary"}>
              {agentName}
            </span>
            {!!metaItems.length && <span className={"  text-text-tertiary"}>
                {metaItems.join(" • ")}
              </span>}
          </div>
          {task ? <span className={"  text-text-tertiary"}>
              {task}
            </span> : null}
        </div>
      </ToolHeader>

      <ToolBody expanded={expanded && hasDetail}>
        <ToolSurface isDark={isDark}>
          <div className="flex flex-col">
            {recentTools.length > 0 && <div className="flex flex-col">
                <span className={"  text-text-tertiary"}>Steps</span>
                {recentTools.map((step, i) => <span key={i} className={"  text-text-secondary"}>
                    {step.tool}({step.args})
                  </span>)}
              </div>}

            {recentOutput.length > 0 && !transcript && <div className="flex flex-col">
                <span className={"  text-text-tertiary"}>Output</span>
                {recentOutput.map((line, i) => <span key={`o-${i}`} className={"  text-text-secondary"}>
                    {line}
                  </span>)}
              </div>}

            {!!transcript && <div className="flex flex-col">
                {(recentTools.length > 0 || recentOutput.length > 0 || hasProgressMeta) && <span className={"  text-text-tertiary"}>Transcript</span>}
                <div className="flex flex-col">{markdownElements}</div>
              </div>}
          </div>
        </ToolSurface>
      </ToolBody>
    </div>;
});