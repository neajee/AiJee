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

export async function listWorkspaces(transport: ApiTransport, includeArchived?: boolean): Promise<Workspace[]> {
    const result = await transport.request("list2", {
      query: { include_archived: includeArchived },
    });
    return unwrapResult<Workspace[]>(result);
  }


export async function getWorkspace(transport: ApiTransport, id: string): Promise<Workspace> {
    const result = await transport.request("get", { path: { id } });
    return unwrapResult<Workspace>(result);
  }


export async function createWorkspace(transport: ApiTransport, params: {
    name: string;
    path: string;
    color?: string;
    workspaceEnabled?: boolean;
    startupScript?: string;
  }): Promise<Workspace> {
    const result = await transport.request("create", {
      body: {
        name: params.name,
        path: params.path,
        color: params.color,
        workspace_enabled: params.workspaceEnabled,
        startup_script: params.startupScript,
      },
    });
    return unwrapResult<Workspace>(result);
  }


export async function updateWorkspace(transport: ApiTransport,
    id: string,
    params: {
      name?: string;
      path?: string;
      color?: string;
      workspaceEnabled?: boolean;
      startupScript?: string;
    },
  ): Promise<Workspace> {
    const result = await transport.request("update2", {
      path: { id },
      body: {
        name: params.name,
        path: params.path,
        color: params.color,
        workspace_enabled: params.workspaceEnabled,
        startup_script: params.startupScript,
      },
    });
    return unwrapResult<Workspace>(result);
  }


export async function deleteWorkspace(transport: ApiTransport, id: string): Promise<void> {
    const result = await transport.request("delete2", { path: { id } });
    unwrapResult(result);
  }


export async function archiveWorkspace(transport: ApiTransport, id: string): Promise<Workspace> {
    const result = await transport.request("archive", { path: { id } });
    return unwrapResult<Workspace>(result);
  }


export async function unarchiveWorkspace(transport: ApiTransport, id: string): Promise<Workspace> {
    const result = await transport.request("unarchive", { path: { id } });
    return unwrapResult<Workspace>(result);
  }


export async function suggestWorkspaces(transport: ApiTransport, ): Promise<string[]> {
    const result = await transport.request("suggestWorkspaces", {});
    return unwrapResult<string[]>(result);
  }

  // ---------------------------------------------------------------------------
  // Workspace sessions (file-based)
  // ---------------------------------------------------------------------------


export async function listWorkspaceSessions(transport: ApiTransport,
    workspaceId: string,
    params?: { page?: number; limit?: number },
  ): Promise<PaginatedSessions> {
    const result = await transport.request("sessionsList", {
      path: { id: workspaceId },
      query: { page: params?.page, limit: params?.limit },
    });
    return unwrapResult<PaginatedSessions>(result);
  }


export async function getWorkspaceSession(transport: ApiTransport,
    workspaceId: string,
    sessionId: string,
  ): Promise<SessionDetail> {
    const result = await transport.request("sessionsGet", {
      path: { id: workspaceId, session_id: sessionId },
    });
    return unwrapResult<SessionDetail>(result);
  }


export async function deleteWorkspaceSession(transport: ApiTransport,
    workspaceId: string,
    sessionId: string,
  ): Promise<void> {
    const result = await transport.request("sessionsDelete", {
      path: { id: workspaceId, session_id: sessionId },
    });
    unwrapResult(result);
  }


export async function renameWorkspaceSession(transport: ApiTransport,
    workspaceId: string,
    sessionId: string,
    name: string,
  ): Promise<void> {
    const result = await transport.request("sessionsRename", {
      path: { id: workspaceId, session_id: sessionId },
      body: { name },
    });
    unwrapResult(result);
  }


export async function archiveWorkspaceSession(transport: ApiTransport,
    workspaceId: string,
    sessionId: string,
  ): Promise<void> {
    const result = await transport.request("sessionsArchive", {
      path: { id: workspaceId, session_id: sessionId },
    });
    unwrapResult(result);
  }


export async function getSessionTree(transport: ApiTransport,
    workspaceId: string,
    sessionId: string,
  ): Promise<SessionTreeNode[]> {
    const result = await transport.request("sessionsTree", {
      path: { id: workspaceId, session_id: sessionId },
    });
    return unwrapResult<SessionTreeNode[]>(result);
  }


export async function getSessionLeaf(transport: ApiTransport,
    workspaceId: string,
    sessionId: string,
  ): Promise<SessionEntry> {
    const result = await transport.request("sessionsLeaf", {
      path: { id: workspaceId, session_id: sessionId },
    });
    return unwrapResult<SessionEntry>(result);
  }


export async function getSessionChildren(transport: ApiTransport,
    workspaceId: string,
    sessionId: string,
    entryId: string,
  ): Promise<SessionEntry[]> {
    const result = await transport.request("sessionsChildren", {
      path: { id: workspaceId, session_id: sessionId, entry_id: entryId },
    });
    return unwrapResult<SessionEntry[]>(result);
  }


export async function getSessionBranch(transport: ApiTransport,
    workspaceId: string,
    sessionId: string,
    entryId: string,
  ): Promise<SessionEntry[]> {
    const result = await transport.request("sessionsBranch", {
      path: { id: workspaceId, session_id: sessionId, entry_id: entryId },
    });
    return unwrapResult<SessionEntry[]>(result);
  }

  // ---------------------------------------------------------------------------
  // Git
  // ---------------------------------------------------------------------------
