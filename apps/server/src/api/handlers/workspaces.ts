import type { IncomingMessage, ServerResponse } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocket } from "ws";
import type { EngineSession } from "@aijee/engine";
import type { StreamEventEnvelope, AgentStreamEvent, ServerEvent } from "@aijee/protocol";
import type { HandlerContext, Workspace, ManagedSession, Mode, OAuthLogin, PersistedSession } from "./context.ts";
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

export function listWorkspaces(ctx: HandlerContext, url: URL, response: ServerResponse): void {
    const includeArchived = url.searchParams.get("include_archived") === "true";
    ctx.ok(response, [...ctx.workspaces.values()].filter((item) => includeArchived || item.status === "active"));
  }


export async function createWorkspace(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse): Promise<void> {
    const body = await ctx.body<{ name?: string; path?: string; color?: string; workspace_enabled?: boolean; startup_script?: string }>(request);
    if (!body.name || !body.path) return ctx.error(response, 422, "name and path are required");
    const path = resolve(body.path);
    if (!existsSync(path)) return ctx.error(response, 400, `Path does not exist: ${body.path}`);
    const existing = [...ctx.workspaces.values()].find((workspace) => workspace.status === "active" && resolve(workspace.path) === path);
    if (existing) return ctx.ok(response, existing, 200);
    const now = new Date().toISOString();
    const workspace: Workspace = { id: randomUUID(), name: body.name, path, color: body.color ?? null, workspace_enabled: body.workspace_enabled ?? true, startup_script: body.startup_script ?? null, status: "active", created_at: now, updated_at: now };
    ctx.workspaces.set(workspace.id, workspace);
    await ctx.persist();
    ctx.ok(response, workspace, 201);
  }


export async function workspaceRoute(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse, id: string, action?: string): Promise<void> {
    const workspace = ctx.workspaces.get(id);
    if (!workspace) return ctx.error(response, 404, "Workspace not found");
    if (request.method === "GET" && !action) return ctx.ok(response, workspace);
    if (request.method === "DELETE" && !action) {
      ctx.workspaces.delete(id);
      await ctx.persist();
      return ctx.ok(response, "Workspace deleted");
    }
    if (request.method === "POST" && (action === "archive" || action === "unarchive")) {
      workspace.status = action === "archive" ? "archived" : "active";
      workspace.updated_at = new Date().toISOString();
      await ctx.persist();
      return ctx.ok(response, workspace);
    }
    if (request.method === "PUT" && !action) {
      const body = await ctx.body<Partial<Pick<Workspace, "name" | "path" | "color" | "workspace_enabled" | "startup_script">>>(request);
      if (body.path !== undefined && !existsSync(body.path)) return ctx.error(response, 400, `Path does not exist: ${body.path}`);
      Object.assign(workspace, body, { updated_at: new Date().toISOString() });
      await ctx.persist();
      return ctx.ok(response, workspace);
    }
    return ctx.error(response, 405, "Method not allowed");
  }


export async function workspaceSessionRoute(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse, workspaceId: string, sessionId?: string, action?: string, entryId?: string): Promise<void> {
    if (!ctx.workspaces.has(workspaceId)) return ctx.error(response, 404, "Workspace not found");
    const managed = sessionId ? await ctx.restoreSession(sessionId) : undefined;
    if (sessionId && (!managed || managed.workspaceId !== workspaceId)) {
      if (!managed && request.method === "POST" && action === "archive") {
        const record = ctx.sessionRecords.get(sessionId);
        if (record?.workspace_id === workspaceId) {
          ctx.sessionRecords.delete(sessionId);
        }
        ctx.archivedSessionIds.add(sessionId);
        await ctx.persist();
        return ctx.ok(response, "Session already archived");
      }
      return ctx.error(response, 404, "Session not found");
    }
    if (!sessionId && request.method === "GET") {
      const page = Math.max(1, Number(new URL(request.url ?? "/", "http://localhost").searchParams.get("page") ?? 1));
      const limit = Math.min(100, Math.max(1, Number(new URL(request.url ?? "/", "http://localhost").searchParams.get("limit") ?? 20)));
      const items = await ctx.mergedSessionItems(ctx.workspaces.get(workspaceId)!.path, workspaceId);
      const offset = (page - 1) * limit;
      return ctx.ok(response, { items: items.slice(offset, offset + limit), page, limit, total: items.length, has_more: offset + limit < items.length });
    }
    if (!managed || !sessionId) return ctx.error(response, 404, "Session not found");
    if (request.method === "GET" && !action) return ctx.ok(response, ctx.chatSessionInfo(sessionId));
    if (request.method === "GET" && action === "tree") return ctx.ok(response, managed.session.tree());
    const entries = managed.session.entries() as Array<Record<string, unknown>>;
    if (request.method === "GET" && action === "leaf") return ctx.ok(response, entries.at(-1) ?? null);
    if (request.method === "GET" && (action === "children" || action === "branch")) {
      if (action === "children") return ctx.ok(response, entries.filter((entry) => entry.parentId === entryId || entry.parent_id === entryId));
      const index = entries.findIndex((entry) => entry.id === entryId);
      return ctx.ok(response, index < 0 ? [] : entries.slice(0, index + 1));
    }
    if (request.method === "POST" && action === "archive") {
      const sessionFile = managed.session.describe().sessionFile;
      await ctx.runtime.sessions.remove(managed.key);
      if (sessionFile && existsSync(sessionFile)) {
        const archiveDir = join(dirname(sessionFile), ".archive");
        await mkdir(archiveDir, { recursive: true });
        await rename(sessionFile, join(archiveDir, basename(sessionFile)));
      }
      ctx.unbindSessionEvents(sessionId);
      ctx.sessions.delete(sessionId);
      ctx.sessionRecords.delete(sessionId);
      ctx.archivedSessionIds.add(sessionId);
      await ctx.persist();
      return ctx.ok(response, "Session archived");
    }
    if (request.method === "DELETE" && !action) return ctx.deleteSession(sessionId, response);
    if (request.method === "PATCH" && !action) {
      const body = await ctx.body<{ name?: string }>(request);
      const name = body.name?.trim() ?? "";
      if (!name || name.length > 200) return ctx.error(response, 400, "Session name must be 1-200 characters");
      managed.session.setSessionName(name);
      return ctx.ok(response, "Session renamed");
    }
    return ctx.error(response, 405, "Method not allowed");
  }
