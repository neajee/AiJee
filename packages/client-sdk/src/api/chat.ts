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

export async function createChatSession(transport: ApiTransport, params?: {
    noTools?: boolean;
    systemPrompt?: string;
    modeId?: string;
  }): Promise<AgentSessionInfo> {
    const result = await transport.request("createSession2", {
      body: {
        no_tools: params?.noTools,
        system_prompt: params?.systemPrompt,
        mode_id: params?.modeId,
      },
    });
    return unwrapResult<AgentSessionInfo>(result);
  }


export async function listChatSessions(transport: ApiTransport, params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedSessions> {
    const result = await transport.request("listSessions2", {
      query: { page: params?.page, limit: params?.limit },
    });
    return unwrapResult<PaginatedSessions>(result);
  }


export async function touchChatSession(transport: ApiTransport,
    sessionId: string,
    sessionFile?: string,
  ): Promise<AgentSessionInfo> {
    const result = await transport.request("touchSession2", {
      path: { session_id: sessionId },
      body: { session_file: sessionFile },
    });
    return unwrapResult<AgentSessionInfo>(result);
  }


export async function deleteChatSession(transport: ApiTransport, sessionId: string): Promise<void> {
    const result = await transport.request("deleteSession", {
      path: { session_id: sessionId },
    });
    unwrapResult(result);
  }

  // ---------------------------------------------------------------------------
  // Workspaces
  // ---------------------------------------------------------------------------
