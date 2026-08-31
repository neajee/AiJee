import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check, Cpu, Pencil, Plus, Trash2, X } from 'lucide-react-native';
import { PI_MODEL_DEFAULTS } from '@aijee/client-sdk';
import { Fonts } from '@/constants/theme';
import { type CustomModelEntry } from '../store/custom-models';
import { useColors } from './custom-models-theme';

const API_TYPES = [
  { value: 'openai-completions', label: 'OpenAI 对话' },
  { value: 'openai-responses', label: 'OpenAI 响应' },
  { value: 'anthropic-messages', label: 'Anthropic' },
  { value: 'google-generativeai', label: 'Google AI' },
];

const PI_DEFAULTS = PI_MODEL_DEFAULTS;

// ─── Field ────────────────────────────────────────────────────

export function Field({
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

export function ApiTypeSelector({
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
export function ChipToggleRow({
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

export function ModelEntryRow({
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


export { API_TYPES };
