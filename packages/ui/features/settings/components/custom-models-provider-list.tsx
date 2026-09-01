import { useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { ProviderIcon as LobeProviderIcon } from '@lobehub/icons-rn';
import { ProviderIcon } from '../../workspace/components/prompt-input/provider-icons';
import { type CustomProvider } from '../store/custom-models';
import { API_TYPES, ApiTypeSelector, Field, ModelEntryRow } from './custom-models-form';
import { useColors } from './custom-models-theme';
import { providerPageStyles } from './custom-models-styles';

function legacyBrand(name: string, id = ''): 'OpenAI' | 'Anthropic' | 'Google' | 'Meta' | null {
  const value = `${id} ${name}`.toLowerCase();
  if (value.includes('anthropic') || value.includes('claude')) return 'Anthropic';
  if (value.includes('openai') || value.includes('chatgpt')) return 'OpenAI';
  if (value.includes('google') || value.includes('gemini')) return 'Google';
  if (value.includes('meta') || value.includes('llama')) return 'Meta';
  return null;
}

function lobeProviderKey(name: string, id = '') {
  const value = `${id} ${name}`.toLowerCase();
  const aliases: Array<[string, string]> = [
    ['vertex', 'vertex-ai'], ['github-copilot', 'copilot'], ['copilot', 'copilot'],
    ['openrouter', 'openrouter'], ['kimi', 'kimi'], ['moonshot', 'moonshot'],
    ['radius', 'radius'], ['xai', 'xai'], ['google', 'google'], ['gemini', 'gemini'],
    ['amazon bedrock', 'bedrock'], ['bedrock', 'bedrock'], ['baseten', 'baseten'],
    ['cerebras', 'cerebras'], ['cloudflare', 'cloudflare'], ['fireworks', 'fireworks'],
    ['github', 'github'], ['groq', 'groq'], ['huggingface', 'huggingface'],
    ['together', 'together'], ['zai', 'zai'], ['qwen', 'qwen'],
    ['anthropic', 'anthropic'], ['claude', 'claude'], ['openai-codex', 'codex'],
    ['openai', 'openai'], ['deepseek', 'deepseek'], ['mistral', 'mistral'],
  ];
  return aliases.find(([alias]) => value.includes(alias))?.[1] ?? null;
}


export function ProviderMark({ name, id, colors }: { name: string; id?: string; colors: ReturnType<typeof useColors> }) {
  const initial = name.trim().match(/[A-Za-z\u4e00-\u9fff]/)?.[0]?.toUpperCase() ?? '?';
  const provider = lobeProviderKey(name, id);
  const brand = legacyBrand(name, id);
  return (
    <View style={[providerPageStyles.mark, { backgroundColor: colors.accentBg }]}>
      {provider ? (
        <LobeProviderIcon provider={provider} size={18} type="mono" color="#000000" />
      ) : brand ? (
        <ProviderIcon provider={brand} size={17} color="#000000" />
      ) : (
        <Text style={[providerPageStyles.markText, { color: colors.textSecondary }]}>{initial}</Text>
      )}
    </View>
  );
}

export function ModelSection({
  title,
  children,
  colors,
}: {
  title: string;
  children: ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={providerPageStyles.section}>
      <Text style={[providerPageStyles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
      <View style={[providerPageStyles.rows, { borderColor: colors.separator, backgroundColor: colors.cardBg }]}>
        {children}
      </View>
    </View>
  );
}

export function RowDivider({ colors }: { colors: ReturnType<typeof useColors> }) {
  return <View style={[providerPageStyles.divider, { backgroundColor: colors.separator }]} />;
}

export function ProviderRow({
  name,
  id,
  meta,
  connected,
  colors,
  onPress,
  trailing,
  disabled,
}: {
  name: string;
  id?: string;
  meta?: string | null;
  connected?: boolean;
  colors: ReturnType<typeof useColors>;
  onPress?: () => void;
  trailing?: ReactNode;
  disabled?: boolean;
}) {
  const content = (
    <>
      {connected ? <View style={[providerPageStyles.statusDot, { backgroundColor: colors.successColor }]} /> : null}
      <ProviderMark name={name} id={id} colors={colors} />
      <View style={providerPageStyles.rowCopy}>
        <Text numberOfLines={1} style={[providerPageStyles.rowName, { color: colors.textPrimary }]}>{name}</Text>
        {meta ? <Text numberOfLines={1} style={[providerPageStyles.rowMeta, { color: colors.textMuted }]}>{meta}</Text> : null}
      </View>
    </>
  );

  if (trailing) {
    return (
      <View style={[providerPageStyles.row, disabled && { opacity: 0.5 }]}>
        <Pressable
          onPress={onPress}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={name}
          accessibilityState={{ disabled }}
          style={({ pressed, hovered, focused }: any) => [
            providerPageStyles.rowMain,
            (pressed || hovered || focused) && !disabled && { backgroundColor: colors.pressedBg },
          ]}
        >
          {content}
        </Pressable>
        {trailing}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityState={{ disabled }}
      style={({ pressed, hovered, focused }: any) => [
        providerPageStyles.row,
        (pressed || hovered || focused) && !disabled && { backgroundColor: colors.pressedBg },
        disabled && { opacity: 0.5 },
      ]}
    >
      {content}
    </Pressable>
  );
}

export function CustomProviderRow({
  name,
  provider,
  colors,
  onUpdate,
  onRemove,
}: {
  name: string;
  provider: CustomProvider;
  colors: ReturnType<typeof useColors>;
  onUpdate: (provider: CustomProvider) => void;
  onRemove: () => void;
}) {
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
            <ModelEntryRow key={`${model.id}-${index}`} model={model} colors={colors} isLast={index === modelCount - 1} onUpdate={(next) => { const models = [...(provider.models ?? [])]; models[index] = next; onUpdate({ ...provider, models }); }} onRemove={() => onUpdate({ ...provider, models: (provider.models ?? []).filter((_, itemIndex) => itemIndex !== index) })} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
