import { toTailwind } from "@/styles/to-tailwind";
import { useMemo } from "react";
import type { PreviewTarget } from "@/features/preview/store";
import { buildPreviewUrl } from "@/features/preview/utils";
interface BrowserPreviewProps {
  serverUrl: string;
  accessToken?: string;
  sessionId: string;
  target: PreviewTarget;
}
export function BrowserPreview({
  serverUrl,
  sessionId,
  target
}: BrowserPreviewProps) {
  const src = useMemo(() => buildPreviewUrl({
    serverUrl,
    sessionId,
    target
  }), [serverUrl, sessionId, target]);
  return <div className={toTailwind(styles.container)}>
      <iframe src={src} title={`Preview ${target.label}`} className={toTailwind(iframeStyle as unknown as React.CSSProperties)} sandbox="allow-same-origin allow-scripts allow-forms allow-modals allow-popups allow-downloads" allow="clipboard-read; clipboard-write" />
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
