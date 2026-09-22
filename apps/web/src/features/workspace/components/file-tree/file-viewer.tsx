import { X } from 'lucide-react';
import { useFileRead } from '@aijee/client-sdk';
import { CodePreview } from '@/features/agent/components/message-list/code-preview';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { basename, languageOf } from '../../utils/file-tree';
export function FileViewer({
  filePath,
  rootPath,
  onClose
}: {
  filePath: string;
  rootPath: string;
  onClose: () => void;
}) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const fileName = basename(filePath);
  // Where the file sits, from the workspace root down to its directory.
  const relative = filePath.startsWith(rootPath) ? filePath.slice(rootPath.replace(/\/+$/, "").length + 1) : filePath;
  const trail = [basename(rootPath), ...relative.split("/").slice(0, -1)].filter(Boolean).join(" › ");
  const {
    data: fileData,
    isLoading,
    error: fileError
  } = useFileRead(filePath);
  return <div className="flex min-h-0 flex-1 flex-col bg-background">
      {/* Sticky header */}
      <div className="flex h-[34px] shrink-0 items-center gap-1 border-b border-border pl-1 pr-2.5">
        <button onClick={onClose} aria-label="Close file" title="Close file" className="flex size-[26px] shrink-0 items-center justify-center rounded-md text-text-tertiary hover:bg-hover">
          {/* There is no page to go back to; this clears the open file. */}
          <X size={13} strokeWidth={2} />
        </button>
        {/* The trail may lose its middle; the filename never does. */}
        <span className="min-w-0 shrink truncate text-caption text-text-tertiary">
          {trail}
        </span>
        <span className="shrink-0 text-caption text-text-tertiary">›</span>
        <span className="shrink-0 text-caption font-medium text-foreground">
          {fileName}
        </span>
        {fileData?.truncated && <span className="ml-1.5 shrink-0 text-meta text-text-tertiary">truncated</span>}
      </div>

      {/* Scrollable content */}
      <div className="min-h-0 min-w-0 flex-1 overflow-auto bg-background">
        {isLoading ? <div className="flex justify-center py-8">
            <span className="size-4 animate-spin rounded-full border-2 border-border border-t-text-tertiary" />
          </div> : fileError ? <div className="flex flex-1 items-center justify-center px-6 py-8 text-center text-body text-text-tertiary">
            {fileError.includes("non-UTF8") ? "Binary file preview is not available." : "Cannot read file"}
          </div> : fileData ? <CodePreview code={fileData.content} isDark={isDark} language={languageOf(filePath)} fill surface="background" /> : null}
      </div>
    </div>;
}
