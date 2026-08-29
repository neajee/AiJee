import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/theme";
import { useResponsiveLayout } from "@/features/navigation/hooks/use-responsive-layout";
import { PromptInput } from "@/features/workspace/components/prompt-input";
import { WorkspaceSidebar } from "@/features/workspace/components/workspace-sidebar";
import { WorkspaceRightPane } from "@/features/preview/components/workspace-right-pane";
import { useWorkspaceStore } from "@/features/workspace/store";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MessageList } from "@/features/agent/components/message-list";
import { ChatShimmer } from "@/features/agent/components/message-list/chat-shimmer";
import { ExtensionUiDialog } from "@/features/agent/components/extension-ui-dialog";
import { DiffPanelProvider } from "@/features/agent/components/diff-panel/context";
import { DiffSidebar } from "@/features/agent/components/diff-panel";
import { MobileDiffSheetProvider } from "@/features/agent/components/message-list/mobile-diff-sheet";
import { useAgentSession, useConnection, useWorkspaceSessions as useSessions } from "@pideck/client-sdk";
import type { ImageContent } from "@pideck/client-sdk";
import { requestBrowserNotificationPermission } from "@/features/agent/browser-notifications";
import type { PendingExtensionUiRequest as LegacyPendingUiRequest } from "@/features/agent/extension-ui";
import type { ChatMessage } from "@/features/agent/types";
import type { Attachment } from "@/features/workspace/components/prompt-input/constants";
import { attachmentsToImages } from "@/features/workspace/components/prompt-input/attachment-images";

export default function SessionScreen() {
  const { workspaceId, sessionId } = useLocalSearchParams<{
    workspaceId: string;
    sessionId: string;
  }>();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { isWideScreen } = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace);
  const clearWorkspaceNotification = useWorkspaceStore(
    (s) => s.clearWorkspaceNotification,
  );
  const clearSessionNotification = useWorkspaceStore(
    (s) => s.clearSessionNotification,
  );
  const setLastSession = useWorkspaceStore((s) => s.setLastSession);

  useEffect(() => {
    if (!workspaceId) return;
    selectWorkspace(workspaceId);
    clearWorkspaceNotification(workspaceId);
  }, [workspaceId, selectWorkspace, clearWorkspaceNotification]);

  // Reading the session is what marks it seen.
  useEffect(() => {
    if (sessionId) clearSessionNotification(sessionId);
  }, [sessionId, clearSessionNotification]);

  useEffect(() => {
    if (workspaceId && sessionId) {
      setLastSession(workspaceId, sessionId);
    }
  }, [workspaceId, sessionId, setLastSession]);

  const { sessions } = useSessions(workspaceId ?? null);
  const session = (sessions as { id: string; file_path: string }[])?.find(
    (s) => s.id === sessionId,
  );
  const sessionFile = session?.file_path || "";

  const agentSession = useAgentSession(sessionId ?? null, {
    workspaceId: workspaceId ?? "",
    sessionFile,
  });

  const messages = agentSession.messages as ChatMessage[];

  const connection = useConnection();
  const inputBlockedByConnection =
    connection.status === "reconnecting" || connection.status === "disconnected";

  const handleSend = useCallback(
    async (
      text: string,
      attachments: Attachment[],
      options?: { queueBehavior?: "steer" | "followUp" },
    ) => {
      if (!sessionId || inputBlockedByConnection) return;
      setAlertMessage(null);
      requestBrowserNotificationPermission();

      let images: ImageContent[] | undefined = attachmentsToImages(attachments);

      // Always send through `prompt` and let pi decide from its own live state
      // whether to run now or queue. Picking steer/followUp here from a possibly
      // stale local isStreaming flag could queue the message in an idle agent,
      // where nothing ever drains it and the message is silently lost.
      const streamingBehavior = options?.queueBehavior ?? "steer";

      try {
        await agentSession.prompt(text, { images, streamingBehavior });
      } catch (error) {
        setAlertMessage(
          error instanceof Error ? error.message : "Failed to send prompt",
        );
        throw error;
      }
    },
    [inputBlockedByConnection, sessionId, agentSession],
  );

  const handleAbort = useCallback(async () => {
    if (!sessionId) return;
    setAlertMessage(null);
    try {
      await agentSession.abort();
    } catch (error) {
      setAlertMessage(
        error instanceof Error ? error.message : "Failed to abort",
      );
    }
  }, [sessionId, agentSession]);

  const clearAlert = useCallback(() => setAlertMessage(null), []);

  const isDark = colorScheme === "dark";
  const editorBg = isDark ? "#151515" : "#FAFAFA";

  const keyboardPadding = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // iOS does not auto-avoid the keyboard, so we animate a bottom padding.
    // On Android the window resizes (adjustResize) automatically, so adding a
    // manual padding here would double-count and create a blank gap behind the
    // keyboard (the reported mobile input layout anomaly). Web is a no-op.
    if (Platform.OS !== "ios") return;
    const showEvent = "keyboardWillShow";
    const hideEvent = "keyboardWillHide";
    const showSub = Keyboard.addListener(showEvent, (e) => {
      const height = e.endCoordinates.height - insets.bottom;
      Animated.spring(keyboardPadding, {
        toValue: height,
        tension: 160,
        friction: 20,
        useNativeDriver: false,
      }).start();
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      Animated.spring(keyboardPadding, {
        toValue: 0,
        tension: 160,
        friction: 20,
        useNativeDriver: false,
      }).start();
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardPadding, insets.bottom]);

  const hasMessages = messages.length > 0;

  return (
    <DiffPanelProvider messages={messages}>
      <MobileDiffSheetProvider>
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? "#121212" : colors.background,
            paddingBottom: isWideScreen
              ? 0
              : Animated.add(keyboardPadding, insets.bottom),
          },
        ]}
      >
        <View style={styles.upperRow}>
          <View style={[styles.editorColumn, { backgroundColor: editorBg }]}>
            {agentSession.isReady && hasMessages && sessionId ? (
              <MessageList key={sessionId} sessionId={sessionId} />
            ) : agentSession.isLoading || (!agentSession.isReady && sessionId) ? (
              Platform.OS === "ios" ? (
                <View style={styles.emptyCenter}>
                  <ActivityIndicator size="small" />
                </View>
              ) : (
                <ChatShimmer />
              )
            ) : (
              <View style={styles.emptyCenter} />
            )}
            <ExtensionUiDialog
              sessionId={sessionId}
              request={agentSession.pendingExtensionUiRequest as LegacyPendingUiRequest | null}
            />
            <PromptInput
              sessionId={sessionId}
              onSend={handleSend}
              isStreaming={agentSession.isStreaming}
              onAbort={handleAbort}
              sessionReady={agentSession.isReady}
              disabled={
                inputBlockedByConnection ||
                !!agentSession.pendingExtensionUiRequest
              }
              allowTypingWhileDisabled={!inputBlockedByConnection}
              stackedAbove={!!agentSession.pendingExtensionUiRequest}
              errorMessage={alertMessage}
              onClearError={clearAlert}
            />
          </View>

          {isWideScreen && (
            <>
              <DiffSidebar messages={messages} />
              <WorkspaceSidebar>
                <View style={{ flex: 1, backgroundColor: editorBg }}>
                  <WorkspaceRightPane sessionId={sessionId ?? null} />
                </View>
              </WorkspaceSidebar>
            </>
          )}
        </View>
      </Animated.View>
      </MobileDiffSheetProvider>
    </DiffPanelProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  upperRow: {
    flex: 1,
    flexDirection: "row",
  },
  editorColumn: {
    flex: 1,
  },
  emptyCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
