import { useState, type ReactNode } from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { DiffPreview } from "@/features/agent/components/message-list/code-preview";
import { splitUnifiedDiff } from "@/features/agent/utils/diff";
import { STATUS_COLORS, statusLabel } from "../../utils/changes-panel";
import { languageOf } from "../../utils/file-tree";
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
  onClick,
  textMuted,
  actions
}: {
  path: string;
  status: string;
  additions?: number;
  deletions?: number;
  isSelected?: boolean;
  diffContent?: string | null;
  diffLoading?: boolean;
  onClick?: () => void;
  textPrimary: string;
  textMuted: string;
  hoverBg: string;
  dividerColor: string;
  actions?: ReactNode;
}) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const slash = path.lastIndexOf("/");
  const dir = slash >= 0 ? path.slice(0, slash) : "";
  const name = slash >= 0 ? path.slice(slash + 1) : path;

  // Modified is the default state of a working tree, so only the states that
  // change what exists get a letter.
  const badge = statusLabel(status);
  const showBadge = badge !== "M";
  const badgeColor = STATUS_COLORS[badge] ?? textMuted;

  // Hover lives on the wrapper so moving onto an action button keeps it up.
  const [hovered, setHovered] = useState(false);
  const sides = diffContent ? splitUnifiedDiff(diffContent) : null;
  return <div className="border-b border-border" onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
      <button onClick={onClick} title={path} aria-label={`${path} (${status})`} className={`relative flex min-h-[30px] w-full items-center gap-1.5 py-1 pl-1 pr-2 text-left hover:bg-hover ${isSelected ? 'bg-active' : ''}`}>
        <FileTypeBadge path={path} fallbackColor={textMuted} />

        {/* Only the directory may be cut, and it is cut from its own end so the
            filename beside it always shows whole. */}
        {dir.length > 0 && <span className="min-w-0 shrink truncate text-caption text-text-tertiary">
            {dir}
          </span>}
        <span className="shrink-0 text-caption font-medium text-foreground">
          {name}
        </span>

        {(additions ?? 0) > 0 && <span className="shrink-0 font-mono text-meta text-success">+{additions}</span>}
        {(deletions ?? 0) > 0 && <span className="shrink-0 font-mono text-meta text-destructive">−{deletions}</span>}
        {showBadge && <span className="ml-1.5 shrink-0 font-mono text-meta" style={{ color: badgeColor }}>
            {badge}
          </span>}

        <div className="flex-1" />

        <div className="flex w-[50px] shrink-0 items-center justify-end gap-0.5">{hovered ? actions : null}</div>
      </button>

      {isSelected && <div className="mx-2 mb-1">
          {diffLoading ? <div className="flex justify-center py-3">
              <span className="size-3 animate-spin rounded-full border-2 border-border border-t-text-tertiary" />
            </div> : sides && (sides.oldValue || sides.newValue) ? <DiffPreview oldValue={sides.oldValue} newValue={sides.newValue} isDark={isDark} maxHeight={300} language={languageOf(path)} title={name} /> : <div className="py-3 text-center text-caption text-text-tertiary">
              No diff available
            </div>}
        </div>}
    </div>;
}
