import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Cpu, Pencil, Trash2 } from 'lucide-react-native';
import { type CustomModelEntry } from '../../store/custom-models';
import { useColors } from '../../hooks/use-custom-models-theme';
import { PI_DEFAULTS } from './constants';
import { ChipToggleRow } from './chip-toggle-row';
import { Field } from './field';

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
