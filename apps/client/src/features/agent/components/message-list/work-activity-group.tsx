import { memo, useMemo, useState } from "react";
import { ListChecks } from "lucide-react";
import { formatTurnAction, summarizeTurnActions, type WorkStep } from "../../utils/turns";
import { ToolBody, ToolHeader } from "./tool-call/tool-disclosure";
import { WorkStepView } from "./work-step";
export const WorkActivityGroup = memo(function WorkActivityGroup({
  steps,
  isDark
}: {
  steps: WorkStep[];
  isDark: boolean;
}) {
  const [override, setOverride] = useState<boolean | null>(null);
  const expanded = override ?? false;
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
          <span className="truncate text-caption font-medium leading-4 text-text-secondary">
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
