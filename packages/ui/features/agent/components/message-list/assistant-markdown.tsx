import { memo } from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { useAppSettingsStore } from "@/features/settings/store";
import { useStableMarkdown } from "../../hooks/use-stable-markdown";
import { createMarkedOptions } from "../../theme";

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
  const tokens = useThemeTokens();
  const codeFontSize = useAppSettingsStore((s) => s.codeFontSize);
  const options = createMarkedOptions(tokens, colorScheme, codeFontSize);
  const elements = useStableMarkdown(text, options, isStreaming);
  return <>{elements}</>;
});
