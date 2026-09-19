import { toTailwind } from "@/styles/to-tailwind";
import { memo, useCallback } from 'react';
import { useWindowDimensions } from "@/platform/browser";
import { Animated } from "@/platform/animation";
import { Maximize2, X } from 'lucide-react';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { CodePreview } from '../../code-preview';
import type { ToolCallInfo } from '../agent-types';
import { ToolBody, ToolHeader, TOOL_BODY_MAX_HEIGHT } from '../tool-disclosure';
import { useEditToolCallController } from '../../../../hooks/use-edit-tool-call-controller';
import { styles } from './style-tokens';
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
        <span className={toTailwind([styles.fileName, {
        color: colors.textSecondary
      }])}>{title} {fileName || filePath || 'file'}</span>
        {(addedLines > 0 || removedLines > 0) && <div className={toTailwind(styles.metaRow)}><span className={toTailwind([styles.metaAdd, {
          color: isDark ? '#3FB950' : '#1A7F37'
        }])}>+{addedLines}</span><span className={toTailwind([styles.metaRemove, {
          color: isDark ? '#F85149' : '#CF222E'
        }])}>-{removedLines}</span></div>}
      </ToolHeader>
      <ToolBody expanded={expanded && hasDiff}>
        <div ref={previewRef} className={toTailwind(styles.diffWrap)}>
          <button onClick={openFullscreen} role="button" aria-label="Open diff fullscreen" className={toTailwind([styles.fullscreenButton, {
          borderColor: colors.border,
          backgroundColor: colors.surfaceRaised
        }])}>
            <Maximize2 size={12} color={colors.textSecondary} strokeWidth={2} /><span className={toTailwind([styles.fullscreenButtonText, {
            color: colors.textSecondary
          }])}>Fullscreen</span>
          </button>
          <CodePreview code={diffText} isDark={isDark} maxHeight={TOOL_BODY_MAX_HEIGHT} language="diff" showLineNumbers={false} />
        </div>
      </ToolBody>
      <div visible={fullscreenOpen} transparent animationType="none" onRequestClose={closeFullscreen}>
        <div className={toTailwind(styles.heroRoot)}>
          <div className={toTailwind([styles.heroBackdrop, {
          opacity: heroProgress
        }])} />
          <button className={toTailwind(styles.heroBackdropPressable)} onClick={closeFullscreen} />
          <div className={toTailwind([styles.heroCard, {
          backgroundColor: colors.background,
          borderColor: colors.border,
          left: heroProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [heroRect.x, 0]
          }),
          top: heroProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [heroRect.y, 0]
          }),
          width: heroProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [heroRect.width, width]
          }),
          height: heroProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [heroRect.height, height]
          }),
          borderRadius: heroProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [12, 0]
          })
        }])}>
            <div className={toTailwind({
            flex: 1,
            opacity: heroProgress.interpolate({
              inputRange: [0, 0.55, 1],
              outputRange: [0, 0, 1]
            })
          })}>
              <div className={toTailwind([styles.fullscreenHeader, {
              borderBottomColor: colors.border,
              backgroundColor: colors.background
            }])}>
                <span className={toTailwind([styles.modalTitle, {
                color: colors.text
              }])}>{fileName || filePath || 'Diff'}</span>
                <button onClick={closeFullscreen} className={toTailwind(styles.modalCloseButton)}><X size={16} color={colors.textSecondary} strokeWidth={2} /></button>
              </div>
              <div className={toTailwind(styles.fullscreenBody)}><CodePreview code={diffText} isDark={isDark} maxHeight={Math.max(320, height - 88)} language="diff" diffLanguage={detectedLanguage} showLineNumbers={false} /></div>
            </div>
          </div>
        </div>
      </div>
    </div>;
});
