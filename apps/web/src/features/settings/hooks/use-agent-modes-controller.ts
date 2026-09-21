import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAgentModes } from '@aijee/client-sdk';

export function useAgentModesController() {
  const { modes, loaded, create, update } = useAgentModes();
  const [value, setValue] = useState('');
  const [savedValue, setSavedValue] = useState('');
  const [saving, setSaving] = useState(false);
  const mode = useMemo(() => modes.find((item) => item.is_default) ?? modes[0], [modes]);

  useEffect(() => {
    const prompt = mode?.system_prompt ?? '';
    setValue(prompt);
    setSavedValue(prompt);
  }, [mode?.id, mode?.system_prompt]);

  const changed = value !== savedValue;
  const save = useCallback(async () => {
    if (!changed || saving) return;
    setSaving(true);
    const systemPrompt = value.trim() || undefined;
    try {
      if (mode) await update(mode.id, { systemPrompt });
      else await create({ name: '个性化', systemPrompt, isDefault: true });
      setSavedValue(value);
    } finally {
      setSaving(false);
    }
  }, [changed, create, mode, saving, update, value]);

  return { loaded, value, setValue, saving, changed, save };
}
