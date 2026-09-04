import { useCallback, useMemo } from "react";
import { Alert, Platform, StyleSheet, Text, View } from "react-native";
import { Plus, Minus, Undo2, Check } from "lucide-react-native";

import { Fonts } from "@/constants/theme";
import { FileRow } from "./file-row";
import { IconButton } from "./icon-button";
import { useChangesTheme } from "../../hooks/use-changes-theme";

interface FileEntry {
  path: string;
  status: string;
  additions?: number;
  deletions?: number;
}

interface SelectedFile {
  path: string;
  staged: boolean;
}

function byPath(a: FileEntry, b: FileEntry) {
  return a.path.localeCompare(b.path);
}

export function ChangesTab({
  staged,
  unstaged,
  untracked,
  selectedFile,
  diffContent,
  diffLoading,
  onFilePress,
  onStage,
  onUnstage,
  onDiscard,
}: {
  staged: FileEntry[];
  unstaged: FileEntry[];
  untracked: string[];
  selectedFile: SelectedFile | null;
  diffContent: string | null | undefined;
  diffLoading: boolean;
  onFilePress: (path: string, staged: boolean) => void;
  onStage: (paths: string[]) => void;
  onUnstage: (paths: string[]) => void;
  onDiscard: (paths: string[]) => void;
}) {
  const { textPrimary, textMuted, hoverBg, dividerColor } = useChangesTheme();
  const totalChanges = staged.length + unstaged.length + untracked.length;

  // A new file is a change like any other, so untracked paths join the working
  // set instead of getting a section of their own.
  const changed = useMemo<FileEntry[]>(
    () => [...unstaged, ...untracked.map((path) => ({ path, status: "?" }))],
    [unstaged, untracked],
  );

  const confirmDiscard = useCallback(
    (paths: string[]) => {
      const msg = `Discard changes to ${paths.length} file${paths.length !== 1 ? "s" : ""}? This cannot be undone.`;
      if (Platform.OS === "web") {
        if (window.confirm(msg)) onDiscard(paths);
      } else {
        Alert.alert("Discard Changes", msg, [
          { text: "Cancel", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => onDiscard(paths),
          },
        ]);
      }
    },
    [onDiscard],
  );

  if (totalChanges === 0) {
    return (
      <View style={styles.cleanState}>
        <Check size={20} color={textMuted} strokeWidth={2} />
        <Text style={[styles.emptyText, { color: textMuted }]}>
          Working tree clean
        </Text>
      </View>
    );
  }

  return (
    <>
      {staged.length > 0 && (
        <FileList
          files={staged}
          keyPrefix="s"
          staged
          selectedFile={selectedFile}
          diffContent={diffContent}
          diffLoading={diffLoading}
          onFilePress={onFilePress}
          textPrimary={textPrimary}
          textMuted={textMuted}
          hoverBg={hoverBg}
          dividerColor={dividerColor}
          renderActions={(path) => (
            <IconButton
              onPress={() => onUnstage([path])}
              title="Unstage"
              icon={<Minus size={13} color={textMuted} strokeWidth={2} />}
            />
          )}
        />
      )}

      {changed.length > 0 && (
        <FileList
          files={changed}
          keyPrefix="u"
          selectedFile={selectedFile}
          diffContent={diffContent}
          diffLoading={diffLoading}
          onFilePress={onFilePress}
          textPrimary={textPrimary}
          textMuted={textMuted}
          hoverBg={hoverBg}
          dividerColor={dividerColor}
          renderActions={(path, status) => (
            <View style={styles.fileActions}>
              {/* An untracked file has no previous version to revert to. */}
              {status !== "?" && (
                <IconButton
                  onPress={() => confirmDiscard([path])}
                  title="Discard changes"
                  icon={<Undo2 size={12} color={textMuted} strokeWidth={2} />}
                />
              )}
              <IconButton
                onPress={() => onStage([path])}
                title="Stage"
                icon={<Plus size={13} color={textMuted} strokeWidth={2} />}
              />
            </View>
          )}
        />
      )}
    </>
  );
}

/**
 * The changed files, flat and sorted by path.
 *
 * Directory headings were an answer to rows that could not fit their path; rows
 * that keep the filename intact and let the directory truncate need no headings,
 * and a flat list keeps sibling files next to each other by sort order anyway.
 */
function FileList({
  files,
  keyPrefix,
  staged = false,
  selectedFile,
  diffContent,
  diffLoading,
  onFilePress,
  renderActions,
  textPrimary,
  textMuted,
  hoverBg,
  dividerColor,
}: {
  files: FileEntry[];
  keyPrefix: string;
  staged?: boolean;
  selectedFile: SelectedFile | null;
  diffContent: string | null | undefined;
  diffLoading: boolean;
  onFilePress?: (path: string, staged: boolean) => void;
  renderActions: (path: string, status: string) => React.ReactNode;
  textPrimary: string;
  textMuted: string;
  hoverBg: string;
  dividerColor: string;
}) {
  const sorted = useMemo(() => [...files].sort(byPath), [files]);

  return (
    <>
      {sorted.map((file) => {
        const isSelected =
          selectedFile?.path === file.path && selectedFile?.staged === staged;
        return (
          <FileRow
            key={`${keyPrefix}-${file.path}`}
            path={file.path}
            status={file.status}
            additions={file.additions}
            deletions={file.deletions}
            isSelected={isSelected}
            diffContent={isSelected ? diffContent : null}
            diffLoading={isSelected && diffLoading}
            onPress={
              onFilePress ? () => onFilePress(file.path, staged) : undefined
            }
            textPrimary={textPrimary}
            textMuted={textMuted}
            hoverBg={hoverBg}
            dividerColor={dividerColor}
            actions={renderActions(file.path, file.status)}
          />
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  cleanState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 48,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    textAlign: "center",
  },
  fileActions: {
    flexDirection: "row",
    gap: 2,
  },
});
