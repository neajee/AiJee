import { ArrowUp, Mic, Plus, Square } from 'lucide-react-native';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { View } from 'tamagui';

import type { ThemeTokens } from '@/constants/theme';
import { Fonts } from '@/constants/theme';
import { mobileLayout, mobileRadius } from '../styles/tokens';

interface ChatComposerProps {
  value: string;
  colors: ThemeTokens;
  disabled?: boolean;
  sending?: boolean;
  isStreaming?: boolean;
  onChangeText: (value: string) => void;
  onSend: () => void;
  onAbort?: () => void;
}

export function ChatComposer({
  value,
  colors,
  disabled = false,
  sending = false,
  isStreaming = false,
  onChangeText,
  onSend,
  onAbort,
}: ChatComposerProps) {
  const canSend = value.trim().length > 0 && !disabled && !sending;

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong }]}>
      <TextInput
        accessibilityLabel="输入消息"
        autoCapitalize="sentences"
        autoCorrect
        editable={!disabled}
        multiline
        onChangeText={onChangeText}
        onSubmitEditing={canSend ? onSend : undefined}
        placeholder="问点什么…"
        placeholderTextColor={colors.textTertiary}
        returnKeyType="send"
        style={[styles.input, { color: colors.text }]}
        value={value}
      />
      <View style={styles.toolbar}>
        <Pressable
          accessibilityLabel="添加附件"
          accessibilityRole="button"
          disabled
          style={[styles.toolButton, { backgroundColor: colors.surface }]}
        >
          <Plus color={colors.textTertiary} size={18} strokeWidth={1.8} />
        </Pressable>
        <View style={styles.toolbarSpacer} />
        <Mic color={colors.textTertiary} size={18} strokeWidth={1.8} />
        {isStreaming && onAbort ? (
          <Pressable
            accessibilityLabel="停止生成"
            accessibilityRole="button"
            onPress={onAbort}
            style={({ pressed }) => [styles.sendButton, { backgroundColor: colors.surface }, pressed && styles.pressed]}
          >
            <Square color={colors.text} fill={colors.text} size={13} strokeWidth={1.8} />
          </Pressable>
        ) : (
          <Pressable
            accessibilityLabel="发送消息"
            accessibilityRole="button"
            disabled={!canSend}
            onPress={onSend}
            style={({ pressed }) => [
              styles.sendButton,
              { backgroundColor: canSend ? colors.accent : colors.surface, opacity: canSend ? 1 : 0.55 },
              pressed && styles.pressed,
            ]}
          >
            <ArrowUp color={canSend ? colors.onAccent : colors.textTertiary} size={18} strokeWidth={2} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 96,
    marginHorizontal: mobileLayout.pageHorizontal,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 9,
    borderWidth: 1,
    borderRadius: mobileRadius.card,
  },
  input: {
    minHeight: 34,
    maxHeight: 110,
    padding: 0,
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 21,
    textAlignVertical: 'top',
  },
  toolbar: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toolbarSpacer: {
    flex: 1,
  },
  toolButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  sendButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  pressed: {
    opacity: 0.68,
  },
});
