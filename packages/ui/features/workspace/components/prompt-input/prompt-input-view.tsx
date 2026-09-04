import type { ChangeEvent, RefObject } from 'react';
import { Animated, NativeSyntheticEvent, Pressable, Text, TextInput, TextInputKeyPressEventData, View } from 'react-native';

import { formatAgentModeLabel, type AgentMode } from '@/features/agent/mode';
import { useCachedAgentConfig } from '@/features/agent/hooks/use-cached-agent-config';
import type { ThinkingPreference, Attachment, SlashCommand } from '../../utils/prompt-input';
import { Toolbar } from './toolbar/index';
import { SlashCommandDropdown } from './slash-command-dropdown';
import { AttachmentChips } from './attachment-chips';
import { MobileModelSheet } from './mobile-model-sheet';
import { MobileEffortSheet } from './mobile-effort-sheet';
import { Square } from 'lucide-react-native';
import { ToolbarSkeleton } from './toolbar-skeleton';
import { InputCard } from './input-card';
import { usePromptTheme } from '@/components/surface-theme/use-prompt-theme';
import { styles } from './styles';

type QueueBehavior = 'steer' | 'followUp';
type PromptTheme = ReturnType<typeof usePromptTheme>;
type AgentConfig = ReturnType<typeof useCachedAgentConfig>;
type PromptKeyPressEventData = TextInputKeyPressEventData & { shiftKey?: boolean; isComposing?: boolean; keyCode?: number };

export interface PromptInputViewProps {
  theme: PromptTheme;
  isWideScreen: boolean;
  inputRef: RefObject<TextInput | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  dropdownAnim: Animated.Value;
  keyboardVisible: boolean;
  errorMessage?: string | null;
  onClearError?: () => void;
  speechError: string | null;
  clearSpeechError: () => void;
  queuedCount: number;
  queuedMessages: Array<{ message: string; kind: string }>;
  isStreaming: boolean;
  requestAbort: () => Promise<void>;
  showCommands: boolean;
  filteredCommands: SlashCommand[];
  slashIndex: number;
  shouldOverlaySlashCommands: boolean;
  handleSelectCommand: (command: SlashCommand) => void;
  attachments: Attachment[];
  removeAttachment: (id: string) => void;
  attachmentNotice: string | null;
  stackedAbove: boolean;
  toolbarOverlap: number;
  entryDone: boolean;
  isFocused: boolean;
  lineCount: number;
  text: string;
  handleTextChange: (value: string) => void;
  handleKeyPress: (event: NativeSyntheticEvent<PromptKeyPressEventData>) => void;
  inputDisabled: boolean;
  sendDisabled: boolean;
  canComposeWhileDisabled: boolean;
  setIsFocused: (focused: boolean) => void;
  handleWebFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleFilePick: () => void;
  isListening: boolean;
  handleMicPress: () => void;
  audioLevel: number;
  inlineToolbar: boolean;
  sessionId?: string | null;
  setMobileSheet: (type: 'model' | 'effort') => void;
  setToolbarPopoverOpen: (open: boolean) => void;
  streamedMode: AgentMode | null | undefined;
  sessionReady: boolean;
  agentConfig: AgentConfig;
  thinkingPreference: ThinkingPreference;
  setThinkingPreference: (value: ThinkingPreference) => void;
  contextUsage: { used: number; total: number } | null;
  showQueueActions: boolean;
  sendDraft: (behavior?: QueueBehavior) => void;
  showAbortButton: boolean;
  handleSubmit: () => void;
  hasDraft: boolean;
  toolbarHiddenKeepLayout: boolean;
  toolbarCollapsed: boolean;
  toolbarPopoverOpen: boolean;
  mobileSheet: null | 'model' | 'effort';
  closeMobileSheet: () => void;
}

export function PromptInputView({
  theme, isWideScreen, inputRef, fileInputRef, fadeAnim, slideAnim, dropdownAnim, keyboardVisible,
  errorMessage, onClearError, speechError, clearSpeechError, queuedCount, queuedMessages, isStreaming,
  requestAbort, showCommands, filteredCommands, slashIndex, shouldOverlaySlashCommands, handleSelectCommand,
  attachments, removeAttachment, attachmentNotice, stackedAbove, toolbarOverlap, entryDone, isFocused,
  lineCount, text, handleTextChange, handleKeyPress, inputDisabled, sendDisabled, canComposeWhileDisabled,
  setIsFocused, handleWebFileChange, handleFilePick, isListening, handleMicPress, audioLevel, inlineToolbar,
  sessionId, setMobileSheet, setToolbarPopoverOpen, streamedMode,
  sessionReady, agentConfig, thinkingPreference, setThinkingPreference, contextUsage, showQueueActions,
  sendDraft, showAbortButton, handleSubmit, hasDraft, toolbarHiddenKeepLayout, toolbarCollapsed,
  toolbarPopoverOpen, mobileSheet, closeMobileSheet,
}: PromptInputViewProps) {
  const formatQueueBehaviorLabel = (behavior: QueueBehavior) => behavior === 'followUp' ? 'Follow up' : 'Steer';

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          paddingBottom: keyboardVisible && !isWideScreen ? 24 : 12,
        },
      ]}
    >
      {/* Send error */}
      {!!errorMessage && (
        <Pressable
          onPress={onClearError}
          style={[styles.sendError, { backgroundColor: theme.isDark ? "#3a1a1a" : "#FEE2E2" }]}
        >
          <Text style={[styles.sendErrorText, { color: theme.isDark ? "#FCA5A5" : "#DC2626" }]}>
            {errorMessage}
          </Text>
        </Pressable>
      )}

      {/* Speech error */}
      {speechError && (
        <Pressable
          onPress={clearSpeechError}
          style={[styles.speechError, { backgroundColor: theme.isDark ? "#3a1a1a" : "#FEE2E2" }]}
        >
          <Text style={[styles.speechErrorText, { color: theme.isDark ? "#FCA5A5" : "#DC2626" }]}>
            {speechError}
          </Text>
        </Pressable>
      )}

      <View style={styles.composerStack}>
        {queuedCount > 0 && (
          <View
            style={[
              styles.queuePanel,
              {
                backgroundColor: theme.isDark ? "#242422" : "#F2F0EB",
                borderColor: theme.cardBorder,
              },
            ]}
          >
            <View style={styles.queueHeader}>
              <Text style={[styles.queueStatus, { color: theme.textMuted }]}>
                {queuedCount} queued message{queuedCount === 1 ? "" : "s"}
              </Text>
              <View style={styles.queueHeaderActions}>
                {isStreaming && (
                  <Pressable
                    onPress={() => { void requestAbort(); }}
                    accessibilityRole="button"
                    accessibilityLabel="Stop generation"
                    hitSlop={8}
                  >
                    <View style={styles.queueActionRow}>
                      <Square size={10} color={theme.textMuted} strokeWidth={2} fill={theme.textMuted} />
                      <Text style={[styles.queueActionLabel, { color: theme.textMuted }]}>Stop</Text>
                    </View>
                  </Pressable>
                )}
              </View>
            </View>
            {queuedMessages.map(({ message, kind }, index) => (
              <View key={`${kind}-${index}`} style={styles.queuedMessageRow}>
                <Text style={[styles.queuedMessageKind, { color: theme.textMuted }]}>{kind}</Text>
                <Text style={[styles.queuedMessageText, { color: theme.textSecondary }]} numberOfLines={2}>
                  {message}
                </Text>
              </View>
            ))}
          </View>
        )}
        {showCommands && (
          <SlashCommandDropdown
            commands={filteredCommands}
            selectedIndex={slashIndex}
            dropdownAnim={dropdownAnim}
            overlay={shouldOverlaySlashCommands}
            onSelect={handleSelectCommand}
          />
        )}

        {/* Attachments shown above the input card */}
        <AttachmentChips attachments={attachments} onRemove={removeAttachment} />
        {attachmentNotice && (
          <Text
            accessibilityRole="alert"
            style={[styles.attachmentNotice, { color: theme.textMuted }]}
          >
            {attachmentNotice}
          </Text>
        )}

        <InputCard
          theme={theme}
          isWideScreen={isWideScreen}
          inputRef={inputRef}
          fileInputRef={fileInputRef}
          showCommands={showCommands}
          shouldOverlaySlashCommands={shouldOverlaySlashCommands}
          stackedAbove={stackedAbove}
          toolbarOverlap={toolbarOverlap}
          entryDone={entryDone}
          isFocused={isFocused}
          lineCount={lineCount}
          text={text}
          handleTextChange={handleTextChange}
          handleKeyPress={handleKeyPress}
          inputDisabled={inputDisabled}
          sendDisabled={sendDisabled}
          canComposeWhileDisabled={canComposeWhileDisabled}
          setIsFocused={setIsFocused}
          handleWebFileChange={handleWebFileChange}
          handleFilePick={handleFilePick}
          isListening={isListening}
          handleMicPress={handleMicPress}
          audioLevel={audioLevel}
          inlineToolbar={inlineToolbar}
          sessionId={sessionId}
          setMobileSheet={setMobileSheet}
          setToolbarPopoverOpen={setToolbarPopoverOpen}
          streamedMode={streamedMode}
          sessionReady={sessionReady}
          agentConfig={agentConfig}
          thinkingPreference={thinkingPreference}
          setThinkingPreference={setThinkingPreference}
          contextUsage={contextUsage}
          showQueueActions={showQueueActions}
          sendDraft={sendDraft}
          showAbortButton={showAbortButton}
          handleSubmit={handleSubmit}
          hasDraft={hasDraft}
        />
      </View>

      {!inlineToolbar && (
        <View
          style={[
            styles.bottomControlsWrap,
            toolbarPopoverOpen && styles.bottomControlsWrapElevated,
            toolbarHiddenKeepLayout && styles.bottomControlsHidden,
            toolbarCollapsed && styles.bottomControlsCollapsed,
          ]}
        >
          <Toolbar
            sessionId={sessionId}
            isWideScreen={isWideScreen}
            onOpenMobileSheet={(type) => setMobileSheet(type)}
            onDropdownOpenChange={setToolbarPopoverOpen}
            inputRef={inputRef}
            skeleton={<ToolbarSkeleton isDark={theme.isDark} />}
            modeLabel={
              sessionId && sessionReady && streamedMode
                ? formatAgentModeLabel(streamedMode)
                : null
            }
            ready={!!sessionReady && !!sessionId}
            config={agentConfig}
            thinkingPreference={thinkingPreference}
            onThinkingPreferenceChange={setThinkingPreference}
          />
        </View>
      )}

      {sessionReady && mobileSheet === "model" && (
        <MobileModelSheet visible sessionId={sessionId} onClose={closeMobileSheet} config={agentConfig} />
      )}
      {sessionReady && mobileSheet === "effort" && (
        <MobileEffortSheet visible sessionId={sessionId} onClose={closeMobileSheet} config={agentConfig} thinkingPreference={thinkingPreference} onThinkingPreferenceChange={setThinkingPreference} />
      )}
    </Animated.View>
  );
}
