import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useColors } from '../../hooks/use-custom-models-theme';
import { ApiTypeSelector } from './api-type-selector';
import { Field } from './field';

// ─── Add Provider Form ────────────────────────────────────────

export function AddProviderForm({
  colors,
  onAdd,
  onCancel,
}: {
  colors: ReturnType<typeof useColors>;
  onAdd: (name: string, baseUrl: string, api: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [api, setApi] = useState('openai-completions');

  return (
    <View style={[colors.s.card.card, { backgroundColor: colors.cardBg }]}>
      <View style={colors.s.card.body}>
        <Text style={[colors.s.add.formTitle, { color: colors.textPrimary }]}>
          新建提供商
        </Text>
        <Field
          label="提供商名称"
          value={name}
          onChangeText={setName}
          placeholder="例如 ollama、lm-studio、my-vllm"
          colors={colors}
          autoFocus
        />
        <Field
          label="Base URL"
          value={baseUrl}
          onChangeText={setBaseUrl}
          placeholder="http://localhost:11434/v1"
          colors={colors}
          mono
        />
        <ApiTypeSelector value={api} onChange={setApi} colors={colors} />
        <View style={colors.s.add.actions}>
          <Pressable
            onPress={onCancel}
            style={({ pressed }) => [
              colors.s.add.btn,
              { borderColor: colors.borderColor },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[colors.s.add.btnText, { color: colors.textMuted }]}>
              取消
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (name.trim()) {
                onAdd(name.trim(), baseUrl.trim(), api);
              }
            }}
            style={({ pressed }) => [
              colors.s.add.btn,
              {
                backgroundColor: colors.isDark ? '#fefdfd' : '#1a1a1a',
                borderColor: colors.isDark ? '#fefdfd' : '#1a1a1a',
              },
              !name.trim() && { opacity: 0.4 },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text
              style={[
                colors.s.add.btnText,
                { color: colors.isDark ? '#1a1a1a' : '#fff' },
              ]}
            >
              添加提供商
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
