import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/hooks/router";
import { Fonts } from "@/constants/theme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { useAuthStore } from "@/features/auth/store";
import { useServersStore } from "@/features/servers/store";
import { useWorkspaceStore } from "@/features/workspace/store";
import { buildServerAddress, parseConnectUrl, type ConnectParams } from "@/features/servers/utils/parse-connect-url";
type ConnectStatus = "loading" | "pairing" | "done" | "error";
function resolveBaseUrl(params: ConnectParams) {
  if (true && typeof window !== "undefined") {
    const {
      hostname,
      origin,
      port,
      protocol
    } = window.location;
    if (port === params.port) {
      return origin;
    }
    const host = hostname.includes(":") && !hostname.startsWith("[") ? `[${hostname}]` : hostname;
    return `${protocol}//${host}:${params.port}`;
  }
  const preferredHost = params.ips.find(entry => entry === "localhost") ?? params.ips[0];
  return buildServerAddress(preferredHost, params.port);
}
function DirectConnectScreen() {
  const router = useRouter();
  const colors = useThemeTokens();
  const authLoaded = useAuthStore(state => state.loaded);
  const serversLoaded = useServersStore(state => state.loaded);
  const authorizeWithCode = useAuthStore(state => state.authorizeWithCode);
  const addServer = useServersStore(state => state.addServer);
  const fetchWorkspaces = useWorkspaceStore(state => state.fetchWorkspaces);
  const [status, setStatus] = useState<ConnectStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const attemptedRef = useRef(false);
  const connectParamsRef = useRef<ConnectParams | null>(true && typeof window !== "undefined" ? parseConnectUrl(window.location.href) : null);
  const connectParams = connectParamsRef.current;
  useEffect(() => {
    if (!authLoaded || !serversLoaded) return;
    if (attemptedRef.current) return;
    attemptedRef.current = true;
    if (!connectParams) {
      setStatus("error");
      setError("Invalid direct login URL.");
      return;
    }
    let cancelled = false;
    const run = async () => {
      const serverId = connectParams.serverId ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const baseUrl = resolveBaseUrl(connectParams);
      const currentServers = useServersStore.getState().servers;
      const existingServer = currentServers.find(server => server.id === serverId);
      setStatus("pairing");
      setError(null);
      if (!connectParams.code) {
        setStatus("error");
        setError("This authorization link is no longer supported. Generate a new device link.");
        return;
      }
      const result = await authorizeWithCode(baseUrl, connectParams.code, serverId, connectParams.hostname || 'AiJee device');
      if (cancelled) return;
      if (!result.success) {
        setStatus("error");
        setError(result.error ?? "Direct login failed");
        return;
      }
      await addServer({
        id: serverId,
        name: existingServer?.name || connectParams.hostname || "AiJee",
        address: baseUrl
      });
      await fetchWorkspaces();
      if (cancelled) return;
      setStatus("done");
      setTimeout(() => {
        router.replace("/");
      }, 400);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [addServer, authLoaded, connectParams, fetchWorkspaces, authorizeWithCode, router, serversLoaded]);
  const titleByStatus: Record<ConnectStatus, string> = {
    loading: "Preparing direct login",
    pairing: "Connecting to AiJee",
    done: "Connected",
    error: "Direct login failed"
  };
  const descriptionByStatus: Record<ConnectStatus, string> = {
    loading: "Loading the connection details.",
    pairing: "Completing secure pairing…",
    done: "Redirecting to your workspace.",
    error: error ?? "Unable to complete the direct login flow."
  };
  return <div className={"  bg-background"}>
      <div className={"  bg-surface border-border"}>
        {status === "error" ? <div /> : <span className="size-3 animate-spin" />}
        <span className={"  text-foreground"}>
          {titleByStatus[status]}
        </span>
        <span className={"  text-text-secondary"}>
          {descriptionByStatus[status]}
        </span>
        {status === "error" && <button onClick={() => router.replace("/servers")}>
            <span className={"  text-accent-content"}>
              Go to Servers
            </span>
          </button>}
      </div>
    </div>;
}export const Route = createFileRoute("/connect")({
  component: DirectConnectScreen
});
