import { memo, useRef, useEffect, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
import { ChevronDown, Check, RotateCw } from 'lucide-react-native';

import { Fonts } from '@/constants/theme';
import { buildThinkingLevelOptions, thinkingLevelLabel, FlatModel, ThinkingLevel, ThinkingPreference } from './constants';
import { matchesModelSearch } from './model-search';
import { usePromptTheme } from './use-theme-colors';
import { ProviderIcon } from './provider-icons';
import type { AgentConfigHandle } from '@aijee/client-sdk';
import type { AgentMode } from '@/features/agent/mode';
import { formatAgentModeLabel } from '@/features/agent/mode';
import { useAppMode } from '@/hooks/use-app-mode';
import { TaskSelector } from '@/features/tasks/components/task-selector';

interface ToolbarProps {
  sessionId?: string | null;
  isWideScreen: boolean;
  /** Narrow viewports get the model + thinking sheet instead of a popover. */
  /** Narrow viewports get a sheet matching the control that was pressed. */
  onOpenMobileSheet: (type: 'model' | 'effort') => void;
  onDropdownOpenChange?: (isOpen: boolean) => void;
  inputRef: React.RefObject<TextInput | null>;
  skeleton?: React.ReactNode;
  modeLabel?: string | null;
  ready?: boolean;
  config: AgentConfigHandle;
  /**
   * Renders as a bare control group for placing inside the input card's action
   * row, instead of the bordered strip that hangs below the card.
   */
  inline?: boolean;
  thinkingPreference?: ThinkingPreference;
  onThinkingPreferenceChange?: (level: ThinkingPreference) => void;
}

/**
 * Two independent controls, not one.
 *
 * The model and its thinking level are separate decisions that happen to sit
 * beside each other: picking a model is a choice of provider, picking a level
 * is a choice of how hard to think. Each opens its own popover so they are
 * never misread as one setting.
 */
type DropdownType = null | 'model' | 'effort';

export const TOOLBAR_WRAP_OFFSET = 10;
export const TOOLBAR_HORIZONTAL_MARGIN = 6;
export const TOOLBAR_BORDER_WIDTH = 0.633;
export const TOOLBAR_CORNER_RADIUS = 12;
export const TOOLBAR_VERTICAL_PADDING = Platform.OS === 'web' ? 7 : 9;
export const TOOLBAR_CONTROL_HEIGHT = Platform.OS === 'web' ? 26 : 30;
export const TOOLBAR_ANDROID_MARGIN_TOP = Platform.OS === 'android' ? -4 : 0;
export const TOOLBAR_MODE_TOGGLE_HEIGHT = TOOLBAR_CONTROL_HEIGHT + 2 + 2 * TOOLBAR_BORDER_WIDTH;

/**
 * Temporarily hidden: the task runner and the work/plan switch are parked while
 * the composer settles on one row. The logic stays wired up so flipping these
 * back on is a one-line change.
 */
const SHOW_TASK_SELECTOR = false;
const SHOW_MODE_TOGGLE = false;

function ToolbarComponent({
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
}: ToolbarProps) {
  const theme = usePromptTheme();
  const appMode = useAppMode();
  const modelScrollRef = useRef<ScrollView>(null);
  const modelSearchRef = useRef<TextInput>(null);
  const toolbarRef = useRef<View>(null);

  // config is passed in from PromptInput (shared instance)
  const models = config.models;
  const agentState = config.state;
  const configError = config.error;
  const configRetry = config.retry;
  // A remembered snapshot is enough to draw the toolbar: the model name on the
  // trigger comes from the state, not the list, so the list may still be in
  // flight. `models === null` means it has never been seen, cached or live.
  const hasModels = !!models && models.length > 0;
  const toolbarDisabled = !ready;
  // Inline the control shares the action row with 32px round buttons, so its
  // triggers match their height. The standalone strip keeps its own.
  const controlHeight = inline ? 32 : TOOLBAR_CONTROL_HEIGHT;

  const currentModel = agentState?.model ?? models?.[0] ?? null;
  const currentThinking = agentState?.thinkingLevel ?? 'medium';
  const currentMode: AgentMode =
    agentState?.mode === 'plan'
      ? 'plan'
      : (modeLabel?.trim().toLowerCase() === 'plan' ? 'plan' : 'work');

  // Levels are model-dependent: only offer what the agent will accept.
  const thinkingOptions = useMemo(
    () => buildThinkingLevelOptions(config.availableThinkingLevels),
    [config.availableThinkingLevels],
  );
  // A model without extended thinking has nothing to choose from.
  const thinkingDisabled = !config.supportsThinking;
  const thinkingLabel = thinkingPreference === 'auto' ? 'Auto' : thinkingLevelLabel(currentThinking);
  const effortOptions = useMemo(() => [{ level: 'auto' as const, label: 'Auto', description: '' }, ...thinkingOptions], [thinkingOptions]);
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

  useEffect(() => {
    setPendingMode(null);
  }, [sessionId]);

  useEffect(() => {
    if (pendingMode && currentMode === pendingMode) {
      setPendingMode(null);
    }
  }, [currentMode, pendingMode]);

  useEffect(() => {
    if (!pendingMode) return;
    const timeoutId = setTimeout(() => setPendingMode(null), 4000);
    return () => clearTimeout(timeoutId);
  }, [pendingMode]);

  const providers = useMemo(() => {
    if (!models) return [];
    const grouped = new Map<string, Array<{ id: string; name?: string; provider?: string; reasoning?: boolean }>>(); 
    const order: string[] = [];
    for (const m of models) {
      const provider = m.provider ?? "unknown";
      const name = m.name ?? m.id;
      const searchable = { ...m, name, provider };
      if (!matchesModelSearch(modelSearch, searchable)) continue;
      if (!grouped.has(provider)) {
        grouped.set(provider, []);
        order.push(provider);
      }
      grouped.get(provider)!.push({ ...m, name, provider });
    }
    return order.map((p) => ({ name: p, models: grouped.get(p)! }));
  }, [models, modelSearch]);

  const flatModels = useMemo<FlatModel[]>(() => {
    const list: FlatModel[] = [];
    for (const p of providers) {
      for (const m of p.models) {
        list.push({ provider: m.provider ?? "unknown", modelId: m.id, modelName: m.name ?? m.id });
      }
    }
    return list;
  }, [providers]);

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

  // Choosing a level closes its own popover, as choosing a model closes its.
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

  const toggleDropdown = useCallback(
    (type: DropdownType) => {
      setActiveDropdown((prev) => {
        if (prev === type) {
          setTimeout(() => inputRef.current?.focus(), 0);
          return null;
        }
        setModelSearch('');
        if (type === 'model') {
          const idx = flatModels.findIndex(
            (m) => m.modelId === currentModel?.id && m.provider === currentModel?.provider
          );
          setPopoverIndex(idx >= 0 ? idx : 0);
          setTimeout(() => modelSearchRef.current?.focus(), 50);
        } else if (type === 'effort') {
          const idx = effortOptions.findIndex((e) => e.level === thinkingPreference);
          setPopoverIndex(idx >= 0 ? idx : 0);
          setTimeout(() => inputRef.current?.focus(), 0);
        }
        return type;
      });
    },
    [flatModels, currentModel, effortOptions, thinkingPreference, inputRef]
  );

  const handleSearchKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      const key = e.nativeEvent.key;
      const maxIdx = flatModels.length - 1;
      if (key === 'ArrowDown') {
        e.preventDefault?.();
        setPopoverIndex((p) => (p >= maxIdx ? 0 : p + 1));
      } else if (key === 'ArrowUp') {
        e.preventDefault?.();
        setPopoverIndex((p) => (p <= 0 ? maxIdx : p - 1));
      } else if (key === 'PageDown') {
        e.preventDefault?.();
        setPopoverIndex((p) => Math.min(maxIdx, p + 5));
      } else if (key === 'PageUp') {
        e.preventDefault?.();
        setPopoverIndex((p) => Math.max(0, p - 5));
      } else if (key === 'Home') {
        e.preventDefault?.();
        setPopoverIndex(0);
      } else if (key === 'End') {
        e.preventDefault?.();
        setPopoverIndex(maxIdx);
      } else if (key === 'Enter' || key === 'Tab') {
        e.preventDefault?.();
        const item = flatModels[popoverIndex];
        if (item) handleSelectModel(item.provider, item.modelId);
      } else if (key === 'Escape') {
        setActiveDropdown(null);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    },
    [flatModels, popoverIndex, handleSelectModel, inputRef]
  );

  if (configError && !agentState) {
    return (
      <View style={inline ? styles.inlineWrap : styles.wrap}>
        <View
          style={[
            inline ? styles.inlineToolbar : styles.toolbar,
            styles.toolbarError,
            inline
              ? null
              : { backgroundColor: theme.toolbarBg, borderColor: theme.toolbarBorder },
          ]}
        >
          <Text style={[styles.errorText, { color: theme.textMuted }]} numberOfLines={1}>
            Failed to load
          </Text>
          <Pressable
            onPress={configRetry}
            accessibilityRole="button"
            accessibilityLabel="Retry loading toolbar"
            style={({ pressed }) => [styles.retryButton, pressed && { opacity: 0.7 }]}
          >
            <RotateCw size={12} color={theme.accentColor} strokeWidth={2} />
            <Text style={[styles.retryText, { color: theme.accentColor }]}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Nothing but the agent state is required to render. Waiting on `ready` or on
  // the model list used to keep the composer a skeleton for the whole several
  // seconds it takes to spawn the pi process.
  if (!agentState && !currentModel) {
    return <>{skeleton}</>;
  }

  return (
    <View ref={toolbarRef} style={[inline ? styles.inlineWrap : styles.wrap, activeDropdown && { zIndex: 10 }]}>
      <View
        style={[
          inline ? styles.inlineToolbar : styles.toolbar,
          inline
            ? null
            : { backgroundColor: theme.toolbarBg, borderColor: theme.toolbarBorder },
        ]}
      >
        {/* Model picker: its own control, its own popover. */}
        <View style={styles.popoverAnchor}>
          <Pressable
            onPress={() => (isWideScreen ? toggleDropdown('model') : onOpenMobileSheet('model'))}
            disabled={toolbarDisabled}
            accessibilityRole="button"
            accessibilityLabel={`Model: ${currentModel?.name ?? 'Loading'}. Press to change.`}
            accessibilityState={{ expanded: activeDropdown === 'model', disabled: toolbarDisabled }}
            style={({ pressed }) => [styles.button, { height: controlHeight }, (pressed || toolbarDisabled) && { opacity: 0.7 }]}
          >
            <ProviderIcon provider={currentModel?.provider ?? ''} size={14} color={theme.textMuted} />
            <Text style={[styles.buttonText, { color: theme.textSecondary }]} numberOfLines={1}>
              {currentModel?.name ?? '…'}
            </Text>
            <ChevronDown size={14} color={theme.textMuted} strokeWidth={1.8} />
          </Pressable>

          {isWideScreen && activeDropdown === 'model' && (
            <Animated.View
              accessibilityRole="menu"
              accessibilityLabel="Model selection"
              style={[
                styles.popover,
                // Inline the control sits on the right of the action row, so the
                // panel hangs from that edge instead of overflowing the window.
                inline ? { left: undefined, right: 0 } : null,
                {
                  backgroundColor: theme.dropdownBg,
                  borderColor: theme.dropdownBorder,
                  opacity: toolbarDropdownAnim,
                  transform: [
                    {
                      translateY: toolbarDropdownAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [4, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={[styles.searchWrap, { borderBottomColor: theme.dropdownBorder }]}>
                <TextInput
                  ref={modelSearchRef}
                  placeholder="Search models..."
                  placeholderTextColor={theme.textMuted}
                  style={[styles.searchInput, { color: theme.textPrimary }]}
                  value={modelSearch}
                  onChangeText={(v) => { setModelSearch(v); setPopoverIndex(0); }}
                  onKeyPress={handleSearchKeyPress}
                  accessibilityLabel="Search models"
                />
              </View>
              <ScrollView
                ref={modelScrollRef}
                style={styles.popoverScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {providers.length === 0 && (
                  <Text style={[styles.noResults, { color: theme.textMuted }]}>
                    {hasModels ? "No models found" : "Loading models…"}
                  </Text>
                )}
                {providers.map((provider) => (
                  <View key={provider.name} accessibilityRole="none">
                    <Text
                      style={[styles.providerHeader, { color: theme.sectionColor }]}
                      accessibilityRole="header"
                    >
                      {provider.name}
                    </Text>
                    {provider.models.map((model) => {
                      const flatIdx = flatModels.findIndex(
                        (m) => m.modelId === model.id && m.provider === model.provider
                      );
                      const isHighlighted = flatIdx === popoverIndex;
                      const isActive = model.id === currentModel?.id;
                      return (
                        <Pressable
                          key={model.id}
                          onPress={() => handleSelectModel(model.provider ?? "unknown", model.id)}
                          accessibilityRole="menuitem"
                          accessibilityLabel={`${model.name ?? model.id} by ${model.provider ?? "unknown"}`}
                          accessibilityState={{ selected: isActive }}
                          style={({ pressed, hovered }: any) => [
                            styles.modelItem,
                            isHighlighted && { backgroundColor: theme.selectedBg },
                            (pressed || hovered) && !isHighlighted && { backgroundColor: theme.hoverBg },
                          ]}
                        >
                          <View style={styles.modelRow}>
                            <ProviderIcon provider={model.provider ?? "unknown"} size={14} color={isActive ? theme.accentColor : theme.textMuted} />
                            <Text style={[styles.modelName, { color: isActive ? theme.accentColor : theme.textPrimary }]}>
                              {model.name}
                            </Text>
                          </View>
                          {isActive && <Check size={14} color={theme.accentColor} strokeWidth={2} />}
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </ScrollView>
            </Animated.View>
          )}
        </View>

        {/* Thinking level: a separate control, so it is a distinct choice. */}
        <View style={styles.popoverAnchor}>
          <Pressable
            onPress={() => (isWideScreen ? toggleDropdown('effort') : onOpenMobileSheet('effort'))}
            disabled={toolbarDisabled || thinkingDisabled}
            accessibilityRole="button"
            accessibilityLabel={
              thinkingDisabled
                ? `Thinking not supported by ${currentModel?.name ?? 'this model'}`
                : `Thinking: ${thinkingLabel}. Press to change.`
            }
            accessibilityState={{ expanded: activeDropdown === 'effort', disabled: toolbarDisabled || thinkingDisabled }}
            style={({ pressed }) => [
              styles.button,
              styles.effortButton,
              { height: controlHeight },
              (pressed || toolbarDisabled || thinkingDisabled) && { opacity: 0.7 },
            ]}
          >
            <Text style={[styles.buttonText, { color: theme.textSecondary }]}>
              {thinkingLabel}
            </Text>
            {!thinkingDisabled && (
              <ChevronDown size={14} color={theme.textMuted} strokeWidth={1.8} />
            )}
          </Pressable>

          {isWideScreen && activeDropdown === 'effort' && (
            <Animated.View
              accessibilityRole="menu"
              accessibilityLabel="Thinking level selection"
              style={[
                styles.popover,
                styles.effortPopover,
                // Inline the control sits on the right of the action row, so the
                // panel hangs from that edge instead of overflowing the window.
                inline ? { left: undefined, right: 0 } : null,
                {
                  backgroundColor: theme.dropdownBg,
                  borderColor: theme.dropdownBorder,
                  opacity: toolbarDropdownAnim,
                  transform: [
                    {
                      translateY: toolbarDropdownAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [4, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {effortOptions.map((item, index) => {
                const isHighlighted = index === popoverIndex;
                const isActive = item.level === thinkingPreference;
                return (
                  <Pressable
                    key={item.level}
                    onPress={() => handleSelectThinking(item.level)}
                    accessibilityRole="menuitem"
                    accessibilityLabel={
                      item.description ? `${item.label} — ${item.description}` : item.label
                    }
                    accessibilityState={{ selected: isActive }}
                    style={({ pressed, hovered }: any) => [
                      styles.effortItem,
                      isHighlighted && { backgroundColor: theme.selectedBg },
                      (pressed || hovered) && !isHighlighted && { backgroundColor: theme.hoverBg },
                    ]}
                  >
                    <View style={styles.effortRow}>
                      <Text style={[styles.effortLabel, { color: isActive ? theme.accentColor : theme.textPrimary }]}>
                        {item.label}
                      </Text>
                      {isActive && <Check size={14} color={theme.accentColor} strokeWidth={2} />}
                    </View>
                  </Pressable>
                );
              })}
            </Animated.View>
          )}
        </View>


        {/* Inline, the action row supplies the flexible gap; a spacer here would
            compete with it for the leftover width. */}
        {!inline && <View style={styles.spacer} />}
        {/* Running a task acts on this session, so it belongs beside the send
            controls rather than in the window bar. */}
        {SHOW_TASK_SELECTOR && appMode === 'code' && isWideScreen && (
          <View style={styles.taskSelector}>
            <TaskSelector placement="above" />
          </View>
        )}
        {SHOW_MODE_TOGGLE && appMode === 'code' && <View
          style={[
            styles.modeToggle,
            {
              backgroundColor: theme.isDark ? '#242422' : '#ECEBE7',
              borderColor: theme.toolbarBorder,
            },
          ]}
        >
          {(['work', 'plan'] as AgentMode[]).map((mode) => {
            const isActive = displayedMode === mode;
            const isPendingTarget = pendingMode === mode;
            return (
              <Pressable
                key={mode}
                accessibilityRole="button"
                  accessibilityLabel={
                    isPendingTarget
                      ? `Switching to ${formatAgentModeLabel(mode)} mode`
                      : `Switch to ${formatAgentModeLabel(mode)} mode`
                  }
                accessibilityState={{
                  selected: isActive,
                  disabled: toolbarDisabled || false,
                }}
                disabled={toolbarDisabled || false}
                onPress={() => handleSelectMode(mode)}
                style={({ pressed }) => [
                  styles.modeButton,
                  isActive && {
                    backgroundColor: theme.isDark ? '#343432' : '#FFFFFF',
                  },
                  pressed && !isActive && { opacity: 0.72 },
                ]}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    {
                      color: isActive ? theme.textPrimary : theme.textMuted,
                      opacity: isPendingTarget ? 0 : 1,
                    },
                  ]}
                >
                  {formatAgentModeLabel(mode)}
                </Text>
                {isPendingTarget && (
                  <ActivityIndicator
                    size="small"
                    color={isActive ? theme.textPrimary : theme.textMuted}
                    style={styles.modePendingIndicator}
                  />
                )}
              </Pressable>
            );
          })}
        </View>}
      </View>
    </View>
  );
}

export const Toolbar = memo(ToolbarComponent);

const styles = StyleSheet.create({
  wrap: {
    marginTop: -TOOLBAR_WRAP_OFFSET,
    paddingTop: TOOLBAR_WRAP_OFFSET,
    marginHorizontal: TOOLBAR_HORIZONTAL_MARGIN,
    overflow: 'visible',
  },
  /** Inline: no strip of its own, it is one item in the action row. */
  inlineWrap: {
    flexShrink: 1,
    minWidth: 0,
    marginLeft: 2,
    overflow: 'visible',
  },
  inlineToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: TOOLBAR_VERTICAL_PADDING,
    borderWidth: TOOLBAR_BORDER_WIDTH,
    borderTopWidth: 0,
    borderBottomLeftRadius: TOOLBAR_CORNER_RADIUS,
    borderBottomRightRadius: TOOLBAR_CORNER_RADIUS,
    gap: 2,
    marginTop: TOOLBAR_ANDROID_MARGIN_TOP,
    zIndex: Platform.OS === 'android' ? 1 : 5,
  },
  toolbarError: {
    justifyContent: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: TOOLBAR_CONTROL_HEIGHT,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  retryText: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
  },
  spacer: {
    flex: 1,
  },
  taskSelector: {
    marginRight: 6,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: TOOLBAR_CONTROL_HEIGHT,
    paddingHorizontal: 8,
    borderRadius: 6,
    maxWidth: 280,
  },
  buttonText: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
    flexShrink: 1,
  },
  effortButton: {
    gap: 3,
    paddingHorizontal: 6,
  },
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: TOOLBAR_BORDER_WIDTH,
    borderRadius: 999,
    padding: 1,
    marginRight: 8,
  },
  modeButton: {
    height: TOOLBAR_CONTROL_HEIGHT,
    borderRadius: 999,
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modeButtonText: {
    fontSize: 10,
    fontFamily: Fonts.sansMedium,
    letterSpacing: 0.2,
  },
  modePendingIndicator: {
    position: 'absolute',
    alignSelf: 'center',
  },
  popoverAnchor: {
    position: 'relative',
  },
  popover: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    marginBottom: 6,
    minWidth: 260,
    borderRadius: 10,
    borderWidth: TOOLBAR_BORDER_WIDTH,
    overflow: 'hidden',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 8,
    zIndex: 10,
  },
  effortPopover: {
    minWidth: 118,
  },
  popoverScroll: {
    maxHeight: 320,
  },
  searchWrap: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: TOOLBAR_BORDER_WIDTH,
  },
  searchInput: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    height: 28,
    paddingHorizontal: 6,
    outlineStyle: 'none',
  } as any,
  noResults: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlign: 'center',
  },
  providerHeader: {
    fontSize: 11,
    fontFamily: Fonts.sansMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  modelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    height: 34,
  },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  modelName: {
    fontSize: 13,
    fontFamily: Fonts.sans,
  },
  effortItem: {
    minHeight: 32,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  effortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  effortLabel: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
});
