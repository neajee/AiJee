import { useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Send } from "lucide-react-native";

import { Fonts } from "@/constants/theme";
import { useChangesTheme } from "./use-theme-colors";

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
  const commitInputRef = useRef<TextInput>(null);

  return (
    <View style={[styles.commitBar, { borderTopColor: dividerColor }]}>
      <View
        style={[
          styles.commitInputBox,
          { backgroundColor: inputBg, borderColor: inputBorder },
        ]}
      >
        <TextInput
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
            <ActivityIndicator size="small" />
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

const styles = StyleSheet.create({
  commitBar: {
    paddingHorizontal: 10,
    paddingVertical: 8,
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
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
    minHeight: 64,
    maxHeight: 100,
    outlineStyle: "none",
  } as any,
  commitActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  commitSendButton: {
    width: 30,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
});
