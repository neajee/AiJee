import { AIJEE_STREAM_PATH } from "../core/constants";
import type {
  AgentSessionInfo, PaginatedSessions, ActiveSessionSummary, AgentSessionCommandResponse, AgentRuntimeStatus,
  SessionDetail, SessionEntry, SessionTreeNode, Workspace, GitStatusResponse, GitBranch, GitLogEntry,
  GitDiffResponse, GitFileDiffResponse, GitStashEntry, GitWorktree, NestedGitReposResponse, PackageStatus,
  MarketplacePackage, PackageSearchResponse, PackageOperationRequest, OperationResult, TaskInfo, TasksConfig,
  TaskLogs, TaskDefinition, AgentMode, CustomModelsConfig, CustomProvider, FsListResponse, FsReadResponse,
  FsEntry, FsUploadResponse, PathCompletion, SessionHistoryResponse, SessionListItem, AgentStateData,
  CompactionResult, ImageContent, ModelInfo,
} from "@aijee/protocol";
import type { BuiltinProvider, CustomModelsConfigResult } from "../types";
import { ApiTransport, unwrapResult } from "./transport";

export async function getSessionMode(transport: ApiTransport, sessionId: string): Promise<{ session_id: string; mode: AgentMode | null }> {
    const result = await transport.request("getSessionMode", { path: { session_id: sessionId } });
    return unwrapResult<{ session_id: string; mode: AgentMode | null }>(result);
  }

  // ---------------------------------------------------------------------------
  // Session history (REST)
  // ---------------------------------------------------------------------------


export async function getSessionHistory(transport: ApiTransport,
    sessionId: string,
    params?: { before?: string; limit?: number },
  ): Promise<SessionHistoryResponse> {
    const result = await transport.request("sessionHistory", {
      path: { session_id: sessionId },
      query: { before: params?.before, limit: params?.limit },
    });
    return unwrapResult<SessionHistoryResponse>(result);
  }

  // ---------------------------------------------------------------------------
  // Active session (per-connection)
  // ---------------------------------------------------------------------------


export async function setActiveSession(transport: ApiTransport,
    connectionId: string,
    sessionId: string | null,
    fromEventId?: number,
    fromDeltaEventId?: number,
  ): Promise<void> {
    const url = transport.buildApiUrl("/api/stream-active-session");
    const response = await transport.authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        connection_id: connectionId,
        session_id: sessionId,
        from_event_id: fromEventId,
        from_delta_event_id: fromDeltaEventId,
      }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error((body as any)?.error ?? `setActiveSession failed (${response.status})`);
    }
  }

  // ---------------------------------------------------------------------------
  // Stream URLs
  // ---------------------------------------------------------------------------


export function getStreamUrl(transport: ApiTransport, from?: number): string {
    const url = new URL(`${transport.serverUrl}${AIJEE_STREAM_PATH}`);
    if (from !== undefined) url.searchParams.set("from", String(from));
    return url.toString();
  }


export function getWsStreamUrl(transport: ApiTransport, from?: number): string {
    const httpUrl = new URL(`${transport.serverUrl}/ws/stream`);
    if (from !== undefined) httpUrl.searchParams.set("from", String(from));
    httpUrl.protocol = httpUrl.protocol === "https:" ? "wss:" : "ws:";
    return httpUrl.toString();
  }
