import { toTailwind } from "@/styles/to-tailwind";
import { Animated } from "@/platform/animation";
import { ArrowUp, Mic, Plus, Square } from 'lucide-react';
import { formatAgentModeLabel } from '@/features/agent/mode';
import { Toolbar } from './toolbar/index';
import { ToolbarSkeleton } from './toolbar-skeleton';
import { ContextUsageRing } from './context-usage-ring';
import { WaveformBars } from './waveform-bars';
import { styles } from './style-tokens';
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
  hasDraft
}: InputCardProps) {
  const queueLabel = (behavior: QueueBehavior) => behavior === 'followUp' ? 'Follow up' : 'Steer';
  return <div className={toTailwind([styles.card, {
    backgroundColor: theme.cardBg,
    borderColor: theme.cardBorder,
    borderTopLeftRadius: showCommands && !shouldOverlaySlashCommands || stackedAbove ? 0 : 12,
    borderTopRightRadius: showCommands && !shouldOverlaySlashCommands || stackedAbove ? 0 : 12,
    marginBottom: toolbarOverlap,
    ...(entryDone ? true ? {
      boxShadow: isFocused ? '0px 2px 6px rgba(0, 0, 0, 0.08)' : '0px 0px 0px rgba(0, 0, 0, 0)',
      transitionProperty: 'box-shadow',
      transitionDuration: '180ms',
      transitionTimingFunction: 'ease'
    } : {
      boxShadow: isFocused ? `0px ${false ? 2 : 3}px ${false ? 5 : 8}px rgba(0, 0, 0, ${false ? 0.07 : 0.1})` : '0px 0px 0px rgba(0, 0, 0, 0)',
      elevation: isFocused ? 2 : 0
    } : {})
  } as any])}>
      <input ref={inputRef} placeholder="Ask anything..." placeholderTextColor={theme.textMuted} className={toTailwind([styles.input, {
      color: theme.textPrimary
    }, sendDisabled && !canComposeWhileDisabled && {
      opacity: 0.5
    }])} focusStyle={{
      outlineWidth: 0,
      borderWidth: 0,
      borderColor: 'transparent',
      boxShadow: 'none'
    } as any} editable={!inputDisabled} multiline {...true ? {
      rows: lineCount
    } as any : {}} value={text} onChangeText={handleTextChange} onKeyPress={handleKeyPress} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} aria-label="Prompt input" accessibilityHint="Press Enter to send, Shift+Enter for a new line, and type / for commands." />
      <div className={toTailwind(styles.actionRow)}>
        {true && <input ref={fileInputRef as any} type="file" multiple accept="image/*,.pdf,.txt,.md,.json,.csv,.js,.ts,.tsx,.jsx,.py,.go,.rs,.java,.c,.cpp,.h" onChange={handleWebFileChange as any} className={toTailwind({
        display: 'none'
      })} />}
        <button className={toTailwind(styles.attachButton)} onClick={handleFilePick} disabled={inputDisabled} role="button" aria-label="Attach file"><Plus size={18} color={theme.textMuted} strokeWidth={1.8} /></button>
        {isListening ? <button className={toTailwind(styles.micWaveRow)} onClick={handleMicPress} role="button" aria-label="Stop recording"><Square size={12} color="#EF4444" strokeWidth={2} fill="#EF4444" /><WaveformBars audioLevel={audioLevel} /></button> : <button className={toTailwind(styles.micButton)} onClick={handleMicPress} disabled={inputDisabled} role="button" aria-label="Start voice input"><Mic size={16} color={theme.textMuted} strokeWidth={1.8} /></button>}
        <div className={toTailwind({
        flex: 1
      })} />
        {inlineToolbar && <Toolbar inline sessionId={sessionId} isWideScreen={isWideScreen} onOpenNarrowSheet={setNarrowSheet} onDropdownOpenChange={setToolbarPopoverOpen} inputRef={inputRef} skeleton={<ToolbarSkeleton inline isDark={theme.isDark} />} modeLabel={sessionId && sessionReady && streamedMode ? formatAgentModeLabel(streamedMode) : null} ready={!!sessionReady && !!sessionId} config={agentConfig} thinkingPreference={thinkingPreference} onThinkingPreferenceChange={setThinkingPreference} />}
        {contextUsage ? <ContextUsageRing used={contextUsage.used} total={contextUsage.total} isDark={theme.isDark} /> : null}
        {showQueueActions ? <div className={toTailwind(styles.queueActionGroup)}>{(['steer', 'followUp'] as QueueBehavior[]).map(behavior => <button key={behavior} role="button" aria-label={`Send as ${queueLabel(behavior)}`} onClick={() => sendDraft(behavior)} disabled={sendDisabled}><span className={toTailwind([styles.queueActionText, {
            color: theme.textSecondary
          }])}>{queueLabel(behavior)}</span></button>)}</div> : <button role="button" aria-label={showAbortButton ? 'Stop generation' : 'Send message'} onClick={handleSubmit} disabled={sendDisabled || !showAbortButton && !hasDraft}>{showAbortButton ? <Square size={12} color="#FFFFFF" strokeWidth={2} fill="#FFFFFF" /> : <ArrowUp size={16} color={theme.isDark ? '#fefdfd' : theme.colors.background} strokeWidth={2} />}</button>}
      </div>
    </div>;
}
