import { memo, useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors, Fonts } from "@/constants/theme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import type { ToolCallInfo } from "../../../types";
import { basename, isToolActive, parseToolArguments, countLines } from "../utils";
import { CodePreview } from "../code-preview";
import { ToolBody, ToolHeader, TOOL_BODY_MAX_HEIGHT } from "./tool-disclosure";

interface WriteToolCallProps {
  tc: ToolCallInfo;
  isDark: boolean;
}

export const WriteToolCall = memo(function WriteToolCall({
  tc,
  isDark,
}: WriteToolCallProps) {
  const colors = useThemeTokens();
  const active = isToolActive(tc);
  // Results stay collapsed by default, even while the tool is running.
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded((p) => !p), []);

  const parsed = parseToolArguments(tc.arguments);
  const filePath = (parsed.path as string) || "";
  const fileName = basename(filePath);
  const content = (parsed.content as string) || "";
  const addedLines = countLines(content);
  const hasContent = !!content;
  const title = active ? "Writing" : "Wrote";

  return (
    <View>
      <ToolHeader
        expanded={expanded}
        expandable={hasContent}
        onToggle={toggle}
        isDark={isDark}
        accessibilityLabel={`${expanded ? "Collapse" : "Expand"} contents of ${fileName || "file"}`}
      >
        <Text style={[styles.fileName, { color: colors.textSecondary }]} numberOfLines={1}>
          {title} {fileName || filePath || "file"}
        </Text>
        {addedLines > 0 && (
          <Text style={[styles.metaAdd, { color: isDark ? "#3FB950" : "#1A7F37" }]}>
            +{addedLines}
          </Text>
        )}
      </ToolHeader>

      <ToolBody expanded={expanded && hasContent}>
        <CodePreview code={content} isDark={isDark} maxHeight={TOOL_BODY_MAX_HEIGHT} />
      </ToolBody>
    </View>
  );
});

const styles = StyleSheet.create({
  fileName: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
    fontWeight: "500",
    flexShrink: 1,
  },
  metaAdd: {
    fontSize: 10,
    fontFamily: Fonts.mono,
    flexShrink: 0,
  },
});
