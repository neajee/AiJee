import { memo } from "react";
import { AssistantMarkdown } from "./assistant-markdown";
import { ToolCallGroup } from "./tool-call";
import { ThinkingBlock } from "./thinking-block";
import type { WorkStep } from "../../utils/turns";
export const WorkStepView = memo(function WorkStepView({
  step,
  isDark
}: {
  step: WorkStep;
  isDark: boolean;
}) {
  switch (step.kind) {
    case "thinking":
      return <ThinkingBlock text={step.text} isStreaming={step.streaming} isDark={isDark} />;
    case "text":
      return <div className="flex flex-col">
          <AssistantMarkdown text={step.text} />
        </div>;
    case "error":
      return <span className={"  text-destructive"}>
          {step.text}
        </span>;
    case "tools":
      return <ToolCallGroup toolCalls={step.toolCalls} isDark={isDark} />;
  }
});
