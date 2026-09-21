import { useCallback, useMemo } from "react";
import { Alert } from "@/platform/browser";
import { Plus, Minus, Undo2, Check } from "lucide-react";
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
  onDiscard
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
  const {
    textPrimary,
    textMuted,
    hoverBg,
    dividerColor
  } = useChangesTheme();
  const totalChanges = staged.length + unstaged.length + untracked.length;

  // A new file is a change like any other, so untracked paths join the working
  // set instead of getting a section of their own.
  const changed = useMemo<FileEntry[]>(() => [...unstaged, ...untracked.map(path => ({
    path,
    status: "?"
  }))], [unstaged, untracked]);
  const confirmDiscard = useCallback((paths: string[]) => {
    const msg = `Discard changes to ${paths.length} file${paths.length !== 1 ? "s" : ""}? This cannot be undone.`;
    if (true) {
      if (window.confirm(msg)) onDiscard(paths);
    } else {
      Alert.alert("Discard Changes", msg, [{
        text: "Cancel",
        style: "cancel"
      }, {
        text: "Discard",
        style: "destructive",
        onClick: () => onDiscard(paths)
      }]);
    }
  }, [onDiscard]);
  if (totalChanges === 0) {
    return <div className="flex flex-col items-center gap-2 py-8">
        <Check size={20} color={textMuted} strokeWidth={2} />
        <span className="text-caption text-text-secondary">Working tree clean</span>
      </div>;
  }
  return <>
      {staged.length > 0 && <section><FileList files={staged} keyPrefix="s" staged selectedFile={selectedFile} diffContent={diffContent} diffLoading={diffLoading} onFilePress={onFilePress} textPrimary={textPrimary} textMuted={textMuted} hoverBg={hoverBg} dividerColor={dividerColor} renderActions={path => <IconButton onClick={() => onUnstage([path])} title="Unstage" icon={<Minus size={13} color={textMuted} strokeWidth={2} />} />} /></section>}

      {changed.length > 0 && <section><FileList files={changed} keyPrefix="u" selectedFile={selectedFile} diffContent={diffContent} diffLoading={diffLoading} onFilePress={onFilePress} textPrimary={textPrimary} textMuted={textMuted} hoverBg={hoverBg} dividerColor={dividerColor} renderActions={(path, status) => <div className="flex items-center gap-0.5">
              {/* An untracked file has no previous version to revert to. */}
              {status !== "?" && <IconButton onClick={() => confirmDiscard([path])} title="Discard changes" icon={<Undo2 size={12} color={textMuted} strokeWidth={2} />} />}
              <IconButton onClick={() => onStage([path])} title="Stage" icon={<Plus size={13} color={textMuted} strokeWidth={2} />} />
            </div>} /></section>}
    </>;
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
  dividerColor
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
  return <>
      {sorted.map(file => {
      const isSelected = selectedFile?.path === file.path && selectedFile?.staged === staged;
      return <FileRow key={`${keyPrefix}-${file.path}`} path={file.path} status={file.status} additions={file.additions} deletions={file.deletions} isSelected={isSelected} diffContent={isSelected ? diffContent : null} diffLoading={isSelected && diffLoading} onClick={onFilePress ? () => onFilePress(file.path, staged) : undefined} textPrimary={textPrimary} textMuted={textMuted} hoverBg={hoverBg} dividerColor={dividerColor} actions={renderActions(file.path, file.status)} />;
    })}
    </>;
}
