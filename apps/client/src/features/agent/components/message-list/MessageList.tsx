import { useCallback } from "react";
import { VirtualList } from "@/components/ui/virtual-list";
import Animated, { FadeIn, FadeOut } from "@/styles/motion";
import { ArrowDown } from "lucide-react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import type { ChatMessage } from "../../component-types.ts";
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
  }: {
    item: ListItem;
    index: number;
  }) => <ListRow item={item} isDark={isDark} active={item.key === activeTurnKey} editing={editing} onEdit={startEditing} onChangeEdit={changeEditingText} onCancelEdit={cancelEditing} onSubmitEdit={() => void editMessage()} onFork={entryId => void forkFrom(entryId)} forkingEntryId={forkingEntryId} />, [activeTurnKey, cancelEditing, changeEditingText, editMessage, editing, forkFrom, forkingEntryId, isDark, startEditing]);
  const keyExtractor = useCallback((item: ListItem) => item.key, []);
  const listHeader = <div className="flex flex-col">
      {session.isLoadingOlderMessages ? <div className="flex flex-col">
          <span className="size-3 animate-spin" />
        </div> : session.hasMoreMessages ? <button onClick={handleLoadMore} role="button" aria-label="Load earlier messages" className="inline-flex items-center">
          <span className={"  text-text-tertiary"}>Load earlier messages</span>
        </button> : null}
    </div>;
  return <div className="flex flex-col">
      <VirtualList<ListItem> ref={listRef} data={items} renderItem={renderItem} keyExtractor={keyExtractor} className="flex flex-col" onScroll={handleScroll} onLayout={alignToLatest} ListHeaderComponent={listHeader} />
      {showScrollButton && <div className="flex flex-col">
          <button onClick={scrollToBottom} className={"  bg-surface-raised border-border"}>
            <ArrowDown size={16} color={colors.icon} strokeWidth={2} />
          </button>
        </div>}
      {actionError && <button onClick={clearActionError} className={"  bg-surface-raised border-destructive"}>
          <span className={"  text-destructive"}>{actionError}</span>
        </button>}
    </div>;
}
