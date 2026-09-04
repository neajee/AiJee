import { Animated, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { ArrowUp, Mic, Plus, Square } from 'lucide-react-native';
import { formatAgentModeLabel } from '@/features/agent/mode';
import { Toolbar } from './toolbar/index';
import { ToolbarSkeleton } from './toolbar-skeleton';
import { ContextUsageRing } from './context-usage-ring';
import { WaveformBars } from './waveform-bars';
import { styles } from './styles';
import type { PromptInputViewProps } from './prompt-input-view';

type QueueBehavior = 'steer' | 'followUp';
type InputCardProps = Pick<PromptInputViewProps,
  'theme' | 'isWideScreen' | 'inputRef' | 'fileInputRef' |
  'showCommands' | 'shouldOverlaySlashCommands' | 'stackedAbove' | 'toolbarOverlap' |
  'entryDone' | 'isFocused' | 'lineCount' | 'text' | 'handleTextChange' | 'handleKeyPress' |
  'inputDisabled' | 'sendDisabled' | 'canComposeWhileDisabled' | 'setIsFocused' |
  'handleWebFileChange' | 'handleFilePick' | 'isListening' | 'handleMicPress' | 'audioLevel' |
  'inlineToolbar' | 'sessionId' | 'setMobileSheet' | 'setToolbarPopoverOpen' | 'streamedMode' |
  'sessionReady' | 'agentConfig' | 'thinkingPreference' | 'setThinkingPreference' | 'contextUsage' |
  'showQueueActions' | 'sendDraft' | 'showAbortButton' | 'handleSubmit' | 'hasDraft'>;

export function InputCard({
  theme, isWideScreen, inputRef, fileInputRef, showCommands, shouldOverlaySlashCommands,
  stackedAbove, toolbarOverlap, entryDone, isFocused, lineCount, text, handleTextChange,
  handleKeyPress, inputDisabled, sendDisabled, canComposeWhileDisabled, setIsFocused,
  handleWebFileChange, handleFilePick, isListening, handleMicPress, audioLevel, inlineToolbar,
  sessionId, setMobileSheet, setToolbarPopoverOpen, streamedMode, sessionReady, agentConfig,
  thinkingPreference, setThinkingPreference, contextUsage, showQueueActions, sendDraft,
  showAbortButton, handleSubmit, hasDraft,
}: InputCardProps) {
  const queueLabel = (behavior: QueueBehavior) => behavior === 'followUp' ? 'Follow up' : 'Steer';
  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
          borderTopLeftRadius: (showCommands && !shouldOverlaySlashCommands) || stackedAbove ? 0 : 12,
          borderTopRightRadius: (showCommands && !shouldOverlaySlashCommands) || stackedAbove ? 0 : 12,
          marginBottom: toolbarOverlap,
          ...(entryDone ? Platform.OS === 'web' ? {
            boxShadow: isFocused ? '0px 2px 6px rgba(0, 0, 0, 0.08)' : '0px 0px 0px rgba(0, 0, 0, 0)',
            transitionProperty: 'box-shadow', transitionDuration: '180ms', transitionTimingFunction: 'ease',
          } : {
            boxShadow: isFocused ? `0px ${Platform.OS === 'ios' ? 2 : 3}px ${Platform.OS === 'ios' ? 5 : 8}px rgba(0, 0, 0, ${Platform.OS === 'ios' ? 0.07 : 0.1})` : '0px 0px 0px rgba(0, 0, 0, 0)',
            elevation: isFocused ? 2 : 0,
          } : {}),
        } as any,
      ]}
    >
      <TextInput
        ref={inputRef}
        placeholder="Ask anything..."
        placeholderTextColor={theme.textMuted}
        style={[styles.input, { color: theme.textPrimary }, sendDisabled && !canComposeWhileDisabled && { opacity: 0.5 }]}
        editable={!inputDisabled}
        multiline
        numberOfLines={lineCount}
        {...(Platform.OS === 'web' ? ({ rows: lineCount } as any) : {})}
        value={text}
        onChangeText={handleTextChange}
        onKeyPress={handleKeyPress}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        accessibilityLabel="Prompt input"
        accessibilityHint="Press Enter to send, Shift+Enter for a new line, and type / for commands."
      />
      <View style={styles.actionRow}>
        {Platform.OS === 'web' && <input ref={fileInputRef as any} type="file" multiple accept="image/*,.pdf,.txt,.md,.json,.csv,.js,.ts,.tsx,.jsx,.py,.go,.rs,.java,.c,.cpp,.h" onChange={handleWebFileChange as any} style={{ display: 'none' }} />}
        <Pressable style={styles.attachButton} onPress={handleFilePick} disabled={inputDisabled} accessibilityRole="button" accessibilityLabel="Attach file"><Plus size={18} color={theme.textMuted} strokeWidth={1.8} /></Pressable>
        {isListening ? <Pressable style={styles.micWaveRow} onPress={handleMicPress} accessibilityRole="button" accessibilityLabel="Stop recording"><Square size={12} color="#EF4444" strokeWidth={2} fill="#EF4444" /><WaveformBars audioLevel={audioLevel} /></Pressable> : <Pressable style={styles.micButton} onPress={handleMicPress} disabled={inputDisabled} accessibilityRole="button" accessibilityLabel="Start voice input"><Mic size={16} color={theme.textMuted} strokeWidth={1.8} /></Pressable>}
        <View style={{ flex: 1 }} />
        {inlineToolbar && <Toolbar inline sessionId={sessionId} isWideScreen={isWideScreen} onOpenMobileSheet={setMobileSheet} onDropdownOpenChange={setToolbarPopoverOpen} inputRef={inputRef} skeleton={<ToolbarSkeleton inline isDark={theme.isDark} />} modeLabel={sessionId && sessionReady && streamedMode ? formatAgentModeLabel(streamedMode) : null} ready={!!sessionReady && !!sessionId} config={agentConfig} thinkingPreference={thinkingPreference} onThinkingPreferenceChange={setThinkingPreference} />}
        {contextUsage ? <ContextUsageRing used={contextUsage.used} total={contextUsage.total} isDark={theme.isDark} /> : null}
        {showQueueActions ? <View style={styles.queueActionGroup}>{(['steer', 'followUp'] as QueueBehavior[]).map((behavior) => <Pressable key={behavior} accessibilityRole="button" accessibilityLabel={`Send as ${queueLabel(behavior)}`} onPress={() => sendDraft(behavior)} disabled={sendDisabled} style={({ pressed }) => [styles.queueActionButton, { backgroundColor: theme.isDark ? '#242422' : '#EFEDE8', borderColor: theme.cardBorder, opacity: sendDisabled ? 0.45 : pressed ? 0.82 : 1 }]}><Text style={[styles.queueActionText, { color: theme.textSecondary }]}>{queueLabel(behavior)}</Text></Pressable>)}</View> : <Pressable accessibilityRole="button" accessibilityLabel={showAbortButton ? 'Stop generation' : 'Send message'} onPress={handleSubmit} disabled={sendDisabled || (!showAbortButton && !hasDraft)} style={({ pressed }) => [styles.sendButton, { backgroundColor: theme.isDark ? '#4d4d4b' : theme.colors.text, opacity: (sendDisabled || (!showAbortButton && !hasDraft)) ? 0.45 : pressed ? 0.85 : 1 }]}>{showAbortButton ? <Square size={12} color="#FFFFFF" strokeWidth={2} fill="#FFFFFF" /> : <ArrowUp size={16} color={theme.isDark ? '#fefdfd' : theme.colors.background} strokeWidth={2} />}</Pressable>}
      </View>
    </Animated.View>
  );
}
