import { Text, View } from 'tamagui';
import { memo, useState } from "react";
import { Pressable } from "react-native";
import { Colors, Fonts } from "@/constants/theme";
import { HAIRLINE_WIDTH } from "@/constants/layout";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import type { ChatMessage } from "../../types";
import { AssistantMarkdown } from "./assistant-markdown";

interface SystemMessageProps {
  message: ChatMessage;
  isDark: boolean;
}

export const SystemMessage = memo(function SystemMessage({
  message,
  isDark,
}: SystemMessageProps) {
  const colors = useThemeTokens();
  const [expanded, setExpanded] = useState(false);

  if (message.systemKind === "compaction") {
    return (
      <View style={styles.compactionWrap}>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Toggle compaction summary"
          onPress={() => setExpanded((value) => !value)}
          style={styles.compactionTrigger}
        >
          <Text style={[styles.compactionLabel, { color: colors.textTertiary }]}>
            上下文已压缩{message.compactionTokensBefore !== undefined ? ` · ${message.compactionTokensBefore.toLocaleString()} tokens` : ""}
          </Text>
        </Pressable>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        {expanded && message.text ? (
          <View style={styles.summary}>
            <AssistantMarkdown text={message.text} />
          </View>
        ) : null}
      </View>
    );
  }

  const label =
    message.systemKind === "bashExecution"
      ? `$ ${message.command || "command"}`
      : message.text || "System event";

  return (
    <View style={styles.container}>
      <View style={[styles.pill, { backgroundColor: colors.surfaceRaised }]}>
        <Text style={[styles.text, { color: colors.textTertiary }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
});

const styles = {
  container: {
    alignItems: "center",
    paddingTop: 6, paddingBottom: 6,
    paddingLeft: 16, paddingRight: 16,
  },
  pill: {
    borderRadius: 12,
    paddingLeft: 12, paddingRight: 12,
    paddingTop: 4, paddingBottom: 4,
    maxWidth: "80%",
  },
  text: {
    fontSize: 11,
    fontFamily: Fonts.mono,
  },
  compactionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    paddingLeft: 16, paddingRight: 16,
    paddingTop: 12, paddingBottom: 12,
  },
  divider: {
    flex: 1,
    height: HAIRLINE_WIDTH,
  },
  compactionTrigger: {
    paddingTop: 2, paddingBottom: 2,
  },
  compactionLabel: {
    fontSize: 11,
    fontFamily: Fonts.sansMedium,
  },
  summary: {
    width: "100%",
    paddingLeft: 12, paddingRight: 12,
    paddingTop: 6,
  },
} as const;
