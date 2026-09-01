import { memo, useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Colors, Fonts } from "@/constants/theme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import type { ToolCallInfo } from "../../../types";
import { parseToolArguments, truncateOutput } from "../utils";
import { ToolBody, ToolHeader, ToolSurface, TOOL_BODY_MAX_HEIGHT } from "./tool-disclosure";
import { ToolResultImages } from "./tool-result-images";

interface BashToolCallProps {
  tc: ToolCallInfo;
  isDark: boolean;
}

export const BashToolCall = memo(function BashToolCall({
  tc,
  isDark,
}: BashToolCallProps) {
  const colors = useThemeTokens();
  // Results stay collapsed by default, even while the tool is running.
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded((p) => !p), []);

  const parsed = parseToolArguments(tc.arguments);
  const rawCommand = (parsed.command as string) || "";
  const cdMatch = rawCommand.match(/^cd\s+(.+?)\s*&&\s*(.+)/);
  const command = cdMatch ? cdMatch[2]!.trim() : rawCommand;
  const cdPath = cdMatch ? cdMatch[1]!.trim() : undefined;
  const output = tc.result || tc.partialResult || "";
  const { text: displayOutput, truncated } = truncateOutput(output);
  const hasOutput = !!displayOutput;

  return (
    <View>
      <ToolHeader
        expanded={expanded}
        expandable
        onToggle={toggle}
        isDark={isDark}
        accessibilityLabel={`${expanded ? "Collapse" : "Expand"} output of ${command || "bash"}`}
      >
        <Text style={[styles.ranLabel, { color: colors.textSecondary }]} numberOfLines={1}>
          Ran <Text style={[styles.command, { color: colors.text }]}>{command || "bash"}</Text>
          {cdPath ? (
            <Text>
              {" in "}
              <Text style={[styles.command, { color: colors.text }]}>{cdPath}</Text>
            </Text>
          ) : null}
        </Text>
      </ToolHeader>

      <ToolBody expanded={expanded}>
        <ToolSurface isDark={isDark}>
          <ScrollView
            style={styles.scroll}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.promptLine}>
              <Text style={[styles.promptChar, { color: colors.textTertiary }]}>{">"}</Text>
              <Text style={[styles.cmdText, { color: colors.text }]} selectable>
                {command}
              </Text>
            </View>
            {hasOutput && (
              <>
                <Text style={[styles.outputText, { color: colors.textSecondary }]} selectable>
                  {displayOutput}
                </Text>
                {truncated && (
                  <Text style={[styles.truncatedText, { color: colors.textTertiary }]}>
                    … output truncated
                  </Text>
                )}
              </>
            )}
          </ScrollView>
        </ToolSurface>
      </ToolBody>

      {tc.resultImages && tc.resultImages.length > 0 && (
        <ToolResultImages images={tc.resultImages} isDark={isDark} />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  ranLabel: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    flexShrink: 1,
  },
  command: {
    fontSize: 12,
    fontFamily: Fonts.mono,
  },
  scroll: {
    maxHeight: TOOL_BODY_MAX_HEIGHT,
  },
  promptLine: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },
  promptChar: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.mono,
    fontWeight: "700",
  },
  cmdText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.mono,
    flex: 1,
  },
  outputText: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: Fonts.mono,
  },
  truncatedText: {
    fontSize: 10,
    fontFamily: Fonts.mono,
    fontStyle: "italic",
    marginTop: 6,
  },
});
