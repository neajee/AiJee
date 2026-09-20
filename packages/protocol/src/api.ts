import type { ImageContent } from "./content.ts";

export interface ApiEnvelope<T = unknown> {
    success: boolean;
    data: T | null;
    error: string | null;
}

export type ActiveSessionSummary = {
    cwd: string;
    process_alive: boolean;
    session_file: string;
    session_id: string;
    workspace_id: string;
};

export type AgentBashRequest = {
    command: string;
    id?: string | null;
    session_id: string;
};

export type AgentCompactRequest = {
    customInstructions?: string | null;
    session_id: string;
};

export type AgentEntriesRequest = {
    session_id: string;
    since?: string | null;
};

export type AgentExportHtmlRequest = {
    outputPath?: string | null;
    session_id: string;
};

export type AgentExtensionUiResponseRequest = {
    cancelled?: boolean | null;
    confirmed?: boolean | null;
    id: string;
    session_id: string;
    value?: unknown;
};

export type AgentForkRequest = {
    entryId: string;
    session_id: string;
};

export type AgentMessageRequest = {
    images?: Array<ImageContent> | null;
    message: string;
    session_file?: string | null;
    session_id: string;
    workspace_id?: string | null;
};

export type AgentMode = {
    created_at: string;
    description?: string | null;
    extensions: Array<string>;
    extra_args: Array<string>;
    id: string;
    is_default: boolean;
    model?: string | null;
    name: string;
    skills: Array<string>;
    sort_order: number;
    system_prompt?: string | null;
    thinking_level?: string | null;
    updated_at: string;
};

export type AgentNewSessionRequest = {
    parentSession?: string | null;
    session_id: string;
};

export type AgentPromptRequest = {
    images?: Array<ImageContent> | null;
    message: string;
    session_file?: string | null;
    session_id: string;
    streaming_behavior?: string | null;
    workspace_id?: string | null;
};

export type AgentRuntimeStatus = {
    can_install_pi: boolean;
    node: RuntimeDependencyStatus;
    pi: RuntimeDependencyStatus;
    ready: boolean;
};

export type AgentSessionCommandResponse = {
    cancelled: boolean;
    result: unknown;
    session: AgentSessionInfo;
};

export type AgentSessionIdRequest = {
    session_id: string;
};

export type AgentSessionInfo = {
    auto_compaction_enabled?: boolean | null;
    cwd: string;
    is_compacting: boolean;
    message_count?: number | null;
    model?: unknown;
    pending_message_count?: number | null;
    process_alive: boolean;
    session_file: string;
    session_id: string;
    session_name?: string | null;
    thinking_level?: string | null;
    workspace_id: string;
};

export type AgentSetBoolRequest = {
    enabled: boolean;
    session_id: string;
};

export type AgentSetModeRequest = {
    mode: string;
    session_id: string;
};

export type AgentSetModelRequest = {
    modelId: string;
    provider: string;
    session_id: string;
};

export type AgentSetSessionNameRequest = {
    name: string;
    session_id: string;
};

export type AgentSetThinkingRequest = {
    level: string;
    session_id: string;
};

export type AgentProductCapabilities = {
    cacheWarming: { mode: "off" | "streaming" | "idle"; status: Record<string, unknown> | null };
    compaction: { enabled: boolean; reserveTokens: number; keepRecentTokens: number };
    prompt: { activeToolNames: string[]; hasSystemPrompt: boolean; systemPromptLength: number; isIdle: boolean; isCompacting: boolean };
    retry: { enabled: boolean; maxRetries: number; baseDelayMs: number; maxAgentDelayMs: number; attempt: number };
};

export type AgentSetCacheWarmingModeRequest = { mode: "off" | "streaming" | "idle"; session_id: string };
export type AgentSetActiveToolsRequest = { session_id: string; tool_names: string[] };

export type AgentSwitchSessionRequest = {
    sessionPath: string;
    session_id: string;
};

export type AuthTokensResponse = {
    access_expires_at: string;
    access_token: string;
    refresh_expires_at: string;
    refresh_token: string;
};

export type CreateAgentModeRequest = {
    description?: string | null;
    extensions?: Array<string> | null;
    extra_args?: Array<string> | null;
    is_default?: boolean | null;
    model?: string | null;
    name: string;
    skills?: Array<string> | null;
    sort_order?: number | null;
    thinking_level?: string | null;
    system_prompt?: string | null;
};

export type CreateAgentSessionRequest = {
    mode_id?: string | null;
    session_path?: string | null;
    workspace_id: string;
};

export type CreateChatSessionRequest = {
    mode_id?: string | null;
    no_tools?: boolean | null;
    system_prompt?: string | null;
};

export type CreateWorkspaceRequest = {
    color?: string | null;
    name: string;
    path: string;
    startup_script?: string | null;
    workspace_enabled?: boolean | null;
};

export type CustomModelEntry = {
    api?: string | null;
    baseUrl?: string | null;
    contextWindow?: number | null;
    cost?: null | ModelCost;
    id: string;
    /**
     * Accepted input modalities, e.g. `["text", "image"]`.
     */
    input?: Array<string> | null;
    maxTokens?: number | null;
    name?: string | null;
    reasoning?: boolean | null;
    /**
     * `null` for a level marks it unsupported; a missing key means "provider default".
     */
    thinkingLevelMap?: {
        [key: string]: unknown;
    } | null;
    [key: string]: unknown | (string | null) | (string | null) | (number | null) | (null | ModelCost) | string | (Array<string> | null) | (number | null) | (string | null) | (boolean | null) | ({
        [key: string]: unknown;
    } | null) | undefined;
};

export type CustomModelsConfig = {
    /**
     * Set when models.json exists but could not be parsed. The UI must refuse
     * to save in that case, otherwise it would overwrite a file it cannot see.
     */
    parseError?: string | null;
    providers?: {
        [key: string]: CustomProvider;
    };
};

export type CustomProvider = {
    api?: string | null;
    apiKey?: string | null;
    baseUrl?: string | null;
    models?: Array<CustomModelEntry>;
    name?: string | null;
    [key: string]: unknown | (string | null) | (string | null) | (string | null) | Array<CustomModelEntry> | (string | null) | undefined;
};

export type ErrorBody = {
    error: string;
    success: boolean;
};

export type FsDeleteRequest = {
    path: string;
    recursive?: boolean | null;
};

export type FsEntry = {
    is_dir: boolean;
    modified?: string | null;
    name: string;
    path: string;
    size: number;
};

export type FsListResponse = {
    entries: Array<FsEntry>;
    path: string;
    total: number;
};

export type FsMkdirRequest = {
    path: string;
};

export type FsReadResponse = {
    content: string;
    length: number;
    offset: number;
    path: string;
    size: number;
    truncated: boolean;
};

export type FsUploadFileResult = {
    error?: string | null;
    name: string;
    path: string;
    size: number;
    success: boolean;
};

export type FsUploadResponse = {
    files: Array<FsUploadFileResult>;
    succeeded: number;
    total: number;
};

export type FsWriteRequest = {
    content: string;
    path: string;
};

export type GitBranch = {
    is_current: boolean;
    is_remote: boolean;
    name: string;
    upstream?: string | null;
};

export type GitCheckoutRequest = {
    branch: string;
    create?: boolean | null;
};

export type GitCommitRequest = {
    message: string;
};

export type GitDiffResponse = {
    diff: string;
    files_changed: number;
    stats: string;
};

export type GitFileDiffResponse = {
    diff: string;
    path: string;
};

export type GitFileEntry = {
    additions: number;
    deletions: number;
    path: string;
    status: string;
};

export type GitLogEntry = {
    author: string;
    date: string;
    hash: string;
    message: string;
    short_hash: string;
};

export type GitPathsRequest = {
    paths: Array<string>;
};

export type GitRemote = {
    name: string;
    url: string;
};

export type GitStashApplyRequest = {
    index?: number | null;
    pop?: boolean | null;
};

export type GitStashEntry = {
    index: number;
    message: string;
};

export type GitStatusResponse = {
    ahead: number;
    behind: number;
    branch: string;
    is_clean: boolean;
    remote_url?: string | null;
    remotes?: Array<GitRemote>;
    staged: Array<GitFileEntry>;
    unstaged: Array<GitFileEntry>;
    untracked: Array<string>;
};

export type GitWorktree = {
    branch?: string | null;
    commit: string;
    is_bare: boolean;
    path: string;
};

export type GitWorktreeAddRequest = {
    branch?: string | null;
    new_branch?: string | null;
    path: string;
};

export type GitWorktreeRemoveRequest = {
    force?: boolean | null;
    path: string;
};

export type HealthResponse = {
    status: string;
};

export type InstalledPackage = {
    name: string;
    scope: string;
    version?: string | null;
};

export type LoginRequest = {
    password: string;
    username: string;
};

export type LogoutRequest = {
    refresh_token?: string | null;
};

export type MarketplacePackage = {
    author?: string | null;
    description?: string | null;
    downloads?: number | null;
    homepage?: string | null;
    name: string;
    npm_url: string;
    package_types: Array<string>;
    readme?: string | null;
    repository?: string | null;
    updated_at?: string | null;
    version: string;
};

export type ModelCost = {
    cacheRead: number;
    cacheWrite: number;
    input: number;
    output: number;
};

export type NestedGitRepo = {
    branch: string;
    /**
     * Relative path from the workspace root
     */
    path: string;
    remotes: Array<GitRemote>;
};

export type NestedGitReposResponse = {
    repos: Array<NestedGitRepo>;
};

export type OperationLog = {
    created_at: string;
    id: number;
    operation: string;
    output: string;
    status: string;
};

export type OperationResult = {
    operation: string;
    output: string;
    success: boolean;
};

export type PackageOperationRequest = {
    lock_version?: boolean | null;
    name: string;
    operation: string;
    scope: string;
    version?: string | null;
    workspace_id?: string | null;
};

export type PackageSearchResponse = {
    from_cache: boolean;
    packages: Array<MarketplacePackage>;
    total: number;
};

export type PackageStatus = {
    installed: boolean;
    installed_version?: string | null;
    latest_version?: string | null;
    name: string;
};

export type PaginatedSessions = {
    has_more: boolean;
    items: Array<SessionListItem>;
    limit: number;
    page: number;
    total: number;
};

export type PairRequest = {
    qr_id: string;
};

export type PathCompletion = {
    is_dir: boolean;
    path: string;
};

export type RefreshRequest = {
    refresh_token: string;
};

export type RuntimeDependencyStatus = {
    command: string;
    details?: string | null;
    installed: boolean;
    path?: string | null;
    version?: string | null;
};

export type SaveCustomModelsRequest = {
    providers: {
        [key: string]: CustomProvider;
    };
};

export type SessionDetail = {
    entries: Array<SessionEntry>;
    header: SessionHeader;
};

export type SessionEntry = {
    entry_type: string;
    id: string;
    parent_id?: string | null;
    preview?: string | null;
    raw: unknown;
    role?: string | null;
    timestamp: string;
};

export type SessionHeader = {
    cwd: string;
    id: string;
    parent_session?: string | null;
    timestamp: string;
    version: number;
};

export type SessionHistoryQuery = {
    before?: string | null;
    limit?: number | null;
};

export type SessionHistoryResponse = {
    has_more: boolean;
    messages: Array<unknown>;
    oldest_entry_id?: string | null;
};

export type SessionInfo = {
    access_expires_at: string;
    access_token: string;
    created_at: string;
    refresh_expires_at: string;
    refresh_token: string;
    username: string;
};

export type SessionListItem = {
    created_at: string;
    cwd: string;
    display_name?: string | null;
    file_path: string;
    id: string;
    last_active: number;
    message_count: number;
    version: number;
};

export type SessionModeResponse = {
    mode?: null | AgentMode;
    session_id: string;
};

export type SessionRenameRequest = {
    name: string;
};

export type SessionTreeNode = {
    children: Array<SessionTreeNode>;
    entry_type: string;
    id: string;
    role?: string | null;
    timestamp: string;
};

export type SetActiveSessionRequest = {
    connection_id: string;
    from_delta_event_id?: number | null;
    from_event_id?: number | null;
    session_id?: string | null;
};

/**
 * Request to start a task
 */
export type StartTaskRequest = {
    label: string;
    workspace_id: string;
};

export type StreamEvent = {
    data: unknown;
    id: number;
    session_id: string;
    timestamp: number;
    type: string;
    workspace_id: string;
};

/**
 * Request to stop/restart a task
 */
export type TaskActionRequest = {
    task_id: string;
};

/**
 * A single task definition – either from .pi/tasks.json or auto-detected
 */
export type TaskDefinition = {
    auto_run?: boolean | null;
    command: string;
    cwd?: string | null;
    env?: {
        [key: string]: string;
    } | null;
    group?: string | null;
    is_background?: boolean | null;
    label: string;
    /**
     * Where this task was detected from: "npm", "make", "cargo", "docker-compose",
     * "pip", "gradle", "pi" (from .pi/tasks.json), etc.
     */
    source?: string;
    type?: string;
};

/**
 * Runtime info about a task instance
 */
export type TaskInfo = {
    command: string;
    exit_code?: number | null;
    id: string;
    label: string;
    /**
     * Source of the task: "npm", "make", "cargo", "pi", etc.
     */
    source: string;
    started_at: string;
    status: TaskStatus;
    stopped_at?: string | null;
    workspace_id: string;
};

/**
 * Task log output
 */
export type TaskLogs = {
    id: string;
    label: string;
    lines: Array<string>;
    total_lines: number;
};

/**
 * Status of a running task
 */
export type TaskStatus = 'running' | 'stopped' | 'failed';

/**
 * Tasks configuration file format
 */
export type TasksConfig = {
    tasks: Array<TaskDefinition>;
    version?: string;
};

export type TouchAgentSessionRequest = {
    session_file: string;
    workspace_id: string;
};

export type TouchChatSessionRequest = {
    session_file?: string | null;
};

export type UpdateAgentModeRequest = {
    description?: string | null;
    extensions?: Array<string> | null;
    extra_args?: Array<string> | null;
    is_default?: boolean | null;
    model?: string | null;
    name?: string | null;
    skills?: Array<string> | null;
    sort_order?: number | null;
    thinking_level?: string | null;
    system_prompt?: string | null;
};

export type UpdateWorkspaceRequest = {
    color?: string | null;
    name?: string | null;
    path?: string | null;
    startup_script?: string | null;
    workspace_enabled?: boolean | null;
};

export type VersionResponse = {
    name: string;
    /** Whether the server process is running in remote mode. */
    remote: boolean;
    server_id: string;
    version: string;
};

export type Workspace = {
    color?: string | null;
    created_at: string;
    id: string;
    name: string;
    path: string;
    startup_script?: string | null;
    status: WorkspaceStatus;
    updated_at: string;
    workspace_enabled: boolean;
};

export type WorkspaceStatus = 'active' | 'archived';
