import type { ReactNode } from 'react';
import type { TabItem } from './tab-bar';

export interface ChangesPanelProps {
  extraTabs?: TabItem[];
  activeExtraTab?: string | null;
  onExtraTabChange?: (key: string | null) => void;
  renderExtraTab?: (key: string) => ReactNode;
}

export interface SelectedFile {
  path: string;
  staged: boolean;
}
