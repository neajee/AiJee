import { GitBranch, ArrowUp, ArrowDown } from "lucide-react";
import { Fonts } from "@/constants/theme";

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
  return <div className="flex min-w-0 items-center gap-1 text-caption text-text-secondary">
      <GitBranch size={12} className="text-text-tertiary" strokeWidth={2} />
      <span className="max-w-24 truncate" title={branch}>{branch}</span>
      {ahead > 0 && <span className="flex items-center gap-0.5">
          <ArrowUp size={9} className="text-text-tertiary" strokeWidth={2.5} />
          <span>{ahead}</span>
        </span>}
      {behind > 0 && <span className="flex items-center gap-0.5">
          <ArrowDown size={9} className="text-text-tertiary" strokeWidth={2.5} />
          <span>{behind}</span>
        </span>}
    </div>;
}
