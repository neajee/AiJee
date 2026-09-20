import type React from "react";
import type { ReactNode } from 'react';
export interface NarrowHeaderActionItem {
  key: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}
export interface NarrowHeaderActionsSheetProps {
  visible: boolean;
  onClose: () => void;
  items: NarrowHeaderActionItem[];
}
export interface NarrowHeaderActionsSheetViewProps {
  visible: boolean;
  items: NarrowHeaderActionItem[];
  bottomInset: number;
  isDark: boolean;
  textPrimary: string;
  textSecondary: string;
  rowBorder: string;
  overlayColor: string;
  handleColor: string;
  sheetStyle: React.CSSProperties;
  overlayStyle: React.CSSProperties;
  panGesture: unknown;
  onDismiss: () => void;
}
