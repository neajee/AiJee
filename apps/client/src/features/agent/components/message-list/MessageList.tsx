import { useCallback } from "react";
import { type ListRenderItemInfo } from "@/types/dom";
import { VirtualList } from "@/components/ui/virtual-list";
import Animated, { FadeIn, FadeOut } from "@/platform/animation";
import { ArrowDown } from "lucide-react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import type { ChatMessage } from "../agent-types";
import { ListRow } from "./list-row";
import type { ListItem } from "../../utils/turns";
import { INITIAL_RENDER_COUNT, RENDER_BATCH_COUNT, WINDOW_SIZE } from "../../utils/message-list-constants";
import type { MessageListController } from "../../hooks/use-message-list-controller";
export function MessageListView({
  controller
}: {
  controller: MessageListController;
}) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const colors = useThemeTokens();
  const {
    session,
    items,
    listRef,
    editing,
    actionError,
    forkingEntryId,
    activeTurnKey,
    historyAnchor,
    showScrollButton,
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
    scrollToBottom
  } = controller;
  const renderItem = useCallback(({
    item
  }: ListRenderItemInfo<ListItem>) => <ListRow item={item} isDark={isDark} active={item.key === activeTurnKey} editing={editing} onEdit={startEditing} onChangeEdit={changeEditingText} onCancelEdit={cancelEditing} onSubmitEdit={() => void editMessage()} onFork={entryId => void forkFrom(entryId)} forkingEntryId={forkingEntryId} />, [activeTurnKey, cancelEditing, changeEditingText, editMessage, editing, forkFrom, forkingEntryId, isDark, startEditing]);
  const keyExtractor = useCallback((item: ListItem) => item.key, []);
  const listHeader = <div className={""}>
      {session.isLoadingOlderMessages ? <div entering={FadeIn.duration(180)} exiting={FadeOut.duration(180)} className={""}>
          <span size="small" color={colors.textTertiary} />
        </div> : session.hasMoreMessages ? <button onClick={handleLoadMore} role="button" aria-label="Load earlier messages" className={""}>
          <span className={"" + " " + ""}>Load earlier messages</span>
        </button> : null}
    </div>;
  return <div className={""}>
      <VirtualList<ListItem> ref={listRef} data={items} renderItem={renderItem} keyExtractor={keyExtractor} className={""} onScroll={handleScroll} onLayout={alignToLatest} onContentSizeChange={handleContentSizeChange} onScrollBeginDrag={handleScrollBeginDrag} onScrollEndDrag={handleScrollEndDrag} onMomentumScrollEnd={handleScrollEndDrag} scrollEventThrottle={16} initialNumToRender={INITIAL_RENDER_COUNT} maxToRenderPerBatch={RENDER_BATCH_COUNT} updateCellsBatchingPeriod={50} windowSize={WINDOW_SIZE} removeClippedSubviews={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" maintainVisibleContentPosition={historyAnchor ? {
      minIndexForVisible: 0
    } : undefined} ListHeaderComponent={listHeader} />
      {showScrollButton && <div entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} className={""}>
          <button onClick={scrollToBottom} className={"" + " " + ""}>
            <ArrowDown size={16} color={colors.icon} strokeWidth={2} />
          </button>
        </div>}
      {actionError && <button onClick={clearActionError} className={"" + " " + ""}>
          <span className={"" + " " + ""}>{actionError}</span>
        </button>}
    </div>;
}
