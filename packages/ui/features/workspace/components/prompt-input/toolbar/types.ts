import type { ReactNode, RefObject } from 'react';
import type { AgentConfigHandle, ModelInfo, AgentStateData } from '@aijee/client-sdk';
import type { Animated, ScrollView, TextInput, View } from 'react-native';

import type { AgentMode } from '@/features/agent/mode';
import type { AppMode } from '@/hooks/use-app-mode';
import type { FlatModel, ThinkingPreference } from '../../../utils/prompt-input';

export interface ToolbarProps {
  sessionId?: string | null;
  isWideScreen: boolean;
  onOpenMobileSheet: (type: 'model' | 'effort') => void;
  onDropdownOpenChange?: (isOpen: boolean) => void;
  inputRef: RefObject<TextInput | null>;
  skeleton?: ReactNode;
  modeLabel?: string | null;
  ready?: boolean;
  config: AgentConfigHandle;
  inline?: boolean;
  thinkingPreference?: ThinkingPreference;
  onThinkingPreferenceChange?: (level: ThinkingPreference) => void;
}

export type DropdownType = null | 'model' | 'effort';

export interface EffortOption {
  level: ThinkingPreference;
  label: string;
  description: string;
}

export interface ToolbarTheme {
  isDark: boolean;
  toolbarBg: string;
  toolbarBorder: string;
  textPrimary: string;
  textMuted: string;
  textSecondary: string;
  dropdownBg: string;
  dropdownBorder: string;
  hoverBg: string;
  selectedBg: string;
  sectionColor: string;
  accentColor: string;
}

export interface ToolbarController {
  theme: ToolbarTheme;
  appMode: AppMode;
  config: AgentConfigHandle;
  skeleton: ReactNode;
  isWideScreen: boolean;
  onOpenMobileSheet: (type: 'model' | 'effort') => void;
  onDropdownOpenChange?: (isOpen: boolean) => void;
  inputRef: RefObject<TextInput | null>;
  inline: boolean;
  ready: boolean;
  currentModel: ModelInfo | null;
  agentState: AgentStateData | null;
  hasModels: boolean;
  toolbarDisabled: boolean;
  controlHeight: number;
  thinkingDisabled: boolean;
  thinkingLabel: string;
  thinkingPreference: ThinkingPreference;
  effortOptions: EffortOption[];
  providers: Array<{ name: string; models: ModelInfo[] }>;
  flatModels: FlatModel[];
  activeDropdown: DropdownType;
  modelSearch: string;
  setModelSearch: (value: string) => void;
  popoverIndex: number;
  setPopoverIndex: (value: number | ((current: number) => number)) => void;
  toolbarDropdownAnim: Animated.Value;
  toolbarRef: RefObject<View | null>;
  modelScrollRef: RefObject<ScrollView | null>;
  modelSearchRef: RefObject<TextInput | null>;
  toggleDropdown: (type: DropdownType) => void;
  handleSelectModel: (provider: string, modelId: string) => void;
  handleSelectThinking: (level: ThinkingPreference) => void;
  handleSearchKeyPress: (event: any) => void;
  displayedMode: AgentMode;
  pendingMode: AgentMode | null;
  handleSelectMode: (mode: AgentMode) => void;
  configError: string | null;
  configRetry: () => void;
  showTaskSelector: boolean;
  showModeToggle: boolean;
}
