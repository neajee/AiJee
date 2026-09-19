export * from "@aijee/protocol";
export * from "./chat-message";

export type ConnectionStatus = "idle" | "connecting" | "connected" | "reconnecting" | "disconnected";
export interface ConnectionState { status: ConnectionStatus; retryAttempt: number; nextRetryAt: number | null; lastDisconnectReason: string | null; disconnectedAt: number | null; }
export interface PiClientConfig {
  serverUrl: string;
  accessToken: string;
  onAuthError?: () => void;
  onApiAuthError?: () => Promise<string | null>;
  transport?: "sse" | "ws";
  reconnectBaseMs?: number;
  reconnectMaxMs?: number;
}
export interface CustomModelsConfigResult { providers?: Record<string, import("@aijee/protocol").CustomProvider>; parseError?: string; }
export interface BuiltinProvider {
  id: string; name: string; configured: boolean; model_count: number; supports_oauth: boolean;
  supports_api_key: boolean; auth_label: string | null; auth_source: string | null;
}
