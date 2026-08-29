import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
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
import { useAgentSession } from "@aijee/client-sdk";
import { useWorkspaceStore } from "@/features/workspace/store";
import { Colors, Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { ChatMessage, TurnFileStats } from "../../types";
import {
  buildListItems,
  formatDuration,
  formatTurnAction,
  groupWorkSteps,
  normalizeStart,
  reconcileItems,
  summarizeTurnActions,
  type ListItem,
  type TurnListItem,
  type WorkStep,
} from "./turns";
import { UserMessage } from "./user-message";
import {
  AssistantMessage,
  MessageToolbar,
  hasMessageActions,
} from "./assistant-message";
import { AssistantMarkdown } from "./assistant-markdown";
import { SystemMessage } from "./system-message";
import { ToolCallGroup } from "./tool-call";
import { ToolBody, ToolHeader, ToolSurface } from "./tool-call/tool-disclosure";
import { basename, collectFileChanges, isToolActive, relativePath, type TurnFileChange } from "./utils";
import { ThinkingBlock } from "./thinking-block";

interface MessageListProps {
  sessionId: string;
}

const SCROLL_THRESHOLD = 200;
/**
 * How close to the oldest loaded message the viewport has to get before the
 * next page is fetched. Generous on purpose: the page should already be in
 * place by the time the reader arrives, so history feels continuous.
 */
const HISTORY_PREFETCH_DISTANCE = 400;
/**
 * Rows measure asynchronously, so the content keeps growing for a while after
 * the first page renders. The opening bottom-align therefore re-runs on every
 * content-size change and only settles once the height has been quiet for
 * this long.
 */
const ALIGN_SETTLE_MS = 220;
/**
 * Upper bound on that align phase. Without it a session that never stops
 * growing (a live stream, an image that decodes late) would keep the reader's
 * own scrolling suppressed indefinitely.
 */
const ALIGN_TIMEOUT_MS = 4000;
/**
 * A programmatic pin lands within a frame or two. Scroll events inside this
 * window are ours, not the reader's, so they must not flip follow state — that
 * feedback loop is what made a streaming turn fight the auto-scroll.
 */
const PIN_SUPPRESS_MS = 160;
/** Cover for the one place an animated scroll is still right: the button. */
const ANIMATED_SCROLL_MS = 420;
/** Ignore sub-pixel offset noise when deciding the reader scrolled up. */
const SCROLL_UP_EPSILON = 4;
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
  /**
   * Follow state is a ref, not state: it changes on scroll events at 60fps and
   * nothing renders from it. Re-rendering the whole list on every frame of a
   * stream was half of the jitter.
   */
  const autoFollowRef = useRef(true);

  const session = useAgentSession(sessionId);
  const messages = session.messages as ChatMessage[];
  const isStreaming = session.isStreaming;
  /**
   * Prepended pages are the only thing that needs an anchor, and they can only
   * arrive while history remains. Once it is exhausted the prop goes away so it
   * can never contend with the follow-the-bottom pin.
   */
  // Keep the native anchor only during an actual prepend. Leaving it enabled
  // for the whole session makes it compete with bottom-follow during streaming.
  const historyAnchor = session.isLoadingOlderMessages;

  const prevMessageCountRef = useRef(messages.length);
  /**
   * True until the list has been dragged to the newest message and the content
   * height has settled. While it is set, scroll offsets belong to us rather
   * than to the reader: nothing derives follow state or history prefetching
   * from them, which is what used to strand a long session at its top — the
   * offset-0 scroll event fired first, pulled in another page of history and
   * cancelled the align that was supposed to run next.
   */
  const aligningRef = useRef(true);
  const alignSettleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alignDeadlineRef = useRef<number | null>(null);
  // Each auto-load has to be re-armed by the content actually growing, so a
  // page shorter than the prefetch distance cannot spin the handler into
  // firing on every scroll frame.
  const lastPrefetchHeightRef = useRef(0);
  /** Coalesces every pin request in a frame into one non-animated scroll. */
  const pinFrameRef = useRef<number | null>(null);
  const pinUntilRef = useRef(0);
  const lastOffsetRef = useRef(0);
  /** A pin issued mid-drag fights the finger; touch always wins. */
  const draggingRef = useRef(false);

  const itemsRef = useRef<ListItem[]>([]);
  const items = useMemo(() => {
    const next = reconcileItems(itemsRef.current, buildListItems(messages));
    itemsRef.current = next;
    return next;
  }, [messages]);

  // Only the trailing turn can be in flight.
  const activeTurnKey = useMemo(() => {
    if (!isStreaming) return null;
    const last = items[items.length - 1];
    return last && last.kind === "turn" ? last.key : null;
  }, [items, isStreaming]);

  /**
   * Hold the viewport at the newest content without animating.
   *
   * An animated scrollToEnd takes ~300ms, and a stream appends rows faster than
   * that: each new chunk restarted the animation from a stale target while the
   * content kept growing underneath it, which reads as the list bouncing. A
   * single unanimated jump per frame is invisible when the delta is one line and
   * correct when it is twenty.
   */
  const pinToBottom = useCallback(() => {
    if (pinFrameRef.current !== null || draggingRef.current) return;
    pinFrameRef.current = requestAnimationFrame(() => {
      pinFrameRef.current = null;
      pinUntilRef.current = Date.now() + PIN_SUPPRESS_MS;
      listRef.current?.scrollToEnd({ animated: false });
    });
  }, []);

  const cancelPin = useCallback(() => {
    if (pinFrameRef.current !== null) {
      cancelAnimationFrame(pinFrameRef.current);
      pinFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    // The opening align owns the offset until it settles.
    if (!autoFollowRef.current || aligningRef.current) return;
    const countChanged = messages.length !== prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;
    if (countChanged) pinToBottom();
  }, [messages.length, pinToBottom]);

  const clearAlignTimer = useCallback(() => {
    if (alignSettleRef.current) {
      clearTimeout(alignSettleRef.current);
      alignSettleRef.current = null;
    }
  }, []);

  const finishAlign = useCallback(() => {
    clearAlignTimer();
    aligningRef.current = false;
    alignDeadlineRef.current = null;
    // The reader starts at the newest message, so they start following it.
    autoFollowRef.current = true;
    setShowScrollButton(false);
  }, [clearAlignTimer]);

  /** Pull the viewport to the newest message, and keep doing it until the
   * content height stops moving. */
  const alignToLatest = useCallback(() => {
    if (!aligningRef.current || !session.isReady || items.length === 0) return;

    if (alignDeadlineRef.current === null) {
      alignDeadlineRef.current = Date.now() + ALIGN_TIMEOUT_MS;
    }

    listRef.current?.scrollToEnd({ animated: false });
    // A second pass after layout catches the rows this frame just measured.
    requestAnimationFrame(() => {
      if (aligningRef.current) listRef.current?.scrollToEnd({ animated: false });
    });

    clearAlignTimer();
    if (Date.now() > alignDeadlineRef.current) {
      finishAlign();
      return;
    }
    alignSettleRef.current = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: false });
      finishAlign();
    }, ALIGN_SETTLE_MS);
  }, [clearAlignTimer, finishAlign, items.length, session.isReady]);

  useEffect(() => {
    alignToLatest();
  }, [alignToLatest]);

  // A new session re-opens at its own newest message.
  useEffect(() => {
    aligningRef.current = true;
    alignDeadlineRef.current = null;
    prevMessageCountRef.current = 0;
    lastPrefetchHeightRef.current = 0;
    lastOffsetRef.current = 0;
    autoFollowRef.current = true;
    setShowScrollButton(false);
    return () => {
      clearAlignTimer();
      cancelPin();
    };
  }, [sessionId, clearAlignTimer, cancelPin]);

  // Growth is what the stream produces, so growth is what drives the follow —
  // no timer. onContentSizeChange fires once per committed layout, which is
  // exactly the moment a new bottom exists to scroll to.
  const handleContentSizeChange = useCallback(() => {
    if (aligningRef.current) {
      alignToLatest();
      return;
    }
    if (autoFollowRef.current) pinToBottom();
  }, [alignToLatest, pinToBottom]);

  const sessionRef = useRef(session);
  sessionRef.current = session;

  const handleLoadMore = useCallback(() => {
    const s = sessionRef.current;
    if (s.hasMoreMessages && !s.isLoadingOlderMessages) {
      s.loadOlderMessages();
    }
  }, []);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      const offset = contentOffset.y;
      const scrolledUp = offset < lastOffsetRef.current - SCROLL_UP_EPSILON;
      lastOffsetRef.current = offset;

      if (aligningRef.current) {
        // Our own offset. Record the height so the first reader-driven scroll
        // after the align cannot immediately read as "new content at the top".
        lastPrefetchHeightRef.current = contentSize.height;
        return;
      }

      // A pin only ever moves the offset toward the bottom, so an upward move is
      // the reader even inside the suppression window; anything else in that
      // window is the echo of our own scroll and must be ignored.
      if (!scrolledUp && Date.now() < pinUntilRef.current) return;

      const isAwayFromBottom = distanceFromBottom > SCROLL_THRESHOLD;
      if (autoFollowRef.current === isAwayFromBottom) {
        autoFollowRef.current = !isAwayFromBottom;
        // Leaving the bottom cancels the pin already queued for this frame,
        // otherwise the reader's scroll-up is undone before they see it.
        if (isAwayFromBottom) cancelPin();
      }
      setShowScrollButton((prev) => (prev === isAwayFromBottom ? prev : isAwayFromBottom));

      // Older history is prepended at the top. Derive this from every scroll
      // event instead of onEndReached, whose initial fire can happen before the
      // history request reports that another page is available.
      const distanceFromOldest = offset;
      if (
        !autoFollowRef.current &&
        distanceFromOldest <= HISTORY_PREFETCH_DISTANCE &&
        contentSize.height !== lastPrefetchHeightRef.current
      ) {
        lastPrefetchHeightRef.current = contentSize.height;
        handleLoadMore();
      }
    },
    [handleLoadMore, cancelPin],
  );

  const scrollToBottom = useCallback(() => {
    finishAlign();
    // Reader-initiated, so animation is a cue rather than a competitor.
    listRef.current?.scrollToEnd({ animated: true });
    pinUntilRef.current = Date.now() + ANIMATED_SCROLL_MS;
  }, [finishAlign]);

  const handleScrollBeginDrag = useCallback(() => {
    draggingRef.current = true;
    cancelPin();
    // Only meaningful during the opening align — afterwards a drag must not
    // reset follow state, or grabbing the list would re-arm the auto-scroll it
    // was meant to break out of.
    if (aligningRef.current) finishAlign();
  }, [finishAlign, cancelPin]);

  const handleScrollEndDrag = useCallback(() => {
    draggingRef.current = false;
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

  const listHeader = (
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
        // Scrolling here loads the page automatically; this stays as the
        // affordance for the case where the history is shorter than the
        // viewport and there is nothing to scroll.
        <Pressable
          onPress={handleLoadMore}
          accessibilityRole="button"
          accessibilityLabel="Load earlier messages"
          style={styles.loadMoreBtn}
        >
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
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        style={styles.list}
        contentContainerStyle={styles.content}
        onScroll={handleScroll}
        onLayout={alignToLatest}
        onContentSizeChange={handleContentSizeChange}
        // A reader who grabs the list mid-align owns the offset from then on.
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleScrollEndDrag}
        // Native only throttles this; a coarser value would let a fast flick
        // reach the oldest message without ever reporting the distance.
        scrollEventThrottle={16}
        initialNumToRender={INITIAL_RENDER_COUNT}
        maxToRenderPerBatch={RENDER_BATCH_COUNT}
        updateCellsBatchingPeriod={50}
        windowSize={WINDOW_SIZE}
        removeClippedSubviews={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        // Anchors prepended history only. While following the newest message we
        // own the offset outright, and two mechanisms adjusting it in the same
        // frame is a fight neither wins.
        maintainVisibleContentPosition={
          historyAnchor ? { minIndexForVisible: 0 } : undefined
        }
        ListHeaderComponent={listHeader}
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
/** Rows past this many get a scroll cap instead of an ever-taller card. */
const SUMMARY_SCROLL_AFTER = 8;
const SUMMARY_ROW_HEIGHT = 22;

const FileChangeRow = memo(function FileChangeRow({
  change,
  root,
  addColor,
  removeColor,
  isDark,
}: {
  change: TurnFileChange;
  root: string | null;
  addColor: string;
  removeColor: string;
  isDark: boolean;
}) {
  const colors = isDark ? Colors.dark : Colors.light;
  const created = change.kind === "created";
  const shown = relativePath(change.path, root);
  const name = basename(shown);
  const dir = shown.slice(0, shown.length - name.length);

  return (
    <View style={styles.fileRow}>
      <Text
        style={[styles.fileKind, { color: created ? addColor : colors.textTertiary }]}
        accessibilityLabel={created ? "created" : "edited"}
      >
        {created ? "A" : "M"}
      </Text>
      {/* Head-truncated with a dimmed directory: the filename is what is read. */}
      <Text style={styles.filePath} numberOfLines={1} ellipsizeMode="head">
        {dir ? <Text style={{ color: colors.textTertiary }}>{dir}</Text> : null}
        <Text style={{ color: colors.text }}>{name}</Text>
      </Text>
      <View style={styles.fileCounts}>
        {change.added > 0 && (
          <Text style={[styles.fileCount, { color: addColor }]}>+{change.added}</Text>
        )}
        {change.removed > 0 && (
          <Text style={[styles.fileCount, { color: removeColor }]}>{"−"}{change.removed}</Text>
        )}
      </View>
    </View>
  );
});

/**
 * What a turn did to the working tree, as a card at the very end of the turn.
 *
 * Collapsed it reads as a list-card header: what changed on the leading edge,
 * how much on the trailing edge. Expanded it lists every file the turn
 * touched, biggest churn first. The file list is derived from the turn's tool
 * calls, so a session without retained tool calls renders the header alone,
 * without a disclosure affordance.
 */
const TurnSummary = memo(function TurnSummary({
  stats,
  changes,
  isDark,
}: {
  stats: TurnFileStats;
  changes: TurnFileChange[];
  isDark: boolean;
}) {
  const colors = isDark ? Colors.dark : Colors.light;
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded((prev) => !prev), []);

  // Tool paths are absolute; the workspace root is what makes them readable.
  const root = useWorkspaceStore((s) => {
    const id = s.selectedWorkspaceId;
    return s.workspaces.find((w) => w.id === id)?.path ?? null;
  });

  // Biggest change first: the cap below means the tail may go unseen.
  const ordered = useMemo(
    () =>
      [...changes].sort(
        (a, b) => b.added + b.removed - (a.added + a.removed),
      ),
    [changes],
  );

  const totalFiles = stats.filesEdited + stats.filesCreated;

  const addColor = isDark ? "#3FB950" : "#1A7F37";
  const removeColor = isDark ? "#F85149" : "#CF222E";

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

  if (totalFiles === 0) return null;

  const expandable = ordered.length > 0;

  return (
    <View style={styles.summaryWrap}>
      <ToolSurface isDark={isDark} padded={false}>
        <View style={styles.summaryHeader}>
          <ToolHeader
            expanded={expanded}
            expandable={expandable}
            onToggle={toggle}
            isDark={isDark}
            accessibilityLabel={`${expanded ? "Collapse" : "Expand"} the list of changed files`}
          >
            <Text style={[styles.summaryTitle, { color: colors.textSecondary }]}>
              {totalFiles} {totalFiles === 1 ? "file" : "files"} changed
            </Text>
            {/* Keeps the counts on the trailing edge, next to the chevron. */}
            <View style={styles.summarySpacer} />
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
          </ToolHeader>
        </View>

        {expandable && (
          <ToolBody expanded={expanded}>
            <ScrollView
              style={[styles.summaryList, { borderTopColor: colors.border }]}
              contentContainerStyle={styles.summaryListContent}
              // A turn can touch dozens of files; cap it like any tool body.
              nestedScrollEnabled
              scrollEnabled={ordered.length > SUMMARY_SCROLL_AFTER}
              showsVerticalScrollIndicator={false}
            >
              {ordered.map((change) => (
                <FileChangeRow
                  key={change.path}
                  change={change}
                  root={root}
                  addColor={addColor}
                  removeColor={removeColor}
                  isDark={isDark}
                />
              ))}
            </ScrollView>
          </ToolBody>
        )}
      </ToolSurface>
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

const WorkActivityGroup = memo(function WorkActivityGroup({
  steps,
  isDark,
}: {
  steps: WorkStep[];
  isDark: boolean;
}) {
  const colors = isDark ? Colors.dark : Colors.light;
  const running = steps.some((step) =>
    step.kind === "thinking"
      ? step.streaming
      : step.kind === "tools" && step.toolCalls.some(isToolActive),
  );
  const [override, setOverride] = useState<boolean | null>(null);
  const expanded = override ?? running;
  const actions = useMemo(() => summarizeTurnActions(steps), [steps]);
  const label = actions.length
    ? actions.map(formatTurnAction).join(" · ")
    : running
      ? "Thinking"
      : "Thought";

  return (
    <View style={styles.activityGroup}>
      <ToolHeader
        expanded={expanded}
        expandable
        onToggle={() => setOverride(!expanded)}
        isDark={isDark}
        accessibilityLabel={`${expanded ? "Collapse" : "Expand"} ${label}`}
      >
        <Text style={[styles.activityLabel, { color: colors.textSecondary }]} numberOfLines={1}>
          {label}
        </Text>
      </ToolHeader>
      <ToolBody expanded={expanded}>
        <View style={styles.activityBody}>
          {steps.map((step) => (
            <WorkStepView key={step.key} step={step} isDark={isDark} />
          ))}
        </View>
      </ToolBody>
    </View>
  );
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

  // The action row belongs to the whole turn, so hover is tracked here rather
  // than on the answer alone: the file-change card counts as part of it.
  const [hovered, setHovered] = useState(false);

  // Only worth deriving once the turn reports it touched something.
  const fileChanges = useMemo(() => {
    if (!turn.fileStats) return [];
    return collectFileChanges(
      turn.steps.flatMap((step) => (step.kind === "tools" ? step.toolCalls : [])),
    );
  }, [turn.fileStats, turn.steps]);

  const elapsedMs = useTurnElapsed(active, turn.startedAt);
  const settledMs = turn.durationMs && turn.durationMs > 0 ? turn.durationMs : null;
  const sections = useMemo(() => groupWorkSteps(turn.steps), [turn.steps]);
  const label = active
    ? "Working for"
    : settledMs
      ? "Worked for"
      : "Worked";
  const timeLabel = active
    ? formatDuration(Math.max(1000, elapsedMs))
    : settledMs
      ? formatDuration(settledMs)
      : null;

  const showDivider = hasWork || active || !!settledMs;

  const divider = (
    <View style={styles.dividerWrap}>
      <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      <View style={styles.dividerCenter}>
        <Text
          style={[styles.dividerText, { color: colors.textTertiary }]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {timeLabel && (
          <Text style={[styles.dividerTime, { color: colors.textTertiary }]}>
            {timeLabel}
          </Text>
        )}
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
    <View
      {...(Platform.OS === "web"
        ? {
            onPointerEnter: () => setHovered(true),
            onPointerLeave: () => setHovered(false),
          }
        : {})}
    >
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
          {sections.map((section) =>
            section.kind === "activity" ? (
              <WorkActivityGroup key={section.key} steps={section.steps} isDark={isDark} />
            ) : (
              <WorkStepView key={section.key} step={section.step} isDark={isDark} />
            ),
          )}
        </Animated.View>
      )}

      {turn.final && <AssistantMessage message={turn.final} isDark={isDark} />}
      {turn.aborted && (
        <Text style={[styles.turnNotice, { color: colors.textTertiary }]}>
          Stopped
        </Text>
      )}
      {turn.fileStats && (
        <TurnSummary stats={turn.fileStats} changes={fileChanges} isDark={isDark} />
      )}
      {/* Last in the turn: the answer, then what it changed, then the actions. */}
      {turn.final && hasMessageActions(turn.final) && (
        <View style={styles.turnToolbar}>
          <MessageToolbar message={turn.final} isDark={isDark} hovered={hovered} />
        </View>
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
  turnToolbar: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  summaryWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  summaryHeader: {
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  summaryTitle: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.sans,
  },
  summarySpacer: {
    flex: 1,
  },
  summaryList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    maxHeight: SUMMARY_ROW_HEIGHT * SUMMARY_SCROLL_AFTER + 12,
  },
  summaryListContent: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: SUMMARY_ROW_HEIGHT,
  },
  fileKind: {
    width: 9,
    fontSize: 10,
    lineHeight: 16,
    fontFamily: Fonts.mono,
    fontWeight: "600",
  },
  filePath: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.mono,
  },
  fileCounts: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 6,
    // Keeps the numbers in a column instead of ragged against the path.
    minWidth: 68,
  },
  fileCount: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: Fonts.mono,
    fontWeight: "600",
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
    height: 10,
    borderRadius: 1,
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
    flexShrink: 1,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    opacity: 0.6,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    flexShrink: 1,
  },
  dividerTime: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    opacity: 0.7,
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
  activityGroup: {
    minWidth: 0,
  },
  activityLabel: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.sans,
  },
  activityBody: {
    gap: 10,
    paddingLeft: 10,
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
