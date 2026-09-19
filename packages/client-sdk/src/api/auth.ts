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

export async function createDevice(transport: ApiTransport, code?: string, name?: string): Promise<{ device_id: string; token: string; name: string; created_at: string }> {
    const response = await transport.authFetch(transport.buildApiUrl('/api/devices'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, name }) });
    return unwrapResult(await response.json());
  }


export async function listDevices(transport: ApiTransport, ): Promise<Array<{ device_id: string; name: string; created_at: string; last_seen: string }>> {
    const response = await transport.authFetch(transport.buildApiUrl('/api/devices'));
    return unwrapResult(await response.json());
  }


export async function revokeDevice(transport: ApiTransport, deviceId: string): Promise<void> {
    const response = await transport.authFetch(transport.buildApiUrl(`/api/devices/${encodeURIComponent(deviceId)}`), { method: 'DELETE' });
    unwrapResult(await response.json());
  }


export async function createDeviceCode(transport: ApiTransport, ): Promise<{ code: string; url: string; expires_at: null }> {
    const response = await transport.authFetch(transport.buildApiUrl('/api/devices/code'), { method: 'POST' });
    return unwrapResult(await response.json());
  }


export async function getDeviceCode(transport: ApiTransport, ): Promise<{ code: string; url: string; expires_at: null }> {
    const response = await transport.authFetch(transport.buildApiUrl('/api/devices/code'));
    return unwrapResult(await response.json());
  }


export async function logout(transport: ApiTransport, refreshToken?: string, baseUrl?: string): Promise<void> {
    const result = await transport.request("logout", {
      body: refreshToken ? { refresh_token: refreshToken } : undefined,
      ...(baseUrl && { baseUrl }),
    });
    unwrapResult(result);
  }


export async function checkSession(transport: ApiTransport, ): Promise<void> {
    const result = await transport.request("checkSession", {});
    unwrapResult(result);
  }

  // ---------------------------------------------------------------------------
  // Agent — runtime
  // ---------------------------------------------------------------------------
