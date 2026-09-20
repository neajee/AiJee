import { memo } from "react";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { basename, relativePath, type TurnFileChange } from "../../utils/message-list";
export const FileChangeRow = memo(function FileChangeRow({
  change,
  root,
  addColor,
  removeColor,
  isDark
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
  return <div className={""}>
      <span className={"" + " " + ""} aria-label={created ? "created" : "edited"}>
        {created ? "A" : "M"}
      </span>
      {/* Head-truncated with a dimmed directory: the filename is what is read. */}
      <span className={""} ellipsizeMode="head">
        {dir ? <span className={""}>{dir}</span> : null}
        <span className={""}>{name}</span>
      </span>
      <div className={""}>
        {change.added > 0 && <span className={"" + " " + ""}>+{change.added}</span>}
        {change.removed > 0 && <span className={"" + " " + ""}>{"−"}{change.removed}</span>}
      </div>
    </div>;
});
