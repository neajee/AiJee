import { useEffect } from "react";
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  ExternalLink,
  Github,
  Gitlab,
  Pencil,
  Pin,
  PinOff,
  SquarePen,
  Trash2,
} from "lucide-react-native";

import { Colors, Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useGitStatus, useNestedRepos } from "@pideck/client-sdk";
import { remotesToLinks, type RemoteLink } from "@/features/workspace/utils/git-remote-url";

/** Exported so callers can right-align the menu under an anchor button. */
export const MENU_WIDTH = 170;
const ITEM_HEIGHT = 33;
const MENU_PADDING = 8;
const SCREEN_MARGIN = 8;

type IconType = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
}>;

interface WorkspaceContextMenuProps {
  visible: boolean;
  /** Viewport coordinates of the click, long press, or anchor button. */
  x: number;
  y: number;
  /** When set, the menu offers pinning. */
  pinned?: boolean;
  /** Working tree of the project, used to offer its git remotes. */
  workspacePath?: string | null;
  onTogglePin?: () => void;
  onNewSession?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

/**
 * The workspace actions menu, opened by the row's ⋯ button, a right-click, or a
 * long press.
 *
 * It renders inside a `Modal` rather than next to the row it belongs to: the
 * sidebar hosting those rows lives in an `overflow: hidden` animated container,
 * and every React Native View is `position: relative`, so an absolutely
 * positioned menu would be measured against the row and then clipped away. A
 * modal escapes both, which also makes the coordinates viewport-based.
 */
export function WorkspaceContextMenu({
  visible,
  x,
  y,
  pinned,
  workspacePath,
  onTogglePin,
  onNewSession,
  onEdit,
  onDelete,
  onClose,
}: WorkspaceContextMenuProps) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Only asked for while the menu is up: the remotes are a menu detail, not
  // something the sidebar needs to keep warm.
  const cwd = visible ? workspacePath ?? null : null;
  const { data: gitData } = useGitStatus(cwd);
  const { repos: nestedRepos } = useNestedRepos(cwd);

  const repoLinks: (RemoteLink & { repoPath?: string })[] = [
    ...remotesToLinks(gitData?.remotes),
    ...(nestedRepos ?? []).flatMap((repo) =>
      remotesToLinks(repo.remotes).map((link) => ({
        ...link,
        repoPath: repo.path,
      })),
    ),
  ];

  const textPrimary = isDark ? "#fefdfd" : Colors[colorScheme].text;
  const textDanger = "#E5484D";
  const menuBg = isDark ? "#252525" : "#FFFFFF";
  const menuBorder = isDark ? "#3b3a39" : "rgba(0,0,0,0.12)";
  const hoverBg = isDark ? "#333" : "#F0F0F0";

  // While the menu is open, a right-click anywhere dismisses it instead of
  // stacking the browser's own menu on top.
  useEffect(() => {
    if (!visible || Platform.OS !== "web") return;
    const handler = (event: Event) => {
      event.preventDefault();
      onClose();
    };
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, [visible, onClose]);

  if (!visible) return null;

  const itemCount =
    2 +
    (onTogglePin ? 1 : 0) +
    (onNewSession ? 1 : 0) +
    repoLinks.length;
  const menuHeight = itemCount * ITEM_HEIGHT + MENU_PADDING * 2;
  // Flip near the edges so the menu never opens partly offscreen.
  const left = Math.max(
    SCREEN_MARGIN,
    Math.min(x, screenWidth - MENU_WIDTH - SCREEN_MARGIN),
  );
  const top = Math.max(
    SCREEN_MARGIN,
    Math.min(y, screenHeight - menuHeight - SCREEN_MARGIN),
  );

  const separator = (
    <View style={[styles.separator, { backgroundColor: menuBorder }]} />
  );

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityLabel="关闭菜单"
      />
      <View
        style={[
          styles.menu,
          { top, left, backgroundColor: menuBg, borderColor: menuBorder },
        ]}
      >
        {onNewSession && (
          <MenuItem
            icon={SquarePen}
            label="新对话"
            color={textPrimary}
            hoverBg={hoverBg}
            onPress={() => {
              onClose();
              onNewSession();
            }}
          />
        )}
        {onNewSession && separator}
        {repoLinks.length > 0 && (
          <>
            {repoLinks.map((link, i) => (
              <MenuItem
                key={`${link.browserUrl}-${i}`}
                icon={
                  link.host === "github"
                    ? Github
                    : link.host === "gitlab"
                      ? Gitlab
                      : ExternalLink
                }
                label={
                  link.repoPath
                    ? `${link.label}: ${link.repoPath.split("/").pop()}`
                    : `在 ${link.label} 打开`
                }
                color={textPrimary}
                hoverBg={hoverBg}
                onPress={() => {
                  onClose();
                  Linking.openURL(link.browserUrl);
                }}
              />
            ))}
            {separator}
          </>
        )}
        {onTogglePin && (
          <MenuItem
            icon={pinned ? PinOff : Pin}
            label={pinned ? "取消置顶" : "置顶"}
            color={textPrimary}
            hoverBg={hoverBg}
            onPress={() => {
              onClose();
              onTogglePin();
            }}
          />
        )}
        <MenuItem
          icon={Pencil}
          label="编辑"
          color={textPrimary}
          hoverBg={hoverBg}
          onPress={() => {
            onClose();
            onEdit();
          }}
        />
        {separator}
        <MenuItem
          icon={Trash2}
          label="删除"
          color={textDanger}
          hoverBg={hoverBg}
          onPress={() => {
            onClose();
            onDelete();
          }}
        />
      </View>
    </Modal>
  );
}

function MenuItem({
  icon: Icon,
  label,
  color,
  hoverBg,
  onPress,
}: {
  icon: IconType;
  label: string;
  color: string;
  hoverBg: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      style={({ pressed, hovered }: any) => [
        styles.menuItem,
        (pressed || hovered) && { backgroundColor: hoverBg },
      ]}
    >
      <Icon size={14} color={color} strokeWidth={1.8} />
      <Text style={[styles.menuText, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: "absolute",
    zIndex: 1000,
    width: MENU_WIDTH,
    borderRadius: 8,
    borderWidth: 0.633,
    paddingVertical: MENU_PADDING / 2,
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
    elevation: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  menuText: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
  separator: {
    height: 0.633,
    marginHorizontal: 8,
  },
});
