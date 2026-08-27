import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ArrowDown, ChevronRight } from "lucide-react-native";
import { useAgentSession } from "@pideck/client-sdk";
import { Colors, Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { ChatMessage, TurnFileStats } from "../../types";
import {
  buildListItems,
  formatDuration,
  normalizeStart,
  reconcileItems,
  type ListItem,
  type TurnListItem,
  type WorkStep,
} from "./turns";
import { UserMessage } from "./user-message";
import { AssistantMessage } from "./assistant-message";
import { AssistantMarkdown } from "./assistant-markdown";
import { SystemMessage } from "./system-message";
import { ToolCallGroup } from "./tool-call";
import { ThinkingBlock } from "./thinking-block";

interface MessageListProps {
  sessionId: string;
}

const SCROLL_THRESHOLD = 200;
const INITIAL_RENDER_COUNT = 12;
const RENDER_BATCH_COUNT = 6;
const WINDOW_SIZE = 7;

export const MessageList = memo(function MessageList({
  sessionId,
}: MessageListProps) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const colors = Colors[colorScheme];
  const listRef = useRef<FlatList<ListItem>>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [autoFollow, setAutoFollow] = useState(true);

  const session = useAgentSession(sessionId);
  const messages = session.messages as ChatMessage[];
  const isStreaming = session.isStreaming;

  const prevMessageCountRef = useRef(messages.length);

  const itemsRef = useRef<ListItem[]>([]);
  const items = useMemo(() => {
    const next = reconcileItems(itemsRef.current, buildListItems(messages));
    itemsRef.current = next;
    return next;
  }, [messages]);
  const reversed = useMemo(() => [...items].reverse(), [items]);

  // Only the trailing turn can be in flight.
  const activeTurnKey = useMemo(() => {
    if (!isStreaming) return null;
    const last = items[items.length - 1];
    return last && last.kind === "turn" ? last.key : null;
  }, [items, isStreaming]);

  useEffect(() => {
    if (!autoFollow) return;
    const countChanged = messages.length !== prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;
    if (countChanged) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
      });
    }
  }, [messages.length, autoFollow]);

  useEffect(() => {
    if (!isStreaming || !autoFollow) return;
    const id = setInterval(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 800);
    return () => clearInterval(id);
  }, [isStreaming, autoFollow]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const isAwayFromBottom = e.nativeEvent.contentOffset.y > SCROLL_THRESHOLD;
      setShowScrollButton(isAwayFromBottom);
      setAutoFollow(!isAwayFromBottom);
    },
    [],
  );

  const scrollToBottom = useCallback(() => {
    setAutoFollow(true);
    setShowScrollButton(false);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const sessionRef = useRef(session);
  sessionRef.current = session;

  const handleLoadMore = useCallback(() => {
    const s = sessionRef.current;
    if (s.hasMoreMessages && !s.isLoadingOlderMessages) {
      s.loadOlderMessages();
    }
  }, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ListItem>) => (
      <ListRow
        item={item}
        isDark={isDark}
        active={item.key === activeTurnKey}
      />
    ),
    [isDark, activeTurnKey],
  );

  const keyExtractor = useCallback((item: ListItem) => item.key, []);

  const listFooter = (
    <View style={styles.historyLoaderWrap}>
      {session.isLoadingOlderMessages ? (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(180)}
          style={styles.historyLoader}
        >
          <ActivityIndicator size="small" color={colors.textTertiary} />
        </Animated.View>
      ) : session.hasMoreMessages ? (
        <Pressable onPress={handleLoadMore} style={styles.loadMoreBtn}>
          <Text style={[styles.loadMoreText, { color: colors.textTertiary }]}>
            Load earlier messages
          </Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View style={styles.root}>
      <FlatList<ListItem>
        ref={listRef}
        data={reversed}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        inverted
        style={styles.list}
        contentContainerStyle={styles.content}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        onScroll={handleScroll}
        scrollEventThrottle={100}
        initialNumToRender={INITIAL_RENDER_COUNT}
        maxToRenderPerBatch={RENDER_BATCH_COUNT}
        updateCellsBatchingPeriod={50}
        windowSize={WINDOW_SIZE}
        removeClippedSubviews={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
        ListFooterComponent={listFooter}
      />
      {showScrollButton && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
          style={styles.scrollBtnWrap}
        >
          <Pressable
            onPress={scrollToBottom}
            style={[
              styles.scrollBtn,
              { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
            ]}
          >
            <ArrowDown size={16} color={colors.icon} strokeWidth={2} />
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
});

function useTurnElapsed(active: boolean, startedAt: number): number {
  const mountedAt = useRef(Date.now());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return 0;
  return Math.max(0, now - normalizeStart(startedAt, mountedAt.current));
}

const SUMMARY_BLOCKS = 5;

const TurnSummary = memo(function TurnSummary({
  stats,
  isDark,
}: {
  stats: TurnFileStats;
  isDark: boolean;
}) {
  const totalFiles = stats.filesEdited + stats.filesCreated;
  if (totalFiles === 0) return null;

  const addColor = isDark ? "#3FB950" : "#1A7F37";
  const removeColor = isDark ? "#F85149" : "#CF222E";
  const textColor = isDark ? Colors.dark.textTertiary : Colors.light.textTertiary;

  const totalLines = stats.linesAdded + stats.linesRemoved;
  let addBlocks = 0;
  let removeBlocks = 0;
  if (totalLines > 0) {
    addBlocks = Math.max(stats.linesAdded > 0 ? 1 : 0, Math.round((stats.linesAdded / totalLines) * SUMMARY_BLOCKS));
    removeBlocks = Math.max(stats.linesRemoved > 0 ? 1 : 0, SUMMARY_BLOCKS - addBlocks);
  } else if (stats.filesCreated > 0) {
    addBlocks = SUMMARY_BLOCKS;
  } else {
    addBlocks = Math.ceil(SUMMARY_BLOCKS / 2);
    removeBlocks = SUMMARY_BLOCKS - addBlocks;
  }

  return (
    <View style={styles.summaryWrap}>
      <Text style={styles.summaryLineCount}>
        {stats.linesAdded > 0 && <Text style={{ color: addColor }}>+{stats.linesAdded}</Text>}
        {stats.linesAdded > 0 && stats.linesRemoved > 0 && " "}
        {stats.linesRemoved > 0 && <Text style={{ color: removeColor }}>{"−"}{stats.linesRemoved}</Text>}
      </Text>
      <View style={styles.summaryBlocks}>
        {Array.from({ length: addBlocks }).map((_, i) => (
          <View key={`a-${i}`} style={[styles.summaryBlock, { backgroundColor: addColor }]} />
        ))}
        {Array.from({ length: removeBlocks }).map((_, i) => (
          <View key={`r-${i}`} style={[styles.summaryBlock, { backgroundColor: removeColor }]} />
        ))}
      </View>
      <Text style={[styles.summaryText, { color: textColor }]}>
        {totalFiles} {totalFiles === 1 ? "file" : "files"}
      </Text>
    </View>
  );
});

const WorkStepView = memo(function WorkStepView({
  step,
  isDark,
}: {
  step: WorkStep;
  isDark: boolean;
}) {
  const colors = isDark ? Colors.dark : Colors.light;

  switch (step.kind) {
    case "thinking":
      return (
        <ThinkingBlock text={step.text} isStreaming={step.streaming} isDark={isDark} />
      );
    case "text":
      return (
        <View style={styles.stepText}>
          <AssistantMarkdown text={step.text} />
        </View>
      );
    case "error":
      return (
        <Text style={[styles.stepError, { color: colors.destructive }]}>
          {step.text}
        </Text>
      );
    case "tools":
      return (
        <ToolCallGroup
          toolCalls={step.toolCalls}
          isDark={isDark}
        />
      );
  }
});

/**
 * A whole assistant turn: the work history behind one "Worked for X" divider,
 * plus the final answer. The divider auto-expands while the turn runs and
 * collapses once it settles, unless the reader toggled it by hand.
 */
const TurnBlock = memo(function TurnBlock({
  turn,
  isDark,
  active,
}: {
  turn: TurnListItem;
  isDark: boolean;
  active: boolean;
}) {
  const colors = isDark ? Colors.dark : Colors.light;
  const [override, setOverride] = useState<boolean | null>(null);
  const expanded = override ?? active;
  const hasWork = turn.steps.length > 0;

  const chevronRotate = useSharedValue(expanded ? 90 : 0);
  useEffect(() => {
    chevronRotate.value = withTiming(expanded ? 90 : 0, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });
  }, [expanded, chevronRotate]);
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotate.value}deg` }],
  }));

  const toggle = useCallback(() => setOverride(!expanded), [expanded]);

  const elapsedMs = useTurnElapsed(active, turn.startedAt);
  const settledMs = turn.durationMs && turn.durationMs > 0 ? turn.durationMs : null;
  const label = active
    ? `Working for ${formatDuration(Math.max(1000, elapsedMs))}`
    : settledMs
      ? `Worked for ${formatDuration(settledMs)}`
      : "Worked";

  const showDivider = hasWork || active || !!settledMs;

  const divider = (
    <View style={styles.dividerWrap}>
      <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      <View style={styles.dividerCenter}>
        <Text style={[styles.dividerText, { color: colors.textTertiary }]}>
          {label}
        </Text>
        {hasWork && (
          <Animated.View style={[styles.dividerChevron, chevronStyle]}>
            <ChevronRight size={12} color={colors.textTertiary} strokeWidth={2} />
          </Animated.View>
        )}
      </View>
      <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
    </View>
  );

  return (
    <View>
      {showDivider &&
        (hasWork ? (
          <Pressable
            onPress={toggle}
            accessibilityRole="button"
            accessibilityLabel={
              expanded ? "Collapse work details" : "Expand work details"
            }
          >
            {divider}
          </Pressable>
        ) : (
          divider
        ))}

      {hasWork && expanded && (
        <Animated.View
          entering={FadeIn.duration(140)}
          style={[styles.workLog, { borderLeftColor: colors.border }]}
        >
          {turn.steps.map((step) => (
            <WorkStepView
              key={step.key}
              step={step}
              isDark={isDark}
            />
          ))}
        </Animated.View>
      )}

      {turn.fileStats && <TurnSummary stats={turn.fileStats} isDark={isDark} />}
      {turn.final && <AssistantMessage message={turn.final} isDark={isDark} />}
      {turn.aborted && (
        <Text style={[styles.turnNotice, { color: colors.textTertiary }]}>
          Stopped
        </Text>
      )}
    </View>
  );
});

const ListRow = memo(function ListRow({
  item,
  isDark,
  active,
}: {
  item: ListItem;
  isDark: boolean;
  active: boolean;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(160)}
      exiting={FadeOut.duration(140)}
      style={styles.itemWrap}
    >
      {item.kind === "turn" ? (
        <TurnBlock turn={item} isDark={isDark} active={active} />
      ) : item.message.role === "user" ? (
        <UserMessage message={item.message} isDark={isDark} />
      ) : (
        <SystemMessage message={item.message} isDark={isDark} />
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { flex: 1 },
  content: {
    paddingTop: 8,
    paddingBottom: 24,
    maxWidth: 1080,
    alignSelf: "center",
    width: "100%",
  },
  itemWrap: { paddingVertical: 2 },
  summaryWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  summaryLineCount: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: Fonts.mono,
    fontWeight: "600",
  },
  summaryBlocks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 16,
  },
  summaryBlock: {
    width: 5,
    height: 12,
    borderRadius: 1,
  },
  summaryText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: Fonts.sans,
  },
  dividerWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  dividerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    opacity: 0.6,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  dividerChevron: {
    width: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  workLog: {
    marginLeft: 16,
    paddingLeft: 12,
    paddingRight: 16,
    paddingTop: 2,
    paddingBottom: 10,
    borderLeftWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  stepText: {
    opacity: 0.75,
  },
  stepError: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.sans,
  },
  turnNotice: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.sans,
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  historyLoaderWrap: {
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  historyLoader: {
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  loadMoreBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  loadMoreText: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
    fontWeight: "500",
  },
  scrollBtnWrap: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
  },
  scrollBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
});
