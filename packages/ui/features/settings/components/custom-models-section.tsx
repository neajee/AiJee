import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
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
} from 'lucide-react-native';

import { Fonts } from '@/constants/theme';
import { PI_MODEL_DEFAULTS } from '@aijee/client-sdk';
import {
  useCustomModelsStore,
  type CustomProvider,
  type CustomModelEntry,
} from '../store/custom-models';
import { useSettingsHeadingVisible, useSettingsPalette, useSettingsPhoneLayout } from './settings-list';

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

export function CustomModelsSection({ isDark, isNative }: { isDark: boolean; isNative?: boolean }) {
  const colors = useColors(isDark, isNative);
  const native = colors.roomy;
  const headingVisible = useSettingsHeadingVisible();
  const { providers, loaded, saving, error, parseError, load, addProvider, removeProvider, updateProvider } =
    useCustomModelsStore();
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  const handleAddProvider = useCallback(
    (name: string, baseUrl: string, api: string) => {
      addProvider(name, {
        baseUrl: baseUrl || undefined,
        api,
        models: [],
      });
      setAdding(false);
    },
    [addProvider]
  );

  const providerEntries = Object.entries(providers);

  return (
    <View style={colors.s.section.container}>
      {headingVisible ? (
        <View style={colors.s.section.header}>
          <Server size={native ? 15 : 12} color={colors.textSecondary} strokeWidth={1.8} />
          <View style={colors.s.section.headerTextCol}>
            <Text style={[colors.s.section.title, { color: colors.textSecondary }]}>
              自定义模型
            </Text>
            <Text style={[colors.s.section.subtitle, { color: colors.textMuted }]}>
              Ollama、LM Studio、vLLM 或任何兼容 OpenAI 的提供商
            </Text>
          </View>
        </View>
      ) : null}

      {!loaded ? (
        <View
          style={[
            colors.s.card.card,
            { backgroundColor: colors.cardBg, borderColor: colors.separator },
          ]}
        >
          <View style={colors.s.section.loadingRow}>
            <Text style={[colors.s.section.loadingText, { color: colors.textMuted }]}>
              正在加载配置…
            </Text>
          </View>
        </View>
      ) : parseError ? (
        <View
          style={[
            colors.s.card.card,
            { backgroundColor: colors.cardBg, borderColor: colors.separator },
          ]}
        >
          <View style={colors.s.section.loadingRow}>
            <Text
              accessibilityRole="alert"
              style={[colors.s.section.loadingText, { color: colors.textPrimary }]}
            >
              无法读取 models.json，为避免覆盖已禁用编辑。请先修复文件：{'\n'}
              {parseError}
            </Text>
          </View>
        </View>
      ) : (
        <View style={colors.s.section.list}>
          {providerEntries.map(([name, provider]) => (
            <ProviderCard
              key={name}
              name={name}
              provider={provider}
              colors={colors}
              onUpdate={(p) => updateProvider(name, p)}
              onRemove={() => removeProvider(name)}
            />
          ))}

          {adding ? (
            <AddProviderForm
              colors={colors}
              onAdd={handleAddProvider}
              onCancel={() => setAdding(false)}
            />
          ) : (
            <Pressable
              onPress={() => setAdding(true)}
              accessibilityRole="button"
              accessibilityLabel="添加提供商"
              style={({ pressed, hovered }: any) => [
                colors.s.section.addButton,
                { borderColor: colors.borderColor },
                native && { backgroundColor: colors.accentBg },
                hovered && { backgroundColor: colors.accentBg },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Plus size={native ? 16 : 14} color={colors.textMuted} strokeWidth={1.8} />
              <Text
                style={[colors.s.section.addButtonText, { color: colors.textMuted }]}
              >
                添加提供商
              </Text>
            </Pressable>
          )}

          {saving && (
            <Text style={[colors.s.section.savingText, { color: colors.textMuted }]}>
              正在保存到 ~/.pi/agent/models.json…
            </Text>
          )}

          {error && !saving && (
            <Text
              accessibilityRole="alert"
              style={[colors.s.section.savingText, { color: colors.textPrimary }]}
            >
              {error}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Styles: web 紧凑版 ───────────────────────────────────────

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
