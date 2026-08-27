import { useCallback, useMemo, useState } from 'react';
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
  Pencil,
  X,
  Check,
  Layers,
  Star,
} from 'lucide-react-native';

import { Fonts } from '@/constants/theme';
import { useAgentModes, type AgentMode } from '@pideck/client-sdk';
import { useSettingsHeadingVisible, useSettingsPalette, useSettingsPhoneLayout } from './settings-list';

/**
 * Density follows the viewport, not `Platform.OS`: a phone browser needs the
 * roomy layout just as much as the native builds do. `isNative` stays as an
 * explicit override for callers that know better.
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
            row: rowNativeStyles,
            form: formNativeStyles,
            field: fieldNativeStyles,
            tag: tagNativeStyles,
          }
        : {
            section: sectionWebStyles,
            row: rowWebStyles,
            form: formWebStyles,
            field: fieldWebStyles,
            tag: tagWebStyles,
          },
      textPrimary: p.text,
      textSecondary: p.textSecondary,
      textMuted: p.textTertiary,
      inputBg: p.tile,
      inputBorder: p.separator,
      borderColor: p.separator,
      cardBg: p.card,
      formBg: p.tile,
      tagBg: p.tile,
      tagBorder: p.separator,
      dangerColor: p.destructive,
      separator: p.separator,
      accentBg: p.accent,
      accentFg: p.onAccent,
      placeholder: p.textTertiary,
      isDark,
    }),
    [isDark, p, roomy],
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  colors,
  mono,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  colors: ReturnType<typeof useColors>;
  mono?: boolean;
}) {
  return (
    <View style={colors.s.field.container}>
      <Text style={[colors.s.field.label, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        style={[
          colors.s.field.input,
          {
            color: colors.textPrimary,
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
          },
          mono && { fontFamily: Fonts.mono },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={label}
      />
    </View>
  );
}

function TagInput({
  label,
  values,
  onChange,
  placeholder,
  colors,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  colors: ReturnType<typeof useColors>;
}) {
  const [inputValue, setInputValue] = useState('');

  const addValue = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInputValue('');
  }, [inputValue, values, onChange]);

  const removeValue = useCallback(
    (idx: number) => {
      onChange(values.filter((_, i) => i !== idx));
    },
    [values, onChange],
  );

  return (
    <View style={colors.s.field.container}>
      <Text style={[colors.s.field.label, { color: colors.textMuted }]}>{label}</Text>
      {values.length > 0 && (
        <View style={colors.s.tag.tags}>
          {values.map((v, i) => (
            <View
              key={`${v}-${i}`}
              style={[colors.s.tag.tag, { backgroundColor: colors.tagBg, borderColor: colors.tagBorder }]}
            >
              <Text
                style={[colors.s.tag.tagText, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {v}
              </Text>
              <Pressable
                onPress={() => removeValue(i)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`移除 ${v}`}
              >
                <X size={colors.roomy ? 14 : 12} color={colors.textMuted} strokeWidth={2} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
      <View style={colors.s.tag.inputRow}>
        <TextInput
          style={[
            colors.s.field.input,
            {
              flex: 1,
              color: colors.textPrimary,
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
              fontFamily: Fonts.mono,
            },
          ]}
          value={inputValue}
          onChangeText={setInputValue}
          onSubmitEditing={addValue}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          accessibilityLabel={label}
        />
        <Pressable
          onPress={addValue}
          disabled={!inputValue.trim()}
          style={({ pressed }) => [
            colors.s.tag.addBtn,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
              opacity: !inputValue.trim() ? 0.4 : pressed ? 0.7 : 1,
            },
          ]}
        >
          <Plus size={colors.roomy ? 18 : 14} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

interface ModeDraft {
  name: string;
  description: string;
  model: string;
  thinkingLevel: string;
  extensions: string[];
  skills: string[];
  extraArgs: string;
  isDefault: boolean;
}

function emptyDraft(): ModeDraft {
  return {
    name: '',
    description: '',
    model: '',
    thinkingLevel: '',
    extensions: [],
    skills: [],
    extraArgs: '',
    isDefault: false,
  };
}

function modeToDraft(mode: AgentMode): ModeDraft {
  return {
    name: mode.name,
    description: mode.description ?? '',
    model: mode.model ?? '',
    thinkingLevel: mode.thinking_level ?? '',
    extensions: [...mode.extensions],
    skills: [...mode.skills],
    extraArgs: mode.extra_args.join(' '),
    isDefault: mode.is_default,
  };
}

function splitSpaceSeparated(val: string): string[] {
  return val.split(/\s+/).filter(Boolean);
}

function ModeForm({
  draft,
  setDraft,
  colors,
  onSave,
  onCancel,
  saveLabel,
}: {
  draft: ModeDraft;
  setDraft: (d: ModeDraft) => void;
  colors: ReturnType<typeof useColors>;
  onSave: () => void;
  onCancel: () => void;
  saveLabel: string;
}) {
  return (
    <View style={[colors.s.form.container, { backgroundColor: colors.formBg }]}>
      <Field
        label="名称"
        value={draft.name}
        onChangeText={(v) => setDraft({ ...draft, name: v })}
        placeholder="例如：深度思考"
        colors={colors}
      />
      <Field
        label="描述"
        value={draft.description}
        onChangeText={(v) => setDraft({ ...draft, description: v })}
        placeholder="可选描述"
        colors={colors}
      />
      <Field
        label="模型"
        value={draft.model}
        onChangeText={(v) => setDraft({ ...draft, model: v })}
        placeholder="例如 anthropic/claude-sonnet-4"
        colors={colors}
        mono
      />
      <Field
        label="思考等级"
        value={draft.thinkingLevel}
        onChangeText={(v) => setDraft({ ...draft, thinkingLevel: v })}
        placeholder="off、minimal、low、medium、high、xhigh、max"
        colors={colors}
      />
      <TagInput
        label="扩展"
        values={draft.extensions}
        onChange={(v) => setDraft({ ...draft, extensions: v })}
        placeholder="添加扩展路径…"
        colors={colors}
      />
      <TagInput
        label="技能"
        values={draft.skills}
        onChange={(v) => setDraft({ ...draft, skills: v })}
        placeholder="添加技能路径…"
        colors={colors}
      />
      <Field
        label="额外 CLI 参数"
        value={draft.extraArgs}
        onChangeText={(v) => setDraft({ ...draft, extraArgs: v })}
        placeholder="例如 --no-tools --verbose"
        colors={colors}
        mono
      />
      <Pressable
        onPress={() => setDraft({ ...draft, isDefault: !draft.isDefault })}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: draft.isDefault }}
        accessibilityLabel="默认模式"
        style={colors.s.form.defaultRow}
      >
        <Star
          size={colors.roomy ? 18 : 14}
          color={draft.isDefault ? '#E8A300' : colors.textMuted}
          fill={draft.isDefault ? '#E8A300' : 'none'}
          strokeWidth={1.8}
        />
        <Text style={[colors.s.form.defaultLabel, { color: colors.textPrimary }]}>
          默认模式
        </Text>
      </Pressable>
      <View style={colors.s.form.actions}>
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [
            colors.s.form.btn,
            { borderColor: colors.borderColor },
            pressed && { opacity: 0.7 },
          ]}
        >
          <X size={colors.roomy ? 16 : 13} color={colors.textMuted} strokeWidth={2} />
          <Text style={[colors.s.form.btnText, { color: colors.textMuted }]}>取消</Text>
        </Pressable>
        <Pressable
          onPress={onSave}
          disabled={!draft.name.trim()}
          style={({ pressed }) => [
            colors.s.form.btn,
            {
              backgroundColor: colors.accentBg,
              borderColor: colors.accentBg,
            },
            pressed && { opacity: 0.7 },
            !draft.name.trim() && { opacity: 0.4 },
          ]}
        >
          <Check size={colors.roomy ? 16 : 13} color={colors.accentFg} strokeWidth={2} />
          <Text style={[colors.s.form.btnText, { color: colors.accentFg }]}>
            {saveLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function ModeRow({
  mode,
  colors,
  onEdit,
  onDelete,
  isLast,
}: {
  mode: AgentMode;
  colors: ReturnType<typeof useColors>;
  onEdit: () => void;
  onDelete: () => void;
  isLast: boolean;
}) {
  const parts: string[] = [];
  if (mode.model) parts.push(mode.model);
  if (mode.thinking_level) parts.push(`思考：${mode.thinking_level}`);
  if (mode.extensions.length) parts.push(`${mode.extensions.length} 个扩展`);
  if (mode.skills.length) parts.push(`${mode.skills.length} 个技能`);
  if (mode.extra_args.length) parts.push(mode.extra_args.join(' '));

  return (
    <View
      style={[
        colors.s.row.row,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.separator,
        },
      ]}
    >
      <View style={colors.s.row.info}>
        <View style={colors.s.row.nameRow}>
          <Text style={[colors.s.row.name, { color: colors.textPrimary }]}>{mode.name}</Text>
          {mode.is_default && (
            <Star size={colors.roomy ? 15 : 12} color="#E8A300" fill="#E8A300" strokeWidth={1.8} />
          )}
        </View>
        {parts.length > 0 && (
          <Text style={[colors.s.row.detail, { color: colors.textMuted }]} numberOfLines={1}>
            {parts.join(' · ')}
          </Text>
        )}
        {mode.description ? (
          <Text style={[colors.s.row.desc, { color: colors.textMuted }]} numberOfLines={1}>
            {mode.description}
          </Text>
        ) : null}
      </View>
      <View style={colors.s.row.actions}>
        <Pressable
          onPress={onEdit}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`编辑模式 ${mode.name}`}
          style={({ pressed }) => (pressed ? { opacity: 0.6 } : undefined)}
        >
          <Pencil size={colors.roomy ? 18 : 14} color={colors.textMuted} strokeWidth={1.8} />
        </Pressable>
        <Pressable
          onPress={onDelete}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`删除模式 ${mode.name}`}
          style={({ pressed }) => (pressed ? { opacity: 0.6 } : undefined)}
        >
          <Trash2 size={colors.roomy ? 18 : 14} color={colors.dangerColor} strokeWidth={1.8} />
        </Pressable>
      </View>
    </View>
  );
}

export function AgentModesSection({ isDark, isNative }: { isDark: boolean; isNative?: boolean }) {
  const colors = useColors(isDark, isNative);
  const native = colors.roomy;
  const headingVisible = useSettingsHeadingVisible();
  const { modes, loaded, create, update, remove } = useAgentModes();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ModeDraft>(emptyDraft());

  const safeList = Array.isArray(modes) ? modes : [];

  const handleCreate = useCallback(async () => {
    try {
      await create({
        name: draft.name.trim(),
        description: draft.description.trim() || undefined,
        model: draft.model.trim() || undefined,
        thinkingLevel: draft.thinkingLevel.trim() || undefined,
        extensions: draft.extensions,
        skills: draft.skills,
        extraArgs: splitSpaceSeparated(draft.extraArgs),
        isDefault: draft.isDefault,
      });
      setAdding(false);
      setDraft(emptyDraft());
    } catch {}
  }, [create, draft]);

  const handleUpdate = useCallback(async () => {
    if (!editingId) return;
    try {
      await update(editingId, {
        name: draft.name.trim(),
        description: draft.description.trim() || undefined,
        model: draft.model.trim() || undefined,
        thinkingLevel: draft.thinkingLevel.trim() || undefined,
        extensions: draft.extensions,
        skills: draft.skills,
        extraArgs: splitSpaceSeparated(draft.extraArgs),
        isDefault: draft.isDefault,
      });
      setEditingId(null);
      setDraft(emptyDraft());
    } catch {}
  }, [update, editingId, draft]);

  if (!loaded) return null;

  return (
    <View style={colors.s.section.container}>
      <View style={colors.s.section.header}>
        {headingVisible ? (
          <>
            <Layers size={native ? 15 : 12} color={colors.textSecondary} strokeWidth={1.8} />
            <Text style={[colors.s.section.title, { color: colors.textSecondary }]}>
              Agent 模式
            </Text>
          </>
        ) : (
          // Keeps the add button pinned right once the heading is suppressed.
          <View style={{ flex: 1 }} />
        )}
        {!adding && !editingId && (
          <Pressable
            onPress={() => {
              setAdding(true);
              setDraft(emptyDraft());
            }}
            accessibilityRole="button"
            accessibilityLabel="新增 Agent 模式"
            hitSlop={8}
            style={({ pressed }) => [colors.s.section.addBtn, pressed && { opacity: 0.7 }]}
          >
            <Plus size={native ? 20 : 14} color={colors.textPrimary} strokeWidth={2} />
          </Pressable>
        )}
      </View>

      <View
        style={[
          colors.s.section.card,
          { backgroundColor: colors.cardBg, borderColor: colors.separator },
        ]}
      >
        {safeList.length === 0 && !adding && (
          <View style={colors.s.section.empty}>
            <Text style={[colors.s.section.emptyText, { color: colors.textMuted }]}>
              尚未配置模式，会话将直接开始。
            </Text>
          </View>
        )}

        {safeList.map((mode, i) =>
          editingId === mode.id ? (
            <ModeForm
              key={mode.id}
              draft={draft}
              setDraft={setDraft}
              colors={colors}
              onSave={handleUpdate}
              onCancel={() => {
                setEditingId(null);
                setDraft(emptyDraft());
              }}
              saveLabel="更新"
            />
          ) : (
            <ModeRow
              key={mode.id}
              mode={mode}
              colors={colors}
              onEdit={() => {
                setEditingId(mode.id);
                setDraft(modeToDraft(mode));
                setAdding(false);
              }}
              onDelete={() => remove(mode.id)}
              isLast={i === safeList.length - 1 && !adding}
            />
          ),
        )}

        {adding && (
          <ModeForm
            draft={draft}
            setDraft={setDraft}
            colors={colors}
            onSave={handleCreate}
            onCancel={() => {
              setAdding(false);
              setDraft(emptyDraft());
            }}
            saveLabel="创建"
          />
        )}
      </View>
    </View>
  );
}

// ─── Styles（web 紧凑版 / 移动端原生版） ─────────────────────

const sectionWebStyles = StyleSheet.create({
  container: { gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  title: { fontSize: 12, fontFamily: Fonts.sansMedium, flex: 1 },
  addBtn: { padding: 6, borderRadius: 6 },
  card: { borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  empty: { padding: 14 },
  emptyText: { fontSize: 13, fontFamily: Fonts.sans, textAlign: 'center' },
});

const rowWebStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 40,
    gap: 10,
  },
  info: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { fontSize: 14, fontFamily: Fonts.sansMedium },
  detail: { fontSize: 12, fontFamily: Fonts.mono },
  desc: { fontSize: 12, fontFamily: Fonts.sans, marginTop: 1 },
  actions: { flexDirection: 'row', gap: 12 },
});

const formWebStyles = StyleSheet.create({
  container: { padding: 14, gap: 12 },
  defaultRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  defaultLabel: { fontSize: 14, fontFamily: Fonts.sans },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  btnText: { fontSize: 13, fontFamily: Fonts.sansMedium },
});

const fieldWebStyles = StyleSheet.create({
  container: { gap: 4 },
  label: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
  },
  input: {
    fontSize: 14,
    fontFamily: Fonts.sans,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

const tagWebStyles = StyleSheet.create({
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tagText: { fontSize: 12, fontFamily: Fonts.mono, maxWidth: 200 },
  inputRow: { flexDirection: 'row', gap: 6 },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const sectionNativeStyles = StyleSheet.create({
  container: { gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16 },
  title: { fontSize: 13, fontFamily: Fonts.sansMedium, flex: 1 },
  addBtn: { padding: 8, borderRadius: 8 },
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  empty: { padding: 16 },
  emptyText: { fontSize: 14, fontFamily: Fonts.sans, textAlign: 'center' },
});

const rowNativeStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    minHeight: 48,
    gap: 12,
  },
  info: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { fontSize: 16, fontFamily: Fonts.sansMedium },
  detail: { fontSize: 13, fontFamily: Fonts.mono },
  desc: { fontSize: 13, fontFamily: Fonts.sans, marginTop: 1 },
  actions: { flexDirection: 'row', gap: 18 },
});

const formNativeStyles = StyleSheet.create({
  container: { padding: 16, gap: 14 },
  defaultRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  defaultLabel: { fontSize: 16, fontFamily: Fonts.sans },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  btnText: { fontSize: 15, fontFamily: Fonts.sansMedium },
});

const fieldNativeStyles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 13, fontFamily: Fonts.sansMedium },
  input: {
    // ≥16px avoids iOS Safari's focus zoom.
    fontSize: 16,
    fontFamily: Fonts.sans,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

const tagNativeStyles = StyleSheet.create({
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tagText: { fontSize: 14, fontFamily: Fonts.mono, maxWidth: 200 },
  inputRow: { flexDirection: 'row', gap: 8 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

