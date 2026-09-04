import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { ChevronDown, ChevronUp, History } from 'lucide-react-native';

import { timeAgo } from '../../utils/changes-panel';
import { useChangesTheme } from '../../hooks/use-changes-theme';
import { binEntries, type LogEntry } from '../../utils/changes-history';
import { styles } from '../../utils/changes-history-styles';

export function HistoryTab({ entries }: { entries: LogEntry[] }) {
  const { textPrimary, textSecondary, textMuted, dividerColor, hashColor } = useChangesTheme();
  const bins = useMemo(() => binEntries(entries), [entries]);
  if (entries.length === 0) {
    return <View style={styles.cleanState}><History size={20} color={textMuted} strokeWidth={2} /><Text style={[styles.emptyText, { color: textMuted }]}>No commits yet</Text></View>;
  }
  return <>{bins.map((bin) => <View key={bin.label}>
    <Text style={[styles.binLabel, { color: textMuted }]}>{bin.label}</Text>
    {bin.entries.map((entry, index) => {
      const previous = index > 0 ? bin.entries[index - 1] : null;
      const showAuthor = !previous || previous.author !== entry.author;
      return <View key={entry.hash} style={styles.logEntry}>
        <View style={styles.spine}>
          {index > 0 && <View style={[styles.spineLineTop, { backgroundColor: dividerColor }]} />}
          {index < bin.entries.length - 1 && <View style={[styles.spineLineBottom, { backgroundColor: dividerColor }]} />}
          <View style={[styles.dot, { backgroundColor: hashColor }]} />
        </View>
        <View style={styles.entryBody}>
          <Text style={[styles.logMessage, { color: textPrimary }]} numberOfLines={1}>{entry.message}</Text>
          <View style={styles.logMeta}>
            <Text style={[styles.logHash, { color: hashColor }]}>{entry.short_hash}</Text>
            {showAuthor && <Text style={[styles.logAuthor, { color: textSecondary }]} numberOfLines={1}>{entry.author}</Text>}
            <View style={{ flex: 1 }} />
            <Text style={[styles.logDate, { color: textMuted }]}>{timeAgo(entry.date)}</Text>
          </View>
        </View>
      </View>;
    })}
  </View>)}</>;
}

export function LogSection({ entries, isLoading, isOpen, onToggle }: { entries: LogEntry[]; isLoading: boolean; isOpen: boolean; onToggle: () => void }) {
  const { textPrimary, textMuted, dividerColor, hoverBg } = useChangesTheme();
  return <View style={[styles.logSection, { borderTopColor: dividerColor }]}>
    <Pressable onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: isOpen }} style={({ pressed, hovered }: any) => [styles.logHeaderRow, (pressed || hovered) && { backgroundColor: hoverBg }]}>
      <History size={12} color={textMuted} strokeWidth={2} /><Text style={[styles.logHeaderText, { color: textPrimary }]}>Log</Text><View style={{ flex: 1 }} />
      {isOpen ? <ChevronDown size={13} color={textMuted} strokeWidth={2} /> : <ChevronUp size={13} color={textMuted} strokeWidth={2} />}
    </Pressable>
    {isOpen && <ScrollView style={styles.logBody} contentContainerStyle={styles.logBodyContent} showsVerticalScrollIndicator={false}>{isLoading ? <ActivityIndicator style={{ marginVertical: 16 }} size="small" /> : <HistoryTab entries={entries} />}</ScrollView>}
  </View>;
}
