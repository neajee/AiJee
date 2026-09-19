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

export async function packageStatus(transport: ApiTransport, ): Promise<PackageStatus> {
    const result = await transport.request("status2", {});
    return unwrapResult<PackageStatus>(result);
  }


export async function packageUpdate(transport: ApiTransport, ): Promise<void> {
    const result = await transport.request("update", {});
    unwrapResult(result);
  }


export async function packageInstall(transport: ApiTransport, ): Promise<void> {
    const result = await transport.request("install", {});
    unwrapResult(result);
  }


export async function packageLogs(transport: ApiTransport, limit?: number): Promise<TaskLogs> {
    const result = await transport.request("logs", { query: { limit } });
    return unwrapResult<TaskLogs>(result);
  }


export async function marketplaceSearch(transport: ApiTransport, params?: { query?: string; category?: string; page?: number; limit?: number }): Promise<PackageSearchResponse> {
    const result = await transport.request("marketplaceSearch", { query: params });
    return unwrapResult<PackageSearchResponse>(result);
  }


export async function marketplaceDetail(transport: ApiTransport, name: string): Promise<MarketplacePackage> {
    const result = await transport.request("marketplaceDetail", { path: { name } });
    return unwrapResult<MarketplacePackage>(result);
  }


export async function marketplaceInstalled(transport: ApiTransport, ): Promise<OperationResult> {
    const result = await transport.request("marketplaceInstalled", {});
    return unwrapResult<OperationResult>(result);
  }


export async function marketplaceOperation(transport: ApiTransport, request: PackageOperationRequest): Promise<OperationResult> {
    const result = await transport.request("marketplaceOperation", { body: request });
    return unwrapResult<OperationResult>(result);
  }

  // ---------------------------------------------------------------------------
  // Tasks
  // ---------------------------------------------------------------------------
