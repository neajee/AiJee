import { View } from 'tamagui';
import { memo, useCallback, useState } from "react";
import { Text } from "tamagui";
import { Colors, Fonts } from "@/constants/theme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import type { ToolCallInfo } from "../../../types";
import { basename, parseToolArguments } from "../../../utils/message-list";
import { CodePreview } from "../code-preview";
import { ToolBody, ToolHeader, TOOL_BODY_MAX_HEIGHT } from "./tool-disclosure";
import { ToolResultImages } from "./tool-result-images";

interface ReadToolCallProps {
  tc: ToolCallInfo;
  isDark: boolean;
}

export const ReadToolCall = memo(function ReadToolCall({
  tc,
  isDark,
}: ReadToolCallProps) {
  const colors = useThemeTokens();
  // Results stay collapsed by default, even while the tool is running.
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded((p) => !p), []);

  const parsed = parseToolArguments(tc.arguments);
  const filePath = (parsed.path as string) || "";
  const fileName = basename(filePath);
  const offset = (parsed.offset as number) || 1;
  const content = tc.result || "";
  const hasImages = !!(tc.resultImages && tc.resultImages.length > 0);

  return (
    <View>
      <ToolHeader
        expanded={expanded}
        expandable={!!content}
        onToggle={toggle}
        isDark={isDark}
        accessibilityLabel={`${expanded ? "Collapse" : "Expand"} contents of ${fileName || "file"}`}
      >
        <Text style={[styles.fileName, { color: colors.textSecondary }]} numberOfLines={1}>
          Read {fileName || filePath || "file"}
        </Text>
      </ToolHeader>
      {hasImages && <ToolResultImages images={tc.resultImages!} isDark={isDark} />}
      <ToolBody expanded={expanded && !!content}>
        <CodePreview
          code={content}
          isDark={isDark}
          startLine={offset}
          maxHeight={TOOL_BODY_MAX_HEIGHT}
        />
      </ToolBody>
    </View>
  );
});

const styles = {
  fileName: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
    fontWeight: "500",
    flexShrink: 1,
  },
} as const;
