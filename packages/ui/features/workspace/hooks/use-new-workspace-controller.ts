import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, TextInput, type NativeSyntheticEvent, type TextInputKeyPressEventData } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, WorkspaceColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useWorkspaceStore } from "../store";
import { sdk, unwrapApiData, type PathCompletion } from "@aijee/client-sdk";

const { complete } = sdk;

export function useNewWorkspaceController({ visible, onClose }: { visible: boolean; onClose: () => void }) {
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


  return {
    visible, onClose, isDark, colors, isWideScreen, insets, useInlineSuggestions, path, name, nameEdited, showSuggestions, suggestionIndex, suggestions, loadingSuggestions,
    pathRef, nameRef, suggestionsRef, fetchCompletions, setShowSuggestions, handleSuggestionScrollFailure, handlePathChange, handleSelectSuggestion, handleNameChange, dismissSuggestions, handleCreate, handlePathKeyPress, handleNameKeyPress,
    canCreate, pathPreview, textPrimary, textMuted, inputBg, inputBorder, suggestionHover, selectedBg, popoverBg,
  };
}

export type NewWorkspaceController = ReturnType<typeof useNewWorkspaceController>;
