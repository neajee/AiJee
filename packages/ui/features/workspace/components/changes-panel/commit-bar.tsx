import { Input, Spinner, View } from 'tamagui';
import { useRef } from "react";
import { Pressable } from "react-native";
import type { TextInput as RNTextInput } from "react-native";
import { Send } from "lucide-react-native";

import { Fonts } from "@/constants/theme";
import { useChangesTheme } from "../../hooks/use-changes-theme";

export function CommitBar({
  stagedCount,
  commitMsg,
  onChangeCommitMsg,
  onCommit,
  isCommitting,
}: {
  stagedCount: number;
  commitMsg: string;
  onChangeCommitMsg: (msg: string) => void;
  onCommit: () => void;
  isCommitting: boolean;
}) {
  const { isDark, textPrimary, textMuted, dividerColor, inputBg, inputBorder, sendColor } =
    useChangesTheme();
  const commitInputRef = useRef<RNTextInput>(null);

  return (
    <View style={[styles.commitBar, { borderTopColor: dividerColor }]}>
      <View
        style={[
          styles.commitInputBox,
          { backgroundColor: inputBg, borderColor: inputBorder },
        ]}
      >
        <Input
          ref={commitInputRef}
          style={[styles.commitTextarea, { color: textPrimary }]}
          value={commitMsg}
          onChangeText={onChangeCommitMsg}
          placeholder={`Commit message for ${stagedCount} staged file${stagedCount !== 1 ? "s" : ""}...`}
          placeholderTextColor={textMuted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          editable={!isCommitting}
        />
        <View style={styles.commitActions}>
          {isCommitting ? (
            <Spinner size="small" />
          ) : (
            <Pressable
              onPress={onCommit}
              disabled={!commitMsg.trim()}
              accessibilityLabel="Commit"
              {...{ title: "Commit" }}
              style={({ pressed }: any) => [
                styles.commitSendButton,
                {
                  backgroundColor: commitMsg.trim()
                    ? sendColor
                    : isDark
                      ? "#333"
                      : "#CCC",
                },
                pressed && commitMsg.trim() && { opacity: 0.8 },
              ]}
            >
              <Send
                size={13}
                color={
                  commitMsg.trim()
                    ? isDark
                      ? "#121212"
                      : "#FFFFFF"
                    : textMuted
                }
                strokeWidth={2}
              />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = {
  commitBar: {
    paddingLeft: 10, paddingRight: 10,
    paddingTop: 8, paddingBottom: 8,
    borderTopWidth: 0.633,
  },
  commitInputBox: {
    borderWidth: 0.633,
    borderRadius: 8,
    overflow: "hidden",
  },
  commitTextarea: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    paddingLeft: 10, paddingRight: 10,
    paddingTop: 8,
    paddingBottom: 4,
    minHeight: 64,
    maxHeight: 100,
    outlineStyle: "none",
  } as any,
  commitActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingLeft: 8, paddingRight: 8,
    paddingBottom: 6,
  },
  commitSendButton: {
    width: 30,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
} as const;
