import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

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
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable
          style={[styles.backdrop, { backgroundColor: isDark ? 'rgba(6, 8, 12, 0.64)' : 'rgba(20, 24, 30, 0.28)' }]}
          onPress={closeOnBackdrop ? onClose : undefined}
          accessibilityLabel="关闭弹窗"
        />
        <Pressable
          style={[
            styles.content,
            { backgroundColor: isDark ? 'rgba(24, 26, 30, 0.96)' : 'rgba(250, 251, 253, 0.92)' },
            contentStyle,
          ]}
          onPress={(event) => event.stopPropagation()}
        >
          {children}
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  content: {
    maxWidth: '100%',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    borderColor: 'rgba(255,255,255,0.16)',
    boxShadow: '0px 14px 38px rgba(0,0,0,0.24)',
    ...( { backdropFilter: 'blur(18px)' } as any),
  },
});
