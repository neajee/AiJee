import { createFileRoute } from "@tanstack/react-router";
import { useLocalSearchParams, useRouter } from "@/platform/router-adapter";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSafeAreaInsets } from "@/platform/browser";
import { Fonts } from "@/constants/theme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { PromptInput } from "@/features/workspace/components/prompt-input";
import { attachmentsToImages } from "@/features/workspace/utils/prompt-input-attachments";
import type { Attachment } from "@/features/workspace/utils/prompt-input";
import { WorkspaceHero } from "@/features/workspace/components/workspace-hero";
import { ComposerContextBar } from "@/features/workspace/components/composer-context-bar";
import { WorkspaceSidebar } from "@/features/workspace/components/workspace-sidebar";
import { WorkspaceRightPane } from "@/features/preview/components/workspace-right-pane";
import { useWorkspaceStore } from "@/features/workspace/store";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { usePiClient, useAgentModes } from "@aijee/client-sdk";
import { requestBrowserNotificationPermission } from "@/features/agent/browser-notifications";
export default function WorkspaceScreen() {
  const {
    workspaceId
  } = useLocalSearchParams<{
    workspaceId: string;
  }>();
  const router = useRouter();
  const colors = useThemeTokens();
  const {
    isWideScreen
  } = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const client = usePiClient();
  const selectWorkspace = useWorkspaceStore(s => s.selectWorkspace);
  const clearWorkspaceNotification = useWorkspaceStore(s => s.clearWorkspaceNotification);
  const {
    modes: rawModes,
    loaded: modesLoaded
  } = useAgentModes();
  const modes = Array.isArray(rawModes) ? rawModes : [];
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [preSessionId, setPreSessionId] = useState<string | null>(null);
  const pendingRef = useRef<Promise<{
    session_id: string;
  }> | null>(null);
  const currentWorkspaceRef = useRef<string | null>(workspaceId ?? null);
  useEffect(() => {
    if (workspaceId) {
      selectWorkspace(workspaceId);
      clearWorkspaceNotification(workspaceId);
    }
  }, [workspaceId, selectWorkspace, clearWorkspaceNotification]);
  useEffect(() => {
    currentWorkspaceRef.current = workspaceId ?? null;
    setPreSessionId(null);
    setSending(false);
    pendingRef.current = null;
  }, [workspaceId]);
  const selectedModeId = modes.find(mode => mode.is_default)?.id;
  const ensureSession = useCallback(async (targetWorkspaceId: string): Promise<string> => {
    if (preSessionId) return preSessionId;
    if (pendingRef.current) {
      const info = await pendingRef.current;
      return info.session_id;
    }
    const promise = client.createAgentSession({
      workspaceId: targetWorkspaceId,
      modeId: selectedModeId,
      draft: true
    });
    pendingRef.current = promise;
    try {
      const info = await promise;
      if (currentWorkspaceRef.current === targetWorkspaceId) {
        setPreSessionId(info.session_id);
      }
      return info.session_id;
    } finally {
      if (pendingRef.current === promise) {
        pendingRef.current = null;
      }
    }
  }, [client, preSessionId, selectedModeId]);
  useEffect(() => {
    if (!workspaceId || preSessionId || !modesLoaded) return;
    void ensureSession(workspaceId).catch(error => {
      setAlertMessage(error instanceof Error ? error.message : "Failed to prepare session");
    });
  }, [ensureSession, preSessionId, workspaceId, modesLoaded]);
  const handleSend = useCallback(async (text: string, attachments: Attachment[]) => {
    if (!workspaceId || !modesLoaded || sending) return;
    setAlertMessage(null);
    requestBrowserNotificationPermission();
    setSending(true);
    try {
      const sessionId = await ensureSession(workspaceId);
      // The first message of a session can carry attachments just like any
      // other, so the images have to travel with it.
      await client.prompt(sessionId, text, {
        workspaceId,
        images: attachmentsToImages(attachments)
      });
      router.replace(`/workspace/${workspaceId}/s/${sessionId}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create session or send prompt";
      setAlertMessage(message);
      setSending(false);
      throw e;
    }
  }, [workspaceId, modesLoaded, sending, ensureSession, client, router]);
  const clearAlert = useCallback(() => setAlertMessage(null), []);
  const editorBg = colors.background;
  return <div className={"" + " " + "pb-[0]"}>
      <div className={""}>
        <div className={"" + " " + ""}>
          {/* Hero and composer are one vertically centred group, so the mark,
              the greeting and the input read as a single focal block. */}
          <div className={""}>
            {sending ? <div className={""}>
                <span size="small" color={colors.textSecondary} />
                <span className={"" + " " + ""}>
                  Starting session…
                </span>
              </div> : <WorkspaceHero />}
            <div>
              {/* Project / environment / branch are the preconditions of the
                  prompt, so they sit directly above the composer. */}
              {!sending && <ComposerContextBar />}
              <PromptInput sessionId={preSessionId} onSend={handleSend} disabled={sending} sessionReady={!!preSessionId} errorMessage={alertMessage} onClearError={clearAlert} />
            </div>
          </div>
        </div>
        {isWideScreen && <WorkspaceSidebar storageScope="start" defaultCollapsed locked>
            <div className={"flex-1"}>
              <WorkspaceRightPane sessionId={preSessionId} />
            </div>
          </WorkspaceSidebar>}
      </div>
    </div>;
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
  centerStack: {
    flex: 1,
    justifyContent: "center",
    gap: 20
  },
  sendingContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 24,
    paddingBottom: 24
  },
  sendingText: {
    fontSize: 14,
    fontFamily: Fonts.sansMedium
  }
} as const;
export const Route = createFileRoute("/_app/workspace/$workspaceId/")({
  component: WorkspaceScreen
});
