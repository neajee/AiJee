import type { EngineSession } from "@aijee/engine";
import type { Workspace as ProtocolWorkspace } from "@aijee/protocol";
import type { PersistedSession } from "../../storage/state-store.ts";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { WebSocket } from "ws";

export interface HandlerContext {
  [key: string]: any;
  body<T>(request: IncomingMessage, maxBytes?: number): Promise<T>;
  ok(response: ServerResponse, data: unknown, status?: number): void;
  error(response: ServerResponse, status: number, message: string): void;
  json(response: ServerResponse, status: number, data: unknown): void;
  safePath(input: string): string;
}
export type Workspace = ProtocolWorkspace;
/**
 * A live client event connection. The client names the session it is currently
 * viewing via `/api/stream-active-session`; high-frequency delta events are only
 * pushed to the connection that is viewing their session.
 */
export type StreamConnection = {
  activeSessionId: string | null;
  response?: ServerResponse;
  socket?: WebSocket;
};
export type ManagedSession = { key: string; workspaceId: string; session: EngineSession; createdAt: string; lastActive: number; modeId?: string; systemPrompt?: string; draft?: boolean };
export type Mode = { id: string; name: string; description?: string; model?: string; thinking_level?: string; system_prompt?: string; extensions?: string[]; skills?: string[]; extra_args?: string[]; is_default?: boolean; sort_order?: number };
export type OAuthLogin = { id: string; providerId: string; url: string | null; instructions: string | null; status: "pending" | "complete" | "failed"; error: string | null; controller: AbortController; expiresAt: number; prompt: { id: string; message: string; type: string; options?: Array<{ id: string; label: string; description?: string }> } | null; resolvePrompt: ((value: string) => void) | null };
export type { PersistedSession };

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function nextForkSessionName(sourceName: string, existingNames: Iterable<string>): string {
  const trimmed = sourceName.trim();
  const base = trimmed.replace(/\s*[（(]\d+[）)]$/, "").trim() || trimmed;
  const used = new Set(existingNames);
  let index = 2;
  while (used.has(`${base}（${index}）`)) index += 1;
  return `${base}（${index}）`;
}
