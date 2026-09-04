import type { Workspace } from '../../types';
import type { RefObject } from 'react';

export interface EditWorkspaceDialogProps {
  visible: boolean;
  workspace: Workspace | null;
  onClose: () => void;
}

export interface EditWorkspaceFormProps {
  workspace: Workspace | null;
  isDark: boolean;
  colors: { text: string };
  textPrimary: string;
  textMuted: string;
  inputBg: string;
  inputBorder: string;
  name: string;
  setName: (value: string) => void;
  saving: boolean;
  canSave: boolean;
  nameRef: RefObject<import('react-native').TextInput | null>;
  handleSave: () => void;
  handleKeyPress: (event: import('react-native').NativeSyntheticEvent<import('react-native').TextInputKeyPressEventData>) => void;
  onClose: () => void;
}
