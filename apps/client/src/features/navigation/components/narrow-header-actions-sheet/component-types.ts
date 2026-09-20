import type React from "react";
import type { ReactNode } from 'react';
export interface NarrowHeaderActionItem {
  key: string;
  label: string;
  icon: ReactNode;
  onPress: () => void;
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
  sheetStyle: React.CSSProperties<React.CSSProperties>;
  overlayStyle: React.CSSProperties<React.CSSProperties>;
  panGesture: unknown;
  onDismiss: () => void;
}
