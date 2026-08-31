import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Linking,
} from 'react-native';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Pencil,
  X,
  Check,
  Server,
  Cpu,
  KeyRound,
  LogIn,
  LogOut,
} from 'lucide-react-native';

import { Fonts } from '@/constants/theme';
import { PI_MODEL_DEFAULTS, useBuiltinProviders, type BuiltinProvider } from '@aijee/client-sdk';
import {
  useCustomModelsStore,
  type CustomProvider,
  type CustomModelEntry,
} from '../store/custom-models';
import { useSettingsHeadingVisible, useSettingsPalette, useSettingsPhoneLayout } from './settings-list';
import { ProviderIcon } from '../../workspace/components/prompt-input/provider-icons';

const API_TYPES = [
  { value: 'openai-completions', label: 'OpenAI 对话' },
  { value: 'openai-responses', label: 'OpenAI 响应' },
  { value: 'anthropic-messages', label: 'Anthropic' },
  { value: 'google-generativeai', label: 'Google AI' },
];

/**
 * What pi substitutes for fields left blank. Shown as placeholders so the user
 * can tell "unset" apart from "zero" and knows what an empty field buys them.
 */
const PI_DEFAULTS = PI_MODEL_DEFAULTS;

// ─── Shared theme helper ──────────────────────────────────────

/**
 * Density follows the viewport rather than `Platform.OS`, so mobile web gets
 * the same roomy layout as the native builds. `isNative` remains an override.
 */
function useColors(isDark: boolean, isNative?: boolean) {
  const phone = useSettingsPhoneLayout();
  const roomy = isNative ?? phone;
  const p = useSettingsPalette();

  return useMemo(
    () => ({
      roomy,
      s: roomy
        ? {
            section: sectionNativeStyles,
            card: cardNativeStyles,
            model: modelNativeStyles,
            field: fieldNativeStyles,
            api: apiNativeStyles,
            add: addNativeStyles,
          }
        : {
            section: sectionWebStyles,
            card: cardWebStyles,
            model: modelWebStyles,
            field: fieldWebStyles,
            api: apiWebStyles,
            add: addWebStyles,
          },
      textPrimary: p.text,
      textSecondary: p.textSecondary,
      textMuted: p.textTertiary,
      inputBg: p.tile,
      borderColor: p.separator,
      cardBg: p.card,
      headerBg: p.tile,
      accentBg: p.tile,
      chipActiveBg: p.tile,
      chipActiveBorder: p.border,
      chipBorder: p.separator,
      dangerColor: p.destructive,
      successColor: p.success,
      actionBg: p.accent,
      actionText: p.onAccent,
      pressedBg: p.pressed,
      separator: p.separator,
      placeholder: p.textTertiary,
      isDark,
    }),
    [isDark, p, roomy],
  );
}

// ─── Field ────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  colors,
  mono,
  autoFocus,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  colors: ReturnType<typeof useColors>;
  mono?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <View style={colors.s.field.container}>
      <Text style={[colors.s.field.label, { color: colors.textMuted }]}>
        {label}
      </Text>
      <TextInput
        style={[
          colors.s.field.input,
          {
            color: colors.textPrimary,
            backgroundColor: colors.inputBg,
            borderColor: colors.borderColor,
          },
          mono && { fontFamily: Fonts.mono },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
      />
    </View>
  );
}

// ─── API Type Selector ────────────────────────────────────────

function ApiTypeSelector({
  value,
  onChange,
  colors,
}: {
  value: string;
  onChange: (v: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={colors.s.field.container}>
      <Text style={[colors.s.field.label, { color: colors.textMuted }]}>
        API 类型
      </Text>
      <View style={colors.s.api.row}>
        {API_TYPES.map((item) => {
          const isActive = value === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() => onChange(item.value)}
              style={[
                colors.s.api.chip,
                {
                  backgroundColor: isActive ? colors.chipActiveBg : 'transparent',
                  borderColor: isActive
                    ? colors.chipActiveBorder
                    : colors.chipBorder,
                },
              ]}
            >
              <Text
                style={[
                  colors.s.api.chipText,
                  { color: isActive ? colors.textPrimary : colors.textMuted },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Capability chips ─────────────────────────────────────────

/**
 * Multi-select chips reusing the API-type chip styling. Used for capabilities
 * pi reads from models.json but that had no editor before (input modalities,
 * reasoning), so they could previously only be set by hand-editing the file.
 */
function ChipToggleRow({
  label,
  hint,
  options,
  colors,
}: {
  label: string;
  hint?: string;
  options: {
    key: string;
    label: string;
    active: boolean;
    locked?: boolean;
    onToggle: () => void;
  }[];
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={colors.s.field.container}>
      <Text style={[colors.s.field.label, { color: colors.textMuted }]}>
        {label}
      </Text>
      <View style={colors.s.api.row}>
        {options.map((item) => (
          <Pressable
            key={item.key}
            onPress={item.locked ? undefined : item.onToggle}
            disabled={item.locked}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.active, disabled: item.locked }}
            style={[
              colors.s.api.chip,
              {
                backgroundColor: item.active ? colors.chipActiveBg : 'transparent',
                borderColor: item.active
                  ? colors.chipActiveBorder
                  : colors.chipBorder,
              },
              item.locked && { opacity: 0.6 },
            ]}
          >
            <Text
              style={[
                colors.s.api.chipText,
                { color: item.active ? colors.textPrimary : colors.textMuted },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {hint ? (
        <Text style={[colors.s.field.label, { color: colors.placeholder }]}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

// ─── Model Entry ──────────────────────────────────────────────

function ModelEntryRow({
  model,
  onRemove,
  onUpdate,
  colors,
  isLast,
}: {
  model: CustomModelEntry;
  onRemove: () => void;
  onUpdate: (m: CustomModelEntry) => void;
  colors: ReturnType<typeof useColors>;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(model);

  useEffect(() => {
    setDraft(model);
  }, [model]);

  // pi defaults an omitted `input` to text-only.
  const modalities = draft.input ?? PI_DEFAULTS.input;

  // One line covering everything pi will actually use, defaults included, so
  // capabilities are visible without opening the editor.
  const summary = useMemo(() => {
    const parts: string[] = [];
    if (model.name) parts.push(model.name);
    const ctx = model.contextWindow ?? PI_DEFAULTS.contextWindow;
    const suffix = model.contextWindow ? '' : '（缺省）';
    parts.push(`${(ctx / 1000).toFixed(0)}k 上下文${suffix}`);
    parts.push((model.input ?? PI_DEFAULTS.input).includes('image') ? '文本+图片' : '仅文本');
    if (model.reasoning) parts.push('可思考');
    return parts.join(' · ');
  }, [model.name, model.contextWindow, model.input, model.reasoning]);

  if (editing) {
    return (
      <View style={[colors.s.model.editWrap, { backgroundColor: colors.accentBg }]}>
        <View style={colors.s.model.editGrid}>
          <View style={{ flex: 1 }}>
            <Field
              label="模型 ID"
              value={draft.id}
              onChangeText={(v) => setDraft({ ...draft, id: v })}
              placeholder="llama3.1:8b"
              colors={colors}
              mono
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="显示名称"
              value={draft.name ?? ''}
              onChangeText={(v) =>
                setDraft({ ...draft, name: v || undefined })
              }
              placeholder="可选"
              colors={colors}
            />
          </View>
        </View>
        <View style={colors.s.model.editGrid}>
          <View style={{ flex: 1 }}>
            <Field
              label="上下文窗口"
              value={draft.contextWindow?.toString() ?? ''}
              onChangeText={(v) =>
                setDraft({
                  ...draft,
                  contextWindow: v ? parseInt(v, 10) || undefined : undefined,
                })
              }
              placeholder={`${PI_DEFAULTS.contextWindow}（缺省）`}
              colors={colors}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="最大 Token"
              value={draft.maxTokens?.toString() ?? ''}
              onChangeText={(v) =>
                setDraft({
                  ...draft,
                  maxTokens: v ? parseInt(v, 10) || undefined : undefined,
                })
              }
              placeholder={`${PI_DEFAULTS.maxTokens}（缺省）`}
              colors={colors}
            />
          </View>
        </View>
        <ChipToggleRow
          label="输入模态"
          hint="决定能否向该模型发送图片附件；留空等同仅文本。"
          colors={colors}
          options={[
            {
              key: 'text',
              label: '文本',
              active: true,
              // pi always accepts text; there is nothing to turn off.
              locked: true,
              onToggle: () => {},
            },
            {
              key: 'image',
              label: '图片',
              active: modalities.includes('image'),
              onToggle: () =>
                setDraft({
                  ...draft,
                  input: modalities.includes('image')
                    ? ['text']
                    : ['text', 'image'],
                }),
            },
          ]}
        />
        <ChipToggleRow
          label="推理能力"
          hint="开启后输入框才会提供思考深度选项。"
          colors={colors}
          options={[
            {
              key: 'reasoning',
              label: '支持扩展思考',
              active: draft.reasoning === true,
              onToggle: () =>
                setDraft({
                  ...draft,
                  reasoning: draft.reasoning === true ? undefined : true,
                }),
            },
          ]}
        />
        <View style={colors.s.model.editActions}>
          <Pressable
            onPress={() => setEditing(false)}
            style={({ pressed }) => [
              colors.s.model.smallBtn,
              { borderColor: colors.borderColor },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[colors.s.model.smallBtnText, { color: colors.textMuted }]}>
              取消
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (draft.id.trim()) {
                onUpdate({ ...draft, id: draft.id.trim() });
                setEditing(false);
              }
            }}
            style={({ pressed }) => [
              colors.s.model.smallBtn,
              {
                backgroundColor: colors.isDark ? '#333' : '#1a1a1a',
                borderColor: colors.isDark ? '#333' : '#1a1a1a',
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text
              style={[
                colors.s.model.smallBtnText,
                { color: colors.isDark ? '#fefdfd' : '#fff' },
              ]}
            >
              保存
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        colors.s.model.row,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.separator,
        },
      ]}
    >
      <Cpu size={colors.roomy ? 14 : 9} color={colors.textMuted} strokeWidth={1.8} />
      <View style={colors.s.model.info}>
        <Text style={[colors.s.model.modelId, { color: colors.textPrimary }]}>
          {model.id}
        </Text>
        {summary ? (
          <Text style={[colors.s.model.modelMeta, { color: colors.textMuted }]}>
            {summary}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={() => setEditing(true)}
        style={({ pressed }) => [colors.s.model.iconBtn, pressed && { opacity: 0.6 }]}
      >
        <Pencil size={colors.roomy ? 15 : 9} color={colors.textMuted} strokeWidth={1.8} />
      </Pressable>
      <Pressable
        onPress={onRemove}
        style={({ pressed }) => [colors.s.model.iconBtn, pressed && { opacity: 0.6 }]}
      >
        <Trash2 size={colors.roomy ? 15 : 9} color={colors.dangerColor} strokeWidth={1.8} />
      </Pressable>
    </View>
  );
}

// ─── Provider Card ────────────────────────────────────────────

function ProviderCard({
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

// ─── Add Provider Form ────────────────────────────────────────

function AddProviderForm({
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

// ─── Main Section ─────────────────────────────────────────────

function providerBrand(name: string, id = ''): 'OpenAI' | 'Anthropic' | 'Google' | 'Meta' | null {
  const value = `${id} ${name}`.toLowerCase();
  if (value.includes('anthropic') || value.includes('claude')) return 'Anthropic';
  if (value.includes('openai') || value.includes('chatgpt')) return 'OpenAI';
  if (value.includes('google') || value.includes('gemini')) return 'Google';
  if (value.includes('meta') || value.includes('llama')) return 'Meta';
  return null;
}

function ProviderMark({ name, id, colors }: { name: string; id?: string; colors: ReturnType<typeof useColors> }) {
  const brand = providerBrand(name, id);
  const initial = name.trim().match(/[A-Za-z\u4e00-\u9fff]/)?.[0]?.toUpperCase() ?? '?';
  return (
    <View style={[providerPageStyles.mark, { backgroundColor: colors.accentBg }]}>
      {brand ? (
        <ProviderIcon provider={brand} size={17} color={colors.textSecondary} />
      ) : (
        <Text style={[providerPageStyles.markText, { color: colors.textSecondary }]}>{initial}</Text>
      )}
    </View>
  );
}

function ModelSection({
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

function RowDivider({ colors }: { colors: ReturnType<typeof useColors> }) {
  return <View style={[providerPageStyles.divider, { backgroundColor: colors.separator }]} />;
}

function ProviderRow({
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
      {connected ? <View style={[providerPageStyles.statusDot, { backgroundColor: colors.successColor }]} /> : null}
      <ProviderMark name={name} id={id} colors={colors} />
      <View style={providerPageStyles.rowCopy}>
        <Text numberOfLines={1} style={[providerPageStyles.rowName, { color: colors.textPrimary }]}>{name}</Text>
        {meta ? <Text numberOfLines={1} style={[providerPageStyles.rowMeta, { color: colors.textMuted }]}>{meta}</Text> : null}
      </View>
      {trailing}
    </Pressable>
  );
}

function CustomProviderRow({
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
            <Pressable onPress={() => onUpdate({ ...provider, models: [...(provider.models ?? []), { id: `model-${modelCount + 1}` }] })} accessibilityRole="button">
              <Text style={[providerPageStyles.linkText, { color: colors.textPrimary }]}>+ 添加模型</Text>
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

const COMMON_PROVIDER_HINTS = ['anthropic', 'github-copilot', 'kimi', 'openai-codex', 'openrouter', 'radius', 'xai', 'google'];

export function CustomModelsSection({ isDark, isNative }: { isDark: boolean; isNative?: boolean }) {
  const colors = useColors(isDark, isNative);
  const headingVisible = useSettingsHeadingVisible();
  const { providers, loaded, saving, error, parseError, load, save, addProvider, removeProvider, updateProvider } = useCustomModelsStore();
  const { providers: builtinProviders, loaded: builtinsLoaded, error: builtinsError, saveApiKey, removeApiKey, startOAuth, getOAuth, reload: reloadBuiltins } = useBuiltinProviders();
  const [adding, setAdding] = useState(false);
  const [showAllBuiltins, setShowAllBuiltins] = useState(false);
  const [activeBuiltinId, setActiveBuiltinId] = useState<string | null>(null);
  const [builtinKey, setBuiltinKey] = useState('');
  const [savingBuiltinKey, setSavingBuiltinKey] = useState(false);
  const [oauthProviderId, setOauthProviderId] = useState<string | null>(null);
  const [oauthMessage, setOauthMessage] = useState<string | null>(null);
  const [oauthUrl, setOauthUrl] = useState<string | null>(null);
  const [providerSearch, setProviderSearch] = useState('');
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const currentSnapshot = useMemo(() => JSON.stringify(providers), [providers]);
  const dirty = savedSnapshot !== null && currentSnapshot !== savedSnapshot;

  useEffect(() => { if (!loaded) void load(); }, [loaded, load]);
  useEffect(() => { if (loaded && savedSnapshot === null) setSavedSnapshot(currentSnapshot); }, [currentSnapshot, loaded, savedSnapshot]);

  const query = providerSearch.trim().toLowerCase();
  const matchingBuiltins = useMemo(
    () => query ? builtinProviders.filter((provider) => `${provider.name} ${provider.id}`.toLowerCase().includes(query)) : builtinProviders,
    [builtinProviders, query],
  );
  const connectedBuiltins = matchingBuiltins.filter((provider) => provider.configured);
  const allAddableBuiltins = matchingBuiltins.filter((provider) => !provider.configured);
  const addableBuiltins = useMemo(() => {
    if (query || showAllBuiltins) return allAddableBuiltins;
    const rank = (provider: BuiltinProvider) => {
      const value = `${provider.id} ${provider.name}`.toLowerCase();
      const index = COMMON_PROVIDER_HINTS.findIndex((hint) => value.includes(hint));
      return index < 0 ? 100 : index;
    };
    return [...allAddableBuiltins].sort((a, b) => rank(a) - rank(b)).slice(0, 8);
  }, [allAddableBuiltins, query, showAllBuiltins]);
  const providerEntries = Object.entries(providers).filter(([name]) => !query || name.toLowerCase().includes(query));

  const beginOAuth = useCallback(async (providerId: string) => {
    setOauthProviderId(providerId);
    setOauthMessage('正在准备授权…');
    try {
      const login = await startOAuth(providerId);
      setOauthUrl(login.url);
      const check = async () => {
        const status = await getOAuth(providerId, login.id);
        if (status.status === 'pending') {
          setOauthMessage(status.instructions ?? '请在浏览器中完成授权…');
          setTimeout(() => void check(), 1200);
          return;
        }
        setOauthProviderId(null);
        setOauthUrl(null);
        setOauthMessage(status.status === 'complete' ? '授权完成' : (status.error ?? '授权失败'));
        await reloadBuiltins();
      };
      void check();
    } catch (oauthError) {
      setOauthProviderId(null);
      setOauthUrl(null);
      setOauthMessage(oauthError instanceof Error ? oauthError.message : '无法启动 OAuth 登录');
    }
  }, [getOAuth, reloadBuiltins, startOAuth]);

  const renderBuiltinPanel = (provider: BuiltinProvider) => activeBuiltinId === provider.id ? (
    <View style={[providerPageStyles.inlinePanel, { borderTopColor: colors.separator }]}>
      {!provider.configured && provider.supports_oauth ? (
        <Pressable disabled={oauthProviderId === provider.id} onPress={() => void beginOAuth(provider.id)} style={({ pressed }) => [providerPageStyles.secondaryButton, { borderColor: colors.borderColor }, pressed && { backgroundColor: colors.pressedBg }]}>
          <LogIn size={15} color={colors.textSecondary} />
          <Text style={[providerPageStyles.linkText, { color: colors.textPrimary }]}>{oauthProviderId === provider.id ? '正在登录…' : '使用账号登录'}</Text>
        </Pressable>
      ) : null}
      {provider.supports_api_key ? <Field label={`${provider.name} API Key`} value={builtinKey} onChangeText={setBuiltinKey} placeholder={provider.configured ? '输入新 Key 可替换当前凭据' : '粘贴 API Key'} colors={colors} /> : null}
      <View style={providerPageStyles.panelActions}>
        {provider.configured ? (
          <Pressable onPress={() => { void removeApiKey(provider.id); setActiveBuiltinId(null); }} style={({ pressed }) => [providerPageStyles.textButton, pressed && { opacity: 0.6 }]} accessibilityRole="button">
            <Text style={[providerPageStyles.linkText, { color: colors.dangerColor }]}>断开连接</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={() => setActiveBuiltinId(null)} style={[providerPageStyles.secondaryButton, { borderColor: colors.borderColor }]}><Text style={[providerPageStyles.linkText, { color: colors.textSecondary }]}>取消</Text></Pressable>
        {provider.supports_api_key ? (
          <Pressable disabled={!builtinKey.trim() || savingBuiltinKey} onPress={() => { setSavingBuiltinKey(true); void saveApiKey(provider.id, builtinKey).then(() => { setBuiltinKey(''); setActiveBuiltinId(null); }).finally(() => setSavingBuiltinKey(false)); }} style={[providerPageStyles.primaryButton, { backgroundColor: colors.actionBg }, (!builtinKey.trim() || savingBuiltinKey) && { opacity: 0.45 }]}>
            <Text style={[providerPageStyles.linkText, { color: colors.actionText }]}>{savingBuiltinKey ? '保存中…' : '保存 Key'}</Text>
          </Pressable>
        ) : null}
      </View>
      {oauthMessage ? <Text accessibilityRole="alert" style={[providerPageStyles.rowMeta, { color: colors.textMuted }]}>{oauthMessage}</Text> : null}
      {oauthUrl ? <Pressable onPress={() => void Linking.openURL(oauthUrl)} accessibilityRole="link"><Text style={[providerPageStyles.linkText, { color: colors.textPrimary }]}>打开授权页</Text></Pressable> : null}
    </View>
  ) : null;

  if (!loaded || !builtinsLoaded) {
    return <Text style={[providerPageStyles.message, { color: colors.textMuted }]}>正在加载模型服务…</Text>;
  }
  if (parseError || builtinsError) {
    return <Text accessibilityRole="alert" style={[providerPageStyles.message, { color: colors.textPrimary }]}>{parseError ? `无法读取 models.json：${parseError}` : builtinsError}</Text>;
  }

  return (
    <View style={providerPageStyles.page}>
      {headingVisible ? (
        <View style={providerPageStyles.pageHeading}>
          <Text style={[providerPageStyles.pageTitle, { color: colors.textPrimary }]}>模型服务</Text>
          <Text style={[providerPageStyles.pageSubtitle, { color: colors.textMuted }]}>模型接入点、凭据与聊天模型列表</Text>
        </View>
      ) : null}

      <TextInput
        value={providerSearch}
        onChangeText={setProviderSearch}
        placeholder="搜索模型服务"
        placeholderTextColor={colors.placeholder}
        accessibilityLabel="搜索模型服务"
        style={[providerPageStyles.search, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.borderColor }]}
      />

      <ModelSection title={`已连接 (${connectedBuiltins.length})`} colors={colors}>
        {connectedBuiltins.length ? connectedBuiltins.map((provider, index) => (
          <View key={provider.id}>
            {index ? <RowDivider colors={colors} /> : null}
            <ProviderRow
              name={provider.name}
              id={provider.id}
              connected
              meta={Number.isFinite(provider.model_count) ? `${provider.model_count} 个模型` : null}
              colors={colors}
              onPress={() => { setBuiltinKey(''); setActiveBuiltinId((id) => id === provider.id ? null : provider.id); }}
            />
            {renderBuiltinPanel(provider)}
          </View>
        )) : (
          <View style={providerPageStyles.emptyRow}><Text style={[providerPageStyles.rowMeta, { color: colors.textMuted }]}>尚未连接服务，从下方选择一个即可开始。</Text></View>
        )}
      </ModelSection>

      <ModelSection title="可添加" colors={colors}>
        {addableBuiltins.map((provider, index) => (
          <View key={provider.id}>
            {index ? <RowDivider colors={colors} /> : null}
            <ProviderRow name={provider.name} id={provider.id} meta={!provider.supports_oauth && provider.supports_api_key ? '需要 API Key' : null} colors={colors} onPress={() => { setBuiltinKey(''); setActiveBuiltinId((id) => id === provider.id ? null : provider.id); }} />
            {renderBuiltinPanel(provider)}
          </View>
        ))}
        {!query && allAddableBuiltins.length > 8 ? (
          <>
            <RowDivider colors={colors} />
            <Pressable onPress={() => setShowAllBuiltins((value) => !value)} accessibilityRole="button" style={({ pressed, hovered }: any) => [providerPageStyles.foldRow, (pressed || hovered) && { backgroundColor: colors.pressedBg }]}>
              <Text style={[providerPageStyles.foldText, { color: colors.textSecondary }]}>{showAllBuiltins ? '收起提供商' : `显示全部 ${allAddableBuiltins.length} 个提供商`}</Text>
              <Text style={[providerPageStyles.foldChevron, { color: colors.textMuted }]}>{showAllBuiltins ? '⌃' : '⌄'}</Text>
            </Pressable>
          </>
        ) : null}
      </ModelSection>

      <ModelSection title="自定义服务" colors={colors}>
        {providerEntries.map(([name, provider], index) => (
          <View key={name}>
            {index ? <RowDivider colors={colors} /> : null}
            <CustomProviderRow name={name} provider={provider} colors={colors} onUpdate={(next) => updateProvider(name, next)} onRemove={() => removeProvider(name)} />
          </View>
        ))}
        {providerEntries.length ? <RowDivider colors={colors} /> : null}
        {adding ? (
          <View style={providerPageStyles.inlinePanel}><AddProviderForm colors={colors} onAdd={(name, baseUrl, api) => { void addProvider(name, { baseUrl: baseUrl || undefined, api, models: [] }); setAdding(false); }} onCancel={() => setAdding(false)} /></View>
        ) : (
          <Pressable onPress={() => setAdding(true)} accessibilityRole="button" accessibilityLabel="添加提供商" style={({ pressed, hovered }: any) => [providerPageStyles.addRow, (pressed || hovered) && { backgroundColor: colors.pressedBg }]}>
            <Plus size={16} color={colors.textSecondary} strokeWidth={1.8} />
            <Text style={[providerPageStyles.rowName, { color: colors.textSecondary }]}>添加提供商</Text>
          </Pressable>
        )}
      </ModelSection>

      {dirty ? (
        <View style={[providerPageStyles.saveBar, { backgroundColor: colors.cardBg, borderTopColor: colors.separator }]}>
          <Pressable disabled={saving} onPress={() => { setSaveMessage(null); void save(providers).then(() => { if (!useCustomModelsStore.getState().error) { setSavedSnapshot(currentSnapshot); setSaveMessage('已保存'); setTimeout(() => setSaveMessage(null), 1800); } }); }} accessibilityRole="button" accessibilityLabel="保存更改" style={({ pressed, hovered }: any) => [providerPageStyles.saveButton, { backgroundColor: colors.actionBg }, (pressed || hovered) && { opacity: 0.86 }, saving && { opacity: 0.5 }]}>
            <Text style={[providerPageStyles.saveButtonText, { color: colors.actionText }]}>{saving ? '保存中…' : '保存更改'}</Text>
          </Pressable>
        </View>
      ) : null}
      {saveMessage ? <Text accessibilityRole="alert" style={[providerPageStyles.feedback, { color: colors.successColor }]}>{saveMessage}</Text> : null}
      {error && !saving ? <Text accessibilityRole="alert" style={[providerPageStyles.feedback, { color: colors.dangerColor }]}>{error}</Text> : null}
    </View>
  );
}

// ─── Styles: web 紧凑版 ───────────────────────────────────────

const providerPageStyles = StyleSheet.create({
  page: { gap: 32, paddingBottom: 24 },
  pageHeading: { gap: 4 },
  pageTitle: { fontSize: 18, fontFamily: Fonts.sansSemiBold },
  pageSubtitle: { fontSize: 13, fontFamily: Fonts.sans },
  search: { height: 40, borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, paddingHorizontal: 12, fontSize: 13, fontFamily: Fonts.sans, outlineStyle: 'none' } as any,
  section: { gap: 8 },
  sectionTitle: { fontSize: 13, fontFamily: Fonts.sansMedium },
  rows: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, overflow: 'visible' },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 12 },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: -4 },
  mark: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  markText: { fontSize: 13, fontFamily: Fonts.sansSemiBold },
  rowCopy: { flex: 1, minWidth: 0, gap: 2 },
  rowName: { fontSize: 13, fontFamily: Fonts.sansMedium },
  rowMeta: { fontSize: 12, fontFamily: Fonts.sans },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 54 },
  emptyRow: { minHeight: 56, justifyContent: 'center', paddingHorizontal: 12 },
  foldRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 6 },
  foldText: { fontSize: 13, fontFamily: Fonts.sansMedium },
  foldChevron: { fontSize: 14, fontFamily: Fonts.sans },
  addRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 12 },
  inlinePanel: { borderTopWidth: StyleSheet.hairlineWidth, padding: 16, gap: 12 },
  panelActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8 },
  secondaryButton: { minHeight: 36, borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButton: { minHeight: 36, borderRadius: 8, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  textButton: { minHeight: 36, paddingHorizontal: 8, justifyContent: 'center', marginRight: 'auto' },
  linkText: { fontSize: 13, fontFamily: Fonts.sansMedium },
  modelEditorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuAnchor: { position: 'relative' },
  moreButton: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  moreText: { fontSize: 15, letterSpacing: 1 },
  menu: { position: 'absolute', right: 0, top: 40, zIndex: 20, minWidth: 112, minHeight: 40, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, boxShadow: '0 4px 14px rgba(0,0,0,.18)' } as any,
  menuText: { fontSize: 13, fontFamily: Fonts.sansMedium },
  saveBar: { position: 'sticky', bottom: 0, zIndex: 10, minHeight: 64, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 4 } as any,
  saveButton: { minHeight: 40, borderRadius: 8, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { fontSize: 13, fontFamily: Fonts.sansSemiBold },
  feedback: { fontSize: 12, fontFamily: Fonts.sans, textAlign: 'right' },
  message: { fontSize: 13, fontFamily: Fonts.sans, paddingVertical: 16 },
});

const sectionWebStyles = StyleSheet.create({
  container: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 4,
  },
  headerTextCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  list: {
    gap: 8,
  },
  loadingRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: Fonts.sans,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    minHeight: 36,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  addButtonText: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
  savingText: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    textAlign: 'center',
  },
});

const cardWebStyles = StyleSheet.create({
  card: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  providerIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  providerName: {
    fontSize: 13.5,
    fontFamily: Fonts.sansMedium,
  },
  providerMeta: {
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBtn: {
    padding: 6,
    borderRadius: 6,
  },
  body: {
    padding: 12,
    gap: 12,
  },
  modelsSection: {
    gap: 8,
  },
  modelsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modelsSectionTitle: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
  },
  addModelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  addModelBtnText: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
  },
  modelsList: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  addModelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addModelInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.mono,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  addModelIconBtn: {
    padding: 6,
    borderRadius: 6,
  },
  emptyModels: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    paddingVertical: 2,
  },
});

const modelWebStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 34,
    gap: 8,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  modelId: {
    fontSize: 13,
    fontFamily: Fonts.mono,
  },
  modelMeta: {
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 6,
  },
  editWrap: {
    margin: 8,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  editGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 2,
  },
  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  smallBtnText: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
});

const fieldWebStyles = StyleSheet.create({
  container: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
  },
  input: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

const apiWebStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
  },
});

const addWebStyles = StyleSheet.create({
  formTitle: {
    fontSize: 13.5,
    fontFamily: Fonts.sansMedium,
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  btnText: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
});

// ─── Styles: 移动端原生版 ────────────────────────────────────

const sectionNativeStyles = StyleSheet.create({
  container: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  headerTextCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: Fonts.sans,
  },
  list: {
    gap: 8,
  },
  loadingRow: {
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: Fonts.sans,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 15,
    fontFamily: Fonts.sansMedium,
  },
  savingText: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    textAlign: 'center',
    marginTop: 2,
  },
});

const cardNativeStyles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  providerIcon: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  providerName: {
    fontSize: 16,
    fontFamily: Fonts.sansMedium,
  },
  providerMeta: {
    fontSize: 13,
    fontFamily: Fonts.sans,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBtn: {
    padding: 8,
    borderRadius: 8,
  },
  body: {
    padding: 16,
    gap: 14,
  },
  modelsSection: {
    gap: 8,
    marginTop: 2,
  },
  modelsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modelsSectionTitle: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
  addModelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
  },
  addModelBtnText: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
  modelsList: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  addModelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addModelInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.mono,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  addModelIconBtn: {
    padding: 8,
    borderRadius: 8,
  },
  emptyModels: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    paddingVertical: 2,
  },
});

const modelNativeStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    minHeight: 48,
    gap: 10,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  modelId: {
    fontSize: 15,
    fontFamily: Fonts.mono,
  },
  modelMeta: {
    fontSize: 13,
    fontFamily: Fonts.sans,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
  },
  editWrap: {
    margin: 10,
    borderRadius: 10,
    padding: 14,
    gap: 12,
  },
  editGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  smallBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  smallBtnText: {
    fontSize: 15,
    fontFamily: Fonts.sansMedium,
  },
});

const fieldNativeStyles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
  input: {
    // ≥16px avoids iOS Safari's focus zoom.
    fontSize: 16,
    fontFamily: Fonts.sans,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

const apiNativeStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    fontSize: 14,
    fontFamily: Fonts.sansMedium,
  },
});

const addNativeStyles = StyleSheet.create({
  formTitle: {
    fontSize: 16,
    fontFamily: Fonts.sansMedium,
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  btnText: {
    fontSize: 15,
    fontFamily: Fonts.sansMedium,
  },
});
