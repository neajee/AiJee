import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Fonts } from '@/constants/theme';
import { useSettingsPalette, useSettingsPhoneLayout } from '@/components/settings-surface';
import { useAgentModesController } from '../../hooks/use-agent-modes-controller';

/** A single, calm surface for instructions that shape every agent session. */
export function AgentModesSection({ isDark: _isDark, isNative }: { isDark: boolean; isNative?: boolean }) {
  const palette = useSettingsPalette();
  const phone = useSettingsPhoneLayout();
  const roomy = isNative ?? phone;
  const { loaded, value, setValue, saving, changed, save } = useAgentModesController();

  if (!loaded) return null;

  return (
    <View style={[styles.wrap, roomy && styles.wrapRoomy]}>
      <View style={[styles.topline, roomy && styles.toplineRoomy]}>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: palette.text }]}>自定义指令</Text>
          <Text style={[styles.description, { color: palette.textTertiary }]}>向智能体提供适用于此主机上所有聊天的额外说明和上下文。</Text>
        </View>
        <Pressable onPress={save} disabled={!changed || saving} accessibilityRole="button" accessibilityLabel="保存自定义指令" style={({ pressed }) => [styles.save, { backgroundColor: changed ? palette.accent : palette.tile }, (!changed || saving) && styles.saveDisabled, pressed && changed && styles.savePressed]}>
          <Text style={[styles.saveText, { color: changed ? palette.onAccent : palette.textTertiary }]}>{saving ? '保存中' : '保存'}</Text>
        </Pressable>
      </View>
      <TextInput
        value={value}
        onChangeText={setValue}
        multiline
        textAlignVertical="top"
        placeholder="例如：回答时保持简洁；先说明结论，再给出关键步骤。"
        placeholderTextColor={palette.textTertiary}
        accessibilityLabel="自定义指令"
        style={[styles.editor, roomy && styles.editorRoomy, { color: palette.text, backgroundColor: palette.tile, borderColor: palette.separator }]}
      />
      <Text style={[styles.hint, { color: palette.textTertiary }]}>保存后，新建或重新载入的智能体会应用这些指令。</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', alignSelf: 'stretch', gap: 12 },
  wrapRoomy: { gap: 14 },
  topline: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
  toplineRoomy: { gap: 24 },
  copy: { flex: 1, gap: 4 },
  title: { fontFamily: Fonts.sansMedium, fontSize: 15, lineHeight: 21 },
  description: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  save: { minWidth: 52, minHeight: 32, paddingHorizontal: 12, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  saveDisabled: { opacity: 0.7 },
  savePressed: { opacity: 0.82 },
  saveText: { fontFamily: Fonts.sansMedium, fontSize: 13 },
  editor: { minHeight: 148, paddingHorizontal: 13, paddingVertical: 11, borderWidth: StyleSheet.hairlineWidth, borderRadius: 9, fontFamily: Fonts.sans, fontSize: 13, lineHeight: 21 },
  editorRoomy: { minHeight: 172, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, lineHeight: 22, borderRadius: 10 },
  hint: { fontFamily: Fonts.sans, fontSize: 11, lineHeight: 16 },
});
