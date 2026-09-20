import type {
  AgentSessionInfo, PaginatedSessions, ActiveSessionSummary, AgentSessionCommandResponse, AgentRuntimeStatus,
  SessionDetail, SessionEntry, SessionTreeNode, Workspace, GitStatusResponse, GitBranch, GitLogEntry,
  GitDiffResponse, GitFileDiffResponse, GitStashEntry, GitWorktree, NestedGitReposResponse, PackageStatus,
  MarketplacePackage, PackageSearchResponse, PackageOperationRequest, OperationResult, TaskInfo, TasksConfig,
  TaskLogs, TaskDefinition, AgentMode, CustomModelsConfig, CustomProvider, FsListResponse, FsReadResponse,
  FsEntry, FsUploadResponse, PathCompletion, SessionHistoryResponse, SessionListItem, AgentStateData,
  AgentProductCapabilities, CompactionResult, ImageContent, ModelInfo,
} from "@aijee/protocol";
import type { BuiltinProvider, CustomModelsConfigResult } from "../types";
import { ApiTransport, unwrapResult } from "./transport";
export async function runtimeStatus(transport: ApiTransport, ): Promise<AgentRuntimeStatus> {
    const result = await transport.request("runtimeStatus", {});
    return unwrapResult<AgentRuntimeStatus>(result);
  }
export async function createAgentSession(transport: ApiTransport, params: {
    workspaceId: string;
    sessionPath?: string;
    modeId?: string;
    draft?: boolean;
  }): Promise<AgentSessionInfo> {
    const body = {
      workspace_id: params.workspaceId,
      session_path: params.sessionPath,
      mode_id: params.modeId,
      draft: params.draft,
    };
    const result = await transport.request("createSession", {
      body,
    });
    return unwrapResult<AgentSessionInfo>(result);
  }
export async function touchAgentSession(transport: ApiTransport,
    sessionId: string,
    params: { sessionFile: string; workspaceId: string },
  ): Promise<AgentSessionInfo> {
    const result = await transport.request("touchSession", {
      path: { session_id: sessionId },
      body: {
        session_file: params.sessionFile,
        workspace_id: params.workspaceId,
      },
    });
    return unwrapResult<AgentSessionInfo>(result);
  }
export async function killSession(transport: ApiTransport, sessionId: string): Promise<void> {
    const result = await transport.request("killSession", {
      path: { session_id: sessionId },
    });
    unwrapResult(result);
  }
export async function listActiveSessions(transport: ApiTransport, ): Promise<ActiveSessionSummary[]> {
    const result = await transport.request("listSessions", {});
    return unwrapResult<ActiveSessionSummary[]>(result);
  }
export async function getAgentState(transport: ApiTransport, sessionId: string): Promise<AgentStateData> {
    const result = await transport.request("getState", { body: { session_id: sessionId } });
    return unwrapResult<AgentStateData>(result);
  }
export async function prompt(transport: ApiTransport, params: {
    sessionId: string;
    message: string;
    images?: ImageContent[];
    streamingBehavior?: "steer" | "followUp";
    workspaceId?: string;
    sessionFile?: string;
    fromEntryId?: string;
  }): Promise<void> {
    const result = await transport.request("prompt", {
      body: {
        session_id: params.sessionId,
        message: params.message,
        images: params.images,
        streaming_behavior: params.streamingBehavior,
        workspace_id: params.workspaceId,
        session_file: params.sessionFile,
        from_entry_id: params.fromEntryId,
      } as never,
    });
    unwrapResult(result);
  }
export async function steer(transport: ApiTransport, params: {
    sessionId: string;
    message: string;
    images?: ImageContent[];
    workspaceId?: string;
    sessionFile?: string;
  }): Promise<void> {
    const result = await transport.request("steer", {
      body: {
        session_id: params.sessionId,
        message: params.message,
        images: params.images,
        workspace_id: params.workspaceId,
        session_file: params.sessionFile,
      },
    });
    unwrapResult(result);
  }
export async function followUp(transport: ApiTransport, params: {
    sessionId: string;
    message: string;
    images?: ImageContent[];
    workspaceId?: string;
    sessionFile?: string;
  }): Promise<void> {
    const result = await transport.request("followUp", {
      body: {
        session_id: params.sessionId,
        message: params.message,
        images: params.images,
        workspace_id: params.workspaceId,
        session_file: params.sessionFile,
      },
    });
    unwrapResult(result);
  }
export async function abort(transport: ApiTransport, sessionId: string): Promise<void> {
    const result = await transport.request("abort", {
      body: { session_id: sessionId },
    });
    unwrapResult(result);
  }
export async function getState(transport: ApiTransport, sessionId: string): Promise<Record<string, unknown>> {
    const result = await transport.request("getState", {
      body: { session_id: sessionId },
    });
    return unwrapResult<Record<string, unknown>>(result);
  }
export async function getMessages(transport: ApiTransport,
    sessionId: string,
  ): Promise<{ messages: Record<string, string>[] }> {
    const result = await transport.request("getMessages", {
      body: { session_id: sessionId },
    });
    return unwrapResult<{ messages: Record<string, string>[] }>(result);
  }
export async function setModel(transport: ApiTransport,
    sessionId: string,
    params: { provider: string; modelId: string },
  ): Promise<void> {
    const result = await transport.request("setModel", {
      body: {
        session_id: sessionId,
        provider: params.provider,
        modelId: params.modelId,
      },
    });
    unwrapResult(result);
  }
export async function cycleModel(transport: ApiTransport, sessionId: string): Promise<void> {
    const result = await transport.request("cycleModel", {
      body: { session_id: sessionId },
    });
    unwrapResult(result);
  }
  /**
   * The agent returns full model descriptors here (contextWindow, maxTokens,
   * input modalities, cost, reasoning, thinkingLevelMap), not just ids.
   */
export async function getAvailableModels(transport: ApiTransport, sessionId: string): Promise<{ models: ModelInfo[] }> {
    const result = await transport.request("getAvailableModels", {
      body: { session_id: sessionId },
    });
    return unwrapResult<{ models: ModelInfo[] }>(result);
  }
export async function setThinkingLevel(transport: ApiTransport, sessionId: string, level: string): Promise<void> {
    const result = await transport.request("setThinkingLevel", {
      body: { session_id: sessionId, level },
    });
    unwrapResult(result);
  }
export async function cycleThinkingLevel(transport: ApiTransport, sessionId: string): Promise<void> {
    const result = await transport.request("cycleThinkingLevel", {
      body: { session_id: sessionId },
    });
    unwrapResult(result);
  }
export async function getAvailableThinkingLevels(transport: ApiTransport, sessionId: string): Promise<{ levels: string[] }> {
    const result = await transport.request("getAvailableThinkingLevels", {
      body: { session_id: sessionId },
    });
    return unwrapResult<{ levels: string[] }>(result);
  }
export async function setSteeringMode(transport: ApiTransport, sessionId: string, mode: string): Promise<void> {
    const result = await transport.request("setSteeringMode", {
      body: { session_id: sessionId, mode },
    });
    unwrapResult(result);
  }
export async function setFollowUpMode(transport: ApiTransport, sessionId: string, mode: string): Promise<void> {
    const result = await transport.request("setFollowUpMode", {
      body: { session_id: sessionId, mode },
    });
    unwrapResult(result);
  }
export async function compact(transport: ApiTransport,
    sessionId: string,
    customInstructions?: string,
  ): Promise<CompactionResult> {
    const result = await transport.request("compact", {
      body: { session_id: sessionId, customInstructions },
    });
    return unwrapResult<CompactionResult>(result);
  }
export async function setAutoCompaction(transport: ApiTransport,
    sessionId: string,
    enabled: boolean,
  ): Promise<void> {
    const result = await transport.request("setAutoCompaction", {
      body: { session_id: sessionId, enabled },
    });
    unwrapResult(result);
  }
export async function setAutoRetry(transport: ApiTransport, sessionId: string, enabled: boolean): Promise<void> {
    const result = await transport.request("setAutoRetry", {
      body: { session_id: sessionId, enabled },
    });
    unwrapResult(result);
  }
export async function abortRetry(transport: ApiTransport, sessionId: string): Promise<void> {
    const result = await transport.request("abortRetry", {
      body: { session_id: sessionId },
    });
    unwrapResult(result);
  }
export async function bash(transport: ApiTransport,
    sessionId: string,
    command: string,
    id?: string,
  ): Promise<{
    output: string;
    exitCode: number;
    cancelled: boolean;
    truncated: boolean;
    fullOutputPath?: string | null;
  }> {
    const result = await transport.request("bash", {
      body: { session_id: sessionId, command, id },
    });
    return unwrapResult(result);
  }
export async function abortBash(transport: ApiTransport, sessionId: string): Promise<void> {
    const result = await transport.request("abortBash", {
      body: { session_id: sessionId },
    });
    unwrapResult(result);
  }
export async function newSession(transport: ApiTransport,
    sessionId: string,
    parentSession?: string,
  ): Promise<AgentSessionCommandResponse> {
    const result = await transport.request("newSession", {
      body: { session_id: sessionId, parentSession },
    });
    return unwrapResult<AgentSessionCommandResponse>(result);
  }
export async function switchSession(transport: ApiTransport,
    sessionId: string,
    sessionPath: string,
  ): Promise<AgentSessionCommandResponse> {
    const result = await transport.request("switchSession", {
      body: { session_id: sessionId, sessionPath },
    });
    return unwrapResult<AgentSessionCommandResponse>(result);
  }
export async function fork(transport: ApiTransport,
    sessionId: string,
    entryId: string,
    position: "before" | "at" = "before",
  ): Promise<{ text?: string; selectedText?: string; cancelled: boolean; session?: { sessionId: string; sessionFile?: string; workspaceId?: string; listItem?: SessionListItem } }> {
    const result = await transport.request("fork", {
      body: { session_id: sessionId, entryId, position } as never,
    });
    return unwrapResult(result);
  }
export async function cloneSession(transport: ApiTransport, sessionId: string): Promise<AgentSessionCommandResponse> {
    const result = await transport.request("cloneSession", {
      body: { session_id: sessionId },
    });
    return unwrapResult<AgentSessionCommandResponse>(result);
  }
export async function getEntries(transport: ApiTransport,
    sessionId: string,
    since?: string,
  ): Promise<Record<string, unknown>> {
    const result = await transport.request("getEntries", {
      body: { session_id: sessionId, since },
    });
    return unwrapResult<Record<string, unknown>>(result);
  }
export async function getTree(transport: ApiTransport, sessionId: string): Promise<Record<string, unknown>> {
    const result = await transport.request("getTree", {
      body: { session_id: sessionId },
    });
    return unwrapResult<Record<string, unknown>>(result);
  }
export async function getForkMessages(transport: ApiTransport,
    sessionId: string,
  ): Promise<{ messages: Array<{ entryId: string; text: string }> }> {
    const result = await transport.request("getForkMessages", {
      body: { session_id: sessionId },
    });
    return unwrapResult(result);
  }
export async function getLastAssistantText(transport: ApiTransport,
    sessionId: string,
  ): Promise<{ text: string | null }> {
    const result = await transport.request("getLastAssistantText", {
      body: { session_id: sessionId },
    });
    return unwrapResult(result);
  }
export async function getSessionStats(transport: ApiTransport, sessionId: string): Promise<{
    sessionFile: string;
    sessionId: string;
    userMessages: number;
    assistantMessages: number;
    toolCalls: number;
    toolResults: number;
    totalMessages: number;
    tokens: {
      input: number;
      output: number;
      cacheRead: number;
      cacheWrite: number;
      total: number;
    };
    cost: number;
    contextUsage?: {
      tokens: number | null;
      contextWindow: number;
      percent: number | null;
    };
  }> {
    const result = await transport.request("getSessionStats", {
      body: { session_id: sessionId },
    });
    return unwrapResult(result);
  }
export async function exportHtml(transport: ApiTransport,
    sessionId: string,
    outputPath?: string,
  ): Promise<{ path: string }> {
    const result = await transport.request("exportHtml", {
      body: { session_id: sessionId, outputPath },
    });
    return unwrapResult(result);
  }
export async function setSessionName(transport: ApiTransport, sessionId: string, name: string): Promise<void> {
    const result = await transport.request("setSessionName", {
      body: { session_id: sessionId, name },
    });
    unwrapResult(result);
  }
export async function getCommands(transport: ApiTransport, sessionId: string): Promise<{
    commands: Array<{
      name: string;
      description?: string;
      source?: "extension" | "prompt" | "skill";
      location?: "user" | "project" | "path";
      path?: string;
      sourceInfo?: {
        path?: string;
        scope?: "user" | "project";
        source?: string;
      };
    }>;
  }> {
    const result = await transport.request("getCommands", {
      body: { session_id: sessionId },
    });
    return unwrapResult(result);
  }
export async function getProductCapabilities(transport: ApiTransport, sessionId: string): Promise<AgentProductCapabilities> {
    const result = await transport.request("getProductCapabilities", { body: { session_id: sessionId } });
    return unwrapResult<AgentProductCapabilities>(result);
  }

export async function setCacheWarmingMode(transport: ApiTransport, sessionId: string, mode: "off" | "streaming" | "idle"): Promise<void> {
    const result = await transport.request("setCacheWarmingMode", { body: { session_id: sessionId, mode } });
    unwrapResult(result);
  }

export async function setActiveTools(transport: ApiTransport, sessionId: string, toolNames: string[]): Promise<void> {
    const result = await transport.request("setActiveTools", { body: { session_id: sessionId, tool_names: toolNames } });
    unwrapResult(result);
  }

export async function extensionUiResponse(transport: ApiTransport, params: {
    sessionId: string;
    id: string;
    value?: string;
    confirmed?: boolean;
    cancelled?: boolean;
  }): Promise<void> {
    const result = await transport.request("extensionUiResponse", {
      body: {
        session_id: params.sessionId,
        id: params.id,
        value: params.value,
        confirmed: params.confirmed,
        cancelled: params.cancelled,
      },
    });
    unwrapResult(result);
  }
