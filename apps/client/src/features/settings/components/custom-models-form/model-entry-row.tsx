import { toTailwind } from "@/styles/to-tailwind";
import { useEffect, useMemo, useState } from 'react';
import { Cpu, Pencil, Trash2 } from 'lucide-react';
import { HAIRLINE_WIDTH } from '@/constants/layout';
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
  isLast
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
    return <div className={toTailwind([colors.s.model.editWrap, {
      backgroundColor: colors.accentBg
    }])}>
        <div className={toTailwind(colors.s.model.editGrid)}>
          <div className={toTailwind({
          flex: 1
        })}>
            <Field label="模型 ID" value={draft.id} onChangeText={v => setDraft({
            ...draft,
            id: v
          })} placeholder="llama3.1:8b" colors={colors} mono />
          </div>
          <div className={toTailwind({
          flex: 1
        })}>
            <Field label="显示名称" value={draft.name ?? ''} onChangeText={v => setDraft({
            ...draft,
            name: v || undefined
          })} placeholder="可选" colors={colors} />
          </div>
        </div>
        <div className={toTailwind(colors.s.model.editGrid)}>
          <div className={toTailwind({
          flex: 1
        })}>
            <Field label="上下文窗口" value={draft.contextWindow?.toString() ?? ''} onChangeText={v => setDraft({
            ...draft,
            contextWindow: v ? parseInt(v, 10) || undefined : undefined
          })} placeholder={`${PI_DEFAULTS.contextWindow}（缺省）`} colors={colors} />
          </div>
          <div className={toTailwind({
          flex: 1
        })}>
            <Field label="最大 Token" value={draft.maxTokens?.toString() ?? ''} onChangeText={v => setDraft({
            ...draft,
            maxTokens: v ? parseInt(v, 10) || undefined : undefined
          })} placeholder={`${PI_DEFAULTS.maxTokens}（缺省）`} colors={colors} />
          </div>
        </div>
        <ChipToggleRow label="输入模态" hint="决定能否向该模型发送图片附件；留空等同仅文本。" colors={colors} options={[{
        key: 'text',
        label: '文本',
        active: true,
        // pi always accepts text; there is nothing to turn off.
        locked: true,
        onToggle: () => {}
      }, {
        key: 'image',
        label: '图片',
        active: modalities.includes('image'),
        onToggle: () => setDraft({
          ...draft,
          input: modalities.includes('image') ? ['text'] : ['text', 'image']
        })
      }]} />
        <ChipToggleRow label="推理能力" hint="开启后输入框才会提供思考深度选项。" colors={colors} options={[{
        key: 'reasoning',
        label: '支持扩展思考',
        active: draft.reasoning === true,
        onToggle: () => setDraft({
          ...draft,
          reasoning: draft.reasoning === true ? undefined : true
        })
      }]} />
        <div className={toTailwind(colors.s.model.editActions)}>
          <button onClick={() => setEditing(false)}>
            <span className={toTailwind([colors.s.model.smallBtnText, {
            color: colors.textMuted
          }])}>
              取消
            </span>
          </button>
          <button onClick={() => {
          if (draft.id.trim()) {
            onUpdate({
              ...draft,
              id: draft.id.trim()
            });
            setEditing(false);
          }
        }}>
            <span className={toTailwind([colors.s.model.smallBtnText, {
            color: colors.isDark ? '#fefdfd' : '#fff'
          }])}>
              保存
            </span>
          </button>
        </div>
      </div>;
  }
  return <div className={toTailwind([colors.s.model.row, !isLast && {
    borderBottomWidth: HAIRLINE_WIDTH,
    borderBottomColor: colors.separator
  }])}>
      <Cpu size={colors.roomy ? 14 : 9} color={colors.textMuted} strokeWidth={1.8} />
      <div className={toTailwind(colors.s.model.info)}>
        <span className={toTailwind([colors.s.model.modelId, {
        color: colors.textPrimary
      }])}>
          {model.id}
        </span>
        {summary ? <span className={toTailwind([colors.s.model.modelMeta, {
        color: colors.textMuted
      }])}>
            {summary}
          </span> : null}
      </div>
      <button onClick={() => setEditing(true)}>
        <Pencil size={colors.roomy ? 15 : 9} color={colors.textMuted} strokeWidth={1.8} />
      </button>
      <button onClick={onRemove}>
        <Trash2 size={colors.roomy ? 15 : 9} color={colors.dangerColor} strokeWidth={1.8} />
      </button>
    </div>;
}
