import type React from "react";
import type { ChangeEvent, RefObject } from 'react';
import { Animated } from "@/styles/motion";
import { formatAgentModeLabel, type AgentMode } from '@/features/agent/mode';
import { useCachedAgentConfig } from '@/features/agent/hooks/use-cached-agent-config';
import type { ThinkingPreference, Attachment, SlashCommand } from '../../utils/prompt-input';
import { Toolbar } from './toolbar/index';
import { SlashCommandDropdown } from './slash-command-dropdown';
import { FileCompletionDropdown } from './file-completion-dropdown';
import { AttachmentChips } from './attachment-chips';
import { NarrowModelSheet } from './narrow-model-sheet';
import { NarrowEffortSheet } from './narrow-effort-sheet';
import { Pencil, Square, X } from 'lucide-react';
import { ToolbarSkeleton } from './toolbar-skeleton';
import { InputCard } from './input-card';
import { usePromptTheme } from '@/components/surface-theme/use-prompt-theme';
type QueueBehavior = 'steer' | 'followUp';
type PromptTheme = ReturnType<typeof usePromptTheme>;
type AgentConfig = ReturnType<typeof useCachedAgentConfig>;
type PromptKeyPressEventData = React.KeyboardEvent & {
  shiftKey?: boolean;
  isComposing?: boolean;
  keyCode?: number;
};
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
  queuedMessages: Array<{
    message: string;
    kind: string;
    behavior: QueueBehavior;
  }>;
  removeQueuedMessage: (index: number) => Promise<void>;
  editQueuedMessage: (index: number) => Promise<void>;
  isStreaming: boolean;
  requestAbort: () => Promise<void>;
  showCommands: boolean;
  filteredCommands: SlashCommand[];
  showFileCompletions: boolean;
  fileCompletions: Array<{ path: string; is_dir: boolean; display: string }>;
  fileCompletionIndex: number;
  handleSelectFile: (item: { path: string; is_dir: boolean; display: string }) => void;
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
  handleKeyPress: (event: React.SyntheticEvent<PromptKeyPressEventData>) => void;
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
  setNarrowSheet: (type: 'model' | 'effort') => void;
  setToolbarPopoverOpen: (open: boolean) => void;
  streamedMode: AgentMode | null | undefined;
  sessionReady: boolean;
  agentConfig: AgentConfig;
  thinkingPreference: ThinkingPreference;
  setThinkingPreference: (value: ThinkingPreference) => void;
  contextUsage: {
    used: number;
    total: number;
  } | null;
  showQueueActions: boolean;
  sendDraft: (behavior?: QueueBehavior) => void;
  showAbortButton: boolean;
  handleSubmit: () => void;
  hasDraft: boolean;
  toolbarHiddenKeepLayout: boolean;
  toolbarCollapsed: boolean;
  toolbarPopoverOpen: boolean;
  narrowSheet: null | 'model' | 'effort';
  closeNarrowSheet: () => void;
}
export function PromptInputView({
  theme,
  isWideScreen,
  inputRef,
  fileInputRef,
  fadeAnim,
  slideAnim,
  dropdownAnim,
  keyboardVisible,
  errorMessage,
  onClearError,
  speechError,
  clearSpeechError,
  queuedCount,
  queuedMessages,
  removeQueuedMessage,
  editQueuedMessage,
  isStreaming,
  requestAbort,
  showCommands,
  filteredCommands,
  showFileCompletions,
  fileCompletions,
  fileCompletionIndex,
  handleSelectFile,
  slashIndex,
  shouldOverlaySlashCommands,
  handleSelectCommand,
  attachments,
  removeAttachment,
  attachmentNotice,
  stackedAbove,
  toolbarOverlap,
  entryDone,
  isFocused,
  lineCount,
  text,
  handleTextChange,
  handleKeyPress,
  inputDisabled,
  sendDisabled,
  canComposeWhileDisabled,
  setIsFocused,
  handleWebFileChange,
  handleFilePick,
  isListening,
  handleMicPress,
  audioLevel,
  inlineToolbar,
  sessionId,
  setNarrowSheet,
  setToolbarPopoverOpen,
  streamedMode,
  sessionReady,
  agentConfig,
  thinkingPreference,
  setThinkingPreference,
  contextUsage,
  showQueueActions,
  sendDraft,
  showAbortButton,
  handleSubmit,
  hasDraft,
  toolbarHiddenKeepLayout,
  toolbarCollapsed,
  toolbarPopoverOpen,
  narrowSheet,
  closeNarrowSheet
}: PromptInputViewProps) {
  const formatQueueBehaviorLabel = (behavior: QueueBehavior) => behavior === 'followUp' ? 'Follow up' : 'Steer';
  return <div className="w-full opacity-100">
      {/* Send error */}
      {!!errorMessage && <button onClick={onClearError}>
          <span>
            {errorMessage}
          </span>
        </button>}

      {/* Speech error */}
      {speechError && <button onClick={clearSpeechError}>
          <span>
            {speechError}
          </span>
        </button>}

      <div className="relative flex flex-col">
        {queuedCount > 0 && <div className="absolute bottom-full right-0 z-20 mb-1 flex max-w-[min(80vw,420px)] flex-col items-end text-[12px] leading-4 text-text-tertiary" aria-label="Queued messages">
            <div className="flex h-6 items-center justify-end gap-1.5 px-1">
              <span className="font-mono text-[12px] leading-4">{queuedCount}</span>
              <span className="flex-1" />
              {isStreaming && <button className="inline-flex size-6 items-center justify-center rounded text-error hover:bg-hover" onClick={() => { void requestAbort(); }} role="button" aria-label="Stop generation">
                <X size={13} strokeWidth={2.2} />
              </button>}
            </div>
            <div className="flex max-h-32 flex-col items-end overflow-y-auto px-1 py-0.5">
              {queuedMessages.map(({ message, kind }, index) => <div key={`${kind}-${index}`} className="flex min-w-0 items-center gap-2 rounded px-1 py-1 text-[12px] leading-4 hover:bg-hover">
                <span className="max-w-[min(60vw,420px)] truncate text-[12px] leading-4 text-text-secondary" title={message}>{message}</span>
                <span className="ml-1 flex shrink-0 items-center gap-0.5">
                  <button className="flex size-5 items-center justify-center rounded text-error hover:bg-hover" onClick={() => void removeQueuedMessage(index)} aria-label="Cancel queued message"><X size={12} strokeWidth={2.2} /></button>
                  <button className="flex size-5 items-center justify-center rounded text-text-tertiary hover:bg-hover" onClick={() => void editQueuedMessage(index)} aria-label="Edit queued message"><Pencil size={11} strokeWidth={1.8} /></button>
                </span>
              </div>)}
            </div>
          </div>}
        {showCommands && <SlashCommandDropdown commands={filteredCommands} selectedIndex={slashIndex} dropdownAnim={dropdownAnim} overlay={shouldOverlaySlashCommands} onSelect={handleSelectCommand} />}
        {showFileCompletions && fileCompletions.length > 0 && <FileCompletionDropdown completions={fileCompletions} selectedIndex={fileCompletionIndex} onSelect={handleSelectFile} />}

        {/* Attachments shown above the input card */}
        <AttachmentChips attachments={attachments} onRemove={removeAttachment} />
        {attachmentNotice && <span role="alert" className={"  text-text-secondary"}>
            {attachmentNotice}
          </span>}

        <InputCard theme={theme} isWideScreen={isWideScreen} inputRef={inputRef} fileInputRef={fileInputRef} showCommands={showCommands} shouldOverlaySlashCommands={shouldOverlaySlashCommands} stackedAbove={stackedAbove} toolbarOverlap={toolbarOverlap} entryDone={entryDone} isFocused={isFocused} lineCount={lineCount} text={text} handleTextChange={handleTextChange} handleKeyPress={handleKeyPress} inputDisabled={inputDisabled} sendDisabled={sendDisabled} canComposeWhileDisabled={canComposeWhileDisabled} setIsFocused={setIsFocused} handleWebFileChange={handleWebFileChange} handleFilePick={handleFilePick} isListening={isListening} handleMicPress={handleMicPress} audioLevel={audioLevel} inlineToolbar={inlineToolbar} sessionId={sessionId} setNarrowSheet={setNarrowSheet} setToolbarPopoverOpen={setToolbarPopoverOpen} streamedMode={streamedMode} sessionReady={sessionReady} agentConfig={agentConfig} thinkingPreference={thinkingPreference} setThinkingPreference={setThinkingPreference} contextUsage={contextUsage} showQueueActions={showQueueActions} sendDraft={sendDraft} showAbortButton={showAbortButton} handleSubmit={handleSubmit} hasDraft={hasDraft} />
      </div>

      {!inlineToolbar && <div>
          <Toolbar sessionId={sessionId} isWideScreen={isWideScreen} onOpenNarrowSheet={type => setNarrowSheet(type)} onDropdownOpenChange={setToolbarPopoverOpen} inputRef={inputRef} skeleton={<ToolbarSkeleton isDark={theme.isDark} />} modeLabel={sessionId && sessionReady && streamedMode ? formatAgentModeLabel(streamedMode) : null} ready={!!sessionReady && !!sessionId} config={agentConfig} thinkingPreference={thinkingPreference} onThinkingPreferenceChange={setThinkingPreference} />
        </div>}

      {sessionReady && narrowSheet === "model" && <NarrowModelSheet visible sessionId={sessionId} onClose={closeNarrowSheet} config={agentConfig} />}
      {sessionReady && narrowSheet === "effort" && <NarrowEffortSheet visible sessionId={sessionId} onClose={closeNarrowSheet} config={agentConfig} thinkingPreference={thinkingPreference} onThinkingPreferenceChange={setThinkingPreference} />}
    </div>;
}
