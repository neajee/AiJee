import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Animated, Keyboard, LayoutAnimation, NativeSyntheticEvent, Platform, TextInput, TextInputKeyPressEventData } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File as ExpoFile } from 'expo-file-system';
import { useQuery } from '@tanstack/react-query';
import { useCachedAgentConfig } from '@/features/agent/hooks/use-cached-agent-config';
import { useAgentSession, usePiClient } from '@aijee/client-sdk';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useSpeechRecognition } from '@/features/speech/hooks/use-speech-recognition';
import { useSpeechSettingsStore } from '@/features/speech/store';
import type { SlashCommand, Attachment, ThinkingPreference } from '../utils/prompt-input';
import { resolveAutoThinkingLevel } from '../utils/prompt-input';
import { usePromptTheme } from '@/components/surface-theme/use-prompt-theme';
import { useDraftStore } from '../store/draft';

const EMPTY_SLASH_COMMANDS: SlashCommand[] = [];
const BUILTIN_COMMANDS: SlashCommand[] = [
  { name: "work", description: "Switch to work mode" },
  { name: "plan", description: "Switch to plan mode" },
  { name: "compact", description: "Compact conversation history" },
];

type PromptKeyPressEventData = TextInputKeyPressEventData & {
  shiftKey?: boolean;
  isComposing?: boolean;
  keyCode?: number;
};

export type QueueBehavior = "steer" | "followUp";

function formatQueueBehaviorLabel(behavior: QueueBehavior): string {
  return behavior === "followUp" ? "Follow up" : "Steer";
}

/**
 * Reads a picked native image into a data URL.
 *
 * Returns undefined when the file cannot be read, so the attachment still
 * appears as a chip (without a thumbnail) instead of the pick failing.
 */
async function readImageDataUrl(uri: string, mimeType?: string | null): Promise<string | undefined> {
  try {
    const base64 = await new ExpoFile(uri).base64();
    return `data:${mimeType || "image/png"};base64,${base64}`;
  } catch {
    return undefined;
  }
}


export interface PromptInputProps {
  sessionId?: string | null;
  onSend?: (text: string, attachments: Attachment[], options?: { queueBehavior?: QueueBehavior }) => Promise<void> | void;
  isStreaming?: boolean;
  onAbort?: () => void | Promise<void>;
  disabled?: boolean;
  sessionReady?: boolean;
  allowTypingWhileDisabled?: boolean;
  stackedAbove?: boolean;
  errorMessage?: string | null;
  onClearError?: () => void;
}

export function usePromptInputController({
  sessionId, onSend, isStreaming, onAbort, disabled, sessionReady = true, allowTypingWhileDisabled = false,
  stackedAbove = false, errorMessage, onClearError,
}: PromptInputProps) {

  const theme = usePromptTheme();
  const { isWideScreen } = useResponsiveLayout();
  const inputRef = useRef<TextInput>(null);
  const shouldAnimateEntry = !sessionId;
  const isStartingSession = !!sessionId && !sessionReady;
  const canComposeWhileDisabled =
    allowTypingWhileDisabled && isStartingSession;
  const inputDisabled = !!disabled && !canComposeWhileDisabled;
  const sendDisabled = !!disabled;
  const agentSession = useAgentSession(sessionId ?? null);
  const streamedMode = agentSession.mode;
  const agentConfig = useCachedAgentConfig(sessionId ?? null, {
    enabled: sessionReady,
  });

  // Context usage: input + output + cacheRead + cacheWrite against context window
  const contextUsage = useMemo(() => {
    // activeModel merges the SSE snapshot with the full descriptor from the
    // models list, so contextWindow is present even if the snapshot trims it.
    const contextWindow = agentConfig.contextWindow;
    if (!contextWindow) return null;
    const msgs = agentSession.messages as {
      role: string;
      usage?: { input?: number; output?: number; cacheRead?: number; cacheWrite?: number };
    }[];
    for (let i = msgs.length - 1; i >= 0; i--) {
      const msg = msgs[i];
      if (msg.role === "assistant" && msg.usage) {
        const u = msg.usage;
        const used = (u.input ?? 0) + (u.output ?? 0) + (u.cacheRead ?? 0) + (u.cacheWrite ?? 0);
        if (used <= 0) continue;
        return { used, total: contextWindow };
      }
    }
    return null;
  }, [agentSession.messages, agentConfig.contextWindow]);

  const piClient = usePiClient();
  const { data: backendCommands } = useQuery({
    queryKey: ["slash-commands", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const result = await piClient.api.getCommands(sessionId);
      return (
        result.commands?.map((c) => ({
          name: c.name,
          description: c.description ?? "",
        })) ?? []
      );
    },
    enabled: !!sessionId && sessionReady,
    staleTime: 30_000,
    retry: 2,
    retryDelay: 1000,
    refetchOnMount: true,
  });
  const slashCommands = useMemo(() => {
    const backend = backendCommands ?? EMPTY_SLASH_COMMANDS;
    const backendNames = new Set(backend.map((c) => c.name));
    const builtins = BUILTIN_COMMANDS.filter((c) => !backendNames.has(c.name));
    return [...backend, ...builtins];
  }, [backendCommands]);

  // --- UI state ---
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [hideBottomForKeyboard, setHideBottomForKeyboard] = useState(false);
  // One sheet now: the model picker carries the thinking level with it.
  const [mobileSheet, setMobileSheet] = useState<null | 'model' | 'effort'>(null);
  const [toolbarPopoverOpen, setToolbarPopoverOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [entryDone, setEntryDone] = useState(false);
  const [thinkingPreference, setThinkingPreference] = useState<ThinkingPreference>('auto');
  // Wide viewports fold the model/mode controls into the input card's action
  // row, so the composer is a single line; narrow ones keep the separate strip
  // below the card, where there is room for them.
  const inlineToolbar = isWideScreen;
  const toolbarHiddenKeepLayout = !isWideScreen && !!mobileSheet;
  const toolbarCollapsed = !isWideScreen && hideBottomForKeyboard;
  const toolbarOverlap = inlineToolbar ? 0 : Platform.OS === "web" ? -4 : -1;
  const shouldOverlaySlashCommands = Platform.OS === "web" || isWideScreen;
  const closeMobileSheet = useCallback(() => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(200, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity),
    );
    setMobileSheet(null);
  }, []);

  // --- Keyboard ---
  useEffect(() => {
    if (Platform.OS === "web") return;
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (e) => {
      const duration = (e as any).duration ?? 250;
      LayoutAnimation.configureNext(
        LayoutAnimation.create(duration, LayoutAnimation.Types.keyboard, LayoutAnimation.Properties.opacity),
      );
      setKeyboardVisible(true);
      setHideBottomForKeyboard(true);
    });
    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      const duration = (e as any).duration ?? 250;
      LayoutAnimation.configureNext(
        LayoutAnimation.create(duration, LayoutAnimation.Types.keyboard, LayoutAnimation.Properties.opacity),
      );
      setKeyboardVisible(false);
      setHideBottomForKeyboard(false);
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // --- Speech ---
  const speechLoaded = useSpeechSettingsStore((s) => s.loaded);
  const loadSpeechSettings = useSpeechSettingsStore((s) => s.load);
  useEffect(() => {
    if (!speechLoaded) loadSpeechSettings();
  }, [speechLoaded, loadSpeechSettings]);

  const draftKey = sessionId ?? "__new__";
  const prevDraftKeyRef = useRef(draftKey);
  useEffect(() => {
    const prev = prevDraftKeyRef.current;
    if (prev !== draftKey) {
      useDraftStore.getState().migrateDraft(prev, draftKey);
      prevDraftKeyRef.current = draftKey;
    }
  }, [draftKey]);
  const text = useDraftStore((s) => s.getText(draftKey));
  const attachments = useDraftStore((s) => s.getAttachments(draftKey));
  const setText = useCallback((v: string) => useDraftStore.getState().setText(draftKey, v), [draftKey]);
  const setAttachments = useCallback((v: Attachment[] | ((prev: Attachment[]) => Attachment[])) => {
    const store = useDraftStore.getState();
    if (typeof v === "function") {
      store.setAttachments(draftKey, v(store.getAttachments(draftKey)));
    } else {
      store.setAttachments(draftKey, v);
    }
  }, [draftKey]);
  const [showCommands, setShowCommands] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState<SlashCommand[]>([]);
  const [slashIndex, setSlashIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const trimmedText = text.trim();
  const hasDraft = trimmedText.length > 0 || attachments.length > 0;
  const showAbortButton = !!isStreaming && !hasDraft;
  const showQueueActions = !!isStreaming && hasDraft;
  const queuedMessages = [
    ...agentSession.steeringQueue.map((message) => ({ message, kind: "Steer" })),
    ...agentSession.followUpQueue.map((message) => ({ message, kind: "Follow up" })),
  ];
  const queuedCount = queuedMessages.length;

  const textBeforeSpeechRef = useRef("");
  const handleSpeechInterim = useCallback((interim: string) => {
    const result = textBeforeSpeechRef.current + (textBeforeSpeechRef.current ? " " : "") + interim;
    console.log('[UI-STT] handleSpeechInterim:', JSON.stringify({ base: textBeforeSpeechRef.current, interim, result }));
    setText(result);
  }, [setText]);
  const handleSpeechFinal = useCallback((final: string) => {
    const base = textBeforeSpeechRef.current;
    const newText = base + (base ? " " : "") + final;
    console.log('[UI-STT] handleSpeechFinal:', JSON.stringify({ base, final, newText }));
    setText(newText);
    textBeforeSpeechRef.current = newText;
  }, [setText]);
  const {
    isListening, start: startListening, stop: stopListening,
    error: speechError, clearError: clearSpeechError, audioLevel,
  } = useSpeechRecognition(handleSpeechInterim, handleSpeechFinal);

  const isListeningRef = useRef(false);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);

  const handleMicPress = useCallback(() => {
    if (inputDisabled) return;
    if (isListening) stopListening();
    else { textBeforeSpeechRef.current = text; startListening(); }
  }, [inputDisabled, isListening, text, startListening, stopListening]);

  // --- Auto-grow ---
  const MIN_LINES = 2;
  const MAX_LINES = 6;
  const lineCount = Math.min(Math.max(text.split("\n").length, MIN_LINES), MAX_LINES);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const el = inputRef.current as any;
    const textarea = el?.querySelector?.("textarea") ?? el;
    if (textarea && textarea.tagName === "TEXTAREA") {
      textarea.rows = lineCount;
      textarea.style.resize = "none";
    }
  }, [lineCount]);

  // --- Animations ---
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(shouldAnimateEntry ? 20 : 0)).current;
  const fadeAnim = useRef(new Animated.Value(shouldAnimateEntry ? 0 : 1)).current;

  useEffect(() => {
    if (!shouldAnimateEntry) { setEntryDone(true); return; }
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, delay: 150, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 120, friction: 14, delay: 150, useNativeDriver: true }),
    ]).start(() => setEntryDone(true));
  }, [fadeAnim, shouldAnimateEntry, slideAnim]);

  useEffect(() => {
    Animated.spring(dropdownAnim, { toValue: showCommands ? 1 : 0, tension: 300, friction: 26, useNativeDriver: true }).start();
  }, [dropdownAnim, showCommands]);

  useEffect(() => {
    if (Platform.OS !== "web" || inputDisabled) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;
      if ((e.metaKey || e.ctrlKey) && (e.key === "v" || e.key === "V")) {
        inputRef.current?.focus();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length !== 1) return;
      inputRef.current?.focus();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [inputDisabled]);

  // --- Send / abort ---
  const clearDraft = useDraftStore((s) => s.clearDraft);
  const sendDraft = useCallback(async (queueBehavior?: QueueBehavior) => {
    if (!hasDraft) return;
    const savedText = trimmedText;
    const savedAttachments = [...attachments];
    clearDraft(draftKey); setShowCommands(false);
    textBeforeSpeechRef.current = "";
    onClearError?.();
    try {
      if (thinkingPreference === 'auto' && sessionId) {
        await agentConfig.setThinkingLevel(
          resolveAutoThinkingLevel(savedText, agentConfig.availableThinkingLevels),
        );
      }
      await onSend?.(savedText, savedAttachments, { queueBehavior });
    } catch {
      setText(savedText);
      setAttachments(savedAttachments);
    }
  }, [agentConfig, attachments, clearDraft, draftKey, hasDraft, onClearError, onSend, sessionId, setText, setAttachments, thinkingPreference, trimmedText]);

  // Queued messages are display-only: pi 0.84.3 has no `clear_queue` RPC command,
  // so AiJee cannot drop them. Stopping only aborts the current run.
  const requestAbort = useCallback(async () => {
    await onAbort?.();
  }, [onAbort]);

  const handleSubmit = useCallback(() => {
    if (sendDisabled) return;
    if (showAbortButton) { void requestAbort(); return; }
    sendDraft(isStreaming ? "steer" : undefined);
  }, [requestAbort, isStreaming, sendDraft, sendDisabled, showAbortButton]);

  // --- Slash commands ---
  const handleTextChange = useCallback((value: string) => {
    setText(value);
    if (isListeningRef.current) {
      textBeforeSpeechRef.current = value;
    }
    const slashMatch = value.match(/(?:^|\s)\/([\w:-]*)$/);
    if (slashMatch) {
      const query = slashMatch[1].toLowerCase();
      const matches = slashCommands.filter((cmd) => cmd.name.toLowerCase().startsWith(query));
      setFilteredCommands(matches);
      setSlashIndex(0);
      setShowCommands(matches.length > 0);
    } else {
      setShowCommands(false);
    }
  }, [setText, slashCommands]);

  const handleSelectCommand = useCallback((command: SlashCommand) => {
    const newText = text.replace(/(?:^|\s)\/([\w:-]*)$/, (match) => {
      const prefix = match.startsWith(" ") ? " " : "";
      return `${prefix}/${command.name} `;
    });
    setText(newText);
    setShowCommands(false);
    inputRef.current?.focus();
  }, [setText, text]);

  // --- Attachments ---
  const storeAddAttachment = useDraftStore((s) => s.addAttachment);
  const storeRemoveAttachment = useDraftStore((s) => s.removeAttachment);

  // Text-only models reject image blocks outright, so refuse the attachment
  // here instead of letting the turn fail after the user hits send.
  const acceptsImages = agentConfig.supportsImages;
  const [attachmentNotice, setAttachmentNotice] = useState<string | null>(null);

  useEffect(() => {
    if (acceptsImages) setAttachmentNotice(null);
  }, [acceptsImages]);

  const addAttachment = useCallback((att: Attachment) => {
    if (att.type === "image" && !acceptsImages) {
      const modelName =
        agentConfig.activeModel?.name ?? agentConfig.activeModel?.id ?? "当前模型";
      setAttachmentNotice(`${modelName} 不支持图片输入，已忽略 ${att.name}`);
      return;
    }
    setAttachmentNotice(null);
    storeAddAttachment(draftKey, att);
  }, [
    acceptsImages,
    agentConfig.activeModel,
    draftKey,
    storeAddAttachment,
  ]);

  const removeAttachment = useCallback((id: string) => {
    storeRemoveAttachment(draftKey, id);
  }, [draftKey, storeRemoveAttachment]);

  const handleFilePick = useCallback(async () => {
    if (inputDisabled) return;
    if (Platform.OS === "web") { fileInputRef.current?.click(); return; }
    const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
    if (!result.canceled && result.assets) {
      for (const asset of result.assets) {
        const isImage = asset.mimeType?.startsWith("image/");
        addAttachment({
          id: `${Date.now()}-${Math.random()}`,
          name: asset.name,
          type: isImage ? "image" : "file",
          uri: asset.uri,
          size: asset.size ?? undefined,
          // The prompt travels as base64, so a native pick has to be read here:
          // a bare file:// uri means the image is silently dropped on send.
          preview: isImage ? await readImageDataUrl(asset.uri, asset.mimeType) : undefined,
        });
      }
    }
  }, [addAttachment, inputDisabled]);

  const handleWebFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith("image/");
      const att: Attachment = {
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        type: isImage ? "image" : "file",
        size: file.size,
      };
      if (isImage) {
        const reader = new FileReader();
        reader.onload = () => { att.preview = reader.result as string; addAttachment({ ...att }); };
        reader.readAsDataURL(file);
      } else {
        addAttachment(att);
      }
    }
    e.target.value = "";
  }, [addAttachment]);

  // --- Paste handler for images (web only) ---
  const handlePaste = useCallback((e: any) => {
    if (Platform.OS !== "web") return;

    // Native ClipboardEvent exposes data on e.clipboardData directly;
    // React synthetic events expose it via e.nativeEvent.clipboardData.
    const clipboardData = e?.clipboardData ?? e?.nativeEvent?.clipboardData;
    if (!clipboardData) return;

    const items = clipboardData.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      // Check if the item is an image
      if (item.type?.startsWith("image/")) {
        e.preventDefault?.(); // Prevent default paste behavior for images
        const file = item.getAsFile?.();
        if (!file) continue;

        const reader = new FileReader();
        reader.onload = () => {
          addAttachment({
            id: `${Date.now()}-${Math.random()}`,
            name: file.name || `pasted-image-${Date.now()}`,
            type: "image",
            size: file.size,
            preview: reader.result as string,
          });
        };
        reader.readAsDataURL(file);
        return; // Only handle the first image
      }
    }
  }, [addAttachment]);

  // Register paste event listener on web
  useEffect(() => {
    if (Platform.OS !== "web" || inputDisabled) return;
    const textarea = inputRef.current as any;
    const el = textarea?.querySelector?.("textarea") ?? textarea;
    if (!el) return;

    el.addEventListener("paste", handlePaste);
    return () => el.removeEventListener("paste", handlePaste);
  }, [handlePaste, inputDisabled]);

  // --- Keyboard nav for slash commands ---
  const handleKeyPress = useCallback((e: NativeSyntheticEvent<PromptKeyPressEventData>) => {
    const { key, shiftKey, isComposing, keyCode } = e.nativeEvent;
    const isShiftEnter = key === "Enter" && shiftKey;
    const isImeComposing = isComposing === true || keyCode === 229;
    const PAGE_SIZE = 7;

    if (showCommands && filteredCommands.length > 0) {
      if (key === "ArrowUp") { e.preventDefault?.(); setSlashIndex((prev) => prev <= 0 ? filteredCommands.length - 1 : prev - 1); return; }
      if (key === "ArrowDown") { e.preventDefault?.(); setSlashIndex((prev) => prev >= filteredCommands.length - 1 ? 0 : prev + 1); return; }
      if (key === "PageUp") { e.preventDefault?.(); setSlashIndex((prev) => Math.max(0, prev - PAGE_SIZE)); return; }
      if (key === "PageDown") { e.preventDefault?.(); setSlashIndex((prev) => Math.min(filteredCommands.length - 1, prev + PAGE_SIZE)); return; }
      if (key === "Home") { e.preventDefault?.(); setSlashIndex(0); return; }
      if (key === "End") { e.preventDefault?.(); setSlashIndex(filteredCommands.length - 1); return; }
      if (key === "Tab" || (key === "Enter" && !isShiftEnter)) { e.preventDefault?.(); handleSelectCommand(filteredCommands[slashIndex]); return; }
      if (key === "Escape") { setShowCommands(false); return; }
    }

    if (key === "Escape" && showAbortButton) {
      e.preventDefault?.();
      void requestAbort();
      return;
    }

    if (Platform.OS === "web" && key === "Enter" && !isShiftEnter) {
      if (isImeComposing) return;
      e.preventDefault?.();
      handleSubmit();
    }
  }, [requestAbort, filteredCommands, handleSelectCommand, handleSubmit, showAbortButton, showCommands, slashIndex]);


  return {
    theme, isWideScreen, inputRef, fileInputRef, fadeAnim, slideAnim, dropdownAnim, keyboardVisible,
    errorMessage, onClearError, speechError, clearSpeechError, queuedCount, queuedMessages, isStreaming: !!isStreaming,
    requestAbort, showCommands, filteredCommands, slashIndex, shouldOverlaySlashCommands, handleSelectCommand,
    attachments, removeAttachment, attachmentNotice, stackedAbove, toolbarOverlap, entryDone, isFocused,
    lineCount, text, handleTextChange, handleKeyPress, inputDisabled, sendDisabled, canComposeWhileDisabled,
    setIsFocused, handleWebFileChange, handleFilePick, isListening, handleMicPress, audioLevel, inlineToolbar,
    sessionId, setMobileSheet, setToolbarPopoverOpen, streamedMode, sessionReady, agentConfig, thinkingPreference,
    setThinkingPreference, contextUsage, showQueueActions, sendDraft, showAbortButton, handleSubmit, hasDraft,
    toolbarHiddenKeepLayout, toolbarCollapsed, toolbarPopoverOpen, mobileSheet, closeMobileSheet,
  };
}
