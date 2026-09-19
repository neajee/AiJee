import type { ComponentType } from 'react';

export interface WorkspaceContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  pinned?: boolean;
  workspacePath?: string | null;
  onTogglePin?: () => void;
  onNewSession?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export type MenuIcon = ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
}>;
