import { Spinner, Text, View } from 'tamagui';
import { Pressable } from 'react-native';
import { formatAgentModeLabel, type AgentMode } from '@/features/agent/mode';
import { styles } from '../../../utils/toolbar-styles';
import type { ToolbarController } from './types';

type ModeToggleProps = Pick<ToolbarController, 'theme' | 'appMode' | 'toolbarDisabled' | 'displayedMode' | 'pendingMode' | 'handleSelectMode'>;

export function ModeToggle({ theme, appMode, toolbarDisabled, displayedMode, pendingMode, handleSelectMode }: ModeToggleProps) {
  if (appMode !== 'code') return null;
  return <View style={[styles.modeToggle, { backgroundColor: theme.isDark ? '#242422' : '#ECEBE7', borderColor: theme.toolbarBorder }]}>
    {(['work', 'plan'] as AgentMode[]).map((mode) => {
      const active = displayedMode === mode;
      const pending = pendingMode === mode;
      return <Pressable key={mode} accessibilityRole="button" accessibilityLabel={pending ? `Switching to ${formatAgentModeLabel(mode)} mode` : `Switch to ${formatAgentModeLabel(mode)} mode`} accessibilityState={{ selected: active, disabled: toolbarDisabled || false }} disabled={toolbarDisabled || false} onPress={() => handleSelectMode(mode)} style={({ pressed }) => [styles.modeButton, active && { backgroundColor: theme.isDark ? '#343432' : '#FFFFFF' }, pressed && !active && { opacity: 0.72 }]}>
        <Text style={[styles.modeButtonText, { color: active ? theme.textPrimary : theme.textMuted, opacity: pending ? 0 : 1 }]}>{formatAgentModeLabel(mode)}</Text>
        {pending && <Spinner size="small" color={active ? theme.textPrimary : theme.textMuted} style={styles.modePendingIndicator} />}
      </Pressable>;
    })}
  </View>;
}
