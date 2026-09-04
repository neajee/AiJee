import { memo, useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Colors, Fonts } from "@/constants/theme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import type { ToolCallInfo } from "../../../types";
import { toolDisplayName } from "../../../utils/message-list";
import { ToolBody, ToolHeader, ToolSurface, TOOL_BODY_MAX_HEIGHT } from "./tool-disclosure";
import { ToolResultImages } from "./tool-result-images";

interface GenericToolCallProps {
  tc: ToolCallInfo;
  isDark: boolean;
}

export const GenericToolCall = memo(function GenericToolCall({
  tc,
  isDark,
}: GenericToolCallProps) {
  const colors = useThemeTokens();
  // Results stay collapsed by default, even while the tool is running.
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded((p) => !p), []);

  const hasImages = !!(tc.resultImages && tc.resultImages.length > 0);
  const resultText = tc.result || tc.partialResult || "";
  const hasResult = !!resultText;
  const name = toolDisplayName(tc.name);

  return (
    <View>
      <ToolHeader
        expanded={expanded}
        expandable={hasResult || hasImages}
        onToggle={toggle}
        isDark={isDark}
        accessibilityLabel={`${expanded ? "Collapse" : "Expand"} result of ${name}`}
      >
        <Text style={[styles.name, { color: colors.textSecondary }]} numberOfLines={1}>
          {name}
        </Text>
      </ToolHeader>

      {hasImages && <ToolResultImages images={tc.resultImages!} isDark={isDark} />}

      <ToolBody expanded={expanded && hasResult}>
        <ToolSurface isDark={isDark}>
          <ScrollView
            style={styles.scroll}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.resultText, { color: colors.textSecondary }]} selectable>
              {resultText}
            </Text>
          </ScrollView>
        </ToolSurface>
      </ToolBody>
    </View>
  );
});

const styles = StyleSheet.create({
  name: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
    fontWeight: "500",
    flexShrink: 1,
  },
  scroll: {
    maxHeight: TOOL_BODY_MAX_HEIGHT,
  },
  resultText: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: Fonts.mono,
  },
});
