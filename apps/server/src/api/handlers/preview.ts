import type { IncomingMessage, ServerResponse } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocket } from "ws";
import type { EngineSession } from "@aijee/engine";
import type { StreamEventEnvelope, AgentStreamEvent, ServerEvent } from "@aijee/protocol";
import type { HandlerContext, Workspace, ManagedSession, Mode, OAuthLogin, PersistedSession } from "./context.ts";
import { request as proxyRequest } from "node:http";
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

export function preview(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse, sessionId: string, hostname: string, port: string, suffix: string): void {
    if (!ctx.sessions.has(sessionId)) return ctx.error(response, 404, "Session not found");
    if (!new Set(["localhost", "127.0.0.1", "::1"]).has(hostname) || !/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) return ctx.error(response, 400, "Preview target must be loopback with a valid port");
    const upstream = proxyRequest({ hostname, port: Number(port), path: `/${suffix}${new URL(request.url ?? "/", "http://localhost").search}`, method: request.method, headers: { ...request.headers, host: `${hostname}:${port}` } }, (upstreamResponse) => {
      const headers = { ...upstreamResponse.headers };
      delete headers["content-security-policy"];
      response.writeHead(upstreamResponse.statusCode ?? 502, headers);
      upstreamResponse.pipe(response);
    });
    upstream.once("error", () => ctx.error(response, 502, "Preview target is unavailable"));
    request.pipe(upstream);
  }
