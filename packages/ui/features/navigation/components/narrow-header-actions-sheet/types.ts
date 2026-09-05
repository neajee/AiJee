import type { ReactNode } from 'react';
import type { PanGesture as PanGestureType } from 'react-native-gesture-handler';
import type { ViewStyle } from 'react-native';
import type { AnimatedStyle } from 'react-native-reanimated';

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
