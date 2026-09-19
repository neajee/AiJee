import type { ReactNode } from 'react';
import type { PanGesture as PanGestureType } from "@/platform/dom";
import type { ViewStyle } from "@/platform/dom";
import type { AnimatedStyle } from "@/platform/dom";

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
  sheetStyle: AnimatedStyle<ViewStyle>;
  overlayStyle: AnimatedStyle<ViewStyle>;
  panGesture: PanGestureType;
  onDismiss: () => void;
}
