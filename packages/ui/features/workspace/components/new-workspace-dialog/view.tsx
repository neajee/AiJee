import { ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { File, Folder } from "lucide-react-native";
import type { PathCompletion } from "@aijee/client-sdk";
import type { NewWorkspaceController } from "../../hooks/use-new-workspace-controller";
import { styles } from "../../utils/new-workspace-dialog-styles";

export function NewWorkspaceDialogView({ controller }: { controller: NewWorkspaceController }) {
  const {
    visible, onClose, isDark, colors, isWideScreen, insets, useInlineSuggestions, path, name, nameEdited, showSuggestions, suggestionIndex, suggestions, loadingSuggestions,
    pathRef, nameRef, suggestionsRef, fetchCompletions, setShowSuggestions, handleSuggestionScrollFailure, handlePathChange, handleSelectSuggestion, handleNameChange, dismissSuggestions, handleCreate, handlePathKeyPress, handleNameKeyPress,
    canCreate, pathPreview, textPrimary, textMuted, inputBg, inputBorder, suggestionHover, selectedBg, popoverBg,
  } = controller;
  const formContent = (
    <>
      {/* Path input */}
      <View style={[styles.field, { zIndex: 10 }]}>
        <Text style={[styles.label, { color: textMuted }]}>项目路径</Text>
        <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: inputBorder }]}>
          <Folder size={16} color={textMuted} strokeWidth={1.8} />
          <TextInput
            ref={pathRef}
            style={[styles.input, { color: textPrimary }]}
            value={path}
            onChangeText={handlePathChange}
            onKeyPress={handlePathKeyPress}
            placeholder="例如：~/work/my-project"
            placeholderTextColor={textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            onFocus={() => {
              if (path.length > 0) {
                setShowSuggestions(true);
                fetchCompletions(path);
              }
            }}
            onBlur={useInlineSuggestions ? () => {
              setTimeout(dismissSuggestions, 200);
            } : undefined}
          />
          {loadingSuggestions && (
            <ActivityIndicator size="small" color={textMuted} />
          )}
        </View>

        {pathPreview && !showSuggestions ? (
          <View style={styles.pathPreview}>
            <Text style={[styles.pathPreviewLabel, { color: textMuted }]}>位置</Text>
            <Text style={[styles.pathPreviewValue, { color: textPrimary }]} numberOfLines={1}>
              {pathPreview}
            </Text>
          </View>
        ) : null}

        {/* Path suggestions popover */}
        {showSuggestions && suggestions.length > 0 && (
          <View
            style={[
              useInlineSuggestions
                ? styles.inlineSuggestionsPopover
                : styles.suggestionsPopover,
              {
                backgroundColor: popoverBg,
                borderColor: inputBorder,
              },
            ]}
          >
            {useInlineSuggestions ? (
              <View>
                {suggestions.map((item, index) => (
                  <Pressable
                    key={item.path}
                    onPress={() => handleSelectSuggestion(item)}
                    style={({ pressed, hovered }: any) => [
                      styles.suggestionItem,
                      index === suggestionIndex && { backgroundColor: selectedBg },
                      (pressed || hovered) && index !== suggestionIndex && { backgroundColor: suggestionHover },
                    ]}
                  >
                    {item.is_dir ? (
                      <Folder size={14} color={textMuted} strokeWidth={1.8} />
                    ) : (
                      <File size={14} color={textMuted} strokeWidth={1.8} />
                    )}
                    <Text style={[styles.suggestionText, { color: textPrimary }]} numberOfLines={1}>
                      {item.path}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <FlatList<PathCompletion>
                ref={suggestionsRef}
                data={suggestions}
                keyExtractor={(item) => item.path}
                style={styles.suggestionsScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                scrollEnabled={suggestions.length > 4}
                getItemLayout={(_data, index) => ({
                  length: 40,
                  offset: 40 * index,
                  index,
                })}
                onScrollToIndexFailed={handleSuggestionScrollFailure}
                renderItem={({ item, index }) => (
                  <Pressable
                    onPress={() => handleSelectSuggestion(item)}
                    style={({ pressed, hovered }: any) => [
                      styles.suggestionItem,
                      index === suggestionIndex && { backgroundColor: selectedBg },
                      (pressed || hovered) && index !== suggestionIndex && { backgroundColor: suggestionHover },
                    ]}
                  >
                    {item.is_dir ? (
                      <Folder size={14} color={textMuted} strokeWidth={1.8} />
                    ) : (
                      <File size={14} color={textMuted} strokeWidth={1.8} />
                    )}
                    <Text style={[styles.suggestionText, { color: textPrimary }]} numberOfLines={1}>
                      {item.path}
                    </Text>
                  </Pressable>
                )}
              />
            )}
          </View>
        )}
      </View>

      {/* Name input */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: textMuted }]}>项目名称</Text>
        <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: inputBorder }]}>
          <TextInput
            ref={nameRef}
            style={[styles.input, styles.nameInput, { color: textPrimary }]}
            value={name}
            onChangeText={handleNameChange}
            onKeyPress={handleNameKeyPress}
            placeholder="例如：My Project"
            placeholderTextColor={textMuted}
          />
        </View>
        {!nameEdited && name.length > 0 && (
          <Text style={[styles.hint, { color: textMuted }]}>
            已根据路径自动生成
          </Text>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [
            styles.cancelButton,
            { borderColor: inputBorder },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={[styles.cancelText, { color: textPrimary }]}>取消</Text>
        </Pressable>
        <Pressable
          onPress={handleCreate}
          disabled={!canCreate}
          style={({ pressed }) => [
            styles.createButton,
            { backgroundColor: canCreate ? (isDark ? '#fefdfd' : colors.text) : (isDark ? '#333' : '#CCC') },
            pressed && canCreate && { opacity: 0.8 },
          ]}
        >
          <Text style={[styles.createText, { color: canCreate ? (isDark ? '#121212' : '#FFFFFF') : textMuted }]}>
            添加项目
          </Text>
        </Pressable>
      </View>
    </>
  );

  // Mobile: bottom sheet
  if (!isWideScreen) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.sheetOverlay} onPress={onClose}>
            <Pressable
              style={[
                styles.sheetContainer,
                {
                  backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF',
                  paddingBottom: insets.bottom + 20,
                },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.sheetHandle}>
                <View style={[styles.sheetHandleBar, { backgroundColor: isDark ? '#555' : '#CCC' }]} />
              </View>
              <Text style={[styles.sheetTitle, { color: textPrimary }]}>新建项目</Text>
              <ScrollView
                style={styles.sheetBody}
                contentContainerStyle={styles.sheetBodyContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {formContent}
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  // Desktop: centered dialog
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.dialog, { backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF', borderColor: inputBorder }]}
          onPress={(e) => e.stopPropagation()}
        >
          {showSuggestions && (
            <Pressable
              style={[StyleSheet.absoluteFill, { zIndex: 5 }]}
              onPress={dismissSuggestions}
            />
          )}
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={[styles.title, { color: textPrimary }]}>新建项目</Text>
              <Text style={[styles.subtitle, { color: textMuted }]}>添加本地目录，随时切换</Text>
            </View>
          </View>
          {formContent}
        </Pressable>
      </Pressable>
    </Modal>
  );

}
