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

export async function gitStatus(transport: ApiTransport, cwd: string): Promise<GitStatusResponse> {
    const result = await transport.request("status", { query: { cwd } });
    return unwrapResult<GitStatusResponse>(result);
  }


export async function gitBranches(transport: ApiTransport, cwd: string): Promise<GitBranch[]> {
    const result = await transport.request("branches", { query: { cwd } });
    return unwrapResult<GitBranch[]>(result);
  }


export async function gitCheckout(transport: ApiTransport,
    cwd: string,
    params: { branch: string; create?: boolean },
  ): Promise<void> {
    const result = await transport.request("checkout", {
      query: { cwd },
      body: {
        branch: params.branch,
        create: params.create,
      },
    });
    unwrapResult(result);
  }


export async function gitCommit(transport: ApiTransport, cwd: string, message: string): Promise<void> {
    const result = await transport.request("commit", { query: { cwd }, body: { message } });
    unwrapResult(result);
  }


export async function gitDiff(transport: ApiTransport,
    cwd: string,
    staged?: boolean,
  ): Promise<GitDiffResponse> {
    const result = await transport.request("diff", { query: { cwd, staged } });
    return unwrapResult<GitDiffResponse>(result);
  }


export async function gitDiffFile(transport: ApiTransport,
    cwd: string,
    path: string,
    staged?: boolean,
  ): Promise<GitFileDiffResponse> {
    const result = await transport.request("diffFile", { query: { cwd, path, staged } });
    return unwrapResult<GitFileDiffResponse>(result);
  }


export async function gitDiscard(transport: ApiTransport, cwd: string, paths: string[]): Promise<void> {
    const result = await transport.request("discard", { query: { cwd }, body: { paths } });
    unwrapResult(result);
  }


export async function gitLog(transport: ApiTransport,
    cwd: string,
    count?: number,
  ): Promise<GitLogEntry[]> {
    const result = await transport.request("log", { query: { cwd, count } });
    return unwrapResult<GitLogEntry[]>(result);
  }


export async function gitStage(transport: ApiTransport, cwd: string, paths: string[]): Promise<void> {
    const result = await transport.request("stage", { query: { cwd }, body: { paths } });
    unwrapResult(result);
  }


export async function gitUnstage(transport: ApiTransport, cwd: string, paths: string[]): Promise<void> {
    const result = await transport.request("unstage", { query: { cwd }, body: { paths } });
    unwrapResult(result);
  }


export async function gitNestedRepos(transport: ApiTransport, cwd: string): Promise<NestedGitReposResponse> {
    const result = await transport.request("nestedRepos", { query: { cwd } });
    return unwrapResult<NestedGitReposResponse>(result);
  }


export async function gitStashList(transport: ApiTransport, cwd: string): Promise<GitStashEntry[]> {
    const result = await transport.request("stashList", { query: { cwd } });
    return unwrapResult<GitStashEntry[]>(result);
  }


export async function gitStashPush(transport: ApiTransport, cwd: string, message?: string): Promise<void> {
    const result = await transport.request("stashPush", {
      query: { cwd, message },
    });
    unwrapResult(result);
  }


export async function gitStashApply(transport: ApiTransport, cwd: string, index?: number, pop?: boolean): Promise<void> {
    const result = await transport.request("stashApply", {
      query: { cwd },
      body: { index, pop },
    });
    unwrapResult(result);
  }


export async function gitStashDrop(transport: ApiTransport, cwd: string, index: number): Promise<void> {
    const result = await transport.request("stashDrop", {
      query: { cwd, index },
    });
    unwrapResult(result);
  }


export async function gitWorktreeList(transport: ApiTransport, cwd: string): Promise<GitWorktree[]> {
    const result = await transport.request("worktreeList", { query: { cwd } });
    return unwrapResult<GitWorktree[]>(result);
  }


export async function gitWorktreeAdd(transport: ApiTransport,
    cwd: string,
    params: { path: string; branch?: string; newBranch?: string },
  ): Promise<void> {
    const result = await transport.request("worktreeAdd", {
      query: { cwd },
      body: {
        path: params.path,
        branch: params.branch,
        new_branch: params.newBranch,
      },
    });
    unwrapResult(result);
  }


export async function gitWorktreeRemove(transport: ApiTransport, cwd: string, path: string): Promise<void> {
    const result = await transport.request("worktreeRemove", {
      query: { cwd },
      body: { path },
    });
    unwrapResult(result);
  }

  // ---------------------------------------------------------------------------
  // Filesystem
  // ---------------------------------------------------------------------------
