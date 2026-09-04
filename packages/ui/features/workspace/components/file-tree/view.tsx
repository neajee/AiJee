import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { FolderOpen, Search, X } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { FileTreeProps } from './types';
import { FileTreeRoot } from './tree-root';
import { FileViewer } from './file-viewer';
import { NARROW_PANEL_WIDTH, TREE_COLUMN_NARROW, TREE_COLUMN_WIDTH } from '../../utils/file-tree-constants';
import { styles } from './styles';

export function FileTree({
  rootPath,
  viewingFile,
  onViewFile,
  expandedDirs,
  onToggleDir,
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

  const tree = (
    <>
      <View style={styles.filterRow}>
        <View
          style={[
            styles.filterField,
            { backgroundColor: fieldBg, borderColor },
          ]}
        >
          <Search size={13} color={textMuted} strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Filter files…"
            placeholderTextColor={textMuted}
            style={[styles.filterInput, { color: textPrimary }]}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Filter files"
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => setQuery("")}
              hitSlop={6}
              accessibilityLabel="Clear filter"
              {...{ title: "Clear filter" }}
              style={({ pressed, hovered }: any) => [
                styles.filterClear,
                (pressed || hovered) && { backgroundColor: hoverBg },
              ]}
            >
              <X size={12} color={textMuted} strokeWidth={2} />
            </Pressable>
          )}
        </View>
      </View>
      <FileTreeRoot
        rootPath={rootPath}
        textMuted={textMuted}
        onFilePress={(p) => onViewFile(p)}
        expandedDirs={expandedDirs}
        onToggleDir={onToggleDir}
        query={query.trim()}
        selectedPath={viewingFile}
      />
    </>
  );

  return (
    <View
      style={styles.treeContainer}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {isNarrow ? (
        // One column: the file takes the panel while it is open, the tree
        // returns when it is closed.
        viewingFile ? (
          <FileViewer
            filePath={viewingFile}
            rootPath={rootPath}
            onClose={() => onViewFile(null)}
          />
        ) : (
          tree
        )
      ) : (
        <View style={styles.splitRow}>
          <View style={styles.splitContent}>
            {viewingFile ? (
              <FileViewer
                filePath={viewingFile}
                rootPath={rootPath}
                onClose={() => onViewFile(null)}
              />
            ) : (
              <View style={styles.readerEmpty}>
                <FolderOpen size={26} color={textMuted} strokeWidth={1.5} />
                <Text style={[styles.readerEmptyTitle, { color: textPrimary }]}>
                  Open a file
                </Text>
                <Text style={[styles.readerEmptyHint, { color: textMuted }]}>
                  Pick one from the workspace tree
                </Text>
              </View>
            )}
          </View>
          <View
            style={[
              styles.splitTree,
              { width: treeWidth, borderLeftColor: borderColor },
            ]}
          >
            {tree}
          </View>
        </View>
      )}
    </View>
  );
}
