import { memo } from "react";
import { Text, View } from "react-native";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { AssistantMarkdown } from "./assistant-markdown";
import { ToolCallGroup } from "./tool-call";
import { ThinkingBlock } from "./thinking-block";
import type { WorkStep } from "../../utils/turns";
import { styles } from "./styles";

export const WorkStepView = memo(function WorkStepView({
  step,
  isDark,
}: {
  step: WorkStep;
  isDark: boolean;
}) {
  const colors = useThemeTokens();

  switch (step.kind) {
    case "thinking":
      return (
        <ThinkingBlock text={step.text} isStreaming={step.streaming} isDark={isDark} />
      );
    case "text":
      return (
        <View style={styles.stepText}>
          <AssistantMarkdown text={step.text} />
        </View>
      );
    case "error":
      return (
        <Text style={[styles.stepError, { color: colors.destructive }]}>
          {step.text}
        </Text>
      );
    case "tools":
      return (
        <ToolCallGroup
          toolCalls={step.toolCalls}
          isDark={isDark}
        />
      );
  }
});
