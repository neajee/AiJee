import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { PiClient } from "../core/pi-client";
import type { PiClientConfig } from "../types";

const PiClientContext = createContext<PiClient | null>(null);

export interface PiClientProviderProps {
  config?: PiClientConfig;
  children: ReactNode;
}

export function PiClientProvider({ config, children }: PiClientProviderProps) {
  const clientRef = useRef<PiClient | null>(null);

  if (!clientRef.current) {
    clientRef.current = new PiClient(config ?? { serverUrl: "", accessToken: "" });
  }

  const client = clientRef.current;

  useEffect(() => {
    if (!config?.serverUrl || !config.accessToken) return;
    client.updateConfig(config.serverUrl, config.accessToken);
    client.connect();
    return () => client.stop();
  }, [client, config?.accessToken, config?.serverUrl]);

  useEffect(() => {
    if (!config) return;
    client.updateConfig(config.serverUrl, config.accessToken);
  }, [client, config]);

  return (
    <PiClientContext.Provider value={client}>
      {children}
    </PiClientContext.Provider>
  );
}

export function usePiClient(): PiClient {
  const client = useContext(PiClientContext);
  if (!client) {
    throw new Error("usePiClient must be used within a <PiClientProvider>");
  }
  return client;
}

export function useOptionalPiClient(): PiClient | null {
  return useContext(PiClientContext);
}
