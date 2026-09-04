import { Pressable, Text, View } from 'react-native';
import { RotateCw } from 'lucide-react-native';

import { TaskSelector } from '@/features/tasks/components/task-selector';
import { styles } from '../../../utils/toolbar-styles';
import { EffortPicker } from './effort-picker';
import { ModeToggle } from './mode-toggle';
import { ModelPicker } from './model-picker';
import type { ToolbarController } from './types';

export function ToolbarView(controller: ToolbarController) {
  const { theme, appMode, skeleton, isWideScreen, inline, currentModel, agentState, configError, configRetry, toolbarRef, activeDropdown, showTaskSelector } = controller;
  if (configError && !agentState) {
    return (
      <View style={inline ? styles.inlineWrap : styles.wrap}>
        <View style={[inline ? styles.inlineToolbar : styles.toolbar, styles.toolbarError, !inline && { backgroundColor: theme.toolbarBg, borderColor: theme.toolbarBorder }]}>
          <Text style={[styles.errorText, { color: theme.textMuted }]} numberOfLines={1}>Failed to load</Text>
          <Pressable onPress={configRetry} accessibilityRole="button" accessibilityLabel="Retry loading toolbar" style={({ pressed }) => [styles.retryButton, pressed && { opacity: 0.7 }]}>
            <RotateCw size={12} color={theme.accentColor} strokeWidth={2} /><Text style={[styles.retryText, { color: theme.accentColor }]}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }
  if (!agentState && !currentModel) return <>{skeleton}</>;

  return (
    <View ref={toolbarRef} style={[inline ? styles.inlineWrap : styles.wrap, activeDropdown && { zIndex: 10 }]}>
      <View style={[inline ? styles.inlineToolbar : styles.toolbar, !inline && { backgroundColor: theme.toolbarBg, borderColor: theme.toolbarBorder }]}>
        <ModelPicker {...controller} />
        <EffortPicker {...controller} />
        {!inline && <View style={styles.spacer} />}
        {showTaskSelector && appMode === 'code' && isWideScreen && <View style={styles.taskSelector}><TaskSelector placement="above" /></View>}
        <ModeToggle {...controller} />
      </View>
    </View>
  );
}
