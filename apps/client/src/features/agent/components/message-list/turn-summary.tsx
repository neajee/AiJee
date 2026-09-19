import { toTailwind } from "@/styles/to-tailwind";
import { memo, useCallback, useMemo, useState } from "react";
import { useWorkspaceStore } from "@/features/workspace/store";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import type { TurnFileStats } from "../agent-types";
import { basename, relativePath, type TurnFileChange } from "../../utils/message-list";
import { ToolBody, ToolHeader, ToolSurface } from "./tool-call/tool-disclosure";
import { FileChangeRow } from "./file-change-row";
import { SUMMARY_BLOCKS, SUMMARY_ROW_HEIGHT, SUMMARY_SCROLL_AFTER, styles } from "./style-tokens";
export const TurnSummary = memo(function TurnSummary({
  stats,
  changes,
  isDark
}: {
  stats: TurnFileStats;
  changes: TurnFileChange[];
  isDark: boolean;
}) {
  const colors = useThemeTokens();
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded(prev => !prev), []);

  // Tool paths are absolute; the workspace root is what makes them readable.
  const root = useWorkspaceStore(s => {
    const id = s.selectedWorkspaceId;
    return s.workspaces.find(w => w.id === id)?.path ?? null;
  });

  // Biggest change first: the cap below means the tail may go unseen.
  const ordered = useMemo(() => [...changes].sort((a, b) => b.added + b.removed - (a.added + a.removed)), [changes]);
  const totalFiles = stats.filesEdited + stats.filesCreated;
  const addColor = isDark ? "#3FB950" : "#1A7F37";
  const removeColor = isDark ? "#F85149" : "#CF222E";
  const totalLines = stats.linesAdded + stats.linesRemoved;
  let addBlocks = 0;
  let removeBlocks = 0;
  if (totalLines > 0) {
    addBlocks = Math.max(stats.linesAdded > 0 ? 1 : 0, Math.round(stats.linesAdded / totalLines * SUMMARY_BLOCKS));
    removeBlocks = Math.max(stats.linesRemoved > 0 ? 1 : 0, SUMMARY_BLOCKS - addBlocks);
  } else if (stats.filesCreated > 0) {
    addBlocks = SUMMARY_BLOCKS;
  } else {
    addBlocks = Math.ceil(SUMMARY_BLOCKS / 2);
    removeBlocks = SUMMARY_BLOCKS - addBlocks;
  }
  if (totalFiles === 0) return null;
  const expandable = ordered.length > 0;
  return <div className={toTailwind(styles.summaryWrap)}>
      <ToolSurface isDark={isDark} padded={false}>
        <div className={toTailwind(styles.summaryHeader)}>
          <ToolHeader expanded={expanded} expandable={expandable} onToggle={toggle} isDark={isDark} aria-label={`${expanded ? "Collapse" : "Expand"} the list of changed files`}>
            <span className={toTailwind([styles.summaryTitle, {
            color: colors.textSecondary
          }])}>
              {totalFiles} {totalFiles === 1 ? "file" : "files"} changed
            </span>
            {/* Keeps the counts on the trailing edge, next to the chevron. */}
            <div className={toTailwind(styles.summarySpacer)} />
            <span className={toTailwind(styles.summaryLineCount)}>
              {stats.linesAdded > 0 && <span className={toTailwind({
              color: addColor
            })}>+{stats.linesAdded}</span>}
              {stats.linesAdded > 0 && stats.linesRemoved > 0 && " "}
              {stats.linesRemoved > 0 && <span className={toTailwind({
              color: removeColor
            })}>{"−"}{stats.linesRemoved}</span>}
            </span>
            <div className={toTailwind(styles.summaryBlocks)}>
              {Array.from({
              length: addBlocks
            }).map((_, i) => <div key={`a-${i}`} className={toTailwind([styles.summaryBlock, {
              backgroundColor: addColor
            }])} />)}
              {Array.from({
              length: removeBlocks
            }).map((_, i) => <div key={`r-${i}`} className={toTailwind([styles.summaryBlock, {
              backgroundColor: removeColor
            }])} />)}
            </div>
          </ToolHeader>
        </div>

        {expandable && <ToolBody expanded={expanded}>
            <div className={toTailwind([styles.summaryList, {
          borderTopColor: colors.border
        }])}
        // A turn can touch dozens of files; cap it like any tool body.
        nestedScrollEnabled scrollEnabled={ordered.length > SUMMARY_SCROLL_AFTER}>
              {ordered.map(change => <FileChangeRow key={change.path} change={change} root={root} addColor={addColor} removeColor={removeColor} isDark={isDark} />)}
            </div>
          </ToolBody>}
      </ToolSurface>
    </div>;
});
