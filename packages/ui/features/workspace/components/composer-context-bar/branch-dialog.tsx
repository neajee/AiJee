import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { usePromptTheme } from '@/components/surface-theme/use-prompt-theme';
import { styles } from '../../utils/composer-context-bar-styles';

interface BranchDialogProps {
  visible: boolean;
  currentBranch: string | null;
  branchName: string;
  busy: string | null;
  error: string | null;
  setBranchName: (value: string) => void;
  onClose: () => void;
  onCreate: () => void;
}

export function BranchDialog({ visible, currentBranch, branchName, busy, error, setBranchName, onClose, onCreate }: BranchDialogProps) {
  const theme = usePromptTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.branchOverlay} onPress={onClose}>
        <Pressable style={[styles.branchDialog, { backgroundColor: theme.dropdownBg, borderColor: theme.dropdownBorder }]} onPress={(event) => event.stopPropagation()}>
          <Text style={[styles.branchTitle, { color: theme.textPrimary }]}>新建分支</Text>
          <Text style={[styles.branchHint, { color: theme.textMuted }]}>将从当前分支 {currentBranch ?? 'HEAD'} 创建并立即切换。</Text>
          <TextInput
            value={branchName}
            onChangeText={setBranchName}
            onSubmitEditing={onCreate}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="例如：feat/new-flow"
            placeholderTextColor={theme.textMuted}
            style={[styles.branchInput, { color: theme.textPrimary, borderColor: theme.dropdownBorder, backgroundColor: theme.hoverBg }]}
          />
          {error ? <Text style={[styles.branchError, { color: theme.colors.destructive }]}>{error}</Text> : null}
          <View style={styles.branchActions}>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.branchCancel, { borderColor: theme.dropdownBorder }, pressed && { opacity: 0.7 }]}><Text style={{ color: theme.textPrimary }}>取消</Text></Pressable>
            <Pressable disabled={!branchName.trim() || busy === 'new-branch'} onPress={onCreate} style={({ pressed }) => [styles.branchCreate, { backgroundColor: theme.accentColor }, (!branchName.trim() || busy === 'new-branch') && { opacity: 0.45 }, pressed && { opacity: 0.75 }]}><Text style={[styles.branchCreateText, { color: theme.colors.onAccent }]}>{busy === 'new-branch' ? '创建中…' : '创建并切换'}</Text></Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
