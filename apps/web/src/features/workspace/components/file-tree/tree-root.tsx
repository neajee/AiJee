import { useFileList } from '@aijee/client-sdk';
import { applyFilter } from '../../utils/file-tree';
import { FileTreeNode } from './tree-node';
export function FileTreeRoot({
  rootPath,
  onFilePress,
  expandedDirs,
  onToggleDir,
  query,
  selectedPath
}: {
  rootPath: string;
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
    return <div className="flex justify-center py-8">
        <span className="size-4 animate-spin rounded-full border-2 border-border border-t-text-tertiary" />
      </div>;
  }
  if (error) {
    return <span className="mt-8 block px-3 text-center text-body text-text-tertiary">
        Failed to load: {error}
      </span>;
  }
  if (!entries || entries.length === 0) {
    return <span className="mt-8 block px-3 text-center text-body text-text-tertiary">
        Empty directory
      </span>;
  }
  const sorted = applyFilter(entries, query, expandedDirs).sort((a, b) => {
    if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  if (query && sorted.length === 0) {
    return <span className="mt-8 block px-3 text-center text-body text-text-tertiary">No matches</span>;
  }
  return <div className="flex flex-col">
      {sorted.map(entry => <FileTreeNode key={entry.path} entry={entry} depth={0} onFilePress={onFilePress} expandedDirs={expandedDirs} onToggleDir={onToggleDir} query={query} selectedPath={selectedPath} />)}
    </div>;
}
