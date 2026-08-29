import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Search,
  X,
} from "lucide-react-native";
import { Colors, Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useFileList, useFileRead } from "@aijee/client-sdk";
import type { FsEntry } from "@aijee/client-sdk";
import { CodePreview } from "@/features/agent/components/message-list/code-preview";
import { FileTypeBadge } from "../file-type-badge";

/** Tree geometry, bolt's: a small left margin and a narrow step per level. */
const NODE_INDENT = 6;
const NODE_STEP = 8;

/**
 * The tree keeps its place beside the file rather than being swapped out for it,
 * and it keeps it whether or not a file is open: the reading pane is simply
 * empty until one is picked. Panels too narrow for two columns fall back to one.
 */
const TREE_COLUMN_WIDTH = 250;
const TREE_COLUMN_NARROW = 150;
const NARROW_PANEL_WIDTH = 560;

/**
 * Names matching the filter, directories that were opened by hand kept alongside.
 *
 * Levels load one directory at a time, so a filter can only speak for the names
 * it has: it narrows each loaded level rather than searching the whole tree. An
 * open directory stays visible even when its own name misses, otherwise typing
 * would close the branch you are looking inside.
 */
function applyFilter(
  entries: FsEntry[],
  query: string,
  expandedDirs: Set<string>,
): FsEntry[] {
  if (!query) return entries;
  const needle = query.toLowerCase();
  return entries.filter(
    (entry) =>
      entry.name.toLowerCase().includes(needle) ||
      (entry.is_dir && expandedDirs.has(entry.path)),
  );
}

function basename(path: string) {
  const trimmed = path.replace(/\/+$/, "");
  return trimmed.slice(trimmed.lastIndexOf("/") + 1) || trimmed;
}

interface FileTreeProps {
  rootPath: string;
  viewingFile: string | null;
  onViewFile: (path: string | null) => void;
  expandedDirs: Set<string>;
  onToggleDir: (path: string) => void;
}

/**
 * Read-only file tree.
 *
 * Browsing is the whole job here: creating, uploading and deleting files belongs
 * to the agent, so no row or header carries a mutation.
 */
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

// ---------------------------------------------------------------------------
// File tree root
// ---------------------------------------------------------------------------

function FileTreeRoot({
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

// ---------------------------------------------------------------------------
// File tree node
// ---------------------------------------------------------------------------

function FileTreeNode({
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

// ---------------------------------------------------------------------------
// Expanded dir
// ---------------------------------------------------------------------------

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
          paddingVertical: 4,
        }}
      >
        <ActivityIndicator size="small" />
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

// ---------------------------------------------------------------------------
// File viewer
// ---------------------------------------------------------------------------

/** The extension is language enough for the tokenizer to pick a dialect. */
function languageOf(path: string) {
  const name = basename(path);
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

function FileViewer({
  filePath,
  rootPath,
  onClose,
}: {
  filePath: string;
  rootPath: string;
  onClose: () => void;
}) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const textPrimary = isDark ? "#fefdfd" : colors.text;
  const textMuted = isDark ? "#cdc8c5" : colors.textTertiary;
  const headerBg = isDark ? "#1a1a1a" : "#F0F0F0";
  const headerBorder = isDark ? "#323131" : "rgba(0,0,0,0.08)";
  const hoverBg = isDark ? "#252525" : "#E8E8E8";

  const fileName = basename(filePath);
  // Where the file sits, from the workspace root down to its directory.
  const relative = filePath.startsWith(rootPath)
    ? filePath.slice(rootPath.replace(/\/+$/, "").length + 1)
    : filePath;
  const trail = [
    basename(rootPath),
    ...relative.split("/").slice(0, -1),
  ]
    .filter(Boolean)
    .join(" › ");

  const { data: fileData, isLoading, error: fileError } = useFileRead(filePath);

  return (
    <View style={styles.viewerContainer}>
      {/* Sticky header */}
      <View
        style={[
          styles.viewerHeader,
          { backgroundColor: headerBg, borderBottomColor: headerBorder },
        ]}
      >
        <Pressable
          onPress={onClose}
          accessibilityLabel="Close file"
          {...{ title: "Close file" }}
          style={({ pressed, hovered }: any) => [
            styles.closeButton,
            (pressed || hovered) && { backgroundColor: hoverBg },
          ]}
        >
          {/* There is no page to go back to; this clears the open file. */}
          <X size={13} color={textMuted} strokeWidth={2} />
        </Pressable>
        {/* The trail may lose its middle; the filename never does. */}
        <Text style={[styles.crumbTrail, { color: textMuted }]} numberOfLines={1}>
          {trail}
        </Text>
        <Text style={[styles.crumbSeparator, { color: textMuted }]}>›</Text>
        <Text style={[styles.crumbName, { color: textPrimary }]} numberOfLines={1}>
          {fileName}
        </Text>
        {fileData?.truncated && (
          <Text style={[styles.viewerMeta, { color: textMuted }]}>truncated</Text>
        )}
      </View>

      {/* Scrollable content */}
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 32 }} />
      ) : fileError ? (
        <View style={styles.viewerMessageWrap}>
          <Text style={[styles.emptyText, { color: textMuted }]}>
            {fileError.includes("non-UTF8")
              ? "Binary file preview is not available."
              : "Cannot read file"}
          </Text>
        </View>
      ) : fileData ? (
        <CodePreview
          code={fileData.content}
          isDark={isDark}
          language={languageOf(filePath)}
          bare
          fill
        />
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  treeContainer: {
    flex: 1,
  },
  splitRow: {
    flex: 1,
    flexDirection: "row",
  },
  splitContent: {
    flex: 1,
  },
  readerEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 24,
  },
  readerEmptyTitle: {
    fontSize: 14,
    fontFamily: Fonts.sansMedium,
  },
  readerEmptyHint: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    textAlign: "center",
  },
  splitTree: {
    borderLeftWidth: 0.633,
  },
  content: {
    paddingBottom: 12,
  },
  filterRow: {
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 4,
  },
  filterField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 0.633,
  },
  filterInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts.sans,
    padding: 0,
    outlineStyle: "none",
  } as any,
  filterClear: {
    width: 18,
    height: 18,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 2,
    paddingRight: 6,
    minHeight: 22,
  },
  iconSlot: {
    width: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    flex: 1,
  },
  dirName: {
    fontFamily: Fonts.sansMedium,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    textAlign: "center",
    marginTop: 32,
  },
  emptyDir: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    paddingVertical: 4,
    fontStyle: "italic",
  },

  // File viewer
  viewerContainer: {
    flex: 1,
  },
  viewerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 4,
    paddingRight: 10,
    height: 34,
    borderBottomWidth: 0.633,
  },
  closeButton: {
    width: 26,
    height: 26,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  crumbTrail: {
    flexShrink: 1,
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  crumbSeparator: {
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  crumbName: {
    flexShrink: 0,
    fontSize: 12.5,
    fontFamily: Fonts.sansMedium,
  },
  viewerMeta: {
    marginLeft: 6,
    fontSize: 11,
    fontFamily: Fonts.sans,
  },
  viewerMessageWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
});
