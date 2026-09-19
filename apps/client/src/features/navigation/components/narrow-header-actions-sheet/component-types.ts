import type { ReactNode } from 'react';
import { PanGesture as PanGestureType } from "@/types/dom";
import { ViewStyle } from "@/types/dom";
import { AnimatedStyle } from "@/types/dom";
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
