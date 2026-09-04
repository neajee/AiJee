import type { ReactNode } from 'react';

export interface WorkspaceSidebarProps {
  children: ReactNode;
  storageScope?: string;
  defaultCollapsed?: boolean;
  locked?: boolean;
}
