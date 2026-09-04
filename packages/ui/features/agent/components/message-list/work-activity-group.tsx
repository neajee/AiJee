import { memo, useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { formatTurnAction, summarizeTurnActions, type WorkStep } from "../../utils/turns";
import { isToolActive } from "../../utils/message-list";
import { ToolBody, ToolHeader } from "./tool-call/tool-disclosure";
import { WorkStepView } from "./work-step";
import { styles } from "./styles";

export const WorkActivityGroup = memo(function WorkActivityGroup({
  steps,
  isDark,
}: {
  steps: WorkStep[];
  isDark: boolean;
}) {
  const colors = useThemeTokens();
  const running = steps.some((step) =>
    step.kind === "thinking"
      ? step.streaming
      : step.kind === "tools" && step.toolCalls.some(isToolActive),
  );
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
  const label = actions.length
    ? actions.map(formatTurnAction).join(" · ")
    : running
      ? "Thinking"
      : "Thought";

  return (
    <View style={styles.activityGroup}>
      <ToolHeader
        expanded={expanded}
        expandable
        onToggle={() => setOverride(!expanded)}
        isDark={isDark}
        accessibilityLabel={`${expanded ? "Collapse" : "Expand"} ${label}`}
      >
        <Text style={[styles.activityLabel, { color: colors.textSecondary }]} numberOfLines={1}>
          {label}
        </Text>
      </ToolHeader>
      <ToolBody expanded={expanded}>
        <View style={styles.activityBody}>
          {steps.map((step) => (
            <WorkStepView key={step.key} step={step} isDark={isDark} />
          ))}
        </View>
      </ToolBody>
    </View>
  );
});
