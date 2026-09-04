import { ScrollView, Text, View } from 'tamagui';
import { Layers } from 'lucide-react-native';
import { AppModal } from '@/components/ui';
import { Pressable } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useModePickerController } from '../../hooks/use-mode-picker-controller';
import { ModeOption } from './mode-option';
import { styles } from './styles';
import type { ModePickerDialogProps } from './types';

export function ModePickerDialog({ visible, modes, onSelect, onSkip }: ModePickerDialogProps) {
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const { selectedId, setSelectedId, handleConfirm, noModeId } = useModePickerController(modes, onSelect, onSkip);
  const bg = isDark ? '#1e1e1c' : '#FFFFFF';
  const textPrimary = isDark ? '#fefdfd' : '#1a1a1a';
  const textMuted = isDark ? '#cdc8c5' : '#888';
  const borderColor = isDark ? '#2a2a2a' : 'rgba(0,0,0,0.1)';
  const selectedBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';
  const selectedBorder = isDark ? '#555' : '#aaa';
  return (
    <AppModal visible={visible} onClose={onSkip} contentStyle={[styles.dialog, { backgroundColor: bg, borderColor }]}>
      <View style={styles.header}><Layers size={18} color={textPrimary} strokeWidth={1.8} /><Text style={[styles.title, { color: textPrimary }]}>Select Mode</Text></View>
      <Text style={[styles.subtitle, { color: textMuted }]}>Choose how the agent should be configured for this session.</Text>
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        <ModeOption
          selected={selectedId === noModeId}
          borderColor={borderColor}
          selectedBg={selectedBg}
          selectedBorder={selectedBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
          onPress={() => setSelectedId(noModeId)}
        />
        {modes.map((mode) => (
          <ModeOption
            key={mode.id}
            mode={mode}
            selected={selectedId === mode.id}
            borderColor={borderColor}
            selectedBg={selectedBg}
            selectedBorder={selectedBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            onPress={() => setSelectedId(mode.id)}
          />
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <Pressable onPress={handleConfirm} style={({ pressed }) => [styles.btn, { backgroundColor: isDark ? '#fefdfd' : '#1a1a1a', borderColor: isDark ? '#fefdfd' : '#1a1a1a' }, pressed && { opacity: 0.7 }]}>
          <Text style={[styles.btnText, { color: isDark ? '#1a1a1a' : '#fff' }]}>Start Session</Text>
        </Pressable>
      </View>
    </AppModal>
  );
}
