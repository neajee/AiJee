import { memo } from "react";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
interface AssistantMarkdownProps {
  text: string;
  isStreaming?: boolean;
}

/**
 * Renders assistant markdown with Streamdown. It handles incomplete markdown
 * while a response streams, highlights code with Shiki, and sanitises the
 * output, so callers only supply the accumulated text and whether it is still
 * growing.
 */
export const AssistantMarkdown = memo(function AssistantMarkdown({
  text,
  isStreaming
}: AssistantMarkdownProps) {
  return <Streamdown
    className="aijee-markdown"
    mode={isStreaming ? "streaming" : "static"}
    isAnimating={!!isStreaming}
    caret={isStreaming ? "block" : undefined}
    shikiTheme={["min-light", "github-dark"]}
    plugins={{ code }}
    // Copying is the only action a snippet needs; tables need no chrome at all.
    controls={{
      code: { copy: true, download: false },
      table: false
    }}
  >
    {text}
  </Streamdown>;
});
