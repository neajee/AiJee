import type { FsEntry } from '@aijee/client-sdk';

export interface FileTreeProps {
  rootPath: string;
  viewingFile: string | null;
  onViewFile: (path: string | null) => void;
  expandedDirs: Set<string>;
  onToggleDir: (path: string) => void;
}

export interface FileTreeNodeProps {
  entry: FsEntry;
  depth: number;
  onFilePress: (path: string) => void;
  expandedDirs: Set<string>;
  onToggleDir: (path: string) => void;
  query: string;
  selectedPath: string | null;
}
