import { useCallback } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useFileList, type FsEntry } from '@aijee/client-sdk';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { FileTypeBadge } from '../file-type-badge';
import { applyFilter } from '../../utils/file-tree';
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
  const colors = useThemeTokens();
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
      <button onClick={handlePress} title={entry.path} style={{ paddingLeft: NODE_INDENT + depth * NODE_STEP }} className={`flex min-h-[22px] w-full items-center gap-1.5 py-0.5 pr-1.5 text-left text-[13px] hover:bg-hover ${isSelected ? 'bg-active' : ''}`}>
        {/* One glyph slot per row: a caret for directories, the file's kind for
            files, so names line up at the same x within a level. */}
        <span className="flex w-[22px] shrink-0 items-center justify-center">
          {entry.is_dir ? expanded ? <ChevronDown size={13} strokeWidth={2} className="text-text-tertiary" /> : <ChevronRight size={13} strokeWidth={2} className="text-text-tertiary" /> : <FileTypeBadge path={entry.path} fallbackColor={colors.textTertiary} />}
        </span>
        <span className={`min-w-0 flex-1 truncate ${entry.is_dir ? 'font-medium text-foreground' : isSelected ? 'text-foreground' : 'text-text-secondary'}`}>
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
  const {
    entries,
    isLoading
  } = useFileList(dirPath);
  if (isLoading) {
    return <div className="flex py-1" style={{ paddingLeft: NODE_INDENT + depth * NODE_STEP }}>
        <span className="size-3 animate-spin rounded-full border-2 border-border border-t-text-tertiary" />
      </div>;
  }
  if (!entries || entries.length === 0) {
    return <span className="block py-1 text-xs italic text-text-tertiary" style={{ paddingLeft: NODE_INDENT + depth * NODE_STEP }}>
        Empty
      </span>;
  }
  const sorted = applyFilter(entries, query, expandedDirs).sort((a, b) => {
    if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return <div className="flex flex-col">
      {sorted.map(entry => <FileTreeNode key={entry.path} entry={entry} depth={depth} onFilePress={onFilePress} expandedDirs={expandedDirs} onToggleDir={onToggleDir} query={query} selectedPath={selectedPath} />)}
    </div>;
}
