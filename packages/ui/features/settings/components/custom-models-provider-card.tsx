import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check, ChevronDown, ChevronUp, Plus, Server, Trash2, X } from 'lucide-react-native';
import { type CustomProvider } from '../store/custom-models';
import { API_TYPES, ApiTypeSelector, Field, ModelEntryRow } from './custom-models-form';
import { useColors } from './custom-models-theme';

// ─── Provider Card ────────────────────────────────────────────

export function ProviderCard({
  name,
  provider,
  colors,
  onUpdate,
  onRemove,
}: {
  name: string;
  provider: CustomProvider;
  colors: ReturnType<typeof useColors>;
  onUpdate: (p: CustomProvider) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [addingModel, setAddingModel] = useState(false);
  const [newModelId, setNewModelId] = useState('');

  const models = provider.models ?? [];

  const handleAddModel = useCallback(() => {
    const trimmed = newModelId.trim();
    if (!trimmed) return;
    onUpdate({
      ...provider,
      models: [...models, { id: trimmed }],
    });
    setNewModelId('');
    setAddingModel(false);
  }, [newModelId, provider, models, onUpdate]);

  const ChevronIcon = expanded ? ChevronUp : ChevronDown;
  const apiLabel =
    API_TYPES.find((t) => t.value === provider.api)?.label ?? provider.api ?? '未设置';

  return (
    <View style={[colors.s.card.card, { backgroundColor: colors.cardBg }]}>
      {/* Header */}
      <Pressable
        onPress={() => setExpanded(!expanded)}
        style={({ hovered }: any) => [
          colors.s.card.header,
          hovered && { backgroundColor: colors.accentBg },
        ]}
      >
        <View style={colors.s.card.headerLeft}>
          <View style={[colors.s.card.providerIcon, { backgroundColor: colors.accentBg }]}>
            <Server size={colors.roomy ? 16 : 10} color={colors.textMuted} strokeWidth={1.8} />
          </View>
          <View style={colors.s.card.headerText}>
            <Text style={[colors.s.card.providerName, { color: colors.textPrimary }]}>
              {name}
            </Text>
            <Text style={[colors.s.card.providerMeta, { color: colors.textMuted }]}>
              {apiLabel} · {models.length} 个模型
            </Text>
          </View>
        </View>
        <View style={colors.s.card.headerRight}>
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onRemove();
            }}
            style={({ pressed }) => [
              colors.s.card.headerBtn,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Trash2 size={colors.roomy ? 16 : 10} color={colors.dangerColor} strokeWidth={1.8} />
          </Pressable>
          <ChevronIcon size={colors.roomy ? 16 : 11} color={colors.textMuted} strokeWidth={1.8} />
        </View>
      </Pressable>

      {/* Expanded body */}
      {expanded && (
        <View style={[colors.s.card.body, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator }]}>
          {/* Connection fields */}
          <Field
            label="Base URL"
            value={provider.baseUrl ?? ''}
            onChangeText={(v) => onUpdate({ ...provider, baseUrl: v || undefined })}
            placeholder="http://localhost:11434/v1"
            colors={colors}
            mono
          />
          <ApiTypeSelector
            value={provider.api ?? 'openai-completions'}
            onChange={(v) => onUpdate({ ...provider, api: v })}
            colors={colors}
          />
          <Field
            label="API 密钥"
            value={provider.apiKey ?? ''}
            onChangeText={(v) => onUpdate({ ...provider, apiKey: v || undefined })}
            placeholder="可选 — 环境变量、!命令或字面量密钥"
            colors={colors}
          />

          {/* Models list */}
          <View style={colors.s.card.modelsSection}>
            <View style={colors.s.card.modelsSectionHeader}>
              <Text style={[colors.s.card.modelsSectionTitle, { color: colors.textPrimary }]}>
                模型
              </Text>
              <Pressable
                onPress={() => setAddingModel(true)}
                style={({ pressed }) => [
                  colors.s.card.addModelBtn,
                  { borderColor: colors.borderColor },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Plus size={colors.roomy ? 14 : 9} color={colors.textMuted} strokeWidth={2} />
                <Text style={[colors.s.card.addModelBtnText, { color: colors.textMuted }]}>
                  添加模型
                </Text>
              </Pressable>
            </View>

            {models.length > 0 && (
              <View style={[colors.s.card.modelsList, { borderColor: colors.borderColor }]}>
                {models.map((model, idx) => (
                  <ModelEntryRow
                    key={`${model.id}-${idx}`}
                    model={model}
                    onRemove={() => {
                      onUpdate({
                        ...provider,
                        models: models.filter((_, i) => i !== idx),
                      });
                    }}
                    onUpdate={(m) => {
                      const next = [...models];
                      next[idx] = m;
                      onUpdate({ ...provider, models: next });
                    }}
                    colors={colors}
                    isLast={idx === models.length - 1}
                  />
                ))}
              </View>
            )}

            {addingModel && (
              <View style={[colors.s.card.addModelRow, { borderColor: colors.borderColor }]}>
                <TextInput
                  style={[
                    colors.s.card.addModelInput,
                    {
                      color: colors.textPrimary,
                      backgroundColor: colors.inputBg,
                      borderColor: colors.borderColor,
                    },
                  ]}
                  value={newModelId}
                  onChangeText={setNewModelId}
                  placeholder="模型 ID（如 llama3.1:8b）"
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  onSubmitEditing={handleAddModel}
                />
                <Pressable
                  onPress={() => {
                    setAddingModel(false);
                    setNewModelId('');
                  }}
                  style={({ pressed }) => [
                    colors.s.card.addModelIconBtn,
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <X size={colors.roomy ? 15 : 10} color={colors.textMuted} strokeWidth={1.8} />
                </Pressable>
                <Pressable
                  onPress={handleAddModel}
                  style={({ pressed }) => [
                    colors.s.card.addModelIconBtn,
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <Check size={colors.roomy ? 15 : 10} color={colors.successColor} strokeWidth={2} />
                </Pressable>
              </View>
            )}

            {models.length === 0 && !addingModel && (
              <Text style={[colors.s.card.emptyModels, { color: colors.textMuted }]}>
                尚未添加模型。
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
