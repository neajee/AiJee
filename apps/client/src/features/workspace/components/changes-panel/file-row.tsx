import { useState } from "react";
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
  actions
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
  const isWeb = true;
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
  return <div {...isWeb ? {
    onPointerEnter: () => setHovered(true),
    onPointerLeave: () => setHovered(false)
  } : {}}>
      <button onClick={onPress} {...{
      title: path
    }} aria-label={`${path} (${status})`}>
        <FileTypeBadge path={path} fallbackColor={textMuted} />

        {/* Only the directory may be cut, and it is cut from its own end so the
            filename beside it always shows whole. */}
        {dir.length > 0 && <span>
            {dir}
          </span>}
        <span>
          {name}
        </span>

        {(additions ?? 0) > 0 && <span>+{additions}</span>}
        {(deletions ?? 0) > 0 && <span>−{deletions}</span>}
        {showBadge && <span>
            {badge}
          </span>}

        <div className="flex flex-col" />

        {actions && (isWeb ?
      // Hovering means a pointer, and a pointer means the metadata can be
      // covered for a moment instead of surrendering 50px on every row.
      <div>
              {actions}
            </div> : <div className="flex flex-col">{actions}</div>)}
      </button>

      {isSelected && <div>
          {diffLoading ? <span className={"pt-[12px] pb-[12px]" + " size-3 animate-spin"} /> : diffContent ? <DiffView diff={diffContent} /> : <span>
              No diff available
            </span>}
        </div>}
    </div>;
}
const styles = {
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 4,
    paddingRight: 8,
    minHeight: 30,
    borderBottomWidth: 0.633
  },
  dirText: {
    flexShrink: 1,
    fontSize: 12,
    fontFamily: Fonts.sans
  },
  nameText: {
    flexShrink: 0,
    fontSize: 12,
    fontFamily: Fonts.sansMedium
  },
  stat: {
    marginLeft: 6,
    fontSize: 11,
    fontFamily: Fonts.mono
  },
  statusBadge: {
    marginLeft: 6,
    fontSize: 10.5,
    fontFamily: Fonts.mono
  },
  filler: {
    flexGrow: 1,
    flexShrink: 0,
    minWidth: 8
  },
  fileActionsWrap: {
    width: ROW_ACTIONS_WIDTH,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end"
  },
  fileActionsOverlay: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    paddingLeft: 8,
    paddingRight: 8,
    flexDirection: "row",
    alignItems: "center"
  },
  diffContainer: {
    marginLeft: 8,
    marginRight: 8,
    marginBottom: 4,
    borderRadius: 6,
    overflow: "hidden",
    maxHeight: 300
  },
  diffEmpty: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    textAlign: "center",
    paddingTop: 12,
    paddingBottom: 12
  }
} as const;
