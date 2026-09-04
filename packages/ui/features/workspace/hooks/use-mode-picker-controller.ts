import { useCallback, useMemo, useState } from 'react';
import type { AgentMode } from '@aijee/client-sdk';

const NO_MODE_ID = '__none__';

export function useModePickerController(modes: AgentMode[], onSelect: (mode: AgentMode) => void, onSkip: () => void) {
  const userDefault = useMemo(() => modes.find((mode) => mode.is_default), [modes]);
  const [selectedId, setSelectedId] = useState(userDefault?.id ?? NO_MODE_ID);
  const handleConfirm = useCallback(() => {
    if (selectedId === NO_MODE_ID) {
      onSkip();
      return;
    }
    const mode = modes.find((item) => item.id === selectedId);
    if (mode) onSelect(mode);
    else onSkip();
  }, [modes, onSelect, onSkip, selectedId]);
  return { selectedId, setSelectedId, handleConfirm, noModeId: NO_MODE_ID };
}
