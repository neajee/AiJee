import { useCallback } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useFileList, type FsEntry } from '@aijee/client-sdk';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FileTypeBadge } from '../file-type-badge';
import { applyFilter } from '../../utils/file-tree';
import type { FileTreeNodeProps } from './component-types';
import { NODE_INDENT, NODE_STEP } from '../../utils/file-tree-constants';
export function FileTreeNode({
  entry,
  depth,
  onFilePress,
  expandedDirs,
  onToggleDir,
  query,
  selectedPath
}: {
  entry: FsEntry;
  depth: number;
  onFilePress: (path: string) => void;
  expandedDirs: Set<string>;
  onToggleDir: (path: string) => void;
  query: string;
  selectedPath: string | null;
}) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const isDark = colorScheme === "dark";
  const textPrimary = isDark ? "#fefdfd" : colors.text;
  const textMuted = isDark ? "#cdc8c5" : colors.textTertiary;
  const hoverBg = isDark ? "#252525" : "#E8E8E8";
  const selectedBg = isDark ? "#2d2d2d" : "#DEDEDE";
  // Directories are told apart by the caret and the heavier name alone, so no
  // saturated folder icon competes with the name; files show their kind.
  const iconColor = isDark ? "#6f6b69" : "#B0B0B0";
  const expanded = entry.is_dir && expandedDirs.has(entry.path);
  const isSelected = !entry.is_dir && entry.path === selectedPath;
  const handlePress = useCallback(() => {
    if (entry.is_dir) {
      onToggleDir(entry.path);
    } else {
      onFilePress(entry.path);
    }
  }, [entry, onFilePress, onToggleDir]);
  return <div>
      <button onClick={handlePress} {...{
      title: entry.path
    }}>
        {/* One glyph slot per row, bolt's: a caret for directories, the file's
            kind for files, so names line up at the same x within a level. */}
        {entry.is_dir ? <div className={""}>
            {expanded ? <ChevronDown size={13} color={textMuted} strokeWidth={2} /> : <ChevronRight size={13} color={textMuted} strokeWidth={2} />}
          </div> : <FileTypeBadge path={entry.path} fallbackColor={iconColor} />}
        <span className={"" + " " + "" + " " + (entry.is_dir ? "" : "")}>
          {entry.name}
        </span>
      </button>
      {expanded && <ExpandedDir dirPath={entry.path} depth={depth + 1} onFilePress={onFilePress} expandedDirs={expandedDirs} onToggleDir={onToggleDir} query={query} selectedPath={selectedPath} />}
    </div>;
}
function ExpandedDir({
  dirPath,
  depth,
  onFilePress,
  expandedDirs,
  onToggleDir,
  query,
  selectedPath
}: {
  dirPath: string;
  depth: number;
  onFilePress: (path: string) => void;
  expandedDirs: Set<string>;
  onToggleDir: (path: string) => void;
  query: string;
  selectedPath: string | null;
}) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const textMuted = isDark ? "#cdc8c5" : Colors[colorScheme].textTertiary;
  const {
    entries,
    isLoading
  } = useFileList(dirPath);
  if (isLoading) {
    return <div className={"pl-[0] pt-[4px] pb-[4px]"}>
        <span size="small" />
      </div>;
  }
  if (!entries || entries.length === 0) {
    return <span className={"" + " " + "pl-[0]"}>
        Empty
      </span>;
  }
  const sorted = applyFilter(entries, query, expandedDirs).sort((a, b) => {
    if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return <div>
      {sorted.map(entry => <FileTreeNode key={entry.path} entry={entry} depth={depth} onFilePress={onFilePress} expandedDirs={expandedDirs} onToggleDir={onToggleDir} query={query} selectedPath={selectedPath} />)}
    </div>;
}
