import { GitBranch, ArrowUp, ArrowDown } from "lucide-react";
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
  behind
}: {
  branch: string;
  ahead: number;
  behind: number;
}) {
  const {
    textSecondary,
    textMuted
  } = useChangesTheme();
  return <div className={"block"}>
      <GitBranch size={12} color={textMuted} strokeWidth={2} />
      <span {...{
      title: branch
    }}>
        {branch}
      </span>
      {ahead > 0 && <div className={"block"}>
          <ArrowUp size={9} color={textMuted} strokeWidth={2.5} />
          <span>{ahead}</span>
        </div>}
      {behind > 0 && <div className={"block"}>
          <ArrowDown size={9} color={textMuted} strokeWidth={2.5} />
          <span>{behind}</span>
        </div>}
    </div>;
}
const styles = {
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: 180
  },
  branch: {
    flexShrink: 1,
    fontSize: 11.5,
    fontFamily: Fonts.sansMedium
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1
  },
  badgeText: {
    fontSize: 10,
    fontFamily: Fonts.mono
  }
} as const;
