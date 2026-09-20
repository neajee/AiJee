import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "@/hooks/router";
import { useSafeAreaInsets } from "@/platform/browser";
import { Fonts } from "@/constants/theme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { PromptInput } from "@/features/workspace/components/prompt-input";
import { WorkspaceHero } from "@/features/workspace/components/workspace-hero";
import { attachmentsToImages } from "@/features/workspace/utils/prompt-input-attachments";
import type { Attachment } from "@/features/workspace/utils/prompt-input";
import { requestBrowserNotificationPermission } from "@/features/agent/browser-notifications";
import { usePiClient } from "@aijee/client-sdk";
type PendingWorkSession = {
  session_id: string;
  session_file?: string;
};
export default function WorkIndex() {
  const router = useRouter();
  const client = usePiClient();
  const colors = useThemeTokens();
  const {
    isWideScreen
  } = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const sendingRef = useRef(false);
  const sessionRef = useRef<PendingWorkSession | null>(null);
  const handleSend = useCallback(async (text: string, attachments: Attachment[]) => {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setErrorMessage(null);
    requestBrowserNotificationPermission();
    try {
      // Work sessions stay in AiJee's private cwd and are created only once the
      // user has actually asked something, so opening the home page is free.
      const session = sessionRef.current ?? (await client.createChatSession({
        noTools: true
      }));
      sessionRef.current = session;
      await client.prompt(session.session_id, text, {
        images: attachmentsToImages(attachments)
      });
      router.replace({
        pathname: "/work/[sessionId]" as any,
        params: {
          sessionId: session.session_id,
          sessionFile: session.session_file ?? ""
        }
      });
    } catch (error) {
      sendingRef.current = false;
      setSending(false);
      setErrorMessage(error instanceof Error ? error.message : "Unable to start work session");
      throw error;
    }
  }, [client, router]);
  const editorBg = colors.background;
  return <div className={"  bg-background pb-0"}>
      <div className={" "}>
        <div className={"block"}>
          {sending ? <div className={"block"}>
              <span size="small" color={colors.textSecondary} />
              <span className={"  text-text-secondary"}>
                Starting Work…
              </span>
            </div> : <WorkspaceHero />}
          <PromptInput onSend={handleSend} disabled={sending} sessionReady={false} errorMessage={errorMessage} onClearError={() => setErrorMessage(null)} />
        </div>
      </div>
    </div>;
}
const styles = {
  container: {
    flex: 1
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
export const Route = createFileRoute("/_app/work/")({
  component: WorkIndex
});
