import { memo, useCallback } from 'react';
import { useWindowDimensions } from "@/platform/browser";
import { Animated } from "@/styles/motion";
import { Maximize2, X } from 'lucide-react';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { CodePreview } from '../../code-preview';
import type { ToolCallInfo } from '../agent-types';
import { ToolBody, ToolHeader, TOOL_BODY_MAX_HEIGHT } from '../tool-disclosure';
import { useEditToolCallController } from '../../../../hooks/use-edit-tool-call-controller';
export const EditToolCall = memo(function EditToolCall({
  tc,
  isDark
}: {
  tc: ToolCallInfo;
  isDark: boolean;
}) {
  const colors = useThemeTokens();
  const {
    width,
    height
  } = useWindowDimensions();
  const controller = useEditToolCallController(tc);
  const {
    active,
    expanded,
    setExpanded,
    fullscreenOpen,
    filePath,
    fileName,
    detectedLanguage,
    diffText,
    hasDiff,
    removedLines,
    addedLines,
    previewRef,
    heroRect,
    heroProgress,
    openFullscreen,
    closeFullscreen
  } = controller;
  const toggle = useCallback(() => setExpanded(value => !value), [setExpanded]);
  const title = active ? 'Editing' : 'Edited';
  return <div>
      <ToolHeader expanded={expanded} expandable={hasDiff} onToggle={toggle} isDark={isDark} aria-label={`${expanded ? 'Collapse' : 'Expand'} diff of ${fileName || 'file'}`}>
        <span>{title} {fileName || filePath || 'file'}</span>
        {(addedLines > 0 || removedLines > 0) && <div className="flex flex-col"><span>+{addedLines}</span><span>-{removedLines}</span></div>}
      </ToolHeader>
      <ToolBody expanded={expanded && hasDiff}>
        <div ref={previewRef} className="flex flex-col">
          <button onClick={openFullscreen} role="button" aria-label="Open diff fullscreen">
            <Maximize2 size={12} color={colors.textSecondary} strokeWidth={2} /><span>Fullscreen</span>
          </button>
          <CodePreview code={diffText} isDark={isDark} maxHeight={TOOL_BODY_MAX_HEIGHT} language="diff" showLineNumbers={false} />
        </div>
      </ToolBody>
      <div hidden={!fullscreenOpen}>
        <div className="flex flex-col">
          <div className={"  opacity-100"} />
          <button className="inline-flex items-center" onClick={closeFullscreen} />
          <div className="flex-1 min-h-0">
            <div className={"flex-1 opacity-100"}>
              <div>
                <span>{fileName || filePath || 'Diff'}</span>
                <button onClick={closeFullscreen} className="inline-flex items-center"><X size={16} color={colors.textSecondary} strokeWidth={2} /></button>
              </div>
              <div className="flex flex-col"><CodePreview code={diffText} isDark={isDark} maxHeight={Math.max(320, height - 88)} language="diff" diffLanguage={detectedLanguage} showLineNumbers={false} /></div>
            </div>
          </div>
        </div>
      </div>
    </div>;
});
