import type { AgentMode } from '@aijee/client-sdk';

export interface ModePickerDialogProps {
  visible: boolean;
  modes: AgentMode[];
  onSelect: (mode: AgentMode) => void;
  onSkip: () => void;
}
