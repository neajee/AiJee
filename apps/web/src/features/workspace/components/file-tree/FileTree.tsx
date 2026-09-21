import { useEffect, useRef, useState } from 'react';
import { FolderOpen, Search, X } from 'lucide-react';
import type { FileTreeProps } from './component-types';
import { FileTreeRoot } from './tree-root';
import { FileViewer } from './file-viewer';
import { NARROW_PANEL_WIDTH, TREE_COLUMN_NARROW, TREE_COLUMN_WIDTH } from '../../utils/file-tree-constants';
export function FileTree({
  rootPath,
  viewingFile,
  onViewFile,
  expandedDirs,
  onToggleDir
}: FileTreeProps) {
  const [query, setQuery] = useState("");
  const [width, setWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Width is unknown on the first paint; assume there is room, since the panel
  // this lives in is usually wide.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    setWidth(node.clientWidth);
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const isNarrow = width > 0 && width < NARROW_PANEL_WIDTH;
  const treeWidth = isNarrow ? TREE_COLUMN_NARROW : TREE_COLUMN_WIDTH;
  const tree = <>
      <div className="min-w-0 shrink-0 px-1.5 pb-1 pt-1.5">
        <div className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-surface-raised px-2">
          <Search size={13} strokeWidth={2} className="shrink-0 text-text-tertiary" />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Filter files…" aria-label="Filter files" className="min-w-0 flex-1 bg-transparent text-caption text-foreground outline-none placeholder:text-text-tertiary" />
          {query.length > 0 && <button onClick={() => setQuery("")} aria-label="Clear filter" title="Clear filter" className="flex size-[18px] shrink-0 items-center justify-center rounded text-text-tertiary hover:bg-hover">
              <X size={12} strokeWidth={2} />
            </button>}
        </div>
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto pb-3">
        <FileTreeRoot rootPath={rootPath} onFilePress={p => onViewFile(p)} expandedDirs={expandedDirs} onToggleDir={onToggleDir} query={query.trim()} selectedPath={viewingFile} />
      </div>
    </>;
  return <div ref={containerRef} className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {isNarrow ? (
    // One column: the file takes the panel while it is open, the tree
    // returns when it is closed.
    viewingFile ? <FileViewer filePath={viewingFile} rootPath={rootPath} onClose={() => onViewFile(null)} /> : <div className="flex min-h-0 flex-1 flex-col">{tree}</div>) : <div className="flex min-h-0 flex-1 flex-row">
          <div className="flex min-h-0 flex-1 flex-col">
            {viewingFile ? <FileViewer filePath={viewingFile} rootPath={rootPath} onClose={() => onViewFile(null)} /> : <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-6">
                <FolderOpen size={26} strokeWidth={1.5} className="text-text-tertiary" />
                <span className="text-body font-medium text-text-secondary">
                  Open a file
                </span>
                <span className="text-center text-caption text-text-tertiary">
                  Pick one from the workspace tree
                </span>
              </div>}
          </div>
          <div className="flex min-h-0 min-w-0 shrink-0 flex-col border-l border-border" style={{ width: treeWidth }}>
            {tree}
          </div>
        </div>}
    </div>;
}
