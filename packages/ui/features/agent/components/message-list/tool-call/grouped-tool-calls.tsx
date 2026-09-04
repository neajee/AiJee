import { memo, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import type { ToolCallInfo } from '../../../types';
import { isToolActive } from '../../../utils/message-list';
import { ToolBody, ToolHeader } from './tool-disclosure';
import { formatSingleLine } from '../../../utils/tool-call-grouping';
import { styles } from './styles';

const MAX_VISIBLE = 5;
const GROUP_LABELS: Record<string, { before: string; after: string; activeBefore?: string }> = {
  read: { before: 'Explored ', activeBefore: 'Exploring ', after: ' files' },
  search: { before: '', after: ' web searches' },
  scrape: { before: 'Scraped ', after: ' pages' },
  crawl: { before: 'Crawled ', after: ' sites' },
  download: { before: '', after: ' downloads' },
  subagent: { before: 'Ran ', after: ' agents' },
};

export const GroupedToolCalls = memo(function GroupedToolCalls({ toolName, calls, isDark }: { toolName: string; calls: ToolCallInfo[]; isDark: boolean }) {
  const colors = useThemeTokens();
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const activeCall = calls.find(isToolActive);
  const autoOpenedRef = useRef(false);
  useEffect(() => {
    if (activeCall && !autoOpenedRef.current) {
      autoOpenedRef.current = true;
      setExpanded(true);
    }
  }, [activeCall]);
  const base = GROUP_LABELS[toolName] ?? { before: '', after: ` ${toolName} calls` };
  const visible = expanded ? (showAll ? calls : calls.slice(0, MAX_VISIBLE)) : [];
  return (
    <View>
      <ToolHeader expanded={expanded} expandable onToggle={() => setExpanded((value) => !value)} isDark={isDark} accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} ${calls.length} ${toolName} calls`}>
        <View style={styles.labelRow}>
          <Text style={[styles.groupLabel, { color: colors.text }]}>{activeCall ? (base.activeBefore ?? base.before) : base.before}</Text>
          <AnimatedNumber value={calls.length} style={[styles.groupLabel, { color: colors.text }]} />
          <Text style={[styles.groupLabel, { color: colors.text }]}>{toolName === 'read' ? ' files' : base.after}</Text>
        </View>
      </ToolHeader>
      <ToolBody expanded={expanded}>
        <View style={styles.expandedList}>
          {visible.map((call) => <View key={call.id} style={styles.expandedItem}><Text style={[styles.expandedItemText, { color: colors.textSecondary }]} numberOfLines={1}>{formatSingleLine(call)}</Text></View>)}
          {calls.length > MAX_VISIBLE && !showAll && <Pressable style={({ pressed }) => [styles.showMoreBtn, pressed && styles.showMorePressed]} accessibilityRole="button" onPress={() => setShowAll(true)}><Text style={[styles.showMoreText, { color: colors.textTertiary }]}>Show {calls.length - MAX_VISIBLE} more…</Text></Pressable>}
        </View>
      </ToolBody>
    </View>
  );
});

function AnimatedNumber({ value, style }: { value: number; style?: any }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);
  useEffect(() => {
    if (value === previous.current) return;
    previous.current = value;
    Animated.timing(opacity, { toValue: 0, duration: 80, useNativeDriver: true }).start(() => {
      setDisplay(value);
      Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }).start();
    });
  }, [opacity, value]);
  return <Animated.Text style={[style, { opacity, fontVariant: ['tabular-nums'] }]}>{display}</Animated.Text>;
}
