import { memo } from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useStableMarkdown } from "../../hooks/use-stable-markdown";
import { markedDarkOptions, markedLightOptions } from "../../theme";

interface AssistantMarkdownProps {
  text: string;
  isStreaming?: boolean;
}

/**
 * Renders assistant markdown. Shared by the final answer and by the narration
 * captured inside a turn's collapsed work history.
 */
export const AssistantMarkdown = memo(function AssistantMarkdown({
  text,
  isStreaming,
}: AssistantMarkdownProps) {
  const colorScheme = useColorScheme() ?? "light";
  const options = colorScheme === "dark" ? markedDarkOptions : markedLightOptions;
  const elements = useStableMarkdown(text, options, isStreaming);
  return <>{elements}</>;
});
