import { toTailwind } from "@/styles/to-tailwind";
import { useState } from 'react';
import { FolderOpen, Search, X } from 'lucide-react';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { FileTreeProps } from './component-types';
import { FileTreeRoot } from './tree-root';
import { FileViewer } from './file-viewer';
import { NARROW_PANEL_WIDTH, TREE_COLUMN_NARROW, TREE_COLUMN_WIDTH } from '../../utils/file-tree-constants';
import { styles } from './style-tokens';
export function FileTree({
  rootPath,
  viewingFile,
  onViewFile,
  expandedDirs,
  onToggleDir
}: FileTreeProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const isDark = colorScheme === "dark";
  const textMuted = isDark ? "#cdc8c5" : colors.textTertiary;
  const textPrimary = isDark ? "#fefdfd" : colors.text;
  const fieldBg = isDark ? "#1a1a1a" : "#F0F0F0";
  const borderColor = isDark ? "#323131" : "rgba(0,0,0,0.08)";
  const hoverBg = isDark ? "#252525" : "#E8E8E8";
  const [query, setQuery] = useState("");
  const [width, setWidth] = useState(0);

  // Width is unknown on the first paint; assume there is room, since the panel
  // this lives in is usually wide.
  const isNarrow = width > 0 && width < NARROW_PANEL_WIDTH;
  const treeWidth = isNarrow ? TREE_COLUMN_NARROW : TREE_COLUMN_WIDTH;
  const tree = <>
      <div className={toTailwind(styles.filterRow)}>
        <div className={toTailwind([styles.filterField, {
        backgroundColor: fieldBg,
        borderColor
      }])}>
          <Search size={13} color={textMuted} strokeWidth={2} />
          <input value={query} onChangeText={setQuery} placeholder="Filter files…" placeholderTextColor={textMuted} className={toTailwind([styles.filterInput, {
          color: textPrimary
        }])} autoCapitalize="none" autoCorrect={false} aria-label="Filter files" />
          {query.length > 0 && <button onClick={() => setQuery("")} hitSlop={6} aria-label="Clear filter" {...{
          title: "Clear filter"
        }}>
              <X size={12} color={textMuted} strokeWidth={2} />
            </button>}
        </div>
      </div>
      <FileTreeRoot rootPath={rootPath} textMuted={textMuted} onFilePress={p => onViewFile(p)} expandedDirs={expandedDirs} onToggleDir={onToggleDir} query={query.trim()} selectedPath={viewingFile} />
    </>;
  return <div className={toTailwind(styles.treeContainer)} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      {isNarrow ?
    // One column: the file takes the panel while it is open, the tree
    // returns when it is closed.
    viewingFile ? <FileViewer filePath={viewingFile} rootPath={rootPath} onClose={() => onViewFile(null)} /> : tree : <div className={toTailwind(styles.splitRow)}>
          <div className={toTailwind(styles.splitContent)}>
            {viewingFile ? <FileViewer filePath={viewingFile} rootPath={rootPath} onClose={() => onViewFile(null)} /> : <div className={toTailwind(styles.readerEmpty)}>
                <FolderOpen size={26} color={textMuted} strokeWidth={1.5} />
                <span className={toTailwind([styles.readerEmptyTitle, {
            color: textPrimary
          }])}>
                  Open a file
                </span>
                <span className={toTailwind([styles.readerEmptyHint, {
            color: textMuted
          }])}>
                  Pick one from the workspace tree
                </span>
              </div>}
          </div>
          <div className={toTailwind([styles.splitTree, {
        width: treeWidth,
        borderLeftColor: borderColor
      }])}>
            {tree}
          </div>
        </div>}
    </div>;
}
