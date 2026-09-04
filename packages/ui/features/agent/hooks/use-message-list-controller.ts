import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Platform, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { useAgentSession } from "@aijee/client-sdk";
import type { ChatMessage } from "../types";
import { buildListItems, reconcileItems, type ListItem } from "../utils/turns";

export interface MessageListProps {
  sessionId: string;
  onForked?: (sessionId: string) => void;
}

const SCROLL_THRESHOLD = 200;
const HISTORY_PREFETCH_DISTANCE = 400;
const ALIGN_SETTLE_MS = 220;
const ALIGN_TIMEOUT_MS = 4000;
const PIN_SUPPRESS_MS = 160;
const ANIMATED_SCROLL_MS = 420;
const SCROLL_UP_EPSILON = 4;

export function useMessageListController({ sessionId, onForked }: MessageListProps) {
  const listRef = useRef<FlatList<ListItem>>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [editing, setEditing] = useState<{ entryId: string; text: string; images?: Array<{ type: "image"; data: string; mimeType: string }> } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [forkingEntryId, setForkingEntryId] = useState<string | null>(null);
  /**
   * Follow state is a ref, not state: it changes on scroll events at 60fps and
   * nothing renders from it. Re-rendering the whole list on every frame of a
   * stream was half of the jitter.
   */
  const autoFollowRef = useRef(true);

  const session = useAgentSession(sessionId);
  const messages = session.messages as ChatMessage[];
  const isStreaming = session.isStreaming;
  const editMessage = useCallback(async () => {
    if (!editing || !editing.text.trim() || isStreaming) return;
    setActionError(null);
    try {
      await session.prompt(editing.text, { fromEntryId: editing.entryId, images: editing.images });
      setEditing(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to edit message");
    }
  }, [editing, isStreaming, session]);
  const forkFrom = useCallback(async (entryId: string) => {
    if (forkingEntryId || isStreaming) return;
    setActionError(null);
    setForkingEntryId(entryId);
    try {
      const result = await session.fork(entryId, "at");
      if (result.cancelled) return;
      const nextId = result.session?.sessionId;
      if (!nextId) throw new Error("Forked session was not returned");
      if (nextId !== sessionId) onForked?.(nextId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to fork session");
    } finally {
      setForkingEntryId(null);
    }
  }, [forkingEntryId, isStreaming, onForked, session, sessionId]);
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


  const startEditing = useCallback((message: ChatMessage) => {
    if (!message.entryId) return;
    setActionError(null);
    setEditing({
      entryId: message.entryId,
      text: message.text,
      ...(message.attachments?.length
        ? { images: message.attachments.map(({ data, mimeType }) => ({ type: "image" as const, data, mimeType })) }
        : {}),
    });
  }, []);
  const changeEditingText = useCallback((text: string) => {
    setEditing((current) => current ? { ...current, text } : current);
  }, []);
  const cancelEditing = useCallback(() => setEditing(null), []);
  const clearActionError = useCallback(() => setActionError(null), []);

  return {
    session,
    messages,
    items,
    listRef,
    editing,
    actionError,
    forkingEntryId,
    activeTurnKey,
    historyAnchor,
    showScrollButton,
    isStreaming,
    editMessage,
    forkFrom,
    startEditing,
    changeEditingText,
    cancelEditing,
    clearActionError,
    handleLoadMore,
    handleScroll,
    alignToLatest,
    handleContentSizeChange,
    handleScrollBeginDrag,
    handleScrollEndDrag,
    scrollToBottom,
  };
}

export type MessageListController = ReturnType<typeof useMessageListController>;
