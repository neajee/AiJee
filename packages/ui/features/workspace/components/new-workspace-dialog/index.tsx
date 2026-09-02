import { useState, useRef, useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';
import { Folder, File } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, WorkspaceColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useResponsiveLayout } from '@/features/navigation/hooks/use-responsive-layout';
import { useWorkspaceStore } from '../../store';
import { sdk, unwrapApiData } from '@aijee/client-sdk';
import type { PathCompletion } from '@aijee/client-sdk';
const { complete } = sdk;

interface NewWorkspaceDialogProps {
  visible: boolean;
  onClose: () => void;
}

export function NewWorkspaceDialog({ visible, onClose }: NewWorkspaceDialogProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { isWideScreen } = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const useInlineSuggestions = !isWideScreen;

  const addWorkspace = useWorkspaceStore((s) => s.addWorkspace);
  const workspaceCount = useWorkspaceStore((s) => s.workspaces.length);

  const [path, setPath] = useState('');
  const [name, setName] = useState('');
  const [nameEdited, setNameEdited] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<PathCompletion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const pathRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);
  const suggestionsRef = useRef<FlatList<PathCompletion>>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const textPrimary = isDark ? '#fefdfd' : colors.text;
  const textMuted = isDark ? '#cdc8c5' : colors.textTertiary;
  const inputBg = isDark ? '#1a1a1a' : '#F6F6F6';
  const inputBorder = isDark ? '#3b3a39' : 'rgba(0,0,0,0.12)';
  const suggestionHover = isDark ? '#333' : '#E0E0E0';
  const selectedBg = isDark ? '#2a2a2a' : '#E8E8E8';
  const popoverBg = isDark ? '#252525' : '#FFFFFF';

  // Reset state on open
  useEffect(() => {
    if (visible) {
      setPath('');
      setName('');
      setNameEdited(false);
      setShowSuggestions(false);
      setSuggestionIndex(-1);
      setSuggestions([]);
      setTimeout(() => pathRef.current?.focus(), 100);
    }
  }, [visible]);

  // Fetch completions from API
  const fetchCompletions = useCallback(async (query: string) => {
    if (!query) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const result = await complete({ query: { q: query } });
      const rawSuggestions = unwrapApiData(result.data);
      if (rawSuggestions) {
        setSuggestions(rawSuggestions);
      } else {
        setSuggestions([]);
      }
    } catch {
      setSuggestions([]);
    }
    setLoadingSuggestions(false);
  }, []);

  // Scroll suggestion into view
  useEffect(() => {
    if (!useInlineSuggestions && suggestionIndex >= 0 && suggestionsRef.current) {
      suggestionsRef.current.scrollToIndex({
        animated: true,
        index: suggestionIndex,
        viewPosition: 0.5,
      });
    }
  }, [suggestionIndex, useInlineSuggestions]);

  const handleSuggestionScrollFailure = useCallback(
    ({ index }: { index: number }) => {
      requestAnimationFrame(() => {
        suggestionsRef.current?.scrollToOffset({
          animated: true,
          offset: Math.max(0, index * 40 - 80),
        });
      });
    },
    [],
  );

  // Extract folder name from path
  const extractName = useCallback((p: string) => {
    const trimmed = p.replace(/\/+$/, '');
    const parts = trimmed.split('/');
    const last = parts[parts.length - 1] || '';
    return last
      .split(/[-_]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }, []);

  const handlePathChange = useCallback((value: string) => {
    setPath(value);
    setSuggestionIndex(-1);
    if (!nameEdited) {
      setName(extractName(value));
    }

    // Debounce API call
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length > 0) {
      setShowSuggestions(true);
      debounceRef.current = setTimeout(() => {
        fetchCompletions(value);
      }, 200);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [nameEdited, extractName, fetchCompletions]);

  const handleSelectSuggestion = useCallback((suggestion: PathCompletion) => {
    if (suggestion.is_dir) {
      // If it's a directory, set the path and fetch its children
      const newPath = suggestion.path.endsWith('/') ? suggestion.path : suggestion.path + '/';
      setPath(newPath);
      setSuggestionIndex(-1);
      if (!nameEdited) {
        setName(extractName(suggestion.path));
      }
      fetchCompletions(newPath);
    } else {
      setPath(suggestion.path);
      setShowSuggestions(false);
      setSuggestionIndex(-1);
      if (!nameEdited) {
        setName(extractName(suggestion.path));
      }
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [nameEdited, extractName, fetchCompletions]);

  const handleNameChange = useCallback((value: string) => {
    setName(value);
    setNameEdited(true);
  }, []);

  const dismissSuggestions = useCallback(() => {
    setShowSuggestions(false);
    setSuggestionIndex(-1);
  }, []);

  const handleCreate = useCallback(() => {
    if (!path.trim()) return;
    const title = name.trim() || extractName(path);
    addWorkspace({
      title,
      path: path.trim(),
      color: WorkspaceColors[workspaceCount % WorkspaceColors.length],
    });
    onClose();
  }, [path, name, extractName, addWorkspace, workspaceCount, onClose]);

  // Keyboard navigation for path suggestions
  const handlePathKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      const key = e.nativeEvent.key;
      if (!showSuggestions || suggestions.length === 0) {
        if (key === 'Enter' && !showSuggestions) {
          e.preventDefault?.();
          nameRef.current?.focus();
        }
        return;
      }

      if (key === 'ArrowDown') {
        e.preventDefault?.();
        setSuggestionIndex((prev) => (prev >= suggestions.length - 1 ? 0 : prev + 1));
      } else if (key === 'ArrowUp') {
        e.preventDefault?.();
        setSuggestionIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
      } else if (key === 'Enter' || key === 'Tab') {
        if (suggestionIndex >= 0 && suggestionIndex < suggestions.length) {
          e.preventDefault?.();
          handleSelectSuggestion(suggestions[suggestionIndex]);
        } else if (key === 'Enter') {
          e.preventDefault?.();
          setShowSuggestions(false);
          nameRef.current?.focus();
        }
      } else if (key === 'Escape') {
        e.preventDefault?.();
        setShowSuggestions(false);
        setSuggestionIndex(-1);
      }
    },
    [showSuggestions, suggestions, suggestionIndex, handleSelectSuggestion]
  );

  // Enter on name field triggers create
  const handleNameKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (e.nativeEvent.key === 'Enter' && path.trim()) {
        e.preventDefault?.();
        handleCreate();
      }
    },
    [path, handleCreate]
  );

  const canCreate = path.trim().length > 0;
  const pathPreview = path.trim().replace(/\/+$/, '') || path.trim();

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
              <FlatList
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

const styles = StyleSheet.create({
  // Desktop dialog
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 560,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    boxShadow: '0px 12px 32px rgba(0, 0, 0, 0.24)',
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerCopy: { gap: 3 },
  title: {
    fontSize: 16,
    fontFamily: Fonts.sansSemiBold,
  },
  subtitle: { fontSize: 12, fontFamily: Fonts.sans },

  // Shared form
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 38,
    borderRadius: 7,
    borderWidth: 0.633,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.sans,
    outlineStyle: 'none',
  } as any,
  pathPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  pathPreviewLabel: { fontSize: 11, fontFamily: Fonts.sansMedium },
  pathPreviewValue: { flex: 1, fontSize: 11, fontFamily: Fonts.mono },
  nameInput: {
    paddingLeft: 0,
  },
  hint: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    marginTop: 4,
    paddingLeft: 2,
  },


  // Suggestions popover
  suggestionsPopover: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 0.633,
    overflow: 'hidden',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.12)',
    elevation: 8,
    zIndex: 20,
  },
  inlineSuggestionsPopover: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 0.633,
    overflow: 'hidden',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.12)',
    elevation: 8,
  },
  suggestionsScroll: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  suggestionText: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    flex: 1,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  cancelButton: {
    height: 32,
    paddingHorizontal: 13,
    borderRadius: 7,
    borderWidth: 0.633,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
  },
  createButton: {
    height: 32,
    paddingHorizontal: 13,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createText: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
  },

  // Mobile bottom sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    overflow: 'visible',
  },
  sheetHandle: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  sheetHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  sheetTitle: {
    fontSize: 17,
    fontFamily: Fonts.sansSemiBold,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sheetBody: {
    maxHeight: 360,
  },
  sheetBodyContent: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
});
