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

export async function listModes(transport: ApiTransport, ): Promise<AgentMode[]> {
    const result = await transport.request("listModes", );
    return unwrapResult<AgentMode[]>(result).map((mode) => ({
      ...mode,
      extensions: Array.isArray(mode.extensions) ? mode.extensions : [],
      skills: Array.isArray(mode.skills) ? mode.skills : [],
      extra_args: Array.isArray(mode.extra_args) ? mode.extra_args : [],
    }));
  }


export async function createMode(transport: ApiTransport, params: {
    name: string;
    description?: string;
    model?: string;
    thinkingLevel?: string;
    systemPrompt?: string;
    extensions?: string[];
    skills?: string[];
    extraArgs?: string[];
    isDefault?: boolean;
    sortOrder?: number;
  }): Promise<AgentMode> {
    const result = await transport.request("createMode", {
      body: {
        name: params.name,
        description: params.description,
        model: params.model,
        thinking_level: params.thinkingLevel,
        system_prompt: params.systemPrompt,
        extensions: Array.isArray(params.extensions) && params.extensions.length > 0 ? params.extensions : undefined,
        skills: Array.isArray(params.skills) && params.skills.length > 0 ? params.skills : undefined,
        extra_args: Array.isArray(params.extraArgs) && params.extraArgs.length > 0 ? params.extraArgs : undefined,
        is_default: params.isDefault,
        sort_order: params.sortOrder,
      },
    });
    return unwrapResult<AgentMode>(result);
  }


export async function updateMode(transport: ApiTransport,
    modeId: string,
    params: {
      name?: string;
      description?: string;
      model?: string;
      thinkingLevel?: string;
      systemPrompt?: string;
      extensions?: string[];
      skills?: string[];
      extraArgs?: string[];
      isDefault?: boolean;
      sortOrder?: number;
    },
  ): Promise<AgentMode> {
    const result = await transport.request("updateMode", {
      path: { mode_id: modeId },
      body: {
        name: params.name,
        description: params.description,
        model: params.model,
        thinking_level: params.thinkingLevel,
        system_prompt: params.systemPrompt,
        extensions: Array.isArray(params.extensions) ? params.extensions : undefined,
        skills: Array.isArray(params.skills) ? params.skills : undefined,
        extra_args: Array.isArray(params.extraArgs) ? params.extraArgs : undefined,
        is_default: params.isDefault,
        sort_order: params.sortOrder,
      },
    });
    return unwrapResult<AgentMode>(result);
  }


export async function deleteMode(transport: ApiTransport, modeId: string): Promise<void> {
    const result = await transport.request("deleteMode", { path: { mode_id: modeId } });
    unwrapResult(result);
  }
