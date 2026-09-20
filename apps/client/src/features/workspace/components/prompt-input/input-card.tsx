import { ArrowUp, Mic, Plus, Square } from 'lucide-react';
import { formatAgentModeLabel } from '@/features/agent/mode';
import { Toolbar } from './toolbar/index';
import { ToolbarSkeleton } from './toolbar-skeleton';
import { ContextUsageRing } from './context-usage-ring';
import { WaveformBars } from './waveform-bars';
import type { PromptInputViewProps } from './prompt-input-view';
type QueueBehavior = 'steer' | 'followUp';
type InputCardProps = Pick<PromptInputViewProps, 'theme' | 'isWideScreen' | 'inputRef' | 'fileInputRef' | 'showCommands' | 'shouldOverlaySlashCommands' | 'stackedAbove' | 'toolbarOverlap' | 'entryDone' | 'isFocused' | 'lineCount' | 'text' | 'handleTextChange' | 'handleKeyPress' | 'inputDisabled' | 'sendDisabled' | 'canComposeWhileDisabled' | 'setIsFocused' | 'handleWebFileChange' | 'handleFilePick' | 'isListening' | 'handleMicPress' | 'audioLevel' | 'inlineToolbar' | 'sessionId' | 'setNarrowSheet' | 'setToolbarPopoverOpen' | 'streamedMode' | 'sessionReady' | 'agentConfig' | 'thinkingPreference' | 'setThinkingPreference' | 'contextUsage' | 'showQueueActions' | 'sendDraft' | 'showAbortButton' | 'handleSubmit' | 'hasDraft'>;
export function InputCard({
  theme,
  isWideScreen,
  inputRef,
  fileInputRef,
  showCommands,
  shouldOverlaySlashCommands,
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
  hasDraft
}: InputCardProps) {
  const queueLabel = (behavior: QueueBehavior) => behavior === 'followUp' ? 'Follow up' : 'Steer';
  const sendBlocked = sendDisabled || (!showAbortButton && !hasDraft);
  // The card tucks under the slash dropdown / stacked panel, so its top corners
  // square off while those are open.
  const squareTop = (showCommands && !shouldOverlaySlashCommands) || stackedAbove;
  return <div
    className={`relative rounded-xl border border-border-strong bg-background transition-shadow duration-200 ${squareTop ? 'rounded-t-none' : ''} ${entryDone && isFocused ? 'shadow-[0px_2px_6px_rgba(0,0,0,0.08)]' : ''}`}
    style={{ marginBottom: toolbarOverlap }}
  >
      <textarea ref={inputRef as any} placeholder="Ask anything..." className="block w-full resize-none bg-transparent px-3.5 pb-1.5 pt-2.5 text-sm leading-5 text-foreground outline-none placeholder:text-text-tertiary disabled:cursor-not-allowed disabled:opacity-50" disabled={inputDisabled} rows={Math.max(1, lineCount)} value={text} onChange={event => handleTextChange(event.target.value)} onKeyDown={handleKeyPress as any} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} aria-label="Prompt input" aria-description="Press Enter to send, Shift+Enter for a new line, and type / for commands." />
      <div className="flex items-center px-2 pb-2">
        <input ref={fileInputRef as any} type="file" multiple accept="image/*,.pdf,.txt,.md,.json,.csv,.js,.ts,.tsx,.jsx,.py,.go,.rs,.java,.c,.cpp,.h" onChange={handleWebFileChange as any} className="hidden" />
        <button className="inline-flex size-8 items-center justify-center rounded-md text-text-tertiary hover:bg-hover disabled:opacity-50" onClick={handleFilePick} disabled={inputDisabled} role="button" aria-label="Attach file"><Plus size={18} strokeWidth={1.8} /></button>
        {isListening ? <button className="inline-flex h-8 items-center gap-1.5 rounded-md px-1 text-destructive hover:bg-hover" onClick={handleMicPress} role="button" aria-label="Stop recording"><Square size={12} fill="currentColor" /><WaveformBars audioLevel={audioLevel} /></button> : <button className="inline-flex size-8 items-center justify-center rounded-md text-text-tertiary hover:bg-hover disabled:opacity-50" onClick={handleMicPress} disabled={inputDisabled} role="button" aria-label="Start voice input"><Mic size={16} strokeWidth={1.8} /></button>}
        <div className="flex-1" />
        {inlineToolbar && <Toolbar inline sessionId={sessionId} isWideScreen={isWideScreen} onOpenNarrowSheet={setNarrowSheet} onDropdownOpenChange={setToolbarPopoverOpen} inputRef={inputRef} skeleton={<ToolbarSkeleton inline isDark={theme.isDark} />} modeLabel={sessionId && sessionReady && streamedMode ? formatAgentModeLabel(streamedMode) : null} ready={!!sessionReady && !!sessionId} config={agentConfig} thinkingPreference={thinkingPreference} onThinkingPreferenceChange={setThinkingPreference} />}
        {contextUsage ? <ContextUsageRing used={contextUsage.used} total={contextUsage.total} isDark={theme.isDark} /> : null}
        {showQueueActions ? <div className="flex items-center gap-2">{(['steer', 'followUp'] as QueueBehavior[]).map(behavior => <button className="inline-flex h-8 items-center justify-center rounded-full border border-border-strong bg-muted px-3.5 text-xs font-medium text-text-secondary hover:opacity-90 disabled:opacity-45" key={behavior} role="button" aria-label={`Send as ${queueLabel(behavior)}`} onClick={() => sendDraft(behavior)} disabled={sendDisabled}><span>{queueLabel(behavior)}</span></button>)}</div> : <button className={`ml-auto inline-flex size-8 items-center justify-center rounded-full hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-45 ${theme.isDark ? 'bg-[#4d4d4b] text-[#fefdfd]' : 'bg-foreground text-background'}`} role="button" aria-label={showAbortButton ? 'Stop generation' : 'Send message'} onClick={handleSubmit} disabled={sendBlocked}>{showAbortButton ? <Square size={12} fill="currentColor" /> : <ArrowUp size={16} strokeWidth={2} />}</button>}
      </div>
    </div>;
}
