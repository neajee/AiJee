import { ActivityIndicator, ScrollView, Text } from 'react-native';
import { useFileList, type FsEntry } from '@aijee/client-sdk';
import { applyFilter } from '../../utils/file-tree';
import type { FileTreeNodeProps } from './types';
import { FileTreeNode } from './tree-node';
import { styles } from './styles';

export function FileTreeRoot({
  rootPath,
  textMuted,
  onFilePress,
  expandedDirs,
  onToggleDir,
  query,
  selectedPath,
}: {
  rootPath: string;
  textMuted: string;
  onFilePress: (path: string) => void;
  expandedDirs: Set<string>;
  onToggleDir: (path: string) => void;
  query: string;
  selectedPath: string | null;
}) {
  const { entries, isLoading, error } = useFileList(rootPath);

  if (isLoading) {
    return <ActivityIndicator style={{ marginTop: 32 }} />;
  }

  if (error) {
    return (
      <Text style={[styles.emptyText, { color: textMuted }]}>
        Failed to load: {error}
      </Text>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <Text style={[styles.emptyText, { color: textMuted }]}>
        Empty directory
      </Text>
    );
  }

  const sorted = applyFilter(entries, query, expandedDirs).sort((a, b) => {
    if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  if (query && sorted.length === 0) {
    return (
      <Text style={[styles.emptyText, { color: textMuted }]}>No matches</Text>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {sorted.map((entry) => (
        <FileTreeNode
          key={entry.path}
          entry={entry}
          depth={0}
          onFilePress={onFilePress}
          expandedDirs={expandedDirs}
          onToggleDir={onToggleDir}
          query={query}
          selectedPath={selectedPath}
        />
      ))}
    </ScrollView>
  );
}
