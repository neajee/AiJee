import type { IncomingMessage, ServerResponse } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocket } from "ws";
import type { EngineSession } from "@aijee/engine";
import type { StreamEventEnvelope, AgentStreamEvent, ServerEvent } from "@aijee/protocol";
import type { HandlerContext, Workspace, ManagedSession, Mode, OAuthLogin, PersistedSession } from "./context.ts";
import { homedir } from "node:os";
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

export async function fsList(ctx: HandlerContext, url: URL, response: ServerResponse): Promise<void> {
    const path = ctx.safePath(url.searchParams.get("path") ?? "");
    const entries = await readdir(path, { withFileTypes: true });
    const result = await Promise.all(entries.map(async (entry) => {
      const fullPath = join(path, entry.name);
      const metadata = await stat(fullPath);
      return { name: entry.name, path: fullPath, is_dir: entry.isDirectory(), size: metadata.size, modified: metadata.mtime.toISOString() };
    }));
    ctx.ok(response, { path, entries: result, total: result.length });
  }


export async function fsComplete(ctx: HandlerContext, url: URL, response: ServerResponse): Promise<void> {
    const input = url.searchParams.get("q") ?? "";
    if (input.startsWith("@")) {
      const query = input.slice(1).toLowerCase();
      const roots = [...ctx.workspaces.values()]
        .filter((workspace) => workspace.status === "active")
        .map((workspace) => resolve(workspace.path));
      const matches: Array<{ path: string; is_dir: boolean }> = [];
      const walk = async (root: string, directory: string, depth: number): Promise<void> => {
        if (matches.length >= 200 || depth > 8) return;
        let entries;
        try { entries = await readdir(directory, { withFileTypes: true }); } catch { return; }
        for (const entry of entries) {
          if (matches.length >= 200 || entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") continue;
          const path = join(directory, entry.name);
          const relative = relativePath(root, path) || basename(path);
          if (entry.name.toLowerCase().includes(query) || relative.toLowerCase().includes(query)) {
            matches.push({ path: relative, is_dir: entry.isDirectory() });
          }
          if (entry.isDirectory()) await walk(root, path, depth + 1);
        }
      };
      for (const root of roots) await walk(root, root, 0);
      return ctx.ok(response, matches.sort((a, b) => a.path.localeCompare(b.path)));
    }
    const expanded = input.startsWith("~/") ? join(homedir(), input.slice(2)) : input;
    const directoryQuery = expanded.length > 1 && expanded.endsWith("/");
    const parent = directoryQuery ? expanded : dirname(expanded || ".");
    const prefix = directoryQuery ? "" : basename(expanded);
    try {
      const entries = await readdir(parent, { withFileTypes: true });
      ctx.ok(response, entries.filter((entry) => entry.name.startsWith(prefix)).map((entry) => ({ path: join(parent, entry.name), is_dir: entry.isDirectory() })));
    } catch { ctx.ok(response, []); }
  }


export async function fsDownload(ctx: HandlerContext, url: URL, response: ServerResponse): Promise<void> {
    const path = ctx.safePath(url.searchParams.get("path") ?? "");
    const content = await readFile(path);
    response.writeHead(200, { "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="${basename(path).replaceAll('"', "")}"` });
    response.end(content);
  }


export async function fsRead(ctx: HandlerContext, url: URL, response: ServerResponse): Promise<void> {
    const path = ctx.safePath(url.searchParams.get("path") ?? "");
    const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0));
    const limit = Math.min(1024 * 1024, Math.max(1, Number(url.searchParams.get("limit") ?? 1024 * 1024)));
    const buffer = await readFile(path);
    const content = buffer.subarray(offset, offset + limit).toString("utf8");
    ctx.ok(response, { path, content, size: buffer.byteLength, offset, length: Buffer.byteLength(content), truncated: offset + Buffer.byteLength(content) < buffer.byteLength });
  }


export async function fsWrite(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse): Promise<void> {
    const body = await ctx.body<{ path?: string; content?: string }>(request);
    if (!body.path || body.content === undefined) return ctx.error(response, 422, "path and content are required");
    const path = ctx.safePath(body.path);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body.content, "utf8");
    ctx.ok(response, { operation: "write", success: true }, 200);
  }


export async function fsUpload(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse, url: URL): Promise<void> {
    const targetDir = ctx.safePath(url.searchParams.get("path") ?? "");
    const chunks: Buffer[] = [];
    let total = 0;
    for await (const chunk of request) {
      const value = Buffer.from(chunk);
      total += value.byteLength;
      if (total > maxJsonBodyBytes) throw new HttpError(413, "Upload exceeds 2MB");
      chunks.push(value);
    }
    const name = request.headers["x-file-name"]?.toString() || "upload.bin";
    await mkdir(targetDir, { recursive: true });
    const target = join(targetDir, basename(name));
    const content = Buffer.concat(chunks);
    await writeFile(target, content);
    ctx.ok(response, { files: [{ path: target, name: basename(target), size: content.byteLength }] });
  }


export async function fsMkdir(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse): Promise<void> {
    const body = await ctx.body<{ path?: string }>(request);
    if (!body.path) return ctx.error(response, 422, "path is required");
    await mkdir(ctx.safePath(body.path), { recursive: true });
    ctx.ok(response, { operation: "mkdir", success: true }, 201);
  }


export async function fsDelete(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse): Promise<void> {
    const body = await ctx.body<{ path?: string; recursive?: boolean }>(request);
    if (!body.path) return ctx.error(response, 422, "path is required");
    await rm(ctx.safePath(body.path), { recursive: body.recursive === true, force: false });
    ctx.ok(response, { operation: "delete", success: true });
  }


export function safePath(ctx: HandlerContext, input: string): string {
    const expanded = input === "~" ? homedir() : input.startsWith("~/") ? join(homedir(), input.slice(2)) : input;
    if (!expanded) throw new Error("path is required");
    const candidate = resolve(expanded);
    const roots = [...ctx.workspaces.values()].filter((workspace) => workspace.status === "active").map((workspace) => resolve(workspace.path));
    if (!roots.some((root) => {
      const relative = relativePath(root, candidate);
      return relative === "" || (!relative.startsWith("..") && !isAbsolute(relative));
    })) throw new HttpError(403, "Path is outside configured workspaces");
    return candidate;
  }
