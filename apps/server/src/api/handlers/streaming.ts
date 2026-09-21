import type { IncomingMessage, ServerResponse } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocket } from "ws";
import type { EngineSession } from "@aijee/engine";
import type { StreamEventEnvelope, AgentStreamEvent, ServerEvent } from "@aijee/protocol";
import type { HandlerContext, StreamConnection, Workspace, ManagedSession, Mode, OAuthLogin, PersistedSession } from "./context.ts";
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

/**
 * The high-frequency events a client only needs for the session it is actually
 * looking at. Everything else is broadcast to every connection so that session
 * lists and streaming indicators stay live without the token-level chatter.
 */
const DELTA_EVENT_TYPES: ReadonlySet<string> = new Set(["message_update", "tool_execution_update"]);

function isDeltaEvent(event: StreamEventEnvelope): boolean {
  return DELTA_EVENT_TYPES.has(event.type);
}

function registerStreamConnection(ctx: HandlerContext, sink: { response?: ServerResponse; socket?: WebSocket }): string {
    const connectionId = randomUUID();
    ctx.streamConnections.set(connectionId, { activeSessionId: null, ...sink } satisfies StreamConnection);
    if (sink.response) ctx.responseConnections.set(sink.response, connectionId);
    if (sink.socket) ctx.socketConnections.set(sink.socket, connectionId);
    return connectionId;
  }


function unregisterStreamConnection(ctx: HandlerContext, connectionId: string): void {
    const connection = ctx.streamConnections.get(connectionId) as StreamConnection | undefined;
    if (!connection) return;
    ctx.streamConnections.delete(connectionId);
    if (connection.response) ctx.responseConnections.delete(connection.response);
    if (connection.socket) ctx.socketConnections.delete(connection.socket);
  }


function isConnectionActiveFor(ctx: HandlerContext, sink: ServerResponse | WebSocket, sessionId: string): boolean {
    const connectionId = (ctx.responseConnections.get(sink) ?? ctx.socketConnections.get(sink)) as string | undefined;
    if (!connectionId) return false;
    const connection = ctx.streamConnections.get(connectionId) as StreamConnection | undefined;
    return connection?.activeSessionId === sessionId;
  }


function writeToConnection(ctx: HandlerContext, connection: StreamConnection, event: StreamEventEnvelope): void {
    if (connection.response) {
      try { connection.response.write(sseFrame(event)); } catch { /* The connection closed mid-replay. */ }
    } else if (connection.socket) {
      ctx.sendSocket(connection.socket, event);
    }
  }


function replayActiveSessionEvents(ctx: HandlerContext, connection: StreamConnection, sessionId: string, fromEventId: number | undefined, fromDeltaEventId: number | undefined): void {
    const fromEvent = fromEventId ?? 0;
    const fromDelta = fromDeltaEventId ?? 0;
    // eventHistory is append-ordered by id, so a single forward pass keeps the
    // coarse and delta streams interleaved exactly as they were produced.
    for (const event of ctx.eventHistory as StreamEventEnvelope[]) {
      if (event.session_id !== sessionId) continue;
      if (event.id <= (isDeltaEvent(event) ? fromDelta : fromEvent)) continue;
      writeToConnection(ctx, connection, event);
    }
  }


export async function setActiveStreamSession(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse): Promise<void> {
    const body = await ctx.body(request) as { connection_id?: unknown; session_id?: unknown; from_event_id?: unknown; from_delta_event_id?: unknown };
    const connectionId = typeof body.connection_id === "string" ? body.connection_id : "";
    const connection = (connectionId ? ctx.streamConnections.get(connectionId) : undefined) as StreamConnection | undefined;
    if (!connection) return ctx.error(response, 404, "Unknown stream connection");
    const sessionId = typeof body.session_id === "string" && body.session_id ? body.session_id : null;
    connection.activeSessionId = sessionId;
    if (sessionId) {
      replayActiveSessionEvents(
        ctx,
        connection,
        sessionId,
        typeof body.from_event_id === "number" && Number.isFinite(body.from_event_id) ? body.from_event_id : undefined,
        typeof body.from_delta_event_id === "number" && Number.isFinite(body.from_delta_event_id) ? body.from_delta_event_id : undefined,
      );
    }
    ctx.ok(response, null);
  }


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
    const connectionId = registerStreamConnection(ctx, { response });
    const hello: ServerEvent = { type: "server_hello", instance_id: ctx.instanceId, connection_id: connectionId };
    const active: ServerEvent = { type: "active_sessions", data: { session_ids: ctx.activeStreamingSessionIds() } };
    response.write(sseFrame(hello));
    response.write(sseFrame(active));
    ctx.replayEvents(response, request.headers["last-event-id"], undefined, new URL(request.url ?? "/", "http://localhost").searchParams.get("from"));
    ctx.globalStreams.add(response);
    const keepalive = setInterval(() => response.write(keepAliveFrame()), 15_000);
    response.once("close", () => { clearInterval(keepalive); ctx.globalStreams.delete(response); unregisterStreamConnection(ctx, connectionId); });
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
    const connectionId = registerStreamConnection(ctx, { socket });
    ctx.sendSocket(socket, { type: "server_hello", instance_id: ctx.instanceId, connection_id: connectionId });
    ctx.sendSocket(socket, { type: "active_sessions", data: { session_ids: ctx.activeStreamingSessionIds() } });
    socket.once("close", () => { ctx.globalSockets.delete(socket); unregisterStreamConnection(ctx, connectionId); });
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
    const sessionId = typeof payload.session_id === "string" ? payload.session_id : "";
    const delta = isDeltaEvent(payload);
    // Coarse events go to every connection; deltas only to the one viewing the
    // session they belong to. Session-scoped streams already target one session.
    for (const stream of ctx.globalStreams) {
      if (delta && !isConnectionActiveFor(ctx, stream, sessionId)) continue;
      try { stream.write(frame); } catch { ctx.globalStreams.delete(stream); }
    }
    for (const stream of ctx.sessionStreams.get(sessionId) ?? []) try { stream.write(frame); } catch { ctx.sessionStreams.get(sessionId)?.delete(stream); }
    for (const socket of ctx.globalSockets) {
      if (delta && !isConnectionActiveFor(ctx, socket, sessionId)) continue;
      ctx.sendSocket(socket, payload);
    }
    for (const socket of ctx.sessionSockets.get(sessionId) ?? []) ctx.sendSocket(socket, payload);
  }


export function replayEvents(ctx: HandlerContext, response: ServerResponse, lastEventId: string | string[] | undefined, sessionId?: string, queryFrom?: string | null): void {
    const raw = Array.isArray(lastEventId) ? lastEventId[0] : lastEventId ?? queryFrom ?? "0";
    const last = Number(raw);
    for (const event of ctx.eventHistory) if (typeof event.id === "number" && event.id > last && (!sessionId || event.session_id === sessionId)) response.write(sseFrame(event));
  }
