import { toTailwind } from "@/styles/to-tailwind";
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
    return <div className={toTailwind(styles.cleanState)}><History size={20} color={textMuted} strokeWidth={2} /><span className={toTailwind([styles.emptyText, {
        color: textMuted
      }])}>No commits yet</span></div>;
  }
  return <>{bins.map(bin => <div key={bin.label}>
    <span className={toTailwind([styles.binLabel, {
        color: textMuted
      }])}>{bin.label}</span>
    {bin.entries.map((entry, index) => {
        const previous = index > 0 ? bin.entries[index - 1] : null;
        const showAuthor = !previous || previous.author !== entry.author;
        return <div key={entry.hash} className={toTailwind(styles.logEntry)}>
        <div className={toTailwind(styles.spine)}>
          {index > 0 && <div className={toTailwind([styles.spineLineTop, {
              backgroundColor: dividerColor
            }])} />}
          {index < bin.entries.length - 1 && <div className={toTailwind([styles.spineLineBottom, {
              backgroundColor: dividerColor
            }])} />}
          <div className={toTailwind([styles.dot, {
              backgroundColor: hashColor
            }])} />
        </div>
        <div className={toTailwind(styles.entryBody)}>
          <span className={toTailwind([styles.logMessage, {
              color: textPrimary
            }])}>{entry.message}</span>
          <div className={toTailwind(styles.logMeta)}>
            <span className={toTailwind([styles.logHash, {
                color: hashColor
              }])}>{entry.short_hash}</span>
            {showAuthor && <span className={toTailwind([styles.logAuthor, {
                color: textSecondary
              }])}>{entry.author}</span>}
            <div className={toTailwind({
                flex: 1
              })} />
            <span className={toTailwind([styles.logDate, {
                color: textMuted
              }])}>{timeAgo(entry.date)}</span>
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
  return <div className={toTailwind([styles.logSection, {
    borderTopColor: dividerColor
  }])}>
    <button onClick={onToggle} role="button" accessibilityState={{
      expanded: isOpen
    }}>
      <History size={12} color={textMuted} strokeWidth={2} /><span className={toTailwind([styles.logHeaderText, {
        color: textPrimary
      }])}>Log</span><div className={toTailwind({
        flex: 1
      })} />
      {isOpen ? <ChevronDown size={13} color={textMuted} strokeWidth={2} /> : <ChevronUp size={13} color={textMuted} strokeWidth={2} />}
    </button>
    {isOpen && <div className={toTailwind(styles.logBody)}>{isLoading ? <span className={toTailwind({
        marginTop: 16,
        marginBottom: 16
      })} size="small" /> : <HistoryTab entries={entries} />}</div>}
  </div>;
}
