import { Text, View } from 'tamagui';
import { useState } from 'react';
import { Pressable } from 'react-native';
import { Plus } from 'lucide-react-native';
import { API_TYPES, ApiTypeSelector, Field, ModelEntryRow } from '../custom-models-form';
import { providerPageStyles } from '../../utils/custom-models-styles';
import { ProviderRow } from './provider-row';
import type { CustomProviderRowProps } from './types';

export function CustomProviderRow({ name, provider, colors, onUpdate, onRemove }: CustomProviderRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const modelCount = provider.models?.length ?? 0;
  const apiLabel = API_TYPES.find((item) => item.value === provider.api)?.label ?? provider.api ?? '未设置 API';

  return (
    <View onPointerEnter={() => setHovered(true)} onPointerLeave={() => { setHovered(false); setMenuOpen(false); }}>
      <ProviderRow
        name={name}
        meta={`${apiLabel} · ${modelCount} 个模型`}
        colors={colors}
        onPress={() => setExpanded((value) => !value)}
        trailing={(hovered || menuOpen) ? (
          <View style={providerPageStyles.menuAnchor}>
            <Pressable
              onPress={(event) => { event.stopPropagation?.(); setMenuOpen((value) => !value); }}
              accessibilityRole="button"
              accessibilityLabel={`管理 ${name}`}
              style={({ pressed }) => [providerPageStyles.moreButton, pressed && { backgroundColor: colors.pressedBg }]}
            >
              <Text style={[providerPageStyles.moreText, { color: colors.textSecondary }]}>•••</Text>
            </Pressable>
            {menuOpen ? (
              <Pressable
                onPress={(event) => { event.stopPropagation?.(); onRemove(); setMenuOpen(false); }}
                accessibilityRole="button"
                accessibilityLabel={`删除 ${name}`}
                style={[providerPageStyles.menu, { backgroundColor: colors.cardBg, borderColor: colors.borderColor }]}
              >
                <Text style={[providerPageStyles.menuText, { color: colors.dangerColor }]}>删除服务</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      />
      {expanded ? (
        <View style={[providerPageStyles.inlinePanel, { borderTopColor: colors.separator }]}>
          <Field label="Base URL" value={provider.baseUrl ?? ''} onChangeText={(value) => onUpdate({ ...provider, baseUrl: value || undefined })} placeholder="http://localhost:11434/v1" colors={colors} mono />
          <ApiTypeSelector value={provider.api ?? 'openai-completions'} onChange={(value) => onUpdate({ ...provider, api: value })} colors={colors} />
          <Field label="API 密钥" value={provider.apiKey ?? ''} onChangeText={(value) => onUpdate({ ...provider, apiKey: value || undefined })} placeholder="可选" colors={colors} />
          <View style={providerPageStyles.modelEditorHeader}>
            <Text style={[providerPageStyles.rowMeta, { color: colors.textSecondary }]}>模型</Text>
            <Pressable onPress={() => onUpdate({ ...provider, models: [...(provider.models ?? []), { id: `model-${modelCount + 1}` }] })} accessibilityRole="button" style={({ pressed }) => [providerPageStyles.addModelButton, { borderColor: colors.borderColor }, pressed && { backgroundColor: colors.pressedBg }]}>
              <Plus size={14} color={colors.textSecondary} strokeWidth={2} />
              <Text style={[providerPageStyles.linkText, { color: colors.textSecondary }]}>添加模型</Text>
            </Pressable>
          </View>
          {(provider.models ?? []).map((model, index) => (
            <ModelEntryRow
              key={`${model.id}-${index}`}
              model={model}
              colors={colors}
              isLast={index === modelCount - 1}
              onUpdate={(next) => {
                const models = [...(provider.models ?? [])];
                models[index] = next;
                onUpdate({ ...provider, models });
              }}
              onRemove={() => onUpdate({ ...provider, models: (provider.models ?? []).filter((_, itemIndex) => itemIndex !== index) })}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
