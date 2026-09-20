import { useMemo } from 'react';
import { ChevronDown, ChevronUp, History } from 'lucide-react';
import { timeAgo } from '../../utils/changes-panel';
import { useChangesTheme } from '../../hooks/use-changes-theme';
import { binEntries, type LogEntry } from '../../utils/changes-history';
import { styles } from '../../utils/changes-history-styles';
export function HistoryTab({
  entries
}: {
  entries: LogEntry[];
}) {
  const {
    textPrimary,
    textSecondary,
    textMuted,
    dividerColor,
    hashColor
  } = useChangesTheme();
  const bins = useMemo(() => binEntries(entries), [entries]);
  if (entries.length === 0) {
    return <div className={""}><History size={20} color={textMuted} strokeWidth={2} /><span className={"" + " " + ""}>No commits yet</span></div>;
  }
  return <>{bins.map(bin => <div key={bin.label}>
    <span className={"" + " " + ""}>{bin.label}</span>
    {bin.entries.map((entry, index) => {
        const previous = index > 0 ? bin.entries[index - 1] : null;
        const showAuthor = !previous || previous.author !== entry.author;
        return <div key={entry.hash} className={""}>
        <div className={""}>
          {index > 0 && <div className={"" + " " + ""} />}
          {index < bin.entries.length - 1 && <div className={"" + " " + ""} />}
          <div className={"" + " " + ""} />
        </div>
        <div className={""}>
          <span className={"" + " " + ""}>{entry.message}</span>
          <div className={""}>
            <span className={"" + " " + ""}>{entry.short_hash}</span>
            {showAuthor && <span className={"" + " " + ""}>{entry.author}</span>}
            <div className={"flex-1"} />
            <span className={"" + " " + ""}>{timeAgo(entry.date)}</span>
          </div>
        </div>
      </div>;
      })}
  </div>)}</>;
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
  return <div className={"" + " " + ""}>
    <button onClick={onToggle} role="button" accessibilityState={{
      expanded: isOpen
    }}>
      <History size={12} color={textMuted} strokeWidth={2} /><span className={"" + " " + ""}>Log</span><div className={"flex-1"} />
      {isOpen ? <ChevronDown size={13} color={textMuted} strokeWidth={2} /> : <ChevronUp size={13} color={textMuted} strokeWidth={2} />}
    </button>
    {isOpen && <div className={""}>{isLoading ? <span className={"mt-[16px] mb-[16px]"} size="small" /> : <HistoryTab entries={entries} />}</div>}
  </div>;
}
