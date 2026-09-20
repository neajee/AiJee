import { memo, useCallback } from 'react';
import { useWindowDimensions } from "@/platform/browser";
import { Animated } from "@/platform/animation";
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
        <span className={"" + " " + ""}>{title} {fileName || filePath || 'file'}</span>
        {(addedLines > 0 || removedLines > 0) && <div className={""}><span className={"" + " " + ""}>+{addedLines}</span><span className={"" + " " + ""}>-{removedLines}</span></div>}
      </ToolHeader>
      <ToolBody expanded={expanded && hasDiff}>
        <div ref={previewRef} className={""}>
          <button onClick={openFullscreen} role="button" aria-label="Open diff fullscreen" className={"" + " " + ""}>
            <Maximize2 size={12} color={colors.textSecondary} strokeWidth={2} /><span className={"" + " " + ""}>Fullscreen</span>
          </button>
          <CodePreview code={diffText} isDark={isDark} maxHeight={TOOL_BODY_MAX_HEIGHT} language="diff" showLineNumbers={false} />
        </div>
      </ToolBody>
      <div visible={fullscreenOpen} transparent animationType="none" onRequestClose={closeFullscreen}>
        <div className={""}>
          <div className={"" + " " + "opacity-[null]"} />
          <button className={""} onClick={closeFullscreen} />
          <div className={"" + " " + "w-[0] h-[0] rounded-[0]"}>
            <div className={"flex-1 opacity-[null]"}>
              <div className={"" + " " + ""}>
                <span className={"" + " " + ""}>{fileName || filePath || 'Diff'}</span>
                <button onClick={closeFullscreen} className={""}><X size={16} color={colors.textSecondary} strokeWidth={2} /></button>
              </div>
              <div className={""}><CodePreview code={diffText} isDark={isDark} maxHeight={Math.max(320, height - 88)} language="diff" diffLanguage={detectedLanguage} showLineNumbers={false} /></div>
            </div>
          </div>
        </div>
      </div>
    </div>;
});
