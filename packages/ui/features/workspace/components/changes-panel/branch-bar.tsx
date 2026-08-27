import { StyleSheet, Text, View } from "react-native";
import { GitBranch, ArrowUp, ArrowDown } from "lucide-react-native";

import { Fonts } from "@/constants/theme";
import { useChangesTheme } from "./use-theme-colors";

export function BranchBar({
  branch,
  ahead,
  behind,
}: {
  branch: string;
  ahead: number;
  behind: number;
}) {
  const { textPrimary, textMuted, dividerColor } = useChangesTheme();

  return (
    <View style={[styles.branchBar, { borderBottomColor: dividerColor }]}>
      <GitBranch size={13} color={textMuted} strokeWidth={2} />
      <Text
        style={[styles.branchText, { color: textPrimary }]}
        numberOfLines={1}
      >
        {branch}
      </Text>
      {(ahead > 0 || behind > 0) && (
        <View style={styles.syncInfo}>
          {ahead > 0 && (
            <View style={styles.syncBadge}>
              <ArrowUp size={10} color={textMuted} strokeWidth={2.5} />
              <Text style={[styles.syncText, { color: textMuted }]}>
                {ahead}
              </Text>
            </View>
          )}
          {behind > 0 && (
            <View style={styles.syncBadge}>
              <ArrowDown size={10} color={textMuted} strokeWidth={2.5} />
              <Text style={[styles.syncText, { color: textMuted }]}>
                {behind}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  branchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 28,
    borderBottomWidth: 0.633,
  },
  branchText: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
    flex: 1,
  },
  syncInfo: {
    flexDirection: "row",
    gap: 6,
  },
  syncBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  syncText: {
    fontSize: 11,
    fontFamily: Fonts.sansMedium,
  },
});
