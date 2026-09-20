import { createFileRoute } from "@tanstack/react-router";
import { useLocalSearchParams, useRouter } from "@/hooks/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSafeAreaInsets } from "@/platform/browser";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { PromptInput } from "@/features/workspace/components/prompt-input";
import { WorkspaceSidebar } from "@/features/workspace/components/workspace-sidebar";
import { WorkspaceRightPane } from "@/features/preview/components/workspace-right-pane";
import { useWorkspaceStore } from "@/features/workspace/store";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { MessageList } from "@/features/agent/components/message-list";
import { ChatShimmer } from "@/features/agent/components/message-list/chat-shimmer";
import { ExtensionUiDialog } from "@/features/agent/components/extension-ui-dialog/index";
import { DiffPanelProvider } from "@/features/agent/components/diff-panel/context";
import { DiffSidebar } from "@/features/agent/components/diff-panel";
import { NarrowDiffSheetProvider } from "@/features/agent/hooks/use-narrow-diff-sheet";
import { useAgentSession, useConnection, useWorkspaceSessions as useSessions } from "@aijee/client-sdk";
import type { ImageContent } from "@aijee/client-sdk";
import { requestBrowserNotificationPermission } from "@/features/agent/browser-notifications";
import type { PendingExtensionUiRequest as LegacyPendingUiRequest } from "@/features/agent/extension-ui";
import type { ChatMessage } from "@/features/agent/agent-types";
import type { Attachment } from "@/features/workspace/utils/prompt-input";
import { attachmentsToImages } from "@/features/workspace/utils/prompt-input-attachments";
export default function SessionScreen() {
  const {
    workspaceId,
    sessionId
  } = useLocalSearchParams<{
    workspaceId: string;
    sessionId: string;
  }>();
  const router = useRouter();
  const colors = useThemeTokens();
  const {
    isWideScreen
  } = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const selectWorkspace = useWorkspaceStore(s => s.selectWorkspace);
  const clearWorkspaceNotification = useWorkspaceStore(s => s.clearWorkspaceNotification);
  const clearSessionNotification = useWorkspaceStore(s => s.clearSessionNotification);
  const setLastSession = useWorkspaceStore(s => s.setLastSession);
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
  const {
    sessions
  } = useSessions(workspaceId ?? null);
  const session = (sessions as {
    id: string;
    file_path: string;
  }[])?.find(s => s.id === sessionId);
  const sessionFile = session?.file_path || "";
  const agentSession = useAgentSession(sessionId ?? null, {
    workspaceId: workspaceId ?? "",
    sessionFile
  });
  const messages = agentSession.messages as ChatMessage[];
  const connection = useConnection();
  const inputBlockedByConnection = connection.status === "reconnecting" || connection.status === "disconnected";
  const handleSend = useCallback(async (text: string, attachments: Attachment[], options?: {
    queueBehavior?: "steer" | "followUp";
  }) => {
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
      await agentSession.prompt(text, {
        images,
        streamingBehavior
      });
    } catch (error) {
      setAlertMessage(error instanceof Error ? error.message : "Failed to send prompt");
      throw error;
    }
  }, [inputBlockedByConnection, sessionId, agentSession]);
  const handleAbort = useCallback(async () => {
    if (!sessionId) return;
    setAlertMessage(null);
    try {
      await agentSession.abort();
    } catch (error) {
      setAlertMessage(error instanceof Error ? error.message : "Failed to abort");
    }
  }, [sessionId, agentSession]);
  const clearAlert = useCallback(() => setAlertMessage(null), []);
  const editorBg = colors.background;
  const hasMessages = messages.length > 0;
  return <DiffPanelProvider messages={messages}>
      <NarrowDiffSheetProvider>
      <div className={"  pb-0"}>
        <div className={"block"}>
          <div>
            {agentSession.isReady && hasMessages && sessionId ? <MessageList key={sessionId} sessionId={sessionId} onForked={nextSessionId => {
              router.replace(`/workspace/${workspaceId}/s/${nextSessionId}`);
            }} /> : agentSession.isLoading || !agentSession.isReady && sessionId ? <ChatShimmer /> : <div className={"block"} />}
            <ExtensionUiDialog sessionId={sessionId} request={agentSession.pendingExtensionUiRequest as LegacyPendingUiRequest | null} />
            <PromptInput sessionId={sessionId} onSend={handleSend} isStreaming={agentSession.isStreaming} onAbort={handleAbort} sessionReady={agentSession.isReady} disabled={inputBlockedByConnection || !!agentSession.pendingExtensionUiRequest} allowTypingWhileDisabled={!inputBlockedByConnection} stackedAbove={!!agentSession.pendingExtensionUiRequest} errorMessage={alertMessage} onClearError={clearAlert} />
          </div>

          {isWideScreen && <>
              <DiffSidebar messages={messages} />
              <WorkspaceSidebar>
                <div className={"flex-1"}>
                  <WorkspaceRightPane sessionId={sessionId ?? null} />
                </div>
              </WorkspaceSidebar>
            </>}
        </div>
</div>
    </NarrowDiffSheetProvider>
    </DiffPanelProvider>;
}
const styles = {
  container: {
    flex: 1
  },
  upperRow: {
    flex: 1,
    flexDirection: "row"
  },
  editorColumn: {
    flex: 1
  },
  emptyCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  }
} as const;
export const Route = createFileRoute("/_app/workspace/$workspaceId/s/$sessionId")({
  component: SessionScreen
});
