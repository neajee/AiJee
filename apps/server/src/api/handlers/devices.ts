import type { IncomingMessage, ServerResponse } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocket } from "ws";
import type { EngineSession } from "@aijee/engine";
import type { StreamEventEnvelope, AgentStreamEvent, ServerEvent } from "@aijee/protocol";
import type { HandlerContext, Workspace, ManagedSession, Mode, OAuthLogin, PersistedSession } from "./context.ts";
import { RuntimeAuth } from "../../auth/runtime-auth.ts";
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

export async function createDevice(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse): Promise<void> {
    const body = await ctx.body<{ code?: string; name?: string }>(request);
    // The UI is served by this runtime. A browser request from that same
    // origin may establish its initial device session on loopback or LAN;
    // code-less requests from any other origin remain forbidden.
    const local = ctx.hasSameOrigin(request);
    try {
      const device = body.code ? ctx.authenticated().issueWithCode(body.code, body.name) : local ? ctx.authenticated().issueDevice(body.name) : (() => { throw new HttpError(403, "A device code is required"); })();
      const token = String(device.token);
      response.setHeader("Set-Cookie", `aijee_token=${token}; HttpOnly; SameSite=Strict; Path=/`);
      ctx.ok(response, { device_id: device.device_id, token, name: device.name, created_at: device.created_at }, 201);
    } catch (error) { ctx.error(response, error instanceof HttpError ? error.status : 422, error instanceof Error ? error.message : "Device authorization failed"); }
  }


export function listDevices(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse): void {
    if (!ctx.authorized(request)) return ctx.error(response, 401, "Unauthorized");
    ctx.ok(response, ctx.authenticated().list());
  }


export function deleteDevice(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse, deviceId: string): void {
    if (!ctx.authorized(request)) return ctx.error(response, 401, "Unauthorized");
    ctx.ok(response, null, ctx.authenticated().revoke(deviceId) ? 200 : 404);
  }


export function logout(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse): void {
    const device = ctx.authenticated().authenticate(request.headers.authorization, typeof request.headers.cookie === "string" ? request.headers.cookie : undefined);
    if (!device) return ctx.error(response, 401, "Unauthorized");
    ctx.authenticated().revoke(device.device_id);
    response.setHeader("Set-Cookie", "aijee_token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0");
    ctx.ok(response, null);
  }


export async function createDeviceCode(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse): Promise<void> {
    if (!ctx.authorized(request)) return ctx.error(response, 401, "Unauthorized");
    const value = ctx.authenticated().mintCode();
    await ctx.authenticated().flush();
    ctx.deviceCodeResponse(request, response, value.code);
  }


export async function getDeviceCode(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse): Promise<void> {
    if (!ctx.authorized(request)) return ctx.error(response, 401, "Unauthorized");
    const code = ctx.authenticated().currentCode().code;
    await ctx.authenticated().flush();
    ctx.deviceCodeResponse(request, response, code);
  }


export function deviceCodeResponse(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse, code: string): void {
    const protocol = typeof request.headers["x-forwarded-proto"] === "string" ? request.headers["x-forwarded-proto"] : "http";
    const host = typeof request.headers.host === "string" ? request.headers.host : "127.0.0.1:10088";
    ctx.ok(response, { code, url: `${protocol}://${host}/?k=${encodeURIComponent(code)}`, expires_at: null });
  }


export function authorized(ctx: HandlerContext, request: IncomingMessage): boolean { return ctx.isLocalRequest(request) || ctx.authenticated().validate(request.headers.authorization, typeof request.headers.cookie === "string" ? request.headers.cookie : undefined); }

export function isLocalRequest(ctx: HandlerContext, request: IncomingMessage): boolean {
    const loopback = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
    const socketAddress = request.socket.remoteAddress ?? "";
    if (!loopback.has(socketAddress)) return false;
    const forwarded = request.headers["x-forwarded-for"];
    const clientAddress = typeof forwarded === "string" ? forwarded.split(",", 1)[0]!.trim() : socketAddress;
    return loopback.has(clientAddress);
  }

export function hasSameOrigin(ctx: HandlerContext, request: IncomingMessage): boolean {
    const origin = request.headers.origin;
    const peer = request.socket.remoteAddress ?? "";
    const trustedProxy = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]).has(peer);
    const forwardedHost = request.headers["x-forwarded-host"];
    const host = trustedProxy && typeof forwardedHost === "string" ? forwardedHost : request.headers.host;
    if (typeof origin === "string" && typeof host === "string") {
      try {
        const url = new URL(origin);
        if ((url.protocol === "http:" || url.protocol === "https:") && url.host === host) return true;
      } catch {
        // Fall through to the browser same-site signal below.
      }
    }
    return request.headers["sec-fetch-site"] === "same-origin";
  }


export function authenticated(ctx: HandlerContext, ): RuntimeAuth { if (!ctx.auth) throw new Error("AiJee runtime is not initialized"); return ctx.auth; }
