import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Check, Copy } from "lucide-react-native";
import { Colors, Fonts } from "@/constants/theme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { CodePreview } from "./code-preview";

interface MarkdownCodeBlockProps {
  code: string;
  language?: string;
  isDark: boolean;
}

/**
 * A fenced code block inside assistant prose.
 *
 * Deliberately different from the tool-call previews: a snippet in a reply is
 * read as prose, not inspected line by line, so there is no line-number
 * gutter. The header carries the language and a copy action, which is the only
 * thing anyone actually wants to do with a snippet in chat.
 */
export const MarkdownCodeBlock = memo(function MarkdownCodeBlock({
  code,
  language,
  isDark,
}: MarkdownCodeBlockProps) {
  const colors = useThemeTokens();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 1500);
  }, [code]);

  const label = (language || "").trim().toLowerCase();

  return (
    <View
      style={[
        styles.container,
        // borderStrong, not border: the block also appears nested inside tool
        // surfaces that already use surfaceRaised, where a 7% hairline vanishes.
        { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong },
      ]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.language, { color: colors.textTertiary }]} numberOfLines={1}>
          {label}
        </Text>
        <Pressable
          onPress={handleCopy}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={copied ? "Code copied" : "Copy code"}
          style={({ pressed }) => [
            styles.copyBtn,
            pressed && { backgroundColor: colors.border },
          ]}
        >
          {copied ? (
            <Check size={13} color={colors.textSecondary} strokeWidth={1.8} />
          ) : (
            <Copy size={13} color={colors.textTertiary} strokeWidth={1.8} />
          )}
        </Pressable>
      </View>

      <View style={styles.body}>
        <CodePreview code={code} language={language} isDark={isDark} showLineNumbers={false} bare />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    borderRadius: 8,
    borderWidth: 0.5,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 28,
    paddingLeft: 12,
    paddingRight: 6,
    borderBottomWidth: 0.5,
  },
  language: {
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: Fonts.mono,
    letterSpacing: 0.3,
  },
  copyBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  body: {
    paddingVertical: 8,
  },
});
