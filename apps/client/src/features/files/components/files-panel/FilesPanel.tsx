import { useCallback, useState } from "react";
import { Colors, Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useWorkspaceStore } from "@/features/workspace/store";
import { FileTree } from "@/features/workspace/components/file-tree";

/**
 * Standalone files panel — used in the narrow Files sheet.
 * Wraps the FileTree with workspace path and enables actions.
 */
export function FilesPanel() {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const colors = Colors[colorScheme];
  const textMuted = isDark ? "#cdc8c5" : colors.textTertiary;
  const surfaceBg = isDark ? "#1e1e1e" : "#FFFFFF";
  const workspace = useWorkspaceStore(s => {
    const id = s.selectedWorkspaceId;
    return s.workspaces.find(w => w.id === id);
  });
  const cwd = workspace?.path ?? null;
  const [viewingFile, setViewingFile] = useState<string | null>(null);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const handleToggleDir = useCallback((dirPath: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(dirPath)) next.delete(dirPath);else next.add(dirPath);
      return next;
    });
  }, []);
  if (!cwd) {
    return <div>
        <span>
          No workspace selected
        </span>
      </div>;
  }
  return <div>
      <div>
        <span>
          Files
        </span>
        <span>
          {workspace?.title ?? cwd}
        </span>
      </div>
      <FileTree rootPath={cwd} viewingFile={viewingFile} onViewFile={setViewingFile} expandedDirs={expandedDirs} onToggleDir={handleToggleDir} />
    </div>;
}