import type { ChangeEvent, RefObject } from 'react';
import { Animated } from "@/platform/animation";
import { NativeSyntheticEvent, TextInputKeyPressEventData } from "@/types/dom";
import { formatAgentModeLabel, type AgentMode } from '@/features/agent/mode';
import { useCachedAgentConfig } from '@/features/agent/hooks/use-cached-agent-config';
import type { ThinkingPreference, Attachment, SlashCommand } from '../../utils/prompt-input';
import { Toolbar } from './toolbar/index';
import { SlashCommandDropdown } from './slash-command-dropdown';
import { AttachmentChips } from './attachment-chips';
import { NarrowModelSheet } from './narrow-model-sheet';
import { NarrowEffortSheet } from './narrow-effort-sheet';
import { Square } from 'lucide-react';
import { ToolbarSkeleton } from './toolbar-skeleton';
import { InputCard } from './input-card';
import { usePromptTheme } from '@/components/surface-theme/use-prompt-theme';
type QueueBehavior = 'steer' | 'followUp';
type PromptTheme = ReturnType<typeof usePromptTheme>;
type AgentConfig = ReturnType<typeof useCachedAgentConfig>;
type PromptKeyPressEventData = TextInputKeyPressEventData & {
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
  }>;
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
  isStreaming,
  requestAbort,
  showCommands,
  filteredCommands,
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
  return <div className={"" + " " + "opacity-[null] pb-[0]"}>
      {/* Send error */}
      {!!errorMessage && <button onClick={onClearError} className={"" + " " + ""}>
          <span className={"" + " " + ""}>
            {errorMessage}
          </span>
        </button>}

      {/* Speech error */}
      {speechError && <button onClick={clearSpeechError} className={"" + " " + ""}>
          <span className={"" + " " + ""}>
            {speechError}
          </span>
        </button>}

      <div className={""}>
        {queuedCount > 0 && <div className={"" + " " + ""}>
            <div className={""}>
              <span className={"" + " " + ""}>
                {queuedCount} queued message{queuedCount === 1 ? "" : "s"}
              </span>
              <div className={""}>
                {isStreaming && <button onClick={() => {
              void requestAbort();
            }} role="button" aria-label="Stop generation" hitSlop={8}>
                    <div className={""}>
                      <Square size={10} color={theme.textMuted} strokeWidth={2} fill={theme.textMuted} />
                      <span className={"" + " " + ""}>Stop</span>
                    </div>
                  </button>}
              </div>
            </div>
            {queuedMessages.map(({
          message,
          kind
        }, index) => <div key={`${kind}-${index}`} className={""}>
                <span className={"" + " " + ""}>{kind}</span>
                <span className={"" + " " + ""}>
                  {message}
                </span>
              </div>)}
          </div>}
        {showCommands && <SlashCommandDropdown commands={filteredCommands} selectedIndex={slashIndex} dropdownAnim={dropdownAnim} overlay={shouldOverlaySlashCommands} onSelect={handleSelectCommand} />}

        {/* Attachments shown above the input card */}
        <AttachmentChips attachments={attachments} onRemove={removeAttachment} />
        {attachmentNotice && <span role="alert" className={"" + " " + ""}>
            {attachmentNotice}
          </span>}

        <InputCard theme={theme} isWideScreen={isWideScreen} inputRef={inputRef} fileInputRef={fileInputRef} showCommands={showCommands} shouldOverlaySlashCommands={shouldOverlaySlashCommands} stackedAbove={stackedAbove} toolbarOverlap={toolbarOverlap} entryDone={entryDone} isFocused={isFocused} lineCount={lineCount} text={text} handleTextChange={handleTextChange} handleKeyPress={handleKeyPress} inputDisabled={inputDisabled} sendDisabled={sendDisabled} canComposeWhileDisabled={canComposeWhileDisabled} setIsFocused={setIsFocused} handleWebFileChange={handleWebFileChange} handleFilePick={handleFilePick} isListening={isListening} handleMicPress={handleMicPress} audioLevel={audioLevel} inlineToolbar={inlineToolbar} sessionId={sessionId} setNarrowSheet={setNarrowSheet} setToolbarPopoverOpen={setToolbarPopoverOpen} streamedMode={streamedMode} sessionReady={sessionReady} agentConfig={agentConfig} thinkingPreference={thinkingPreference} setThinkingPreference={setThinkingPreference} contextUsage={contextUsage} showQueueActions={showQueueActions} sendDraft={sendDraft} showAbortButton={showAbortButton} handleSubmit={handleSubmit} hasDraft={hasDraft} />
      </div>

      {!inlineToolbar && <div className={"" + " " + (toolbarPopoverOpen ? "" : "") + " " + (toolbarHiddenKeepLayout ? "" : "") + " " + (toolbarCollapsed ? "" : "")}>
          <Toolbar sessionId={sessionId} isWideScreen={isWideScreen} onOpenNarrowSheet={type => setNarrowSheet(type)} onDropdownOpenChange={setToolbarPopoverOpen} inputRef={inputRef} skeleton={<ToolbarSkeleton isDark={theme.isDark} />} modeLabel={sessionId && sessionReady && streamedMode ? formatAgentModeLabel(streamedMode) : null} ready={!!sessionReady && !!sessionId} config={agentConfig} thinkingPreference={thinkingPreference} onThinkingPreferenceChange={setThinkingPreference} />
        </div>}

      {sessionReady && narrowSheet === "model" && <NarrowModelSheet visible sessionId={sessionId} onClose={closeNarrowSheet} config={agentConfig} />}
      {sessionReady && narrowSheet === "effort" && <NarrowEffortSheet visible sessionId={sessionId} onClose={closeNarrowSheet} config={agentConfig} thinkingPreference={thinkingPreference} onThinkingPreferenceChange={setThinkingPreference} />}
    </div>;
}
