import { memo, useCallback, useState } from "react";
import { Colors, Fonts } from "@/constants/theme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import type { ToolCallInfo } from "../agent-types";
import { toolDisplayName } from "../../../utils/message-list";
import { ToolBody, ToolHeader, ToolSurface, TOOL_BODY_MAX_HEIGHT } from "./tool-disclosure";
import { ToolResultImages } from "./tool-result-images";
interface GenericToolCallProps {
  tc: ToolCallInfo;
  isDark: boolean;
}
export const GenericToolCall = memo(function GenericToolCall({
  tc,
  isDark
}: GenericToolCallProps) {
  const colors = useThemeTokens();
  // Results stay collapsed by default, even while the tool is running.
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded(p => !p), []);
  const hasImages = !!(tc.resultImages && tc.resultImages.length > 0);
  const resultText = tc.result || tc.partialResult || "";
  const hasResult = !!resultText;
  const name = toolDisplayName(tc.name);
  return <div>
      <ToolHeader expanded={expanded} expandable={hasResult || hasImages} onToggle={toggle} isDark={isDark} aria-label={`${expanded ? "Collapse" : "Expand"} result of ${name}`}>
        <span className={"  text-text-secondary"}>
          {name}
        </span>
      </ToolHeader>

      {hasImages && <ToolResultImages images={tc.resultImages!} isDark={isDark} />}

      <ToolBody expanded={expanded && hasResult}>
        <ToolSurface isDark={isDark}>
          <div className={"block"} nestedScrollEnabled>
            <span className={"  text-text-secondary"} selectable>
              {resultText}
            </span>
          </div>
        </ToolSurface>
      </ToolBody>
    </div>;
});
const styles = {
  name: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
    fontWeight: "500",
    flexShrink: 1
  },
  scroll: {
    maxHeight: TOOL_BODY_MAX_HEIGHT
  },
  resultText: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: Fonts.mono
  }
} as const;
