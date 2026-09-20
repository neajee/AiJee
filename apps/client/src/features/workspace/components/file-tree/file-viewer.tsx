import { X } from 'lucide-react';
import { useFileRead } from '@aijee/client-sdk';
import { CodePreview } from '@/features/agent/components/message-list/code-preview';
import { Colors } from '@/constants/theme';
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
  const colors = Colors[colorScheme];
  const isDark = colorScheme === "dark";
  const textPrimary = isDark ? "#fefdfd" : colors.text;
  const textMuted = isDark ? "#cdc8c5" : colors.textTertiary;
  const headerBg = isDark ? "#1a1a1a" : "#F0F0F0";
  const headerBorder = isDark ? "#323131" : "rgba(0,0,0,0.08)";
  const hoverBg = isDark ? "#252525" : "#E8E8E8";
  const fileName = basename(filePath);
  // Where the file sits, from the workspace root down to its directory.
  const relative = filePath.startsWith(rootPath) ? filePath.slice(rootPath.replace(/\/+$/, "").length + 1) : filePath;
  const trail = [basename(rootPath), ...relative.split("/").slice(0, -1)].filter(Boolean).join(" › ");
  const {
    data: fileData,
    isLoading,
    error: fileError
  } = useFileRead(filePath);
  return <div className={""}>
      {/* Sticky header */}
      <div className={"" + " " + ""}>
        <button onClick={onClose} aria-label="Close file" {...{
        title: "Close file"
      }}>
          {/* There is no page to go back to; this clears the open file. */}
          <X size={13} color={textMuted} strokeWidth={2} />
        </button>
        {/* The trail may lose its middle; the filename never does. */}
        <span className={"" + " " + ""}>
          {trail}
        </span>
        <span className={"" + " " + ""}>›</span>
        <span className={"" + " " + ""}>
          {fileName}
        </span>
        {fileData?.truncated && <span className={"" + " " + ""}>truncated</span>}
      </div>

      {/* Scrollable content */}
      {isLoading ? <span className={"mt-[32px]"} /> : fileError ? <div className={""}>
          <span className={"" + " " + ""}>
            {fileError.includes("non-UTF8") ? "Binary file preview is not available." : "Cannot read file"}
          </span>
        </div> : fileData ? <CodePreview code={fileData.content} isDark={isDark} language={languageOf(filePath)} bare fill /> : null}
    </div>;
}
