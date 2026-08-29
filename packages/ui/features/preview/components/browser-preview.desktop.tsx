import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import type { PreviewTarget } from "@/features/preview/store";
import { buildPreviewUrl } from "@/features/preview/utils";

interface Props { serverUrl: string; accessToken?: string; sessionId: string; target: PreviewTarget }

export function BrowserPreviewDesktop({ serverUrl, accessToken, sessionId, target }: Props) {
  const [frame, setFrame] = useState("");
  const [size, setSize] = useState({ width: 1280, height: 800 });
  const socket = useRef<WebSocket>();
  const targetUrl = useMemo(() => buildPreviewUrl({ serverUrl, sessionId, target }), [serverUrl, sessionId, target]);
  const brokerUrl = useMemo(() => {
    const value = new URL("/api/preview/ws", window.location.origin);
    value.protocol = value.protocol === "https:" ? "wss:" : "ws:";
    if (accessToken) value.searchParams.set("token", accessToken);
    return value.toString();
  }, [accessToken]);

  useEffect(() => {
    const ws = new WebSocket(brokerUrl);
    socket.current = ws;
    ws.onopen = () => ws.send(JSON.stringify({ type: "init", url: targetUrl, token: accessToken }));
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "frame") { setFrame(message.data); setSize({ width: message.width, height: message.height }); }
    };
    return () => { ws.close(); socket.current = undefined; };
  }, [targetUrl, accessToken, brokerUrl]);

  const send = (message: unknown) => socket.current?.send(JSON.stringify(message));
  return <View style={styles.container}>
    {frame ? <img src={frame} alt={`Preview ${target.label}`} style={{ ...imageStyle, aspectRatio: size.width / size.height }}
      onClick={(event) => { const rect = event.currentTarget.getBoundingClientRect(); send({ type: "click", x: (event.clientX - rect.left) * size.width / rect.width, y: (event.clientY - rect.top) * size.height / rect.height }); }}
      onKeyDown={(event) => {
        const modifiers = (event.shiftKey ? 8 : 0) | (event.ctrlKey ? 2 : 0) | (event.altKey ? 1 : 0) | (event.metaKey ? 4 : 0);
        send({ type: "key", event: { type: "rawKeyDown", key: event.key, code: event.code, modifiers } });
        if (event.key.length === 1) send({ type: "key", event: { type: "char", text: event.key, unmodifiedText: event.key, modifiers } });
        send({ type: "key", event: { type: "keyUp", key: event.key, code: event.code, modifiers } });
      }}
      tabIndex={0} /> : <View style={styles.image} />}
  </View>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: "#111", alignItems: "center", justifyContent: "center" }, image: { flex: 1 } });
const imageStyle = { width: "100%", height: "100%", objectFit: "contain", outline: "none" } as React.CSSProperties;
