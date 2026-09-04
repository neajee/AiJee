import { Pressable, Text, TextInput, View } from 'react-native';
import { styles } from './styles';
import type { EditWorkspaceFormProps } from './types';

export function EditWorkspaceForm({
  workspace,
  isDark,
  colors,
  textPrimary,
  textMuted,
  inputBg,
  inputBorder,
  name,
  setName,
  saving,
  canSave,
  nameRef,
  handleSave,
  handleKeyPress,
  onClose,
}: EditWorkspaceFormProps) {
  return (
    <>
      <View style={styles.field}>
        <Text style={[styles.label, { color: textMuted }]}>Workspace Name</Text>
        <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: inputBorder }]}>
          <TextInput
            ref={nameRef}
            style={[styles.input, { color: textPrimary }]}
            value={name}
            onChangeText={setName}
            onKeyPress={handleKeyPress}
            placeholder="My Project"
            placeholderTextColor={textMuted}
          />
        </View>
      </View>
      <View style={styles.field}>
        <Text style={[styles.label, { color: textMuted }]}>Path</Text>
        <Text style={[styles.pathText, { color: textPrimary }]}>{workspace?.path}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [styles.cancelButton, { borderColor: inputBorder }, pressed && { opacity: 0.7 }]}
        >
          <Text style={[styles.cancelText, { color: textPrimary }]}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          disabled={!canSave || saving}
          style={({ pressed }) => [
            styles.saveButton,
            { backgroundColor: canSave ? (isDark ? '#fefdfd' : colors.text) : isDark ? '#333' : '#CCC' },
            pressed && canSave && { opacity: 0.8 },
          ]}
        >
          <Text style={[styles.saveText, { color: canSave ? (isDark ? '#121212' : '#FFFFFF') : textMuted }]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </Pressable>
      </View>
    </>
  );
}
