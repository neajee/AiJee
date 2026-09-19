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

export async function listTasks(ctx: HandlerContext, url: URL, response: ServerResponse): Promise<void> { const workspaceId = url.pathname.split("/").pop()!; ctx.ok(response, ctx.tasks.list(workspaceId)); }

export async function taskConfig(ctx: HandlerContext, url: URL, response: ServerResponse): Promise<void> {
    const workspaceId = url.pathname.split("/").pop()!;
    const workspace = ctx.workspaces.get(workspaceId);
    if (!workspace) return ctx.error(response, 404, "Workspace not found");
    ctx.ok(response, { tasks: await ctx.tasks.definitions(workspace.path) });
  }

export async function taskLogs(ctx: HandlerContext, path: string, response: ServerResponse): Promise<void> { ctx.ok(response, ctx.tasks.logs(path.split("/").pop()!)); }

export async function startTask(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse): Promise<void> { const body = await ctx.body<{ workspace_id?: string; label?: string }>(request); const workspace = body.workspace_id ? ctx.workspaces.get(body.workspace_id) : undefined; if (!workspace || !body.label) return ctx.error(response, 400, "workspace_id and label are required"); ctx.ok(response, await ctx.tasks.start(workspace.id, workspace.path, body.label)); }

export async function stopTask(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse): Promise<void> { const body = await ctx.body<{ task_id?: string }>(request); if (!body.task_id) return ctx.error(response, 400, "task_id is required"); ctx.ok(response, await ctx.tasks.stop(body.task_id)); }

export async function restartTask(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse): Promise<void> { const body = await ctx.body<{ task_id?: string }>(request); if (!body.task_id) return ctx.error(response, 400, "task_id is required"); ctx.ok(response, await ctx.tasks.restart(body.task_id)); }

export async function removeTask(ctx: HandlerContext, path: string, response: ServerResponse): Promise<void> { await ctx.tasks.remove(path.split("/").pop()!); ctx.ok(response, null); }
