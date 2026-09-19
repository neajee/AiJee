import { toTailwind } from "@/styles/to-tailwind";
import { formatAgentModeLabel, type AgentMode } from '@/features/agent/mode';
import { styles } from '../../../utils/toolbar-styles';
import type { ToolbarController } from './component-types';
type ModeToggleProps = Pick<ToolbarController, 'theme' | 'appMode' | 'toolbarDisabled' | 'displayedMode' | 'pendingMode' | 'handleSelectMode'>;
export function ModeToggle({
  theme,
  appMode,
  toolbarDisabled,
  displayedMode,
  pendingMode,
  handleSelectMode
}: ModeToggleProps) {
  if (appMode !== 'code') return null;
  return <div className={toTailwind([styles.modeToggle, {
    backgroundColor: theme.isDark ? '#242422' : '#ECEBE7',
    borderColor: theme.toolbarBorder
  }])}>
    {(['work', 'plan'] as AgentMode[]).map(mode => {
      const active = displayedMode === mode;
      const pending = pendingMode === mode;
      return <button key={mode} role="button" aria-label={pending ? `Switching to ${formatAgentModeLabel(mode)} mode` : `Switch to ${formatAgentModeLabel(mode)} mode`} accessibilityState={{
        selected: active,
        disabled: toolbarDisabled || false
      }} disabled={toolbarDisabled || false} onClick={() => handleSelectMode(mode)}>
        <span className={toTailwind([styles.modeButtonText, {
          color: active ? theme.textPrimary : theme.textMuted,
          opacity: pending ? 0 : 1
        }])}>{formatAgentModeLabel(mode)}</span>
        {pending && <span size="small" color={active ? theme.textPrimary : theme.textMuted} className={toTailwind(styles.modePendingIndicator)} />}
      </button>;
    })}
  </div>;
}
