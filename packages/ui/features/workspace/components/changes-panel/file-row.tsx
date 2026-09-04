import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { STATUS_COLORS, statusLabel } from "../../utils/changes-panel";
import { DiffView } from "./diff-view";
import { FileTypeBadge } from "../file-type-badge";

/** Reserved on touch, where there is no hover to overlay the actions on. */
export const ROW_ACTIONS_WIDTH = 50;

/**
 * One changed file.
 *
 * The path leads and the filename ends it in full: the directory is context and
 * may lose its middle, the name never does. Churn sits right after the name
 * rather than in a far-right column, so a row reads as one phrase.
 */
export function FileRow({
  path,
  status,
  additions,
  deletions,
  isSelected,
  diffContent,
  diffLoading,
  onPress,
  textPrimary,
  textMuted,
  hoverBg,
  dividerColor,
  actions,
}: {
  path: string;
  status: string;
  additions?: number;
  deletions?: number;
  isSelected?: boolean;
  diffContent?: string | null;
  diffLoading?: boolean;
  onPress?: () => void;
  textPrimary: string;
  textMuted: string;
  hoverBg: string;
  dividerColor: string;
  actions?: React.ReactNode;
}) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const isWeb = Platform.OS === "web";
  const selectedBg = isDark ? "#1e1e1e" : "#E8E8E8";

  const slash = path.lastIndexOf("/");
  const dir = slash >= 0 ? path.slice(0, slash) : "";
  const name = slash >= 0 ? path.slice(slash) : path;

  // Modified is the default state of a working tree, so only the states that
  // change what exists get a letter.
  const badge = statusLabel(status);
  const showBadge = badge !== "M";
  const badgeColor = STATUS_COLORS[badge] ?? textMuted;

  // Hover lives on the wrapper so moving onto an action button keeps it up.
  const [hovered, setHovered] = useState(false);

  return (
    <View
      {...(isWeb
        ? {
            onPointerEnter: () => setHovered(true),
            onPointerLeave: () => setHovered(false),
          }
        : {})}
    >
      <Pressable
        onPress={onPress}
        {...{ title: path }}
        accessibilityLabel={`${path} (${status})`}
        style={({ pressed, hovered: rowHovered }: any) => [
          styles.fileRow,
          { borderBottomColor: dividerColor },
          isSelected && { backgroundColor: selectedBg },
          !isSelected && (pressed || rowHovered) && { backgroundColor: hoverBg },
        ]}
      >
        <FileTypeBadge path={path} fallbackColor={textMuted} />

        {/* Only the directory may be cut, and it is cut from its own end so the
            filename beside it always shows whole. */}
        {dir.length > 0 && (
          <Text
            style={[styles.dirText, { color: textMuted }]}
            numberOfLines={1}
          >
            {dir}
          </Text>
        )}
        <Text style={[styles.nameText, { color: textPrimary }]} numberOfLines={1}>
          {name}
        </Text>

        {(additions ?? 0) > 0 && (
          <Text style={[styles.stat, { color: "#26A269" }]}>+{additions}</Text>
        )}
        {(deletions ?? 0) > 0 && (
          <Text style={[styles.stat, { color: "#E5484D" }]}>−{deletions}</Text>
        )}
        {showBadge && (
          <Text style={[styles.statusBadge, { color: badgeColor }]}>
            {badge}
          </Text>
        )}

        <View style={styles.filler} />

        {actions &&
          (isWeb ? (
            // Hovering means a pointer, and a pointer means the metadata can be
            // covered for a moment instead of surrendering 50px on every row.
            <View
              style={[
                styles.fileActionsOverlay,
                { backgroundColor: isSelected ? selectedBg : hoverBg },
                !hovered && ({ opacity: 0, pointerEvents: "none" } as any),
              ]}
            >
              {actions}
            </View>
          ) : (
            <View style={styles.fileActionsWrap}>{actions}</View>
          ))}
      </Pressable>

      {isSelected && (
        <View
          style={[
            styles.diffContainer,
            { backgroundColor: isDark ? "#111" : "#F4F4F4" },
          ]}
        >
          {diffLoading ? (
            <ActivityIndicator style={{ paddingVertical: 12 }} size="small" />
          ) : diffContent ? (
            <DiffView diff={diffContent} />
          ) : (
            <Text style={[styles.diffEmpty, { color: textMuted }]}>
              No diff available
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 4,
    paddingRight: 8,
    minHeight: 30,
    borderBottomWidth: 0.633,
  },
  dirText: {
    flexShrink: 1,
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  nameText: {
    flexShrink: 0,
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
  },
  stat: {
    marginLeft: 6,
    fontSize: 11,
    fontFamily: Fonts.mono,
  },
  statusBadge: {
    marginLeft: 6,
    fontSize: 10.5,
    fontFamily: Fonts.mono,
  },
  filler: {
    flexGrow: 1,
    flexShrink: 0,
    minWidth: 8,
  },
  fileActionsWrap: {
    width: ROW_ACTIONS_WIDTH,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  fileActionsOverlay: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  diffContainer: {
    marginHorizontal: 8,
    marginBottom: 4,
    borderRadius: 6,
    overflow: "hidden",
    maxHeight: 300,
  },
  diffEmpty: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    textAlign: "center",
    paddingVertical: 12,
  },
});
