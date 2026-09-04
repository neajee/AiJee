import { memo } from "react";
import { Text, View } from "react-native";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { basename, relativePath, type TurnFileChange } from "../../utils/message-list";
import { styles } from "./styles";

export const FileChangeRow = memo(function FileChangeRow({
  change,
  root,
  addColor,
  removeColor,
  isDark,
}: {
  change: TurnFileChange;
  root: string | null;
  addColor: string;
  removeColor: string;
  isDark: boolean;
}) {
  const colors = useThemeTokens();
  const created = change.kind === "created";
  const shown = relativePath(change.path, root);
  const name = basename(shown);
  const dir = shown.slice(0, shown.length - name.length);

  return (
    <View style={styles.fileRow}>
      <Text
        style={[styles.fileKind, { color: created ? addColor : colors.textTertiary }]}
        accessibilityLabel={created ? "created" : "edited"}
      >
        {created ? "A" : "M"}
      </Text>
      {/* Head-truncated with a dimmed directory: the filename is what is read. */}
      <Text style={styles.filePath} numberOfLines={1} ellipsizeMode="head">
        {dir ? <Text style={{ color: colors.textTertiary }}>{dir}</Text> : null}
        <Text style={{ color: colors.text }}>{name}</Text>
      </Text>
      <View style={styles.fileCounts}>
        {change.added > 0 && (
          <Text style={[styles.fileCount, { color: addColor }]}>+{change.added}</Text>
        )}
        {change.removed > 0 && (
          <Text style={[styles.fileCount, { color: removeColor }]}>{"−"}{change.removed}</Text>
        )}
      </View>
    </View>
  );
});
