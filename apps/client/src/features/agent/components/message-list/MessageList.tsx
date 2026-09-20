import { useCallback } from "react";
import { VirtualList } from "@/components/ui/virtual-list";
import { ArrowDown } from "lucide-react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { ListRow } from "./list-row";
import type { ListItem } from "../../utils/turns";
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
    scrollToBottom
  } = controller;
  const renderItem = useCallback(({
    item
  }: {
    item: ListItem;
    index: number;
  }) => <ListRow item={item} isDark={isDark} active={item.key === activeTurnKey} editing={editing} onEdit={startEditing} onChangeEdit={changeEditingText} onCancelEdit={cancelEditing} onSubmitEdit={() => void editMessage()} onFork={entryId => void forkFrom(entryId)} forkingEntryId={forkingEntryId} />, [activeTurnKey, cancelEditing, changeEditingText, editMessage, editing, forkFrom, forkingEntryId, isDark, startEditing]);
  const keyExtractor = useCallback((item: ListItem) => item.key, []);
  const listHeader = <div className="flex min-h-7 items-center justify-center">
      {session.isLoadingOlderMessages ? <div className="flex items-center justify-center py-2">
          <span className="size-4 animate-spin rounded-full border-2 border-border border-t-text-tertiary" />
        </div> : session.hasMoreMessages ? <button onClick={handleLoadMore} role="button" aria-label="Load earlier messages" className="flex items-center justify-center px-4 py-2.5 text-xs font-medium text-text-tertiary hover:text-foreground">
          Load earlier messages
        </button> : null}
    </div>;
  return <div className="relative flex min-h-0 flex-1 flex-col">
      <VirtualList<ListItem> ref={listRef} data={items} renderItem={renderItem} keyExtractor={keyExtractor} className="min-h-0 flex-1 overflow-y-auto" onScroll={handleScroll} onLayout={alignToLatest} ListHeaderComponent={listHeader} />
      {showScrollButton && <div className="absolute bottom-3 left-1/2 z-30 -translate-x-1/2">
          <button onClick={scrollToBottom} aria-label="Scroll to latest" className="flex size-9 items-center justify-center rounded-full border border-border bg-surface-raised shadow-md">
            <ArrowDown size={16} color={colors.icon} strokeWidth={2} />
          </button>
        </div>}
      {actionError && <button onClick={clearActionError} className="absolute bottom-3 left-4 right-4 z-30 rounded-lg border border-destructive bg-surface-raised px-2.5 py-2 text-left">
          <span className="text-xs leading-[18px] text-destructive">{actionError}</span>
        </button>}
    </div>;
}
