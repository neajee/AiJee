import { useMemo } from 'react';
import { ChevronDown, ChevronUp, History } from 'lucide-react';
import { timeAgo } from '../../utils/changes-panel';
import { useChangesTheme } from '../../hooks/use-changes-theme';
import { binEntries, type LogEntry } from '../../utils/changes-history';
export function HistoryTab({
  entries
}: {
  entries: LogEntry[];
}) {
  const { textMuted } = useChangesTheme();
  const bins = useMemo(() => binEntries(entries), [entries]);
  if (entries.length === 0) {
    return <div className="flex flex-col items-center gap-1.5 py-6 text-caption text-text-tertiary"><History size={18} color={textMuted} strokeWidth={2} /><span>No commits yet</span></div>;
  }
  return <div className="flex flex-col">
    {bins.map(bin => <section key={bin.label}>
      <div className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">{bin.label}</div>
      <div className="relative ml-3 border-l border-border">
      {bin.entries.map((entry, index) => {
        const previous = index > 0 ? bin.entries[index - 1] : null;
        const showAuthor = !previous || previous.author !== entry.author;
        return <article key={entry.hash} className="relative border-b border-border/60 px-2.5 py-2 last:border-b-0">
          <span className="absolute -left-[4px] top-3 size-1.5 rounded-full border border-border bg-card" />
          <div className="flex min-w-0 items-start gap-2">
            <span className="min-w-0 flex-1 break-words text-[11px] leading-4 text-text-secondary" title={entry.message}>{entry.message}</span>
            <span className="shrink-0 text-[10px] leading-4 text-text-tertiary">{timeAgo(entry.date)}</span>
          </div>
          <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[10px] leading-4 text-text-tertiary">
            <span className="font-mono">{entry.short_hash}</span>
            {showAuthor && <><span aria-hidden="true">·</span><span className="truncate">{entry.author}</span></>}
          </div>
        </article>;
      })}
      </div>
    </section>)}
  </div>;
}
export function LogSection({
  entries,
  isLoading,
  isOpen,
  onToggle
}: {
  entries: LogEntry[];
  isLoading: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const {
    textPrimary,
    textMuted,
    dividerColor,
    hoverBg
  } = useChangesTheme();
  return <div>
    <button onClick={onToggle} role="button">
      <History size={12} color={textMuted} strokeWidth={2} /><span>Log</span><div className={"flex-1"} />
      {isOpen ? <ChevronDown size={13} color={textMuted} strokeWidth={2} /> : <ChevronUp size={13} color={textMuted} strokeWidth={2} />}
    </button>
    {isOpen && <div className="flex flex-col">{isLoading ? <span className={"mt-[16px] mb-[16px]" + " size-3 animate-spin"} /> : <HistoryTab entries={entries} />}</div>}
  </div>;
}
