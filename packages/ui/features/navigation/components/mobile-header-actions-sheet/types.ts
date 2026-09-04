import type { ReactNode } from 'react';
import type { PanGesture as PanGestureType } from 'react-native-gesture-handler';
import type { ViewStyle } from 'react-native';
import type { AnimatedStyle } from 'react-native-reanimated';

export interface MobileHeaderActionItem {
  key: string;
  label: string;
  icon: ReactNode;
  onPress: () => void;
}

export interface MobileHeaderActionsSheetProps {
  visible: boolean;
  onClose: () => void;
  items: MobileHeaderActionItem[];
}

export interface MobileHeaderActionsSheetViewProps {
  visible: boolean;
  items: MobileHeaderActionItem[];
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
