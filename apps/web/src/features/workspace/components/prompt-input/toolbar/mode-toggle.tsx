import { formatAgentModeLabel, type AgentMode } from '@/features/agent/mode';
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
  return <div className={"  border-border"}>
    {(['work', 'plan'] as AgentMode[]).map(mode => {
      const active = displayedMode === mode;
      const pending = pendingMode === mode;
      return <button key={mode} role="button" aria-label={pending ? `Switching to ${formatAgentModeLabel(mode)} mode` : `Switch to ${formatAgentModeLabel(mode)} mode`} disabled={toolbarDisabled || false} onClick={() => handleSelectMode(mode)}>
        <span className={"  opacity-100"}>{formatAgentModeLabel(mode)}</span>
        {pending && <span className={"block" + " size-3 animate-spin"} />}
      </button>;
    })}
  </div>;
}
