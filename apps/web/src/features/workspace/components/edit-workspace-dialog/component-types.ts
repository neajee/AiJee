import type React from "react";
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
  colors: {
    text: string;
  };
  textPrimary: string;
  textMuted: string;
  inputBg: string;
  inputBorder: string;
  name: string;
  setName: (value: string) => void;
  saving: boolean;
  canSave: boolean;
  nameRef: RefObject<HTMLInputElement | null>;
  handleSave: () => void;
  handleKeyPress: (event: React.SyntheticEvent<React.KeyboardEvent>) => void;
  onClose: () => void;
}
