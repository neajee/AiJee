import { Spinner, Text, View } from 'tamagui';
import { useCallback } from 'react';
import { Pressable } from 'react-native';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { useFileList, type FsEntry } from '@aijee/client-sdk';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FileTypeBadge } from '../file-type-badge';
import { applyFilter } from '../../utils/file-tree';
import type { FileTreeNodeProps } from './types';
import { NODE_INDENT, NODE_STEP } from '../../utils/file-tree-constants';
import { styles } from './styles';

export function FileTreeNode({
  entry,
  depth,
  onFilePress,
  expandedDirs,
  onToggleDir,
  query,
  selectedPath,
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

  return (
    <View>
      <Pressable
        onPress={handlePress}
        {...{ title: entry.path }}
        style={({ pressed, hovered }: any) => [
          styles.row,
          { paddingLeft: NODE_INDENT + depth * NODE_STEP },
          isSelected && { backgroundColor: selectedBg },
          !isSelected && (pressed || hovered) && { backgroundColor: hoverBg },
        ]}
      >
        {/* One glyph slot per row, bolt's: a caret for directories, the file's
            kind for files, so names line up at the same x within a level. */}
        {entry.is_dir ? (
          <View style={styles.iconSlot}>
            {expanded ? (
              <ChevronDown size={13} color={textMuted} strokeWidth={2} />
            ) : (
              <ChevronRight size={13} color={textMuted} strokeWidth={2} />
            )}
          </View>
        ) : (
          <FileTypeBadge path={entry.path} fallbackColor={iconColor} />
        )}
        <Text
          style={[
            styles.name,
            { color: textPrimary },
            entry.is_dir && styles.dirName,
          ]}
          numberOfLines={1}
        >
          {entry.name}
        </Text>
      </Pressable>
      {expanded && (
        <ExpandedDir
          dirPath={entry.path}
          depth={depth + 1}
          onFilePress={onFilePress}
          expandedDirs={expandedDirs}
          onToggleDir={onToggleDir}
          query={query}
          selectedPath={selectedPath}
        />
      )}
    </View>
  );
}

function ExpandedDir({
  dirPath,
  depth,
  onFilePress,
  expandedDirs,
  onToggleDir,
  query,
  selectedPath,
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

  const { entries, isLoading } = useFileList(dirPath);

  if (isLoading) {
    return (
      <View
        style={{
          paddingLeft: NODE_INDENT + depth * NODE_STEP,
          paddingTop: 4, paddingBottom: 4,
        }}
      >
        <Spinner size="small" />
      </View>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <Text
        style={[
          styles.emptyDir,
          { color: textMuted, paddingLeft: NODE_INDENT + depth * NODE_STEP },
        ]}
      >
        Empty
      </Text>
    );
  }

  const sorted = applyFilter(entries, query, expandedDirs).sort((a, b) => {
    if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <View>
      {sorted.map((entry) => (
        <FileTreeNode
          key={entry.path}
          entry={entry}
          depth={depth}
          onFilePress={onFilePress}
          expandedDirs={expandedDirs}
          onToggleDir={onToggleDir}
          query={query}
          selectedPath={selectedPath}
        />
      ))}
    </View>
  );
}
