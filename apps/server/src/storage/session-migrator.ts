import { existsSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { SessionManager } from "@earendil-works/pi-coding-agent";
import type { PersistedSession } from "./state-store.ts";

/**
 * Reconcile persisted session records against the native pi-coding-agent SDK
 * session store (`SessionManager.listAll()` → `~/.pi/agent/sessions/`, the same
 * store the engine writes to, including `.archive/` subdirectories).
 *
 * Uses the SDK as the single source of truth for what sessions exist; our own
 * server only keeps a metadata index on top of it.
 *
 * Does two things, idempotently:
 *  1. Removes "ghost" records whose session file no longer exists on disk.
 *  2. Imports every session the SDK discovers that has no record yet.
 */
export interface ReconcileResult {
  imported: number;
  removed: number;
  remapped: number;
  total: number;
}

function sessionModifiedAt(path: string, sdkModified: Date | string): number {
  const sdkTime = sdkModified instanceof Date ? sdkModified.getTime() : new Date(sdkModified).getTime();
  try {
    return Math.max(Number.isNaN(sdkTime) ? 0 : sdkTime, statSync(path).mtimeMs);
  } catch {
    return Number.isNaN(sdkTime) ? Date.now() : sdkTime;
  }
}

/**
 * Native SDK listing for one working directory, shaped as the session list
 * items the API/UI expect (display_name from the explicit session name, falling
 * back to the first user message). Archived files are not discovered by the SDK.
 */
export async function listNativeSessionItems(cwd: string): Promise<Array<Record<string, unknown>>> {
  const infos = await SessionManager.list(cwd); // SDK-caught: returns [] on missing/unreadable dir
  return infos.map((info) => {
    const created = info.created instanceof Date ? info.created : new Date(info.created as string);
    const modified = info.modified instanceof Date ? info.modified : new Date(info.modified as string);
    const firstMessage = info.firstMessage && info.firstMessage !== "(no messages)" ? info.firstMessage : null;
    return {
      id: info.id,
      file_path: info.path,
      cwd: info.cwd ?? cwd,
      display_name: info.name ?? firstMessage,
      created_at: Number.isNaN(created.getTime()) ? new Date().toISOString() : created.toISOString(),
      last_active: sessionModifiedAt(info.path, modified),
      message_count: info.messageCount ?? 0,
      version: info.messageCount ?? 0,
    };
  });
}

/** Normalize workspace/cwd paths for comparison (resolves, strips slash). */
function normalized(p: string): string {
  return resolve(p);
}

export async function reconcileSessionRecords(
  existing: PersistedSession[],
  workspaces: Array<{ id: string; path: string }>,
  archivedSessionIds: ReadonlySet<string> = new Set(),
  systemWorkspacePath = join(homedir(), ".aijee", "system-workspace"),
): Promise<{ sessions: PersistedSession[]; result: ReconcileResult }> {
  const systemRoot = normalized(systemWorkspacePath);
  // 1. Drop ghost records whose session file is gone (our metadata index only).
  const kept = existing.filter((record) =>
    !archivedSessionIds.has(record.session_id) &&
    existsSync(record.session_file) &&
    (record.workspace_id !== "__chat__" || normalized(record.cwd) === systemRoot || normalized(record.cwd).startsWith(`${systemRoot}/`)),
  );
  const removed = existing.length - kept.length;

  // 2. Match session cwd (from the SDK header) to workspace by normalized path.
  const cwdToWorkspace = new Map<string, string>();
  for (const workspace of workspaces) cwdToWorkspace.set(normalized(workspace.path), workspace.id);
  /**
   * Sessions belong to a registered workspace, or to the chat pseudo-workspace
   * when they live under AiJee's private system workspace.
   * Sessions from unrelated project directories are skipped: they would only
   * add noise, and they get picked up once that workspace is added.
   */
  const workspaceOf = (cwd: string): string | undefined => {
    const key = normalized(cwd);
    const workspaceId = cwdToWorkspace.get(key);
    if (workspaceId) return workspaceId;
    return key === systemRoot || key.startsWith(`${systemRoot}/`) ? "__chat__" : undefined;
  };

  // 3. Native SDK discovery: every session file it can read, across all projects.
  const infos = await SessionManager.listAll();

  // 4. Merge by session id: keep existing records, import everything else.
  let remapped = 0;
  const remappedExisting = kept.map((record) => {
    const workspaceId = workspaceOf(record.cwd);
    if (!workspaceId || workspaceId === record.workspace_id) return record;
    remapped += 1;
    return { ...record, workspace_id: workspaceId };
  });
  const byId = new Map(remappedExisting.map((record) => [record.session_id, record]));
  let imported = 0;
  for (const info of infos) {
    if (archivedSessionIds.has(info.id) || byId.has(info.id)) continue;
    const workspaceId = workspaceOf(info.cwd ?? "");
    if (!workspaceId) continue;
    const created = info.created instanceof Date ? info.created.getTime() : Number.NaN;
    byId.set(info.id, {
      session_id: info.id,
      session_file: info.path,
      workspace_id: workspaceId,
      cwd: info.cwd ?? "",
      created_at: Number.isNaN(created) ? new Date().toISOString() : new Date(created).toISOString(),
      last_active: sessionModifiedAt(info.path, info.modified),
    });
    imported++;
  }

  // 5. Stable ordering: most recently active first (matches old disk-scan UX).
  const sessions = [...byId.values()].sort((a, b) => b.last_active - a.last_active);
  return { sessions, result: { imported, removed, remapped, total: sessions.length } };
}
