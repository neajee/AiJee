import { memo, useCallback, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Colors, Fonts } from "@/constants/theme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import type { ToolCallInfo } from "../../../types";
import { parseToolArguments, truncateOutput } from "../utils";
import { ToolBody, ToolHeader, ToolSurface } from "./tool-disclosure";
import { ToolResultImages } from "./tool-result-images";

interface BashToolCallProps {
  tc: ToolCallInfo;
  isDark: boolean;
}

/**
 * Command output is the turn's primary artifact, so it gets more room than the
 * generic tool body cap: ~26 lines instead of ~16, and anything longer scrolls
 * with a visible indicator. The data layer still truncates at 50 lines so a
 * runaway `cat` cannot render megabytes into the list.
 */
const BASH_OUTPUT_MAX_HEIGHT = 420;

export const BashToolCall = memo(function BashToolCall({
  tc,
  isDark,
}: BashToolCallProps) {
  const colors = useThemeTokens();
  // Results stay collapsed by default, even while the tool is running.
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded((p) => !p), []);
  // While streaming, the panel tracks the tail of the output so the reader
  // always sees the newest lines; dragging inside the panel stops the chase.
  const scrollRef = useRef<ScrollView>(null);
  const followTailRef = useRef(true);
  const handleOutputGrowth = useCallback(() => {
    if (expanded && followTailRef.current) {
      scrollRef.current?.scrollToEnd({ animated: false });
    }
  }, [expanded]);
  const stopFollowing = useCallback(() => {
    followTailRef.current = false;
  }, []);

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
        expandable={hasOutput}
        onToggle={toggle}
        isDark={isDark}
        accessibilityLabel={`${expanded ? "Collapse" : "Expand"} output of ${command || "bash"}`}
      >
        <Text
          style={[styles.ranLabel, { color: colors.textSecondary }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          Ran <Text style={[styles.command, { color: colors.text }]}>{command || "bash"}</Text>
          {cdPath ? (
            <Text>
              {" in "}
              <Text style={[styles.command, { color: colors.text }]}>{cdPath}</Text>
            </Text>
          ) : null}
        </Text>
      </ToolHeader>

      {hasOutput && (
        <ToolBody expanded={expanded}>
          <ToolSurface isDark={isDark}>
            <ScrollView
              ref={scrollRef}
              style={styles.scroll}
              nestedScrollEnabled
              showsVerticalScrollIndicator
              onContentSizeChange={handleOutputGrowth}
              onScrollBeginDrag={stopFollowing}
            >
              <Text style={[styles.outputText, { color: colors.textSecondary }]} selectable>
                {displayOutput}
              </Text>
              {truncated && (
                <Text style={[styles.truncatedText, { color: colors.textTertiary }]}>
                  … output truncated
                </Text>
              )}
            </ScrollView>
          </ToolSurface>
        </ToolBody>
      )}

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
    maxHeight: BASH_OUTPUT_MAX_HEIGHT,
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
