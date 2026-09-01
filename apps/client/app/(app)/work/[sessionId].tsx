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

import { useResponsiveLayout } from "@/features/navigation/hooks/use-responsive-layout";
import { PromptInput } from "@/features/workspace/components/prompt-input";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { MessageList } from "@/features/agent/components/message-list";
import { ChatShimmer } from "@/features/agent/components/message-list/chat-shimmer";
import { ExtensionUiDialog } from "@/features/agent/components/extension-ui-dialog";
import { useAgentSession, useChatSessions, useConnection } from "@aijee/client-sdk";
import type { ImageContent } from "@aijee/client-sdk";
import { requestBrowserNotificationPermission } from "@/features/agent/browser-notifications";
import type { PendingExtensionUiRequest as LegacyPendingUiRequest } from "@/features/agent/extension-ui";
import type { ChatMessage } from "@/features/agent/types";
import type { Attachment } from "@/features/workspace/components/prompt-input/constants";
import { attachmentsToImages } from "@/features/workspace/components/prompt-input/attachment-images";

export default function WorkSessionScreen() {
  const { sessionId, sessionFile: sessionFileParam } = useLocalSearchParams<{
    sessionId: string;
    sessionFile?: string;
  }>();
  const colorScheme = useColorScheme() ?? "light";
  const colors = useThemeTokens();
  const { isWideScreen } = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const { sessions } = useChatSessions();
  const session = sessions.find((item) => item.id === sessionId);
  const sessionFile = session?.file_path ?? (typeof sessionFileParam === "string" ? sessionFileParam : "");

  const agentSession = useAgentSession(sessionId ?? null, { sessionFile });
  const messages = agentSession.messages as ChatMessage[];
  const connection = useConnection();
  const inputBlockedByConnection =
    connection.status === "reconnecting" || connection.status === "disconnected";

  useEffect(() => {
    setAlertMessage(null);
  }, [sessionId]);

  const handleSend = useCallback(
    async (
      text: string,
      attachments: Attachment[],
      options?: { queueBehavior?: "steer" | "followUp" },
    ) => {
      if (!sessionId || inputBlockedByConnection) return;
      setAlertMessage(null);
      requestBrowserNotificationPermission();
      const images: ImageContent[] | undefined = attachmentsToImages(attachments);
      try {
        await agentSession.prompt(text, {
          images,
          streamingBehavior: options?.queueBehavior ?? "steer",
        });
      } catch (error) {
        setAlertMessage(error instanceof Error ? error.message : "Failed to send prompt");
        throw error;
      }
    },
    [agentSession, inputBlockedByConnection, sessionId],
  );

  const handleAbort = useCallback(async () => {
    if (!sessionId) return;
    setAlertMessage(null);
    try {
      await agentSession.abort();
    } catch (error) {
      setAlertMessage(error instanceof Error ? error.message : "Failed to abort");
    }
  }, [agentSession, sessionId]);

  const clearAlert = useCallback(() => setAlertMessage(null), []);
  const isDark = colorScheme === "dark";
  const keyboardPadding = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    const showSub = Keyboard.addListener("keyboardWillShow", (event) => {
      Animated.spring(keyboardPadding, {
        toValue: event.endCoordinates.height - insets.bottom,
        tension: 160,
        friction: 20,
        useNativeDriver: false,
      }).start();
    });
    const hideSub = Keyboard.addListener("keyboardWillHide", () => {
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
  }, [insets.bottom, keyboardPadding]);

  const hasMessages = messages.length > 0;
  return (
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
      <View style={styles.editorColumn}>
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
          disabled={inputBlockedByConnection || !!agentSession.pendingExtensionUiRequest}
          allowTypingWhileDisabled={!inputBlockedByConnection}
          stackedAbove={!!agentSession.pendingExtensionUiRequest}
          errorMessage={alertMessage}
          onClearError={clearAlert}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  editorColumn: { flex: 1 },
  emptyCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
});
