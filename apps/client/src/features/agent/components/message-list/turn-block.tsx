import { toTailwind } from "@/styles/to-tailwind";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withTiming } from "@/platform/animation";
import { ChevronRight, GitFork } from "lucide-react";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { AssistantMessage, MessageToolbar } from "./assistant-message";
import { collectFileChanges } from "../../utils/message-list";
import { formatDuration, groupWorkSteps, type TurnListItem } from "../../utils/turns";
import { TurnSummary } from "./turn-summary";
import { WorkActivityGroup } from "./work-activity-group";
import { WorkStepView } from "./work-step";
import { useTurnElapsed } from "../../hooks/use-turn-elapsed";
import { styles } from "./style-tokens";

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
  /**
   * Once the turn is seen running, keep its work log open for the rest of its
   * life. Following `active` directly would collapse the log the moment the
   * turn finishes (or the next turn claims the list tail), taking the tool
   * output the reader was looking at with it.
   */
  const [autoExpanded, setAutoExpanded] = useState(active);
  useEffect(() => {
    if (active) setAutoExpanded(true);
  }, [active]);
  const expanded = override ?? autoExpanded;
  const hasWork = turn.steps.length > 0;
  const chevronRotate = useSharedValue(expanded ? 90 : 0);
  useEffect(() => {
    chevronRotate.value = withTiming(expanded ? 90 : 0, {
      duration: 180,
      easing: Easing.out(Easing.cubic)
    });
  }, [expanded, chevronRotate]);
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{
      rotate: `${chevronRotate.value}deg`
    }]
  }));
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
  const divider = <div className={toTailwind(styles.dividerWrap)}>
      <div className={toTailwind([styles.dividerLine, {
      backgroundColor: colors.border
    }])} />
      <div className={toTailwind(styles.dividerCenter)}>
        <span className={toTailwind([styles.dividerText, {
        color: colors.textTertiary
      }])}>
          {label}
        </span>
        {timeLabel && <span className={toTailwind([styles.dividerTime, {
        color: colors.textTertiary
      }])}>
            {timeLabel}
          </span>}
        {hasWork && <div className={toTailwind([styles.dividerChevron, chevronStyle])}>
            <ChevronRight size={12} color={colors.textTertiary} strokeWidth={2} />
          </div>}
      </div>
      <div className={toTailwind([styles.dividerLine, {
      backgroundColor: colors.border
    }])} />
    </div>;
  return <div {...true ? {
    onPointerEnter: () => setHovered(true),
    onPointerLeave: () => setHovered(false)
  } : {}}>
      {showDivider && (hasWork ? <button onClick={toggle} role="button" aria-label={expanded ? "Collapse work details" : "Expand work details"}>
            {divider}
          </button> : divider)}

      {hasWork && expanded && <div entering={FadeIn.duration(140)} className={toTailwind([styles.workLog, {
      borderLeftColor: colors.border
    }])}>
          {sections.map(section => section.kind === "activity" ? <WorkActivityGroup key={section.key} steps={section.steps} isDark={isDark} /> : <WorkStepView key={section.key} step={section.step} isDark={isDark} />)}
        </div>}

      {turn.final && <AssistantMessage message={turn.final} isDark={isDark} />}
      {turn.aborted && <span className={toTailwind([styles.turnNotice, {
      color: colors.textTertiary
    }])}>
          Stopped
        </span>}
      {turn.fileStats && <TurnSummary stats={turn.fileStats} changes={fileChanges} isDark={isDark} />}
      {/* Last in the turn: the answer, then what it changed, then the actions. */}
      {turn.final && !turn.final.isStreaming && (turn.final.text || turn.final.errorMessage) && <div className={toTailwind(styles.turnToolbar)}>
          <MessageToolbar message={turn.final} isDark={isDark} hovered={hovered} />
          {forkEntryId && onFork && <button onClick={() => onFork(forkEntryId)} disabled={active || !!forkingEntryId} role="button" aria-label="Fork from this reply" className={toTailwind(styles.actionButton)}>
              {forkingEntryId === forkEntryId ? <span size="small" color={colors.textTertiary} className={toTailwind({
          width: 12,
          height: 12
        })} /> : <GitFork size={14} color={colors.textTertiary} strokeWidth={1.8} />}
            </button>}
        </div>}
    </div>;
});
