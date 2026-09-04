import { useCallback, useEffect, useRef, useState } from 'react';
import { type NativeSyntheticEvent, TextInput, type TextInputKeyPressEventData } from 'react-native';

import { sdk } from '@aijee/client-sdk';
import { useWorkspaceStore } from '../store';
import type { Workspace } from '../types';

const { update2 } = sdk;

export function useEditWorkspaceController(visible: boolean, workspace: Workspace | null, onClose: () => void) {
  const fetchWorkspaces = useWorkspaceStore((s) => s.fetchWorkspaces);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible && workspace) {
      setName(workspace.title);
      setSaving(false);
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [visible, workspace]);

  const handleSave = useCallback(async () => {
    if (!workspace || !name.trim() || saving) return;
    setSaving(true);
    await update2({ path: { id: workspace.id }, body: { name: name.trim() } });
    await fetchWorkspaces();
    setSaving(false);
    onClose();
  }, [fetchWorkspaces, name, onClose, saving, workspace]);

  const handleKeyPress = useCallback((event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (event.nativeEvent.key === 'Enter' && name.trim()) {
      event.preventDefault?.();
      void handleSave();
    }
  }, [handleSave, name]);

  return {
    name,
    setName,
    saving,
    nameRef,
    handleSave,
    handleKeyPress,
    canSave: name.trim().length > 0 && name.trim() !== workspace?.title,
  };
}
