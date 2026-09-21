import { formatReleaseShort, type VersionInfo } from "../utils/about";
/** One release in the changelog: time on the left, notes on the right. */
export function ReleaseRow({
  release,
  current
}: {
  release: NonNullable<VersionInfo['timeline']>[number];
  current: boolean;
}) {
  const notes = release.notes ?? [];
  const groups = (['feature', 'fix', 'other'] as const).map(type => ({
    type,
    label: type === 'feature' ? '新功能' : type === 'fix' ? '修复' : '其他',
    items: notes.filter(note => note.type === type)
  })).filter(group => group.items.length > 0);
  return <div className="relative flex min-w-0 gap-4 border-b border-border/60 py-3 pl-7 last:border-b-0">
      <span className={`absolute left-[5px] top-5 size-2.5 rounded-full border-2 ${current ? 'border-primary bg-primary' : 'border-border bg-card'}`} />
      <span className="absolute bottom-[-1.25rem] left-[9px] top-8 w-px bg-border" />
      <div className="flex w-24 shrink-0 flex-col gap-1">
        <span className="font-mono text-caption text-text-tertiary">{formatReleaseShort(release.published_at)}</span>
        <span className="flex flex-wrap items-center gap-1.5"><span className={`font-mono text-caption ${current ? 'font-semibold text-foreground' : 'text-text-secondary'}`}>{release.tag}</span>{current ? <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">当前</span> : null}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {groups.length ? groups.map(group => <div key={group.type} className="flex flex-col gap-1">
            <span className="text-meta font-semibold text-text-secondary">
              {group.label} · {group.items.length}
            </span>
            {group.items.map((note, index) => <div key={`${note.commit}-${index}`} className="flex min-w-0 items-baseline gap-2">
                <span className="min-w-0 flex-1 text-body leading-[18px] text-foreground">{note.title}</span>
                {note.commit ? <span className="shrink-0 font-mono text-meta text-text-tertiary">{note.commit}</span> : null}
              </div>)}
          </div>) : <span className="text-caption text-text-tertiary">无变更记录</span>}
      </div>
    </div>;
}
