import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import type { PreviewTarget } from "@/features/preview/store";
import { buildPreviewSrc } from "@/features/preview/service-worker";

interface BrowserPreviewProps {
  serverUrl: string;
  accessToken?: string;
  sessionId: string;
  target: PreviewTarget;
}

export function BrowserPreview({ serverUrl, sessionId, target }: BrowserPreviewProps) {
  const src = useMemo(
    () =>
      buildPreviewSrc({
        sessionId,
        hostname: target.hostname,
        port: target.port,
        serverUrl,
      }),
    [sessionId, target.hostname, target.port, serverUrl],
  );

  const key = `${sessionId}_${target.hostname}_${target.port}`;

  return (
    <View style={styles.container}>
      <iframe
        key={key}
        src={src}
        title={`Preview ${target.label}`}
        style={iframeStyle as React.CSSProperties}
        sandbox="allow-same-origin allow-scripts allow-forms allow-modals allow-popups allow-downloads"
        allow="clipboard-read; clipboard-write"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

const iframeStyle = {
  width: "100%",
  height: "100%",
  border: "none",
  backgroundColor: "transparent",
};
