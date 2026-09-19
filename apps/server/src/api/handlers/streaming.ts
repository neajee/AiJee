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

export async function stream(ctx: HandlerContext, request: IncomingMessage, sessionId: string, response: ServerResponse): Promise<void> {
    const managed = await ctx.restoreSession(sessionId);
    if (!managed) return ctx.error(response, 404, "Session not found");
    openSse(response);
    const hello: ServerEvent = { type: "session_stream_hello", session_id: sessionId };
    response.write(sseFrame(hello));
    ctx.replayEvents(response, request.headers["last-event-id"], sessionId, new URL(request.url ?? "/", "http://localhost").searchParams.get("from"));
    const streams = ctx.sessionStreams.get(sessionId) ?? new Set<ServerResponse>();
    streams.add(response);
    ctx.sessionStreams.set(sessionId, streams);
    const keepalive = setInterval(() => response.write(keepAliveFrame()), 15_000);
    response.once("close", () => { clearInterval(keepalive); streams.delete(response); if (streams.size === 0) ctx.sessionStreams.delete(sessionId); });
  }


export function globalStream(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse): void {
    openSse(response);
    const hello: ServerEvent = { type: "server_hello", instance_id: ctx.instanceId, connection_id: randomUUID() };
    const active: ServerEvent = { type: "active_sessions", data: { session_ids: ctx.activeStreamingSessionIds() } };
    response.write(sseFrame(hello));
    response.write(sseFrame(active));
    ctx.replayEvents(response, request.headers["last-event-id"], undefined, new URL(request.url ?? "/", "http://localhost").searchParams.get("from"));
    ctx.globalStreams.add(response);
    const keepalive = setInterval(() => response.write(keepAliveFrame()), 15_000);
    response.once("close", () => { clearInterval(keepalive); ctx.globalStreams.delete(response); });
  }


export function bindSessionEvents(ctx: HandlerContext, sessionId: string, session: EngineSession, workspaceId: string): void {
    ctx.unbindSessionEvents(sessionId);
    const unsubscribe = session.subscribe((event) => {
      const managed = ctx.sessions.get(sessionId);
      if (managed) managed.lastActive = Date.now();
      const record = ctx.sessionRecords.get(sessionId);
      if (record) record.last_active = Date.now();
      ctx.publishEvent({ id: ctx.nextEventId++, session_id: sessionId, workspace_id: workspaceId, type: event.type, data: event.data as AgentStreamEvent, timestamp: event.timestamp });
      const streaming = session.describe().streaming;
      if (ctx.sessionStreamingStates.get(sessionId) !== streaming) {
        ctx.sessionStreamingStates.set(sessionId, streaming);
        ctx.publishEvent({ id: ctx.nextEventId++, session_id: sessionId, workspace_id: workspaceId, type: "session_state", data: { isStreaming: streaming } as unknown as AgentStreamEvent, timestamp: Date.now() });
        ctx.publishEvent({ id: ctx.nextEventId++, type: "active_sessions", data: { session_ids: ctx.activeStreamingSessionIds() } as unknown as AgentStreamEvent, timestamp: Date.now() } as StreamEventEnvelope);
      }
    });
    ctx.sessionEventUnsubscribers.set(sessionId, unsubscribe);
  }


export function unbindSessionEvents(ctx: HandlerContext, sessionId: string): void {
    ctx.sessionEventUnsubscribers.get(sessionId)?.();
    ctx.sessionEventUnsubscribers.delete(sessionId);
    ctx.sessionStreamingStates.delete(sessionId);
  }


export function handleUpgrade(ctx: HandlerContext, request: IncomingMessage, socket: Duplex, head: Buffer): void {
    const url = new URL(request.url ?? "/", "http://localhost");
    const sessionMatch = /^\/api\/ws\/stream\/([^/]+)$/.exec(url.pathname);
    const isPreview = url.pathname === "/api/preview/ws";
    const isGlobal = url.pathname === "/api/ws/stream";
    if (!isGlobal && !isPreview && !sessionMatch) { socket.destroy(); return; }
    const authorization = request.headers.authorization ?? (url.searchParams.get("token") ? `Bearer ${url.searchParams.get("token")}` : undefined);
    if (!ctx.auth || (!ctx.auth.initialized() && !ctx.localMode) || !(ctx.localMode && ctx.isLocalRequest(request)) && !ctx.auth.validate(authorization, typeof request.headers.cookie === "string" ? request.headers.cookie : undefined)) { socket.destroy(); return; }
    if (sessionMatch && !ctx.sessions.has(sessionMatch[1])) { socket.destroy(); return; }
    ctx.wsServer.handleUpgrade(request, socket, head, (client: WebSocket) => {
      if (isPreview) ctx.previewBroker.attach(client);
      else if (sessionMatch) ctx.attachSessionSocket(sessionMatch[1], client);
      else ctx.attachGlobalSocket(client);
    });
  }


export function attachGlobalSocket(ctx: HandlerContext, socket: WebSocket): void {
    ctx.globalSockets.add(socket);
    ctx.sendSocket(socket, { type: "server_hello", instance_id: ctx.instanceId, connection_id: randomUUID() });
    ctx.sendSocket(socket, { type: "active_sessions", data: { session_ids: ctx.activeStreamingSessionIds() } });
    socket.once("close", () => ctx.globalSockets.delete(socket));
  }


export function activeStreamingSessionIds(ctx: HandlerContext, ): string[] {
    return [...ctx.sessions.entries()]
      .filter(([, managed]) => managed.session.describe().streaming)
      .map(([sessionId]) => sessionId);
  }


export function attachSessionSocket(ctx: HandlerContext, sessionId: string, socket: WebSocket): void {
    const sockets = ctx.sessionSockets.get(sessionId) ?? new Set<WebSocket>();
    sockets.add(socket);
    ctx.sessionSockets.set(sessionId, sockets);
    ctx.sendSocket(socket, { type: "session_stream_hello", session_id: sessionId });
    socket.once("close", () => {
      sockets.delete(socket);
      if (sockets.size === 0) ctx.sessionSockets.delete(sessionId);
    });
  }


export function sendSocket(ctx: HandlerContext, socket: WebSocket, payload: unknown): void {
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
  }


export function publishEvent(ctx: HandlerContext, payload: StreamEventEnvelope): void {
    ctx.eventHistory.push(payload);
    if (ctx.eventHistory.length > 5000) ctx.eventHistory.splice(0, ctx.eventHistory.length - 5000);
    const frame = sseFrame(payload);
    for (const stream of ctx.globalStreams) try { stream.write(frame); } catch { ctx.globalStreams.delete(stream); }
    const sessionId = typeof payload.session_id === "string" ? payload.session_id : "";
    for (const stream of ctx.sessionStreams.get(sessionId) ?? []) try { stream.write(frame); } catch { ctx.sessionStreams.get(sessionId)?.delete(stream); }
    for (const socket of ctx.globalSockets) ctx.sendSocket(socket, payload);
    for (const socket of ctx.sessionSockets.get(sessionId) ?? []) ctx.sendSocket(socket, payload);
  }


export function replayEvents(ctx: HandlerContext, response: ServerResponse, lastEventId: string | string[] | undefined, sessionId?: string, queryFrom?: string | null): void {
    const raw = Array.isArray(lastEventId) ? lastEventId[0] : lastEventId ?? queryFrom ?? "0";
    const last = Number(raw);
    for (const event of ctx.eventHistory) if (typeof event.id === "number" && event.id > last && (!sessionId || event.session_id === sessionId)) response.write(sseFrame(event));
  }
