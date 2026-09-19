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

export async function fsList(transport: ApiTransport, path: string): Promise<FsListResponse> {
    const result = await transport.request("list", { query: { path } });
    return unwrapResult<FsListResponse>(result);
  }


export async function fsRead(transport: ApiTransport, path: string): Promise<FsReadResponse> {
    const result = await transport.request("read", { query: { path } });
    return unwrapResult<FsReadResponse>(result);
  }


export async function fsWrite(transport: ApiTransport, path: string, content: string): Promise<void> {
    const result = await transport.request("write", { body: { path, content } });
    unwrapResult(result);
  }


export async function fsDelete(transport: ApiTransport, path: string): Promise<void> {
    const result = await transport.request("delete_", { body: { path } });
    unwrapResult(result);
  }


export async function fsMkdir(transport: ApiTransport, path: string): Promise<void> {
    const result = await transport.request("mkdir", { body: { path } });
    unwrapResult(result);
  }


export async function fsComplete(transport: ApiTransport, input: string): Promise<PathCompletion[]> {
    const result = await transport.request("complete", { query: { q: input } });
    return unwrapResult<PathCompletion[]>(result);
  }


export async function fsUpload(transport: ApiTransport, params: {
    path: string;
    createFormData: () => FormData;
    onProgress?: (loaded: number, total: number) => void;
  }): Promise<FsUploadResponse> {
    const url = transport.buildApiUrl("/api/fs/upload", { path: params.path });

    const execute = (allowRetry: boolean) =>
      new Promise<FsUploadResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.setRequestHeader("Authorization", `Bearer ${transport.accessToken}`);
        xhr.responseType = "text";

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            params.onProgress?.(event.loaded, event.total);
          }
        };

        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.onabort = () => reject(new Error("Upload cancelled"));
        xhr.onload = async () => {
          if (xhr.status === 401 && allowRetry && transport.onAuthError) {
            const newToken = await transport.onAuthError();
            if (newToken) {
              transport.accessToken = newToken;
              execute(false).then(resolve).catch(reject);
              return;
            }
          }

          let parsed: any = null;
          try {
            parsed = xhr.responseText ? JSON.parse(xhr.responseText) : null;
          } catch {
            // ignore parse failure and use status handling below
          }

          if (xhr.status < 200 || xhr.status >= 300) {
            const message = parsed?.error ?? parsed?.output ?? `Upload failed (${xhr.status})`;
            reject(new Error(message));
            return;
          }

          try {
            resolve(unwrapResult<FsUploadResponse>({ data: parsed }));
          } catch (error) {
            reject(error instanceof Error ? error : new Error("Upload failed"));
          }
        };

        xhr.send(params.createFormData());
      });

    return execute(true);
  }


export async function fsDownload(transport: ApiTransport, path: string): Promise<{
    data: Uint8Array;
    fileName: string;
    contentType: string;
  }> {
    const url = transport.buildApiUrl("/api/fs/download", { path });
    const response = await transport.authFetch(url);

    if (!response.ok) {
      let message = `Download failed (${response.status})`;
      try {
        const data = await response.json();
        if (data && typeof data === "object") {
          message = (data as any).error ?? message;
        }
      } catch {
        // ignore json parse errors
      }
      throw new Error(message);
    }

    const contentDisposition = response.headers.get("content-disposition") ?? "";
    const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
    const fileName = fileNameMatch?.[1] ?? path.split("/").pop() ?? "file";
    const contentType = response.headers.get("content-type") ?? "application/octet-stream";
    const buffer = await response.arrayBuffer();

    return {
      data: new Uint8Array(buffer),
      fileName,
      contentType,
    };
  }

  // ---------------------------------------------------------------------------
  // Package management
  // ---------------------------------------------------------------------------
