import { memo } from "react";
import { Download } from "lucide-react";
import type { ToolCallInfo } from "../../../component-types.ts";
import { parseToolArguments } from "../../../utils/message-list";
interface DownloadToolCallProps {
  tc: ToolCallInfo;
  isDark: boolean;
}
export const DownloadToolCall = memo(function DownloadToolCall({
  tc
}: DownloadToolCallProps) {
  const parsed = parseToolArguments(tc.arguments);
  const url = parsed.url as string || "";
    return <div>
      <div className="flex min-w-0 items-center gap-1.5 py-1">
        <Download size={12} strokeWidth={1.8} className="shrink-0 text-text-tertiary" />
        <span className="shrink-0 text-caption font-medium text-text-secondary">
          Download
        </span>
        {url ? <span className="min-w-0 flex-1 truncate font-mono text-meta text-text-tertiary">
            {url}
          </span> : null}
      </div>
    </div>;
});