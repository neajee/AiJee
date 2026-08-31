export * from "./stream-events";
export * from "./chat-message";

export type {
  AgentMode,
  AgentSessionInfo,
  ActiveSessionSummary,
  AgentRuntimeStatus,
  AgentSessionCommandResponse,
  CustomModelEntry,
  CustomModelsConfig,
  CustomProvider,
  FsEntry,
  FsListResponse,
  FsReadResponse,
  FsUploadFileResult,
  FsUploadResponse,
  GitBranch,
  GitDiffResponse,
  GitFileDiffResponse,
  GitFileEntry,
  GitLogEntry,
  GitRemote,
  GitStashEntry,
  GitStatusResponse,
  GitWorktree,
  NestedGitRepo,
  NestedGitReposResponse,
  PackageStatus,
  MarketplacePackage,
  PackageOperationRequest,
  PackageSearchResponse,
  OperationResult,
  PaginatedSessions,
  PathCompletion,
  SessionDetail,
  SessionEntry,
  SessionHistoryResponse,
  SessionListItem,
  SessionTreeNode,
  TaskDefinition,
  TaskInfo,
  TaskLogs,
  TasksConfig,
  Workspace,
} from "../generated/types.gen";

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export interface ConnectionState {
  status: ConnectionStatus;
  retryAttempt: number;
  nextRetryAt: number | null;
  lastDisconnectReason: string | null;
  disconnectedAt: number | null;
}

export interface PiClientConfig {
  serverUrl: string;
  accessToken: string;
  onAuthError?: () => void;
  onApiAuthError?: () => Promise<string | null>;
  transport?: "sse" | "ws";
  reconnectBaseMs?: number;
  reconnectMaxMs?: number;
}

/**
 * models.json as read from disk, plus the read/parse failure the server
 * reports instead of pretending the file is empty.
 *
 * `parseError` is hand-declared until the OpenAPI types are regenerated
 * (`yarn api:generate`); the server already returns it.
 */
export interface CustomModelsConfigResult {
  providers?: Record<string, import("../generated/types.gen").CustomProvider>;
  /**
   * Present when models.json exists but could not be read. Saving is rejected
   * by the server in that state, so the UI must surface it rather than showing
   * an empty provider list.
   */
  parseError?: string;
}

/** A Pi SDK-owned provider; credentials are never included in this shape. */
export interface BuiltinProvider {
  id: string;
  name: string;
  configured: boolean;
  model_count: number;
  supports_oauth: boolean;
  supports_api_key: boolean;
  auth_label: string | null;
  /** Credential provenance reported by Pi, never the credential itself. */
  auth_source: string | null;
}
