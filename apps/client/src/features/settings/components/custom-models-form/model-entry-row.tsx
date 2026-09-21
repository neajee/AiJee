import { useEffect, useMemo, useState } from 'react';
import { Cpu, Pencil, Trash2 } from 'lucide-react';
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
  colors
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
    return <div className="flex flex-col gap-3 p-[var(--gutter)]">
        <div className="flex gap-3">
          <div className="min-w-0 flex-1">
            <Field label="模型 ID" value={draft.id} onChange={v => setDraft({
            ...draft,
            id: v
          })} placeholder="llama3.1:8b" colors={colors} mono />
          </div>
          <div className="min-w-0 flex-1">
            <Field label="显示名称" value={draft.name ?? ''} onChange={v => setDraft({
            ...draft,
            name: v || undefined
          })} placeholder="可选" colors={colors} />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="min-w-0 flex-1">
            <Field label="上下文窗口" value={draft.contextWindow?.toString() ?? ''} onChange={v => setDraft({
            ...draft,
            contextWindow: v ? parseInt(v, 10) || undefined : undefined
          })} placeholder={`${PI_DEFAULTS.contextWindow}（缺省）`} colors={colors} />
          </div>
          <div className="min-w-0 flex-1">
            <Field label="最大 Token" value={draft.maxTokens?.toString() ?? ''} onChange={v => setDraft({
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
        <div className="flex justify-end gap-2">
          <button onClick={() => setEditing(false)} className="flex h-8 items-center rounded-md border border-border px-3 text-caption text-text-secondary hover:bg-hover">
            <span>取消</span>
          </button>
          <button onClick={() => {
          if (draft.id.trim()) {
            onUpdate({
              ...draft,
              id: draft.id.trim()
            });
            setEditing(false);
          }
        }} disabled={!draft.id.trim()} className="flex h-8 items-center rounded-md bg-accent px-3 text-caption font-medium text-accent-content hover:opacity-90 disabled:opacity-40">
            <span>保存</span>
          </button>
        </div>
      </div>;
  }
  return <div className="flex items-center gap-2 py-1.5">
      <Cpu className="shrink-0" size={14} color={colors.textMuted} strokeWidth={1.8} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-caption text-foreground">{model.id}</span>
        {summary ? <span className="truncate text-meta text-text-tertiary">{summary}</span> : null}
      </div>
      <button onClick={() => setEditing(true)} aria-label={`编辑 ${model.id}`} className="flex size-7 shrink-0 items-center justify-center rounded-md hover:bg-hover">
        <Pencil size={14} color={colors.textMuted} strokeWidth={1.8} />
      </button>
      <button onClick={onRemove} aria-label={`删除 ${model.id}`} className="flex size-7 shrink-0 items-center justify-center rounded-md hover:bg-hover">
        <Trash2 size={14} color={colors.dangerColor} strokeWidth={1.8} />
      </button>
    </div>;
}
