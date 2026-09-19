import type { ComponentType } from 'react';

export interface CommandPaletteProps {
  visible: boolean;
  onClose: () => void;
}

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: ComponentType<any>;
  section: string;
  onSelect: () => void;
}
