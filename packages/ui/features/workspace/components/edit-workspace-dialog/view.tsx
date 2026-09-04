import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useEditWorkspaceController } from '../../hooks/use-edit-workspace-controller';
import { EditWorkspaceForm } from './form-content';
import { styles } from './styles';
import type { EditWorkspaceDialogProps } from './types';

export function EditWorkspaceDialog({ visible, workspace, onClose }: EditWorkspaceDialogProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { isWideScreen } = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const controller = useEditWorkspaceController(visible, workspace, onClose);
  const textPrimary = isDark ? '#fefdfd' : colors.text;
  const textMuted = isDark ? '#cdc8c5' : colors.textTertiary;
  const inputBg = isDark ? '#1a1a1a' : '#F6F6F6';
  const inputBorder = isDark ? '#3b3a39' : 'rgba(0,0,0,0.12)';
  const formProps = { workspace, isDark, colors, textPrimary, textMuted, inputBg, inputBorder, ...controller, onClose };

  if (!isWideScreen) {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.sheetOverlay} onPress={onClose}>
            <Pressable
              style={[styles.sheetContainer, { backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF', paddingBottom: insets.bottom + 20 }]}
              onPress={(event) => event.stopPropagation()}
            >
              <View style={styles.sheetHandle}><View style={[styles.sheetHandleBar, { backgroundColor: isDark ? '#555' : '#CCC' }]} /></View>
              <Text style={[styles.sheetTitle, { color: textPrimary }]}>Edit Workspace</Text>
              <ScrollView style={styles.sheetBody} contentContainerStyle={styles.sheetBodyContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <EditWorkspaceForm {...formProps} />
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.dialog, { backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF' }]} onPress={(event) => event.stopPropagation()}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: textPrimary }]}>Edit Workspace</Text>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.5 }]}>
              <X size={18} color={textMuted} strokeWidth={2} />
            </Pressable>
          </View>
          <EditWorkspaceForm {...formProps} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
