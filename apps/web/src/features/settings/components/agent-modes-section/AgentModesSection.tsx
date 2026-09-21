import { useAgentModesController } from '../../hooks/use-agent-modes-controller';

/** A single, calm surface for instructions that shape every agent session. */
export function AgentModesSection({
  isDark: _isDark
}: {
  isDark: boolean;
  isNative?: boolean;
}) {
  const {
    loaded,
    value,
    setValue,
    saving,
    changed,
    save
  } = useAgentModesController();
  if (!loaded) return null;
  return <div className="flex flex-col gap-[var(--group-gap)]">
      <div className="overflow-hidden rounded-[var(--card-radius)]">
        <div className="flex items-start justify-between gap-3 px-[var(--gutter)] pt-[var(--row-padding-v)]">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-sans text-[var(--label-size)] text-foreground">自定义指令</span>
            <span className="font-sans text-[var(--desc-size)] text-text-secondary">向智能体提供适用于此主机上所有聊天的额外说明和上下文。</span>
          </div>
          <button onClick={save} disabled={!changed || saving} role="button" aria-label="保存自定义指令" className="flex h-7 shrink-0 items-center rounded-md bg-accent px-3 text-caption font-medium text-accent-content hover:opacity-90 disabled:opacity-40">
            <span>{saving ? '保存中' : '保存'}</span>
          </button>
        </div>
        <div className="px-[var(--gutter)] pb-[var(--row-padding-v)] pt-2">
          <textarea value={value} onChange={event => setValue(event.target.value)} placeholder="例如：回答时保持简洁；先说明结论，再给出关键步骤。" aria-label="自定义指令" className="min-h-32 w-full resize-y rounded-lg border border-border bg-muted px-2.5 py-2 font-sans text-[var(--value-size)] leading-[20px] text-foreground outline-none focus:border-border-strong" />
        </div>
      </div>
    </div>;
}
