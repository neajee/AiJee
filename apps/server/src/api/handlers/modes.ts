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

export async function createMode(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse): Promise<void> {
    const body = await ctx.body<Omit<Mode, "id"> & { name?: string }>(request);
    if (!body.name?.trim()) return ctx.error(response, 422, "name is required");
    const mode: Mode = { ...body, id: randomUUID(), name: body.name.trim() };
    ctx.modes.set(mode.id, mode);
    await ctx.persist();
    ctx.ok(response, mode, 201);
  }


export async function modeRoute(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse, id: string): Promise<void> {
    const mode = ctx.modes.get(id);
    if (request.method === "DELETE") {
      if (!mode) return ctx.error(response, 404, "Mode not found");
      ctx.modes.delete(id); await ctx.persist(); return ctx.ok(response, null);
    }
    if (request.method === "PUT") {
      if (!mode) return ctx.error(response, 404, "Mode not found");
      Object.assign(mode, await ctx.body<Partial<Mode>>(request)); await ctx.persist(); return ctx.ok(response, mode);
    }
    return ctx.error(response, 405, "Method not allowed");
  }


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
