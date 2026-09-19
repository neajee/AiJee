import { toTailwind } from "@/styles/to-tailwind";
import { memo } from "react";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { basename, relativePath, type TurnFileChange } from "../../utils/message-list";
import { styles } from "./style-tokens";
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
  return <div className={toTailwind(styles.fileRow)}>
      <span className={toTailwind([styles.fileKind, {
      color: created ? addColor : colors.textTertiary
    }])} aria-label={created ? "created" : "edited"}>
        {created ? "A" : "M"}
      </span>
      {/* Head-truncated with a dimmed directory: the filename is what is read. */}
      <span className={toTailwind(styles.filePath)} ellipsizeMode="head">
        {dir ? <span className={toTailwind({
        color: colors.textTertiary
      })}>{dir}</span> : null}
        <span className={toTailwind({
        color: colors.text
      })}>{name}</span>
      </span>
      <div className={toTailwind(styles.fileCounts)}>
        {change.added > 0 && <span className={toTailwind([styles.fileCount, {
        color: addColor
      }])}>+{change.added}</span>}
        {change.removed > 0 && <span className={toTailwind([styles.fileCount, {
        color: removeColor
      }])}>{"−"}{change.removed}</span>}
      </div>
    </div>;
});
