import { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
  type ListRenderItemInfo,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { ArrowDown } from "lucide-react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import type { ChatMessage } from "../../types";
import { ListRow } from "./list-row";
import type { ListItem } from "../../utils/turns";
import { styles } from "./styles";
import { INITIAL_RENDER_COUNT, RENDER_BATCH_COUNT, WINDOW_SIZE } from "../../utils/message-list-constants";
import type { MessageListController } from "../../hooks/use-message-list-controller";

export function MessageListView({ controller }: { controller: MessageListController }) {
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
    scrollToBottom,
  } = controller;

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ListItem>) => (
      <ListRow
        item={item}
        isDark={isDark}
        active={item.key === activeTurnKey}
        editing={editing}
        onEdit={startEditing}
        onChangeEdit={changeEditingText}
        onCancelEdit={cancelEditing}
        onSubmitEdit={() => void editMessage()}
        onFork={(entryId) => void forkFrom(entryId)}
        forkingEntryId={forkingEntryId}
      />
    ),
    [activeTurnKey, cancelEditing, changeEditingText, editMessage, editing, forkFrom, forkingEntryId, isDark, startEditing],
  );
  const keyExtractor = useCallback((item: ListItem) => item.key, []);
  const listHeader = (
    <View style={styles.historyLoaderWrap}>
      {session.isLoadingOlderMessages ? (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(180)} style={styles.historyLoader}>
          <ActivityIndicator size="small" color={colors.textTertiary} />
        </Animated.View>
      ) : session.hasMoreMessages ? (
        <Pressable onPress={handleLoadMore} accessibilityRole="button" accessibilityLabel="Load earlier messages" style={styles.loadMoreBtn}>
          <Text style={[styles.loadMoreText, { color: colors.textTertiary }]}>Load earlier messages</Text>
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
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleScrollEndDrag}
        scrollEventThrottle={16}
        initialNumToRender={INITIAL_RENDER_COUNT}
        maxToRenderPerBatch={RENDER_BATCH_COUNT}
        updateCellsBatchingPeriod={50}
        windowSize={WINDOW_SIZE}
        removeClippedSubviews={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        maintainVisibleContentPosition={historyAnchor ? { minIndexForVisible: 0 } : undefined}
        ListHeaderComponent={listHeader}
      />
      {showScrollButton && (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} style={styles.scrollBtnWrap}>
          <Pressable onPress={scrollToBottom} style={[styles.scrollBtn, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
            <ArrowDown size={16} color={colors.icon} strokeWidth={2} />
          </Pressable>
        </Animated.View>
      )}
      {actionError && (
        <Pressable onPress={clearActionError} style={[styles.actionError, { backgroundColor: colors.surfaceRaised, borderColor: colors.destructive }]}>
          <Text style={[styles.actionErrorText, { color: colors.destructive }]}>{actionError}</Text>
        </Pressable>
      )}
    </View>
  );
}
