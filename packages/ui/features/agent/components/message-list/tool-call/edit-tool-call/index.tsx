import { Text, View } from 'tamagui';
import { memo, useCallback } from 'react';
import { Animated, Modal, Pressable, useWindowDimensions } from 'react-native';
import { Maximize2, X } from 'lucide-react-native';

import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { CodePreview } from '../../code-preview';
import type { ToolCallInfo } from '../../../../types';
import { ToolBody, ToolHeader, TOOL_BODY_MAX_HEIGHT } from '../tool-disclosure';
import { useEditToolCallController } from '../../../../hooks/use-edit-tool-call-controller';
import { styles } from './styles';

export const EditToolCall = memo(function EditToolCall({ tc, isDark }: { tc: ToolCallInfo; isDark: boolean }) {
  const colors = useThemeTokens();
  const { width, height } = useWindowDimensions();
  const controller = useEditToolCallController(tc);
  const {
    active, expanded, setExpanded, fullscreenOpen, filePath, fileName, detectedLanguage,
    diffText, hasDiff, removedLines, addedLines, previewRef, heroRect, heroProgress,
    openFullscreen, closeFullscreen,
  } = controller;
  const toggle = useCallback(() => setExpanded((value) => !value), [setExpanded]);
  const title = active ? 'Editing' : 'Edited';
  return (
    <View>
      <ToolHeader expanded={expanded} expandable={hasDiff} onToggle={toggle} isDark={isDark} accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} diff of ${fileName || 'file'}`}>
        <Text style={[styles.fileName, { color: colors.textSecondary }]} numberOfLines={1}>{title} {fileName || filePath || 'file'}</Text>
        {(addedLines > 0 || removedLines > 0) && <View style={styles.metaRow}><Text style={[styles.metaAdd, { color: isDark ? '#3FB950' : '#1A7F37' }]}>+{addedLines}</Text><Text style={[styles.metaRemove, { color: isDark ? '#F85149' : '#CF222E' }]}>-{removedLines}</Text></View>}
      </ToolHeader>
      <ToolBody expanded={expanded && hasDiff}>
        <View ref={previewRef} style={styles.diffWrap}>
          <Pressable onPress={openFullscreen} accessibilityRole="button" accessibilityLabel="Open diff fullscreen" style={[styles.fullscreenButton, { borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}>
            <Maximize2 size={12} color={colors.textSecondary} strokeWidth={2} /><Text style={[styles.fullscreenButtonText, { color: colors.textSecondary }]}>Fullscreen</Text>
          </Pressable>
          <CodePreview code={diffText} isDark={isDark} maxHeight={TOOL_BODY_MAX_HEIGHT} language="diff" showLineNumbers={false} />
        </View>
      </ToolBody>
      <Modal visible={fullscreenOpen} transparent animationType="none" onRequestClose={closeFullscreen}>
        <View style={styles.heroRoot}>
          <Animated.View style={[styles.heroBackdrop, { opacity: heroProgress }]} />
          <Pressable style={styles.heroBackdropPressable} onPress={closeFullscreen} />
          <Animated.View style={[styles.heroCard, { backgroundColor: colors.background, borderColor: colors.border, left: heroProgress.interpolate({ inputRange: [0, 1], outputRange: [heroRect.x, 0] }), top: heroProgress.interpolate({ inputRange: [0, 1], outputRange: [heroRect.y, 0] }), width: heroProgress.interpolate({ inputRange: [0, 1], outputRange: [heroRect.width, width] }), height: heroProgress.interpolate({ inputRange: [0, 1], outputRange: [heroRect.height, height] }), borderRadius: heroProgress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }]}>
            <Animated.View style={{ flex: 1, opacity: heroProgress.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0, 0, 1] }) }}>
              <View style={[styles.fullscreenHeader, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>{fileName || filePath || 'Diff'}</Text>
                <Pressable onPress={closeFullscreen} style={styles.modalCloseButton}><X size={16} color={colors.textSecondary} strokeWidth={2} /></Pressable>
              </View>
              <View style={styles.fullscreenBody}><CodePreview code={diffText} isDark={isDark} maxHeight={Math.max(320, height - 88)} language="diff" diffLanguage={detectedLanguage} showLineNumbers={false} /></View>
            </Animated.View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
});
