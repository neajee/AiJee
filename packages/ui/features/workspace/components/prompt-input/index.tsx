import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import {
  Animated,
  Keyboard,
  LayoutAnimation,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from "react-native";
import { Plus, ArrowUp, Mic, Square } from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import { File as ExpoFile } from "expo-file-system";
import { useQuery } from "@tanstack/react-query";

import { Fonts } from "@/constants/theme";
import { formatAgentModeLabel } from "@/features/agent/mode";
import { useCachedAgentConfig } from "@/features/agent/hooks/use-cached-agent-config";
import { useAgentSession, usePiClient } from "@aijee/client-sdk";
import { useResponsiveLayout } from "@/features/navigation/hooks/use-responsive-layout";
import { useSpeechRecognition } from "@/features/speech/hooks/use-speech-recognition";
import { useSpeechSettingsStore } from "@/features/speech/store";

import {
  SlashCommand,
  Attachment,
} from "./constants";
import { usePromptTheme } from "./use-theme-colors";
import { SlashCommandDropdown } from "./slash-command-dropdown";
import { AttachmentChips } from "./attachment-chips";
import { Toolbar } from "./toolbar";
import { MobileModelSheet } from "./mobile-model-sheet";
import { MobileEffortSheet } from "./mobile-effort-sheet";
import { WaveformBars } from "./waveform-bars";
import { ToolbarSkeleton } from "./toolbar-skeleton";
import { ContextUsageRing } from "./context-usage-ring";
import { useDraftStore } from "./draft-store";

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

type QueueBehavior = "steer" | "followUp";

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

interface PromptInputProps {
  sessionId?: string | null;
  onSend?: (
    text: string,
    attachments: Attachment[],
    options?: { queueBehavior?: QueueBehavior },
  ) => Promise<void> | void;
  isStreaming?: boolean;
  onAbort?: () => void | Promise<void>;
  disabled?: boolean;
  sessionReady?: boolean;
  allowTypingWhileDisabled?: boolean;
  stackedAbove?: boolean;
  errorMessage?: string | null;
  onClearError?: () => void;
}

export function PromptInput({
  sessionId,
  onSend,
  isStreaming,
  onAbort,
  disabled,
  sessionReady = true,
  allowTypingWhileDisabled = false,
  stackedAbove = false,
  errorMessage,
  onClearError,
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
  // Wide viewports fold the model/mode controls into the input card's action
  // row, so the composer is a single line; narrow ones keep the separate strip
  // below the card, where there is room for them.
  const inlineToolbar = isWideScreen;
  const toolbarHiddenKeepLayout = !isWideScreen && !!mobileSheet;
  const toolbarCollapsed = !isWideScreen && hideBottomForKeyboard;
  const toolbarOverlap = inlineToolbar ? 0 : Platform.OS === "web" ? -4 : -1;
  const shouldOverlaySlashCommands = Platform.OS === "web" || isWideScreen;
  const toolbarSkeleton = useMemo(
    () => <ToolbarSkeleton isDark={theme.isDark} />,
    [theme.isDark],
  );
  // The inline toolbar lives inside the action row, so it needs a chrome-less
  // placeholder: passing null used to make the model control vanish entirely
  // while the pre-session's config loaded on the workspace start page.
  const inlineToolbarSkeleton = useMemo(
    () => <ToolbarSkeleton inline isDark={theme.isDark} />,
    [theme.isDark],
  );

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
      await onSend?.(savedText, savedAttachments, { queueBehavior });
    } catch {
      setText(savedText);
      setAttachments(savedAttachments);
    }
  }, [attachments, clearDraft, draftKey, hasDraft, onClearError, onSend, setText, setAttachments, trimmedText]);

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

  // =========================================================================
  // Render
  // =========================================================================

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

        {/* Input card */}
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.cardBorder,
              borderTopLeftRadius:
                (showCommands && !shouldOverlaySlashCommands) || stackedAbove ? 0 : 12,
              borderTopRightRadius:
                (showCommands && !shouldOverlaySlashCommands) || stackedAbove ? 0 : 12,
              marginBottom: toolbarOverlap,
              ...(entryDone
                ? Platform.OS === "web"
                  ? {
                      boxShadow: isFocused ? "0px 2px 6px rgba(0, 0, 0, 0.08)" : "0px 0px 0px rgba(0, 0, 0, 0)",
                      transitionProperty: "box-shadow",
                      transitionDuration: "180ms",
                      transitionTimingFunction: "ease",
                    }
                  : {
                      boxShadow: isFocused
                        ? `0px ${Platform.OS === "ios" ? 2 : 3}px ${Platform.OS === "ios" ? 5 : 8}px rgba(0, 0, 0, ${Platform.OS === "ios" ? 0.07 : 0.1})`
                        : "0px 0px 0px rgba(0, 0, 0, 0)",
                      elevation: isFocused ? 2 : 0,
                    }
                : {}),
            } as any,
          ]}
        >
        <TextInput
          ref={inputRef}
          placeholder="Ask anything..."
          placeholderTextColor={theme.textMuted}
          style={[
            styles.input,
            { color: theme.textPrimary },
            sendDisabled && !canComposeWhileDisabled && { opacity: 0.5 },
          ]}
          editable={!inputDisabled}
          multiline
          numberOfLines={lineCount}
          {...(Platform.OS === "web" ? ({ rows: lineCount } as any) : {})}
          value={text}
          onChangeText={handleTextChange}
          onKeyPress={handleKeyPress}
          onTouchStart={undefined}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessibilityLabel="Prompt input"
          accessibilityHint="Press Enter to send, Shift+Enter for a new line, and type / for commands."
        />

        <View style={styles.actionRow}>
          {Platform.OS === "web" && (
            <input
              ref={fileInputRef as any}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.md,.json,.csv,.js,.ts,.tsx,.jsx,.py,.go,.rs,.java,.c,.cpp,.h"
              onChange={handleWebFileChange as any}
              style={{ display: "none" }}
            />
          )}
          <Pressable
            style={styles.attachButton}
            onPress={handleFilePick}
            disabled={inputDisabled}
            accessibilityRole="button"
            accessibilityLabel="Attach file"
          >
            <Plus size={18} color={theme.textMuted} strokeWidth={1.8} />
          </Pressable>
          {isListening ? (
            <Pressable style={styles.micWaveRow} onPress={handleMicPress} accessibilityRole="button" accessibilityLabel="Stop recording">
              <Square size={12} color="#EF4444" strokeWidth={2} fill="#EF4444" />
              <WaveformBars audioLevel={audioLevel} />
            </Pressable>
          ) : (
            <Pressable style={styles.micButton} onPress={handleMicPress} disabled={inputDisabled} accessibilityRole="button" accessibilityLabel="Start voice input">
              <Mic size={16} color={theme.textMuted} strokeWidth={1.8} />
            </Pressable>
          )}
          <View style={{ flex: 1 }} />
          {/* Model, usage and send share the trailing edge: pick what runs, see
              what it costs, then send. */}
          {inlineToolbar && (
            <Toolbar
              inline
              sessionId={sessionId}
              isWideScreen={isWideScreen}
              onOpenMobileSheet={(type) => setMobileSheet(type)}
              onDropdownOpenChange={setToolbarPopoverOpen}
              inputRef={inputRef}
              skeleton={inlineToolbarSkeleton}
              modeLabel={
                sessionId && sessionReady && streamedMode
                  ? formatAgentModeLabel(streamedMode)
                  : null
              }
              ready={!!sessionReady && !!sessionId}
              config={agentConfig}
            />
          )}
          {contextUsage ? (
            <ContextUsageRing used={contextUsage.used} total={contextUsage.total} isDark={theme.isDark} />
          ) : null}
          {showQueueActions ? (
            <View style={styles.queueActionGroup}>
              {(["steer", "followUp"] as QueueBehavior[]).map((behavior) => (
                <Pressable
                  key={behavior}
                  accessibilityRole="button"
                  accessibilityLabel={`Send as ${formatQueueBehaviorLabel(behavior)}`}
                  onPress={() => sendDraft(behavior)}
                  disabled={sendDisabled}
                  style={({ pressed }) => [
                    styles.queueActionButton,
                    {
                      backgroundColor: theme.isDark ? "#242422" : "#EFEDE8",
                      borderColor: theme.cardBorder,
                      opacity: sendDisabled ? 0.45 : pressed ? 0.82 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.queueActionText, { color: theme.textSecondary }]}>
                    {formatQueueBehaviorLabel(behavior)}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showAbortButton ? "Stop generation" : "Send message"}
              onPress={handleSubmit}
              disabled={sendDisabled || (!showAbortButton && !hasDraft)}
              style={({ pressed }) => [
                styles.sendButton,
                {
                  backgroundColor: theme.isDark ? "#4d4d4b" : theme.colors.text,
                  opacity: (sendDisabled || (!showAbortButton && !hasDraft)) ? 0.45 : pressed ? 0.85 : 1,
                },
              ]}
            >
              {showAbortButton ? (
                <Square size={12} color="#FFFFFF" strokeWidth={2} fill="#FFFFFF" />
              ) : (
                <ArrowUp size={16} color={theme.isDark ? "#fefdfd" : theme.colors.background} strokeWidth={2} />
              )}
            </Pressable>
          )}
        </View>
        </Animated.View>
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
            skeleton={toolbarSkeleton}
            modeLabel={
              sessionId && sessionReady && streamedMode
                ? formatAgentModeLabel(streamedMode)
                : null
            }
            ready={!!sessionReady && !!sessionId}
            config={agentConfig}
          />
        </View>
      )}

      {sessionReady && mobileSheet === "model" && (
        <MobileModelSheet visible sessionId={sessionId} onClose={closeMobileSheet} config={agentConfig} />
      )}
      {sessionReady && mobileSheet === "effort" && (
        <MobileEffortSheet visible sessionId={sessionId} onClose={closeMobileSheet} config={agentConfig} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    maxWidth: 1080,
    alignSelf: "center",
    width: "100%",
    overflow: "visible",
  },
  sendError: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  sendErrorText: {
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  speechError: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  speechErrorText: {
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  composerStack: {
    position: "relative",
    overflow: "visible",
    zIndex: Platform.OS === "android" ? 8 : 10,
  },
  attachmentNotice: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    lineHeight: 15,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  card: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 0.633,
    position: "relative",
    zIndex: Platform.OS === "android" ? 5 : 8,
  },
  input: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    fontSize: 15,
    fontFamily: Fonts.sans,
    outlineStyle: "none" as never,
  },
  actionRow: {
    flexDirection: "row",
    // Centred: the row now mixes 32px round buttons with the shorter model
    // control, and bottom alignment would leave the text sitting low.
    alignItems: "center",
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  attachButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  micButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  micWaveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 32,
    paddingHorizontal: 4,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  queueActionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  queueActionButton: {
    height: 32,
    borderRadius: 999,
    borderWidth: 0.633,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  queueActionText: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
  },
  queuePanel: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    marginBottom: 8,
    padding: 8,
    gap: 6,
  },
  queueHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  queueHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  queueStatus: {
    fontSize: 11,
    fontFamily: Fonts.sans,
  },
  queueActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  queueActionLabel: {
    fontSize: 11,
    fontFamily: Fonts.sansMedium,
  },
  queuedMessageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  queuedMessageKind: {
    width: 52,
    fontSize: 10,
    fontFamily: Fonts.sansMedium,
  },
  queuedMessageText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Fonts.sans,
  },
  bottomControlsWrap: {
    overflow: "visible",
    position: "relative",
    zIndex: Platform.OS === "android" ? 4 : 7,
  },
  bottomControlsWrapElevated: {
    zIndex: Platform.OS === "android" ? 12 : 12,
  },
  bottomControlsHidden: {
    opacity: 0,
    pointerEvents: "none" as const,
  },
  bottomControlsCollapsed: {
    height: 0,
    overflow: "hidden" as const,
    opacity: 0,
    pointerEvents: "none" as const,
  },
});
