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

export async function getTaskConfig(transport: ApiTransport, workspaceId: string): Promise<TasksConfig> {
    const result = await transport.request("getConfig", { path: { workspace_id: workspaceId } });
    return unwrapResult<TasksConfig>(result);
  }


export async function listTasks(transport: ApiTransport, workspaceId: string): Promise<TaskInfo[]> {
    const result = await transport.request("listTasks", { path: { workspace_id: workspaceId } });
    return unwrapResult<TaskInfo[]>(result);
  }


export async function startTask(transport: ApiTransport, label: string, workspaceId: string): Promise<TaskInfo> {
    const result = await transport.request("startTask", {
      body: { label, workspace_id: workspaceId },
    });
    return unwrapResult<TaskInfo>(result);
  }


export async function stopTask(transport: ApiTransport, taskId: string): Promise<TaskInfo> {
    const result = await transport.request("stopTask", { body: { task_id: taskId } });
    return unwrapResult<TaskInfo>(result);
  }


export async function restartTask(transport: ApiTransport, taskId: string): Promise<TaskInfo> {
    const result = await transport.request("restartTask", { body: { task_id: taskId } });
    return unwrapResult<TaskInfo>(result);
  }


export async function removeTask(transport: ApiTransport, taskId: string): Promise<void> {
    const result = await transport.request("removeTask", { path: { task_id: taskId } });
    unwrapResult(result);
  }


export async function getTaskLogs(transport: ApiTransport, taskId: string): Promise<TaskLogs> {
    const result = await transport.request("getLogs", { path: { task_id: taskId } });
    return unwrapResult<TaskLogs>(result);
  }

  // ---------------------------------------------------------------------------
  // Custom models
  // ---------------------------------------------------------------------------
