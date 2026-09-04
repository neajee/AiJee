import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, NativeSyntheticEvent, Platform, TextInput, TextInputKeyPressEventData,
  type ScrollView as RNScrollView,
  type View as RNView,
} from 'react-native';

import { buildThinkingLevelOptions, thinkingLevelLabel, type FlatModel, type ThinkingPreference } from '../utils/prompt-input';
import { matchesModelSearch } from '../utils/prompt-input-search';
import { usePromptTheme } from '@/components/surface-theme/use-prompt-theme';
import { useAppMode } from '@/hooks/use-app-mode';
import type { AgentMode } from '@/features/agent/mode';
import type { ToolbarController, ToolbarProps, DropdownType, EffortOption } from '../components/prompt-input/toolbar/types';
import {
  TOOLBAR_CONTROL_HEIGHT,
} from '../utils/toolbar-styles';

const SHOW_TASK_SELECTOR = false;
const SHOW_MODE_TOGGLE = false;

export function useToolbarController({
  sessionId,
  isWideScreen,
  onOpenMobileSheet,
  onDropdownOpenChange,
  inputRef,
  skeleton = null,
  modeLabel = null,
  ready = true,
  config,
  inline = false,
  thinkingPreference = 'auto',
  onThinkingPreferenceChange,
}: ToolbarProps): ToolbarController {
  const theme = usePromptTheme();
  const appMode = useAppMode();
  const modelScrollRef = useRef<RNScrollView | null>(null);
  const modelSearchRef = useRef<TextInput | null>(null);
  const toolbarRef = useRef<RNView | null>(null);
  const models = config.models;
  const agentState = config.state;
  const configError = config.error;
  const configRetry = config.retry;
  const hasModels = !!models && models.length > 0;
  const toolbarDisabled = !ready;
  const controlHeight = inline ? 32 : TOOLBAR_CONTROL_HEIGHT;
  const currentModel = config.activeModel ?? agentState?.model ?? models?.[0] ?? null;
  const currentThinking = agentState?.thinkingLevel ?? 'medium';
  const currentMode: AgentMode =
    agentState?.mode === 'plan'
      ? 'plan'
      : (modeLabel?.trim().toLowerCase() === 'plan' ? 'plan' : 'work');
  const thinkingOptions = useMemo(
    () => buildThinkingLevelOptions(config.availableThinkingLevels),
    [config.availableThinkingLevels],
  );
  const thinkingDisabled = !config.supportsThinking;
  const thinkingLabel = thinkingPreference === 'auto' ? 'Auto' : thinkingLevelLabel(currentThinking);
  const effortOptions = useMemo<EffortOption[]>(
    () => [{ level: 'auto', label: 'Auto', description: '' }, ...thinkingOptions],
    [thinkingOptions],
  );
  const [pendingMode, setPendingMode] = useState<AgentMode | null>(null);
  const displayedMode = pendingMode ?? currentMode;
  const [activeDropdown, setActiveDropdown] = useState<DropdownType>(null);
  const [popoverIndex, setPopoverIndex] = useState(0);
  const [modelSearch, setModelSearch] = useState('');
  const toolbarDropdownAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(toolbarDropdownAnim, {
      toValue: activeDropdown ? 1 : 0,
      tension: 300,
      friction: 26,
      useNativeDriver: true,
    }).start();
  }, [activeDropdown, toolbarDropdownAnim]);

  useEffect(() => {
    onDropdownOpenChange?.(activeDropdown !== null);
    return () => onDropdownOpenChange?.(false);
  }, [activeDropdown, onDropdownOpenChange]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !activeDropdown) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const element = toolbarRef.current as unknown as { contains?: (node: EventTarget | null) => boolean } | null;
      if (!element?.contains?.(event.target)) setActiveDropdown(null);
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer, true);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer, true);
  }, [activeDropdown]);

  useEffect(() => setPendingMode(null), [sessionId]);

  useEffect(() => {
    if (pendingMode && currentMode === pendingMode) setPendingMode(null);
  }, [currentMode, pendingMode]);

  useEffect(() => {
    if (!pendingMode) return;
    const timeoutId = setTimeout(() => setPendingMode(null), 4000);
    return () => clearTimeout(timeoutId);
  }, [pendingMode]);

  const providers = useMemo(() => {
    if (!models) return [];
    const grouped = new Map<string, typeof models>();
    const order: string[] = [];
    for (const model of models) {
      const provider = model.provider ?? 'unknown';
      const name = model.name ?? model.id;
      const searchable = { ...model, name, provider };
      if (!matchesModelSearch(modelSearch, searchable)) continue;
      if (!grouped.has(provider)) {
        grouped.set(provider, []);
        order.push(provider);
      }
      grouped.get(provider)!.push({ ...model, name, provider });
    }
    return order.map((name) => ({ name, models: grouped.get(name)! }));
  }, [models, modelSearch]);

  const flatModels = useMemo<FlatModel[]>(() =>
    providers.flatMap((provider) => provider.models.map((model) => ({
      provider: model.provider ?? 'unknown',
      modelId: model.id,
      modelName: model.name ?? model.id,
    }))), [providers]);

  useEffect(() => {
    if (activeDropdown === 'model' && modelScrollRef.current) {
      modelScrollRef.current.scrollTo({
        y: Math.max(0, popoverIndex * 34 - 60),
        animated: true,
      });
    }
  }, [popoverIndex, activeDropdown]);

  const handleSelectModel = useCallback((provider: string, modelId: string) => {
    config.setModel({ provider, modelId });
    setActiveDropdown(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [config, inputRef]);

  const handleSelectThinking = useCallback((level: ThinkingPreference) => {
    onThinkingPreferenceChange?.(level);
    if (level !== 'auto') config.setThinkingLevel(level);
    setActiveDropdown(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [config, inputRef, onThinkingPreferenceChange]);

  const handleSelectMode = useCallback((mode: AgentMode) => {
    if (mode === currentMode) {
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }
    setPendingMode(mode);
    config.setMode(mode).catch(() => setPendingMode(null));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [currentMode, inputRef, config]);

  const toggleDropdown = useCallback((type: DropdownType) => {
    setActiveDropdown((prev) => {
      if (prev === type) {
        setTimeout(() => inputRef.current?.focus(), 0);
        return null;
      }
      setModelSearch('');
      if (type === 'model') {
        const index = flatModels.findIndex(
          (model) => model.modelId === currentModel?.id && model.provider === currentModel?.provider,
        );
        setPopoverIndex(index >= 0 ? index : 0);
        setTimeout(() => modelSearchRef.current?.focus(), 50);
      } else if (type === 'effort') {
        const index = effortOptions.findIndex((item) => item.level === thinkingPreference);
        setPopoverIndex(index >= 0 ? index : 0);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      return type;
    });
  }, [flatModels, currentModel, effortOptions, thinkingPreference, inputRef]);

  const handleSearchKeyPress = useCallback((event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    const key = event.nativeEvent.key;
    const maxIndex = flatModels.length - 1;
    if (key === 'ArrowDown') {
      event.preventDefault?.();
      setPopoverIndex((index) => (index >= maxIndex ? 0 : index + 1));
    } else if (key === 'ArrowUp') {
      event.preventDefault?.();
      setPopoverIndex((index) => (index <= 0 ? maxIndex : index - 1));
    } else if (key === 'PageDown') {
      event.preventDefault?.();
      setPopoverIndex((index) => Math.min(maxIndex, index + 5));
    } else if (key === 'PageUp') {
      event.preventDefault?.();
      setPopoverIndex((index) => Math.max(0, index - 5));
    } else if (key === 'Home') {
      event.preventDefault?.();
      setPopoverIndex(0);
    } else if (key === 'End') {
      event.preventDefault?.();
      setPopoverIndex(maxIndex);
    } else if (key === 'Enter' || key === 'Tab') {
      event.preventDefault?.();
      const item = flatModels[popoverIndex];
      if (item) handleSelectModel(item.provider, item.modelId);
    } else if (key === 'Escape') {
      setActiveDropdown(null);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [flatModels, popoverIndex, handleSelectModel, inputRef]);

  return {
    theme,
    appMode,
    config,
    skeleton,
    isWideScreen,
    onOpenMobileSheet,
    onDropdownOpenChange,
    inputRef,
    inline,
    ready,
    currentModel,
    agentState,
    hasModels,
    toolbarDisabled,
    controlHeight,
    thinkingDisabled,
    thinkingLabel,
    thinkingPreference,
    effortOptions,
    providers,
    flatModels,
    activeDropdown,
    modelSearch,
    setModelSearch,
    popoverIndex,
    setPopoverIndex,
    toolbarDropdownAnim,
    toolbarRef,
    modelScrollRef,
    modelSearchRef,
    toggleDropdown,
    handleSelectModel,
    handleSelectThinking,
    handleSearchKeyPress,
    displayedMode,
    pendingMode,
    handleSelectMode,
    configError,
    configRetry,
    showTaskSelector: SHOW_TASK_SELECTOR,
    showModeToggle: SHOW_MODE_TOGGLE,
  };
}
