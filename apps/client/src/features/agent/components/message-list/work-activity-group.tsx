import { memo, useEffect, useMemo, useState } from "react";
import { ListChecks } from "lucide-react";
import { formatTurnAction, summarizeTurnActions, type WorkStep } from "../../utils/turns";
import { isToolActive } from "../../utils/message-list";
import { ToolBody, ToolHeader } from "./tool-call/tool-disclosure";
import { WorkStepView } from "./work-step";
export const WorkActivityGroup = memo(function WorkActivityGroup({
  steps,
  isDark
}: {
  steps: WorkStep[];
  isDark: boolean;
}) {
  const running = steps.some(step => step.kind === "thinking" ? step.streaming : step.kind === "tools" && step.toolCalls.some(isToolActive));
  const [override, setOverride] = useState<boolean | null>(null);
  /**
   * Auto-open once, when work starts, and stay open for the rest of the turn.
   * Following `running` directly would re-collapse the panel in the gaps
   * between consecutive tools — and re-open it on the next one — while a
   * command's output is still streaming in, which reads as the panel flapping.
   */
  const [autoExpanded, setAutoExpanded] = useState(running);
  useEffect(() => {
    if (running) setAutoExpanded(true);
  }, [running]);
  const expanded = override ?? autoExpanded;
  const actions = useMemo(() => summarizeTurnActions(steps), [steps]);
  // A group with no tool calls is just thinking; the thinking block already
  // carries its own "Thought" header, so a second group header only repeats it.
  if (actions.length === 0) {
    return <div className="flex flex-col gap-3">
        {steps.map(step => <WorkStepView key={step.key} step={step} isDark={isDark} />)}
      </div>;
  }
  const label = actions.map(formatTurnAction).join(" · ");
  return <div className="flex flex-col gap-1.5">
      {/* Matches ToolBody's indent so the header glyph lines up with the steps. */}
      <div className="px-2">
        <ToolHeader expanded={expanded} expandable onToggle={() => setOverride(!expanded)} isDark={isDark} icon={ListChecks} aria-label={`${expanded ? "Collapse" : "Expand"} ${label}`}>
          <span className="truncate text-xs font-medium text-text-secondary">
            {label}
          </span>
        </ToolHeader>
      </div>
      <ToolBody expanded={expanded}>
        <div className="flex flex-col gap-1.5">
          {steps.map(step => <WorkStepView key={step.key} step={step} isDark={isDark} />)}
        </div>
      </ToolBody>
    </div>;
});
