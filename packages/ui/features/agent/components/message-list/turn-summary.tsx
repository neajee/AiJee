import { Text, View } from 'tamagui';
import { memo, useCallback, useMemo, useState } from "react";
import { ScrollView } from "tamagui";
import { useWorkspaceStore } from "@/features/workspace/store";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import type { TurnFileStats } from "../../types";
import { basename, relativePath, type TurnFileChange } from "../../utils/message-list";
import { ToolBody, ToolHeader, ToolSurface } from "./tool-call/tool-disclosure";
import { FileChangeRow } from "./file-change-row";
import { SUMMARY_BLOCKS, SUMMARY_ROW_HEIGHT, SUMMARY_SCROLL_AFTER, styles } from "./styles";

export const TurnSummary = memo(function TurnSummary({
  stats,
  changes,
  isDark,
}: {
  stats: TurnFileStats;
  changes: TurnFileChange[];
  isDark: boolean;
}) {
  const colors = useThemeTokens();
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded((prev) => !prev), []);

  // Tool paths are absolute; the workspace root is what makes them readable.
  const root = useWorkspaceStore((s) => {
    const id = s.selectedWorkspaceId;
    return s.workspaces.find((w) => w.id === id)?.path ?? null;
  });

  // Biggest change first: the cap below means the tail may go unseen.
  const ordered = useMemo(
    () =>
      [...changes].sort(
        (a, b) => b.added + b.removed - (a.added + a.removed),
      ),
    [changes],
  );

  const totalFiles = stats.filesEdited + stats.filesCreated;

  const addColor = isDark ? "#3FB950" : "#1A7F37";
  const removeColor = isDark ? "#F85149" : "#CF222E";

  const totalLines = stats.linesAdded + stats.linesRemoved;
  let addBlocks = 0;
  let removeBlocks = 0;
  if (totalLines > 0) {
    addBlocks = Math.max(stats.linesAdded > 0 ? 1 : 0, Math.round((stats.linesAdded / totalLines) * SUMMARY_BLOCKS));
    removeBlocks = Math.max(stats.linesRemoved > 0 ? 1 : 0, SUMMARY_BLOCKS - addBlocks);
  } else if (stats.filesCreated > 0) {
    addBlocks = SUMMARY_BLOCKS;
  } else {
    addBlocks = Math.ceil(SUMMARY_BLOCKS / 2);
    removeBlocks = SUMMARY_BLOCKS - addBlocks;
  }

  if (totalFiles === 0) return null;

  const expandable = ordered.length > 0;

  return (
    <View style={styles.summaryWrap}>
      <ToolSurface isDark={isDark} padded={false}>
        <View style={styles.summaryHeader}>
          <ToolHeader
            expanded={expanded}
            expandable={expandable}
            onToggle={toggle}
            isDark={isDark}
            accessibilityLabel={`${expanded ? "Collapse" : "Expand"} the list of changed files`}
          >
            <Text style={[styles.summaryTitle, { color: colors.textSecondary }]}>
              {totalFiles} {totalFiles === 1 ? "file" : "files"} changed
            </Text>
            {/* Keeps the counts on the trailing edge, next to the chevron. */}
            <View style={styles.summarySpacer} />
            <Text style={styles.summaryLineCount}>
              {stats.linesAdded > 0 && <Text style={{ color: addColor }}>+{stats.linesAdded}</Text>}
              {stats.linesAdded > 0 && stats.linesRemoved > 0 && " "}
              {stats.linesRemoved > 0 && <Text style={{ color: removeColor }}>{"−"}{stats.linesRemoved}</Text>}
            </Text>
            <View style={styles.summaryBlocks}>
              {Array.from({ length: addBlocks }).map((_, i) => (
                <View key={`a-${i}`} style={[styles.summaryBlock, { backgroundColor: addColor }]} />
              ))}
              {Array.from({ length: removeBlocks }).map((_, i) => (
                <View key={`r-${i}`} style={[styles.summaryBlock, { backgroundColor: removeColor }]} />
              ))}
            </View>
          </ToolHeader>
        </View>

        {expandable && (
          <ToolBody expanded={expanded}>
            <ScrollView
              style={[styles.summaryList, { borderTopColor: colors.border }]}
              contentContainerStyle={styles.summaryListContent}
              // A turn can touch dozens of files; cap it like any tool body.
              nestedScrollEnabled
              scrollEnabled={ordered.length > SUMMARY_SCROLL_AFTER}
              showsVerticalScrollIndicator={false}
            >
              {ordered.map((change) => (
                <FileChangeRow
                  key={change.path}
                  change={change}
                  root={root}
                  addColor={addColor}
                  removeColor={removeColor}
                  isDark={isDark}
                />
              ))}
            </ScrollView>
          </ToolBody>
        )}
      </ToolSurface>
    </View>
  );
});
