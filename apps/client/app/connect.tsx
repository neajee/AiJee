import { Spinner, Text, View } from 'tamagui';
import { useEffect, useRef, useState } from "react";
import {
  Platform, Pressable } from "react-native";
import { useRouter } from "expo-router";

import { Fonts } from "@/constants/theme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { useAuthStore } from "@/features/auth/store";
import { useServersStore } from "@/features/servers/store";
import { useWorkspaceStore } from "@/features/workspace/store";
import {
  buildServerAddress,
  parseConnectUrl,
  type ConnectParams,
} from "@/features/servers/utils/parse-connect-url";

type ConnectStatus = "loading" | "pairing" | "done" | "error";

function resolveBaseUrl(params: ConnectParams) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const { hostname, origin, port, protocol } = window.location;
    if (port === params.port) {
      return origin;
    }

    const host =
      hostname.includes(":") && !hostname.startsWith("[")
        ? `[${hostname}]`
        : hostname;

    return `${protocol}//${host}:${params.port}`;
  }

  const preferredHost = params.ips.find((entry) => entry === "localhost") ?? params.ips[0];
  return buildServerAddress(preferredHost, params.port);
}

export default function DirectConnectScreen() {
  const router = useRouter();
  const colors = useThemeTokens();

  const authLoaded = useAuthStore((state) => state.loaded);
  const serversLoaded = useServersStore((state) => state.loaded);
  const authorizeWithCode = useAuthStore((state) => state.authorizeWithCode);
  const addServer = useServersStore((state) => state.addServer);
  const fetchWorkspaces = useWorkspaceStore((state) => state.fetchWorkspaces);

  const [status, setStatus] = useState<ConnectStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const attemptedRef = useRef(false);
  const connectParamsRef = useRef<ConnectParams | null>(
    Platform.OS === "web" && typeof window !== "undefined"
      ? parseConnectUrl(window.location.href)
      : null,
  );

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
      const serverId =
        connectParams.serverId ??
        Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const baseUrl = resolveBaseUrl(connectParams);
      const currentServers = useServersStore.getState().servers;
      const existingServer = currentServers.find((server) => server.id === serverId);

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
        address: baseUrl,
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
  }, [
    addServer,
    authLoaded,
    connectParams,
    fetchWorkspaces,
    authorizeWithCode,
    router,
    serversLoaded,
  ]);

  const titleByStatus: Record<ConnectStatus, string> = {
    loading: "Preparing direct login",
    pairing: "Connecting to AiJee",
    done: "Connected",
    error: "Direct login failed",
  };

  const descriptionByStatus: Record<ConnectStatus, string> = {
    loading: "Loading the connection details.",
        pairing: "Completing secure pairing…",
    done: "Redirecting to your workspace.",
    error: error ?? "Unable to complete the direct login flow.",
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderStrong,
          },
        ]}
      >
        {status === "error" ? (
          <View
            style={[
              styles.badge,
              { backgroundColor: colors.destructive + '22' },
            ]}
          />
        ) : (
          <Spinner
            size="large"
            color={status === "done" ? colors.success : colors.text}
          />
        )}
        <Text style={[styles.title, { color: colors.text }]}>
          {titleByStatus[status]}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {descriptionByStatus[status]}
        </Text>
        {status === "error" && (
          <Pressable
            onPress={() => router.replace("/servers")}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: colors.accent },
              pressed && { opacity: 0.75 },
            ]}
          >
            <Text
              style={[
                styles.buttonText,
                { color: colors.onAccent },
              ]}
            >
              Go to Servers
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = {
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderWidth: 1,
    borderRadius: 24,
    paddingLeft: 28, paddingRight: 28,
    paddingTop: 32, paddingBottom: 32,
    alignItems: "center",
  },
  badge: {
    width: 18,
    height: 18,
    borderRadius: 999,
  },
  title: {
    marginTop: 20,
    fontSize: 26,
    lineHeight: 32,
    fontFamily: Fonts.sansSemiBold,
    textAlign: "center",
  },
  description: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Fonts.sans,
    textAlign: "center",
  },
  button: {
    marginTop: 24,
    minWidth: 180,
    borderRadius: 999,
    paddingLeft: 20, paddingRight: 20,
    paddingTop: 14, paddingBottom: 14,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 15,
    lineHeight: 18,
    fontFamily: Fonts.sansSemiBold,
  },
} as const;
