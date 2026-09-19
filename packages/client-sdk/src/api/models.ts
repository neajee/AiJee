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

export async function getCustomModels(transport: ApiTransport, ): Promise<CustomModelsConfigResult> {
    const result = await transport.request("getCustomModels", {});
    return unwrapResult<CustomModelsConfigResult>(result);
  }


export async function listBuiltinProviders(transport: ApiTransport, ): Promise<BuiltinProvider[]> {
    const response = await transport.authFetch(transport.buildApiUrl("/api/providers"));
    return unwrapResult<BuiltinProvider[]>(await response.json());
  }


export async function saveBuiltinProviderKey(transport: ApiTransport, providerId: string, apiKey: string): Promise<void> {
    const response = await transport.authFetch(transport.buildApiUrl(`/api/providers/${encodeURIComponent(providerId)}/api-key`), { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ api_key: apiKey }) });
    unwrapResult(await response.json());
  }


export async function removeBuiltinProviderKey(transport: ApiTransport, providerId: string): Promise<void> {
    const response = await transport.authFetch(transport.buildApiUrl(`/api/providers/${encodeURIComponent(providerId)}/api-key`), { method: "DELETE" });
    unwrapResult(await response.json());
  }


export async function startProviderOAuth(transport: ApiTransport, providerId: string): Promise<{ id: string; url: string | null; instructions: string | null; status: string; error: string | null; prompt?: { id: string; message: string; type: string } | null }> {
    const response = await transport.authFetch(transport.buildApiUrl(`/api/providers/${encodeURIComponent(providerId)}/oauth`), { method: "POST" });
    return unwrapResult(await response.json());
  }


export async function getProviderOAuth(transport: ApiTransport, providerId: string, loginId: string): Promise<{ url: string | null; instructions: string | null; status: "pending" | "complete" | "failed"; error: string | null; prompt?: { id: string; message: string; type: string } | null }> {
    const response = await transport.authFetch(transport.buildApiUrl(`/api/providers/${encodeURIComponent(providerId)}/oauth/${encodeURIComponent(loginId)}`));
    return unwrapResult(await response.json());
  }


export async function resolveProviderOAuthPrompt(transport: ApiTransport, providerId: string, loginId: string, promptId: string, value: string): Promise<void> {
    const response = await transport.authFetch(transport.buildApiUrl(`/api/providers/${encodeURIComponent(providerId)}/oauth/${encodeURIComponent(loginId)}/prompt/${encodeURIComponent(promptId)}`), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value }) });
    unwrapResult(await response.json());
  }


export async function saveCustomModels(transport: ApiTransport, config: { providers: Record<string, CustomProvider> }): Promise<void> {
    const result = await transport.request("saveCustomModels", { body: { providers: config.providers } });
    unwrapResult(result);
  }

  // ---------------------------------------------------------------------------
  // Modes
  // ---------------------------------------------------------------------------
