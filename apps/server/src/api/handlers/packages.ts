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

export async function packageStatus(ctx: HandlerContext, ): Promise<Record<string, unknown>> { return ctx.packages.status(); }

export async function packageLogs(ctx: HandlerContext, limit?: number): Promise<unknown> { return ctx.packages.logs(limit); }

export async function packageInstall(ctx: HandlerContext, ): Promise<unknown> { return ctx.packages.operation("install"); }

export async function packageUpdate(ctx: HandlerContext, ): Promise<unknown> { return ctx.packages.operation("update"); }

export async function marketplaceSearch(ctx: HandlerContext, url: URL): Promise<unknown> { return ctx.packages.marketplace(url.searchParams.get("query") ?? "", url.searchParams.get("category") ?? "", Number(url.searchParams.get("limit") ?? 30)); }

export async function marketplaceDetail(ctx: HandlerContext, name: string): Promise<unknown> { const result = await ctx.packages.marketplace(name, "", 1) as { packages?: Array<Record<string, unknown>> }; if (!result.packages?.[0]) throw new Error("Package not found"); try { const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name).replace(/^%40/, "@").replace("%2F", "/")}`, { signal: AbortSignal.timeout(10_000) }); if (response.ok) { const npm = await response.json() as Record<string, unknown>; const latest = (npm["dist-tags"] as Record<string, unknown> | undefined)?.latest; const readme = typeof npm.readme === "string" ? npm.readme : null; result.packages[0] = { ...result.packages[0], version: latest ?? result.packages[0].version, readme }; } } catch { /* metadata is optional */ } return result.packages[0]; }

export async function marketplaceInstalled(ctx: HandlerContext, ): Promise<unknown> { return ctx.packages.installed(); }

export async function marketplaceOperation(ctx: HandlerContext, body: Record<string, unknown>): Promise<unknown> { return ctx.packages.enqueueOperation({ operation: String(body.operation ?? ""), name: String(body.name ?? ""), scope: String(body.scope ?? "user"), version: body.version == null ? null : String(body.version), cwd: typeof body.cwd === "string" ? body.cwd : undefined }, async () => { try { await ctx.runtime.reloadResources(); } catch {} }); }

export function marketplaceCancel(ctx: HandlerContext, ): unknown { return { operation: "cancel", success: ctx.packages.cancel(), output: "cancel requested" }; }
