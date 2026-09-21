import { memo } from 'react';
import { FileDiff } from 'lucide-react';
import { DiffPreview } from '../../code-preview';
import type { ToolCallInfo } from '../../../../component-types.ts';
import { ToolBody, ToolHeader, TOOL_BODY_MAX_HEIGHT } from '../tool-disclosure';
import { useEditToolCallController } from '../../../../hooks/use-edit-tool-call-controller';
export const EditToolCall = memo(function EditToolCall({
  tc,
  isDark
}: {
  tc: ToolCallInfo;
  isDark: boolean;
}) {
  const {
    active,
    expanded,
    toggle,
    filePath,
    fileName,
    detectedLanguage,
    oldValue,
    newValue,
    hasDiff,
    removedLines,
    addedLines
  } = useEditToolCallController(tc);
  const title = active ? 'Editing' : 'Edited';
  return <div>
      <ToolHeader expanded={expanded} expandable={hasDiff} onToggle={toggle} isDark={isDark} icon={FileDiff} aria-label={`${expanded ? 'Collapse' : 'Expand'} diff of ${fileName || 'file'}`}>
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="min-w-0 flex-1 truncate">{title} {fileName || filePath || 'file'}</span>
          {(addedLines > 0 || removedLines > 0) && <div className="flex shrink-0 items-center gap-1.5 font-mono text-meta"><span className="text-success">+{addedLines}</span><span className="text-destructive">-{removedLines}</span></div>}
        </div>
      </ToolHeader>
      <ToolBody expanded={expanded && hasDiff}>
        <DiffPreview oldValue={oldValue} newValue={newValue} isDark={isDark} maxHeight={TOOL_BODY_MAX_HEIGHT} language={detectedLanguage} title={fileName || filePath || 'Diff'} />
      </ToolBody>
    </div>;
});
