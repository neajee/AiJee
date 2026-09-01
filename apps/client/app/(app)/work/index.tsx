import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Fonts } from "@/constants/theme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { useResponsiveLayout } from "@/features/navigation/hooks/use-responsive-layout";
import { PromptInput } from "@/features/workspace/components/prompt-input";
import { WorkspaceHero } from "@/features/workspace/components/workspace-hero";
import { attachmentsToImages } from "@/features/workspace/components/prompt-input/attachment-images";
import type { Attachment } from "@/features/workspace/components/prompt-input/constants";
import { requestBrowserNotificationPermission } from "@/features/agent/browser-notifications";
import { usePiClient } from "@aijee/client-sdk";

type PendingWorkSession = { session_id: string; session_file?: string };

export default function WorkIndex() {
  const router = useRouter();
  const client = usePiClient();
  const colors = useThemeTokens();
  const { isWideScreen } = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const sendingRef = useRef(false);
  const sessionRef = useRef<PendingWorkSession | null>(null);
  const keyboardPadding = useRef(new Animated.Value(0)).current;

  const handleSend = useCallback(async (text: string, attachments: Attachment[]) => {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setErrorMessage(null);
    requestBrowserNotificationPermission();

    try {
      // Work sessions stay in AiJee's private cwd and are created only once the
      // user has actually asked something, so opening the home page is free.
      const session = sessionRef.current ?? await client.createChatSession({ noTools: true });
      sessionRef.current = session;
      await client.prompt(session.session_id, text, {
        images: attachmentsToImages(attachments),
      });
      router.replace({
        pathname: "/work/[sessionId]" as any,
        params: {
          sessionId: session.session_id,
          sessionFile: session.session_file ?? "",
        },
      });
    } catch (error) {
      sendingRef.current = false;
      setSending(false);
      setErrorMessage(error instanceof Error ? error.message : "Unable to start work session");
      throw error;
    }
  }, [client, router]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (event) => {
      const height = Platform.OS === "ios"
        ? event.endCoordinates.height - insets.bottom
        : event.endCoordinates.height;
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
  }, [insets.bottom, keyboardPadding]);

    const editorBg = colors.background;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingBottom: isWideScreen ? 0 : Animated.add(keyboardPadding, insets.bottom),
        },
      ]}
    >
      <View style={[styles.editorColumn, { backgroundColor: editorBg }]}>
        <View style={styles.centerStack}>
          {sending ? (
            <View style={styles.sendingContainer}>
              <ActivityIndicator size="small" color={colors.textSecondary} />
              <Text style={[styles.sendingText, { color: colors.textSecondary }]}>
                Starting Work…
              </Text>
            </View>
          ) : (
            <WorkspaceHero />
          )}
          <PromptInput
            onSend={handleSend}
            disabled={sending}
            sessionReady={false}
            errorMessage={errorMessage}
            onClearError={() => setErrorMessage(null)}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  editorColumn: { flex: 1 },
  centerStack: { flex: 1, justifyContent: "center", gap: 20 },
  sendingContainer: { alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 24 },
  sendingText: { fontSize: 14, fontFamily: Fonts.sansMedium },
});
