import { toTailwind } from "@/styles/to-tailwind";
import { useFileList, type FsEntry } from '@aijee/client-sdk';
import { applyFilter } from '../../utils/file-tree';
import type { FileTreeNodeProps } from './component-types';
import { FileTreeNode } from './tree-node';
import { styles } from './style-tokens';
export function FileTreeRoot({
  rootPath,
  textMuted,
  onFilePress,
  expandedDirs,
  onToggleDir,
  query,
  selectedPath
}: {
  rootPath: string;
  textMuted: string;
  onFilePress: (path: string) => void;
  expandedDirs: Set<string>;
  onToggleDir: (path: string) => void;
  query: string;
  selectedPath: string | null;
}) {
  const {
    entries,
    isLoading,
    error
  } = useFileList(rootPath);
  if (isLoading) {
    return <span className={toTailwind({
      marginTop: 32
    })} />;
  }
  if (error) {
    return <span className={toTailwind([styles.emptyText, {
      color: textMuted
    }])}>
        Failed to load: {error}
      </span>;
  }
  if (!entries || entries.length === 0) {
    return <span className={toTailwind([styles.emptyText, {
      color: textMuted
    }])}>
        Empty directory
      </span>;
  }
  const sorted = applyFilter(entries, query, expandedDirs).sort((a, b) => {
    if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  if (query && sorted.length === 0) {
    return <span className={toTailwind([styles.emptyText, {
      color: textMuted
    }])}>No matches</span>;
  }
  return <div className={toTailwind({
    flex: 1
  })}>
      {sorted.map(entry => <FileTreeNode key={entry.path} entry={entry} depth={0} onFilePress={onFilePress} expandedDirs={expandedDirs} onToggleDir={onToggleDir} query={query} selectedPath={selectedPath} />)}
    </div>;
}
