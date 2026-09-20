import { useMemo } from "react";
import type { PreviewTarget } from "@/features/preview/store";
import { buildPreviewSrc } from "@/features/preview/service-worker";
import { BrowserPreviewDesktop } from "@/features/preview/components/browser-preview.desktop";
interface BrowserPreviewProps {
  serverUrl: string;
  accessToken?: string;
  sessionId: string;
  target: PreviewTarget;
}
export function BrowserPreview({
  serverUrl,
  accessToken,
  sessionId,
  target
}: BrowserPreviewProps) {
  if (navigator.userAgent.includes("AiJeeDesktop/")) {
    return <BrowserPreviewDesktop serverUrl={serverUrl} accessToken={accessToken} sessionId={sessionId} target={target} />;
  }
  const src = useMemo(() => buildPreviewSrc({
    sessionId,
    hostname: target.hostname,
    port: target.port,
    serverUrl
  }), [sessionId, target.hostname, target.port, serverUrl]);
  const key = `${sessionId}_${target.hostname}_${target.port}`;
  return <div className={""}>
      <iframe key={key} src={src} title={`Preview ${target.label}`} className={""} sandbox="allow-same-origin allow-scripts allow-forms allow-modals allow-popups allow-downloads" allow="clipboard-read; clipboard-write" />
    </div>;
}
const styles = {
  container: {
    flex: 1
  }
} as const;
const iframeStyle = {
  width: "100%",
  height: "100%",
  border: "none",
  backgroundColor: "transparent"
};
