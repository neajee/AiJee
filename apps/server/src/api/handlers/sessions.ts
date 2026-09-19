import type { IncomingMessage, ServerResponse } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocket } from "ws";
import type { EngineSession } from "@aijee/engine";
import type { StreamEventEnvelope, AgentStreamEvent, ServerEvent } from "@aijee/protocol";
import type { HandlerContext, Workspace, ManagedSession, Mode, OAuthLogin, PersistedSession } from "./context.ts";
import { listNativeSessionItems, reconcileSessionRecords } from "../../storage/session-migrator.ts";
import { nextForkSessionName } from "./context.ts";
import { execFileSync } from "node:child_process";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative as relativePath, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import { constants as zlibConstants, createBrotliCompress, createGzip } from "node:zlib";
import { randomBytes, randomUUID } from "node:crypto";
import { corsHeaders, HttpError, maxJsonBodyBytes, maxPromptBodyBytes } from "../middleware/index.ts";
import { normalizeImageAttachments } from "../prompt-images.ts";
import { keepAliveFrame, openSse, sseFrame } from "../stream/serializer.ts";
import { recordTelemetry } from "../../telemetry/index.ts";
import { ModelRuntime } from "@earendil-works/pi-coding-agent";

export async function sessionMode(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse, sessionId: string): Promise<void> {
    const record = ctx.sessionRecords.get(sessionId);
    if (!record) return ctx.error(response, 404, "Session not found");
    if (request.method === "GET") return ctx.ok(response, { session_id: sessionId, mode: record.mode_id ? ctx.modes.get(record.mode_id) ?? null : null });
    if (request.method !== "PUT") return ctx.error(response, 405, "Method not allowed");
    const body = await ctx.body<{ mode_id?: string | null }>(request);
    if (body.mode_id !== null && body.mode_id !== undefined && !ctx.modes.has(body.mode_id)) return ctx.error(response, 404, "Mode not found");
    record.mode_id = body.mode_id ?? undefined;
    const managed = await ctx.restoreSession(sessionId);
    if (managed) { managed.modeId = record.mode_id; await ctx.applyMode(managed.session, record.mode_id); }
    await ctx.persist();
    ctx.ok(response, { session_id: sessionId, mode: record.mode_id ? ctx.modes.get(record.mode_id) ?? null : null });
  }


export async function createChatSession(ctx: HandlerContext, _request: IncomingMessage, response: ServerResponse): Promise<void> {
    await ctx.createManagedSession(response, ctx.systemWorkspacePath, undefined, "__chat__");
  }


export async function listChatSessions(ctx: HandlerContext, url: URL, response: ServerResponse): Promise<void> {
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));
    const items = await ctx.mergedSessionItems(ctx.systemWorkspacePath, "__chat__");
    const offset = (page - 1) * limit;
    ctx.ok(response, { items: items.slice(offset, offset + limit), page, limit, total: items.length, has_more: offset + limit < items.length });
  }

  /**
   * Native SDK list for a working directory, overlaid with live in-process
   * sessions (e.g. brand-new ones with no assistant reply yet, so no file).
   * Persisted records are kept only as a fallback for sessions the SDK does
   * not discover, so nothing previously visible disappears.
   */

export async function mergedSessionItems(ctx: HandlerContext, cwd: string, workspaceId: string): Promise<Array<Record<string, unknown>>> {
    const items = new Map<string, Record<string, unknown>>();
    const emptyNativeIds = new Set<string>();
    for (const item of await listNativeSessionItems(cwd)) {
      const id = item.id as string;
      if (ctx.archivedSessionIds.has(id)) continue;
      if ((item.message_count as number) <= 0 && !item.display_name && workspaceId !== "__chat__") emptyNativeIds.add(id);
      else items.set(id, item);
    }
    for (const record of ctx.sessionRecords.values()) {
      if (record.workspace_id !== workspaceId || (workspaceId === "__chat__" && !ctx.isSystemWorkspacePath(record.cwd)) || ctx.archivedSessionIds.has(record.session_id) || emptyNativeIds.has(record.session_id)) continue;
      const nativeItem = items.get(record.session_id);
      if (nativeItem) {
        items.set(record.session_id, {
          ...nativeItem,
          last_active: Math.max(nativeItem.last_active as number, record.last_active),
        });
        continue;
      }
      items.set(record.session_id, {
        id: record.session_id,
        file_path: record.session_file,
        cwd: record.cwd,
        display_name: null,
        created_at: record.created_at,
        last_active: record.last_active,
        message_count: 0,
        version: 0,
      });
    }
    for (const managed of ctx.sessions.values()) {
      if (managed.workspaceId !== workspaceId || managed.draft || ctx.archivedSessionIds.has(managed.session.describe().sessionId) || (workspaceId !== "__chat__" && managed.session.messages().length === 0) || items.has(managed.session.describe().sessionId)) continue;
      const descriptor = managed.session.describe();
      items.set(descriptor.sessionId, {
        id: descriptor.sessionId,
        file_path: descriptor.sessionFile ?? "",
        cwd: descriptor.cwd,
        display_name: typeof managed.session.state().sessionName === "string"
          ? managed.session.state().sessionName
          : null,
        created_at: managed.createdAt,
        last_active: managed.lastActive,
        message_count: managed.session.messages().length,
        version: (managed.session.entries() as Array<Record<string, unknown>>).length,
      });
    }
    return [...items.values()].sort((a, b) => (b.last_active as number) - (a.last_active as number));
  }


export async function touchChatSession(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse, sessionId: string): Promise<void> {
    const existing = await ctx.restoreSession(sessionId);
    if (existing) return ctx.ok(response, ctx.sessionInfo(sessionId));
    const body = await ctx.body<{ session_file?: string }>(request);
    await ctx.createManagedSession(response, ctx.systemWorkspacePath, body.session_file, "__chat__");
  }


export async function createManagedSession(ctx: HandlerContext, response: ServerResponse, cwd: string, sessionFile?: string, workspaceId = "__chat__", modeId?: string): Promise<void> {
    const key = randomUUID();
    const mode = modeId ? ctx.modes.get(modeId) : [...ctx.modes.values()].find((candidate) => candidate.is_default);
    const descriptor = await ctx.runtime.createSession(key, { cwd, sessionFile, appendSystemPrompt: mode?.system_prompt?.trim() ? [mode.system_prompt.trim()] : undefined });
    const session = ctx.runtime.sessions.get(key);
    if (!session) throw new Error("Session registry lost newly created session");
    const now = new Date().toISOString();
    ctx.sessions.set(descriptor.sessionId, { key, workspaceId, session, createdAt: now, lastActive: Date.now(), modeId });
    ctx.sessionRecords.set(descriptor.sessionId, { session_id: descriptor.sessionId, session_file: descriptor.sessionFile ?? "", workspace_id: workspaceId, cwd: descriptor.cwd, created_at: now, last_active: Date.now(), mode_id: modeId });
    await ctx.applyMode(session, modeId);
    await ctx.persist();
    ctx.bindSessionEvents(descriptor.sessionId, session, workspaceId);
    ctx.ok(response, ctx.sessionInfo(descriptor.sessionId), 201);
  }


export function chatSessionInfo(ctx: HandlerContext, sessionId: string): Record<string, unknown> {
    const managed = ctx.sessions.get(sessionId);
    const record = ctx.sessionRecords.get(sessionId);
    if (!managed && record) return { id: sessionId, file_path: record.session_file, cwd: record.cwd, display_name: null, created_at: record.created_at, last_active: record.last_active, message_count: null, version: null };
    if (!managed) throw new Error("Session not found");
    const descriptor = managed.session.describe();
    const entries = managed.session.entries() as Array<Record<string, unknown>>;
    const sessionName = managed.session.state().sessionName;
    return { id: sessionId, file_path: descriptor.sessionFile ?? "", cwd: descriptor.cwd, display_name: typeof sessionName === "string" ? sessionName : null, created_at: managed.createdAt, last_active: managed.lastActive, message_count: managed.session.messages().length, version: entries.length };
  }


export async function createSession(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse): Promise<void> {
    const body = await ctx.body<{ workspace_id?: string; session_path?: string; mode_id?: string; draft?: boolean }>(request);
    const workspace = body.workspace_id ? ctx.workspaces.get(body.workspace_id) : undefined;
    if (!workspace) return ctx.error(response, 404, "Workspace not found");
    if (body.draft) {
      const existing = [...ctx.sessions.values()].find((managed) => managed.draft && managed.workspaceId === workspace.id);
      if (existing) {
        const requestedMode = body.mode_id ? ctx.modes.get(body.mode_id) : [...ctx.modes.values()].find((candidate) => candidate.is_default);
        const requestedPrompt = requestedMode?.system_prompt?.trim() || undefined;
        if (existing.modeId === body.mode_id && existing.systemPrompt === requestedPrompt) return ctx.ok(response, ctx.sessionInfo(existing.session.describe().sessionId), 200);
        ctx.sessions.delete(existing.session.describe().sessionId);
        await existing.session.dispose();
      }
    }
    const key = randomUUID();
    const mode = body.mode_id ? ctx.modes.get(body.mode_id) : [...ctx.modes.values()].find((candidate) => candidate.is_default);
    const descriptor = await ctx.runtime.createSession(key, { cwd: workspace.path, sessionFile: body.session_path, appendSystemPrompt: mode?.system_prompt?.trim() ? [mode.system_prompt.trim()] : undefined });
    const session = ctx.runtime.sessions.get(key);
    if (!session) throw new Error("Session registry lost newly created session");
    const now = new Date().toISOString();
    ctx.sessions.set(descriptor.sessionId, { key, workspaceId: workspace.id, session, createdAt: now, lastActive: Date.now(), modeId: body.mode_id, systemPrompt: mode?.system_prompt?.trim() || undefined, draft: body.draft });
    if (!body.draft) ctx.sessionRecords.set(descriptor.sessionId, { session_id: descriptor.sessionId, session_file: descriptor.sessionFile ?? "", workspace_id: workspace.id, cwd: descriptor.cwd, created_at: now, last_active: Date.now(), mode_id: body.mode_id });
    await ctx.applyMode(session, body.mode_id);
    if (!body.draft) await ctx.persist();
    ctx.bindSessionEvents(descriptor.sessionId, session, workspace.id);
    ctx.ok(response, ctx.sessionInfo(descriptor.sessionId), 201);
  }


export async function touchAgentSession(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse, sessionId: string): Promise<void> {
    const existing = await ctx.restoreSession(sessionId);
    if (existing) return ctx.ok(response, ctx.sessionInfo(sessionId));
    const body = await ctx.body<{ session_file?: string; workspace_id?: string }>(request);
    const workspace = body.workspace_id ? ctx.workspaces.get(body.workspace_id) : undefined;
    if (!workspace) return ctx.error(response, 404, "Workspace not found");
    await ctx.createManagedSession(response, workspace.path, body.session_file, workspace.id);
  }


export async function prompt(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse, action: "prompt" | "steer" | "followUp"): Promise<void> {
    const body = await ctx.body<{ session_id?: string; message?: string; images?: unknown; streaming_behavior?: unknown; from_entry_id?: string }>(request, maxPromptBodyBytes);
    const managed = body.session_id ? await ctx.restoreSession(body.session_id) : undefined;
    if (!managed || !body.message) return ctx.error(response, 404, "Session or message not found");
    if (managed.draft) {
      const descriptor = managed.session.describe();
      managed.draft = false;
      ctx.sessionRecords.set(descriptor.sessionId, { session_id: descriptor.sessionId, session_file: descriptor.sessionFile ?? "", workspace_id: managed.workspaceId, cwd: descriptor.cwd, created_at: managed.createdAt, last_active: Date.now(), mode_id: managed.modeId });
      await ctx.persist();
    }
    const capability = action === "prompt" ? "streaming" : action === "steer" ? "steering" : "followUp";
    if (!managed.session.capabilities[capability]) return ctx.error(response, 501, `${action} is not supported by the selected engine`);
    let images;
    try {
      images = normalizeImageAttachments(body.images);
    } catch (error) {
      return ctx.error(response, 422, error instanceof Error ? error.message : "Invalid image attachment");
    }
    // The client always posts to /prompt and lets the engine decide whether the
    // message runs now or queues, which pi only does when it is told how to
    // queue: dropping this field made every mid-turn message fail silently.
    const streamingBehavior = body.streaming_behavior === "followUp" ? ("followUp" as const) : ("steer" as const);
    if (body.from_entry_id) {
      if (!managed.session.navigateTree) return ctx.error(response, 501, "Message editing is not supported by the selected engine");
      const navigation = await managed.session.navigateTree(body.from_entry_id);
      if (navigation.cancelled) return ctx.error(response, 409, "Session navigation was cancelled");
    }
    const operation = action === "prompt"
      ? managed.session.prompt(body.message, { images, streamingBehavior })
      : action === "steer" ? managed.session.steer(body.message, images) : managed.session.followUp(body.message, images);
    void operation.catch((error: unknown) => recordTelemetry("agent.command.failed", { action, session_id: body.session_id ?? "", error: error instanceof Error ? error.message : String(error) }));
    ctx.ok(response, null);
  }


export async function agentBash(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse): Promise<void> {
    const body = await ctx.body<{ session_id?: string; command?: string; id?: string }>(request);
    const managed = body.session_id ? await ctx.restoreSession(body.session_id) : undefined;
    if (!managed || !body.command) return ctx.error(response, 404, "Session or command not found");
    if (!managed.session.capabilities.bash) return ctx.error(response, 501, "Bash is not supported by the selected engine");
    ctx.ok(response, await managed.session.bash(body.command, body.id));
  }


export async function sessionHistory(ctx: HandlerContext, sessionId: string, url: URL, response: ServerResponse): Promise<void> {
    const managed = await ctx.restoreSession(sessionId);
    if (!managed) return ctx.error(response, 404, "Session not found");
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));
    // A session file is append-only and retains discarded branches. The chat
    // transcript must only expose the active branch after an edited resend.
    const entries = (managed.session.activeEntries?.() ?? managed.session.entries()) as Array<Record<string, unknown>>;
    const before = url.searchParams.get("before");
    const end = before ? Math.max(0, entries.findIndex((entry) => entry.id === before)) : entries.length;
    const selected = entries.slice(Math.max(0, end - limit), end);
    ctx.ok(response, {
      messages: selected.map((entry) => {
        const raw = entry.raw;
        if (raw && typeof raw === "object" && !Array.isArray(raw)) {
          const message = (raw as Record<string, unknown>).message;
          if (message && typeof message === "object" && !Array.isArray(message)) {
            return { ...(message as Record<string, unknown>), entryId: entry.id };
          }
        }
        const message = entry.message;
        if (message && typeof message === "object" && !Array.isArray(message)) {
          return { ...(message as Record<string, unknown>), entryId: entry.id };
        }
        return raw && typeof raw === "object" && !Array.isArray(raw)
          ? { ...(raw as Record<string, unknown>), entryId: entry.id }
          : entry;
      }),
      oldest_entry_id: selected[0]?.id ?? null,
      has_more: end - limit > 0,
    });
  }


export async function abort(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse): Promise<void> {
    const body = await ctx.body<{ session_id?: string }>(request);
    // Abort only makes sense for a live session: do not restore just to abort.
    const managed = body.session_id ? ctx.sessions.get(body.session_id) : undefined;
    if (!managed) return ctx.error(response, 404, "Session not found");
    await managed.session.abort();
    ctx.ok(response, null);
  }


export async function sessionCommand(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse, command: (session: EngineSession, body: Record<string, unknown>) => unknown, capability?: keyof EngineSession["capabilities"]): Promise<void> {
    const body = await ctx.body<Record<string, unknown>>(request);
    // Restore on demand: sessions are lazy, so a page reload or server restart
    // must not turn model/tool/stats lookups into 404s.
    const managed = typeof body.session_id === "string" ? await ctx.restoreSession(body.session_id) : undefined;
    if (!managed) return ctx.error(response, 404, "Session not found");
    if (capability && !managed.session.capabilities[capability]) return ctx.error(response, 501, `${capability} is not supported by the selected engine`);
    ctx.ok(response, await command(managed.session, body));
  }


export async function forkAgent(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse): Promise<void> {
    const body = await ctx.body<Record<string, unknown>>(request);
    const oldId = typeof body.session_id === "string" ? body.session_id : "";
    const managed = await ctx.restoreSession(oldId);
    if (!managed) return ctx.error(response, 404, "Session not found");
    if (!managed.session.capabilities.fork) return ctx.error(response, 501, "fork is not supported by the selected engine");
    if (managed.session.describe().streaming) return ctx.error(response, 409, "Agent busy");
    const entryId = String(body.entryId ?? body.entry_id ?? "");
    if (!entryId) return ctx.error(response, 422, "entryId is required");
    const position = body.position === "at" ? "at" : "before";
    const sourceDescriptor = managed.session.describe();
    const siblings = await ctx.mergedSessionItems(sourceDescriptor.cwd, managed.workspaceId) as Array<{ id: string; display_name?: string | null }>;
    const sourceItem = siblings.find((item) => item.id === oldId);
    const stateName = managed.session.state().sessionName;
    const sourceName = typeof stateName === "string" && stateName.trim()
      ? stateName.trim()
      : typeof sourceItem?.display_name === "string" ? sourceItem.display_name.trim() : "";
    const result = await managed.session.fork(entryId, { position });
    if ((result as { cancelled?: boolean } | null)?.cancelled) return ctx.ok(response, result);
    const descriptor = managed.session.describe();
    const newId = descriptor.sessionId;
    const createdAt = new Date().toISOString();
    if (sourceName) {
      managed.session.setSessionName(nextForkSessionName(
        sourceName,
        siblings.flatMap((item) => typeof item.display_name === "string" ? [item.display_name] : []),
      ));
    }
    ctx.unbindSessionEvents(oldId);
    ctx.sessions.delete(oldId);
    ctx.sessions.set(newId, { ...managed, createdAt, lastActive: Date.now() });
    ctx.sessionRecords.set(newId, {
      session_id: newId,
      session_file: descriptor.sessionFile ?? "",
      workspace_id: managed.workspaceId,
      cwd: descriptor.cwd,
      created_at: createdAt,
      last_active: Date.now(),
      mode_id: managed.modeId,
    });
    await ctx.persist();
    ctx.bindSessionEvents(newId, managed.session, managed.workspaceId);
    return ctx.ok(response, {
      ...(result as Record<string, unknown>),
      session: {
        sessionId: newId,
        sessionFile: descriptor.sessionFile,
        workspaceId: managed.workspaceId === "__chat__" ? undefined : managed.workspaceId,
        listItem: ctx.chatSessionInfo(newId),
      },
    });
  }


export async function mutateSession(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse, command: (session: EngineSession, body: Record<string, unknown>) => unknown, capability?: keyof EngineSession["capabilities"]): Promise<void> { return ctx.sessionCommand(request, response, async (session: EngineSession, body: Record<string, unknown>) => { await command(session, body); return null; }, capability); }


export async function replaceSession(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse, action: "new" | "switch"): Promise<void> {
    const body = await ctx.body<Record<string, unknown>>(request);
    const oldId = typeof body.session_id === "string" ? body.session_id : "";
    const managed = await ctx.restoreSession(oldId);
    if (!managed) return ctx.error(response, 404, "Session not found");
    const descriptor = action === "new" ? await managed.session.newSession() : await managed.session.switchSession(String(body.sessionPath ?? body.session_path ?? ""));
    ctx.unbindSessionEvents(oldId);
    ctx.sessions.delete(oldId);
    ctx.sessions.set(descriptor.sessionId, { ...managed, session: managed.session });
    const record = ctx.sessionRecords.get(oldId);
    if (record) {
      ctx.sessionRecords.delete(oldId);
      ctx.sessionRecords.set(descriptor.sessionId, { ...record, session_id: descriptor.sessionId, session_file: descriptor.sessionFile ?? record.session_file, last_active: Date.now() });
      await ctx.persist();
    }
    ctx.bindSessionEvents(descriptor.sessionId, managed.session, managed.workspaceId);
    ctx.ok(response, { result: { cancelled: false }, session: ctx.sessionInfo(descriptor.sessionId) });
  }


export function deleteSession(ctx: HandlerContext, sessionId: string, response: ServerResponse): void {
    const managed = ctx.sessions.get(sessionId);
    if (!managed) return ctx.error(response, 404, "Session not found");
    void ctx.runtime.sessions.remove(managed.key);
    ctx.unbindSessionEvents(sessionId);
    ctx.sessions.delete(sessionId);
    ctx.sessionRecords.delete(sessionId);
    void ctx.persist();
    ctx.ok(response, null);
  }


export async function restoreSession(ctx: HandlerContext, sessionId: string): Promise<ManagedSession | undefined> {
    const active = ctx.sessions.get(sessionId);
    if (active) return active;
    // Concurrent callers (history fetch + model fetch on page open) must share one
    // restore, otherwise each would open its own engine session on the same file.
    const pending = ctx.restoring.get(sessionId);
    if (pending) return pending;
    const record = ctx.sessionRecords.get(sessionId);
    if (!record?.session_file) return undefined;
    const restore = ctx.openPersistedSession(sessionId, record).finally(() => ctx.restoring.delete(sessionId));
    ctx.restoring.set(sessionId, restore);
    return restore;
  }


export async function openPersistedSession(ctx: HandlerContext, sessionId: string, record: PersistedSession): Promise<ManagedSession> {
    // Stable registry key so the engine registry itself also deduplicates.
    const key = `session:${sessionId}`;
    const mode = record.mode_id ? ctx.modes.get(record.mode_id) : [...ctx.modes.values()].find((candidate) => candidate.is_default);
    const descriptor = await ctx.runtime.createSession(key, { cwd: record.cwd, sessionFile: record.session_file, appendSystemPrompt: mode?.system_prompt?.trim() ? [mode.system_prompt.trim()] : undefined });
    const session = ctx.runtime.sessions.get(key);
    if (!session) throw new Error("Session registry lost restored session");
    const managed = { key, workspaceId: record.workspace_id, session, createdAt: record.created_at, lastActive: record.last_active, modeId: record.mode_id };
    ctx.sessions.set(sessionId, managed);
    ctx.bindSessionEvents(sessionId, session, record.workspace_id);
    await ctx.applyMode(session, record.mode_id);
    // A session file that no longer exists yields a fresh engine session with a
    // new id. Re-key both maps so later lookups by the new id resolve, and keep
    // the requested id pointing at the same live session for in-flight clients.
    if (descriptor.sessionId !== sessionId) {
      const rekeyed: PersistedSession = { ...record, session_id: descriptor.sessionId, session_file: descriptor.sessionFile ?? record.session_file, last_active: Date.now() };
      ctx.sessionRecords.delete(sessionId);
      ctx.sessionRecords.set(descriptor.sessionId, rekeyed);
      ctx.sessions.set(descriptor.sessionId, managed);
      await ctx.persist();
    }
    return managed;
  }


export async function applyMode(ctx: HandlerContext, session: EngineSession, modeId?: string): Promise<void> {
    const mode = modeId ? ctx.modes.get(modeId) : [...ctx.modes.values()].find((candidate) => candidate.is_default);
    if (!mode) return;
    if (mode.model) {
      const [provider, ...model] = mode.model.split("/");
      if (provider && model.length > 0) await session.setModel(provider, model.join("/"));
    }
    if (mode.thinking_level) session.setThinkingLevel(mode.thinking_level);
  }


export function listSessions(ctx: HandlerContext, ): unknown[] { return [...ctx.sessionRecords.keys()].map((id) => ctx.sessionInfo(id)); }

export function sessionInfo(ctx: HandlerContext, sessionId: string): Record<string, unknown> {
    const managed = ctx.sessions.get(sessionId);
    const persisted = ctx.sessionRecords.get(sessionId);
    if (!managed && persisted) return { session_id: persisted.session_id, session_file: persisted.session_file, workspace_id: persisted.workspace_id, cwd: persisted.cwd, model: null, thinking_level: null, is_compacting: null, session_name: null, auto_compaction_enabled: null, message_count: null, pending_message_count: null, process_alive: false, created_at: persisted.created_at, last_active: persisted.last_active };
    if (!managed) throw new Error("Session not found");
    const descriptor = managed.session.describe();
    const state = managed.session.state();
    const record = ctx.sessionRecords.get(sessionId);
    if (record) { record.last_active = managed.lastActive; record.session_file = descriptor.sessionFile ?? record.session_file; }
    return { session_id: descriptor.sessionId, session_file: descriptor.sessionFile ?? "", workspace_id: managed.workspaceId, cwd: descriptor.cwd, model: state.model ?? null, thinking_level: state.thinkingLevel ?? null, is_compacting: state.isCompacting ?? null, session_name: state.sessionName ?? null, auto_compaction_enabled: state.autoCompactionEnabled ?? null, message_count: managed.session.messages().length, pending_message_count: state.pendingMessageCount ?? null, process_alive: true, created_at: managed.createdAt, last_active: managed.lastActive };
  }

export async function reconcileSessions(ctx: HandlerContext, ): Promise<void> {
    const before = ctx.sessionRecords.size;
    const { sessions, result } = await reconcileSessionRecords(
      [...ctx.sessionRecords.values()],
      [...ctx.workspaces.values()],
      ctx.archivedSessionIds,
      ctx.systemWorkspacePath,
    );
    if (result.imported === 0 && result.removed === 0 && result.remapped === 0) return;
    ctx.sessionRecords.clear();
    for (const session of sessions) ctx.sessionRecords.set(session.session_id, session);
    // Patch only the sessions key so devices/identity/etc. are left untouched.
    await ctx.store.update({ sessions });
    recordTelemetry("sessions.reconciled", { before, imported: result.imported, removed: result.removed, remapped: result.remapped, total: result.total });
}

export function isSystemWorkspacePath(ctx: HandlerContext, path: string): boolean {
  const root = resolve(ctx.systemWorkspacePath);
  const candidate = resolve(path);
  const relative = relativePath(root, candidate);
  return relative === "" || (!relative.startsWith("..") && !isAbsolute(relative));
}
