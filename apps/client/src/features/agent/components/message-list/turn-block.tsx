import { memo, useCallback, useMemo, useState } from "react";
import { ChevronRight, GitFork } from "lucide-react";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { AssistantMessage, MessageToolbar } from "./assistant-message";
import { collectFileChanges } from "../../utils/message-list";
import { formatDuration, formatTps, groupWorkSteps, type TurnListItem } from "../../utils/turns";
import { TurnSummary } from "./turn-summary";
import { WorkActivityGroup } from "./work-activity-group";
import { WorkStepView } from "./work-step";
import { useTurnElapsed } from "../../hooks/use-turn-elapsed";

/**
 * A whole assistant turn: the work history behind one "Worked for X" divider,
 * plus the final answer. The divider auto-opens while the turn runs and stays
 * open once it has — the reader's place is not yanked away when the turn
 * settles or the next one starts — until they collapse it by hand.
 */
export const TurnBlock = memo(function TurnBlock({
  turn,
  isDark,
  active,
  onFork,
  forkingEntryId
}: {
  turn: TurnListItem;
  isDark: boolean;
  active: boolean;
  onFork?: (entryId: string) => void;
  forkingEntryId?: string | null;
}) {
  const colors = useThemeTokens();
  const [override, setOverride] = useState<boolean | null>(null);
  // Work details are collapsed by default; the final assistant answer remains visible.
  const expanded = override ?? false;
  const hasWork = turn.steps.length > 0;
  const toggle = useCallback(() => setOverride(!expanded), [expanded]);

  // The action row belongs to the whole turn, so hover is tracked here rather
  // than on the answer alone: the file-change card counts as part of it.
  const [hovered, setHovered] = useState(false);

  // Only worth deriving once the turn reports it touched something.
  const fileChanges = useMemo(() => {
    if (!turn.fileStats) return [];
    return collectFileChanges(turn.steps.flatMap(step => step.kind === "tools" ? step.toolCalls : []));
  }, [turn.fileStats, turn.steps]);
  const elapsedMs = useTurnElapsed(active, turn.startedAt);
  const settledMs = turn.durationMs && turn.durationMs > 0 ? turn.durationMs : null;
  const sections = useMemo(() => groupWorkSteps(turn.steps), [turn.steps]);
  const label = active ? "Working for" : settledMs ? "Worked for" : "Worked";
  const timeLabel = active ? formatDuration(Math.max(1000, elapsedMs)) : settledMs ? formatDuration(settledMs) : null;
  const showDivider = hasWork || active || !!settledMs;
  const forkEntryId = turn.final?.entryId ?? turn.sourceEntryId;
  const divider = <div className="flex w-full items-center px-4 py-2.5">
      <span className="h-px flex-1 bg-border opacity-60" />
      <span className="flex min-w-0 items-center gap-1 px-2 text-caption text-text-secondary">
        <span className="truncate">{label}</span>
        {timeLabel && <span className="font-mono text-meta text-text-tertiary">{timeLabel}</span>}
        {hasWork && <ChevronRight className={`shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} size={12} color={colors.textTertiary} strokeWidth={2} />}
      </span>
      <span className="h-px flex-1 bg-border opacity-60" />
    </div>;
  return <div className="flex flex-col gap-2" {...true ? {
    onPointerEnter: () => setHovered(true),
    onPointerLeave: () => setHovered(false)
  } : {}}>
      {showDivider && (hasWork ? <button onClick={toggle} role="button" aria-label={expanded ? "Collapse work details" : "Expand work details"}>
            {divider}
          </button> : divider)}

      {hasWork && expanded && <div className="ml-4 flex flex-col gap-1.5 border-l border-border pb-2.5 pl-3 pr-4 pt-0.5">
          {sections.map(section => section.kind === "activity" ? <WorkActivityGroup key={section.key} steps={section.steps} isDark={isDark} /> : <WorkStepView key={section.key} step={section.step} isDark={isDark} />)}
        </div>}

      {turn.final && <AssistantMessage message={turn.final} isDark={isDark} />}
      {turn.aborted && <span className="px-4 py-0.5 text-caption leading-[18px] text-text-tertiary">
          Stopped
        </span>}
      {turn.fileStats && <TurnSummary stats={turn.fileStats} changes={fileChanges} isDark={isDark} />}
      {/* Last in the turn: the answer, then what it changed, then the actions. */}
      {turn.final && !turn.final.isStreaming && (turn.final.text || turn.final.errorMessage) && <div className="flex items-center justify-between gap-1 px-4 pt-1.5">
          <div className="flex items-center gap-0.5">
            <MessageToolbar message={turn.final} isDark={isDark} hovered={hovered} />
            {forkEntryId && onFork && <button onClick={() => onFork(forkEntryId)} disabled={active || !!forkingEntryId} role="button" aria-label="Fork from this reply" className={`flex size-[26px] items-center justify-center rounded-md transition-opacity hover:bg-hover disabled:opacity-40 ${hovered ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
                {forkingEntryId === forkEntryId ? <span className="size-3 animate-spin rounded-full border-2 border-border border-t-text-tertiary" /> : <GitFork size={14} color={colors.textTertiary} strokeWidth={1.8} />}
              </button>}
          </div>
          {turn.tps !== undefined && <span className="whitespace-nowrap px-1 font-mono text-meta text-text-tertiary">{formatTps(turn.tps)}</span>}
        </div>}
    </div>;
});
