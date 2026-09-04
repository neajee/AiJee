import { Text, View } from 'tamagui';

import { GitBranch, ArrowUp, ArrowDown } from "lucide-react-native";

import { Fonts } from "@/constants/theme";
import { useChangesTheme } from "../../hooks/use-changes-theme";

/**
 * The current branch, riding along at the end of the tab row.
 *
 * It is a label, not a control: nothing here needs pressing, so it costs no row
 * of its own.
 */
export function BranchLabel({
  branch,
  ahead,
  behind,
}: {
  branch: string;
  ahead: number;
  behind: number;
}) {
  const { textSecondary, textMuted } = useChangesTheme();

  return (
    <View style={styles.wrap}>
      <GitBranch size={12} color={textMuted} strokeWidth={2} />
      <Text
        style={[styles.branch, { color: textSecondary }]}
        numberOfLines={1}
        {...{ title: branch }}
      >
        {branch}
      </Text>
      {ahead > 0 && (
        <View style={styles.badge}>
          <ArrowUp size={9} color={textMuted} strokeWidth={2.5} />
          <Text style={[styles.badgeText, { color: textMuted }]}>{ahead}</Text>
        </View>
      )}
      {behind > 0 && (
        <View style={styles.badge}>
          <ArrowDown size={9} color={textMuted} strokeWidth={2.5} />
          <Text style={[styles.badgeText, { color: textMuted }]}>{behind}</Text>
        </View>
      )}
    </View>
  );
}

const styles = {
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: 180,
  },
  branch: {
    flexShrink: 1,
    fontSize: 11.5,
    fontFamily: Fonts.sansMedium,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: Fonts.mono,
  },
} as const;
