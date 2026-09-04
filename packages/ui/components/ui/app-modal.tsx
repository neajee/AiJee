import type { ReactNode } from 'react';
import { Modal, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { View as TamaguiView } from 'tamagui';

import { useColorScheme } from '@/hooks/use-color-scheme';

export function AppModal({
  visible,
  onClose,
  children,
  contentStyle,
  closeOnBackdrop = true,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  closeOnBackdrop?: boolean;
}) {
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const contentStyles = Array.isArray(contentStyle) ? contentStyle : contentStyle ? [contentStyle] : [];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <TamaguiView style={rootStyle}>
        <Pressable
          style={[backdropStyle, { backgroundColor: isDark ? 'rgba(6, 8, 12, 0.64)' : 'rgba(20, 24, 30, 0.28)' }]}
          onPress={closeOnBackdrop ? onClose : undefined}
          accessibilityLabel="关闭弹窗"
        />
        <Pressable
          style={[
            contentStyleBase,
            { backgroundColor: isDark ? 'rgba(24, 26, 30, 0.96)' : 'rgba(250, 251, 253, 0.92)' },
            ...contentStyles,
          ]}
          onPress={(event) => event.stopPropagation()}
        >
          {children}
        </Pressable>
      </TamaguiView>
    </Modal>
  );
}

const rootStyle = { flex: 1, alignItems: 'center', justifyContent: 'center' } as const;
const backdropStyle = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } as const;
const contentStyleBase = {
    maxWidth: '100%',
    overflow: 'hidden',
    borderWidth: 0.5,
    borderRadius: 18,
    borderColor: 'rgba(255,255,255,0.16)',
    boxShadow: '0px 14px 38px rgba(0,0,0,0.24)',
    ...( { backdropFilter: 'blur(18px)' } as any),
  } as const;
