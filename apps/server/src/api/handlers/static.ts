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

export async function web(ctx: HandlerContext, request: IncomingMessage, response: ServerResponse, url: URL): Promise<void> {
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    const candidate = resolve(ctx.webRoot, relative || "index.html");
    const root = resolve(ctx.webRoot);
    const fromRoot = relativePath(root, candidate);
    const file = !fromRoot.startsWith("..") && !isAbsolute(fromRoot) ? candidate : join(root, "index.html");
    let target = file;
    try { if (!(await stat(target)).isFile()) target = join(root, "index.html"); } catch { target = join(root, "index.html"); }
    try {
      const metadata = await stat(target);
      const extension = target.split(".").pop() ?? "html";
      const types: Record<string, string> = { html: "text/html; charset=utf-8", js: "text/javascript; charset=utf-8", css: "text/css; charset=utf-8", json: "application/json; charset=utf-8", svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", ico: "image/x-icon", ttf: "font/ttf", woff: "font/woff", woff2: "font/woff2" };
      const etag = `W/\"${metadata.size.toString(16)}-${Math.trunc(metadata.mtimeMs).toString(16)}\"`;
      const isHtml = extension === "html";
      const isHashed = /[.-][a-f0-9]{8,}\./i.test(target);
      const headers: Record<string, string> = {
        "Content-Type": types[extension] ?? "application/octet-stream",
        "Cache-Control": isHtml ? "no-cache" : isHashed ? "public, max-age=31536000, immutable" : "public, max-age=86400",
        "ETag": etag,
        "Last-Modified": metadata.mtime.toUTCString(),
      };
      if (request.headers["if-none-match"] === etag) {
        response.writeHead(304, headers);
        response.end();
        return;
      }
      const compressible = new Set(["html", "js", "css", "json", "svg"]);
      const accepted = request.headers["accept-encoding"] ?? "";
      const encoding = compressible.has(extension) && metadata.size > 1024
        ? accepted.includes("br") ? "br" : accepted.includes("gzip") ? "gzip" : ""
        : "";
      if (encoding) {
        headers["Content-Encoding"] = encoding;
        headers["Vary"] = "Accept-Encoding";
      } else {
        headers["Content-Length"] = String(metadata.size);
      }
      response.writeHead(200, headers);
      const source = createReadStream(target);
      if (encoding === "br") {
        await pipeline(source, createBrotliCompress({ params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 5 } }), response);
      } else if (encoding === "gzip") {
        await pipeline(source, createGzip({ level: 6 }), response);
      } else {
        await pipeline(source, response);
      }
    } catch (error) {
      if (!response.headersSent) ctx.error(response, 404, "Web assets not found; run yarn web:build");
      else if (!response.destroyed) {
        const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
        if (code !== "ERR_STREAM_PREMATURE_CLOSE" && code !== "ECONNRESET" && code !== "EPIPE") response.destroy();
      }
    }
  }


export function cors(ctx: HandlerContext, response: ServerResponse): void { for (const [name, value] of Object.entries(corsHeaders)) response.setHeader(name, value); }

export function ok(ctx: HandlerContext, response: ServerResponse, data: unknown, status = 200): void { ctx.json(response, status, { success: true, data, error: null }); }

export function error(ctx: HandlerContext, response: ServerResponse, status: number, message: string): void { ctx.json(response, status, { success: false, data: null, error: message }); }

export function json(ctx: HandlerContext, response: ServerResponse, status: number, data: unknown): void { response.writeHead(status, { "Content-Type": "application/json" }); response.end(JSON.stringify(data)); }


export async function body<T>(ctx: HandlerContext, request: IncomingMessage, maxBytes = maxJsonBodyBytes): Promise<T> {
    const limitLabel = `${Math.round(maxBytes / (1024 * 1024))}MB`;
    const contentLength = Number(request.headers["content-length"] ?? 0);
    if (contentLength > maxBytes) throw new HttpError(413, `Request body exceeds ${limitLabel}`);
    const chunks: Buffer[] = [];
    let total = 0;
    for await (const chunk of request) {
      const value = Buffer.from(chunk);
      total += value.byteLength;
      if (total > maxBytes) throw new HttpError(413, `Request body exceeds ${limitLabel}`);
      chunks.push(value);
    }
    if (total === 0) throw new HttpError(400, "JSON request body is required");
    try { return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T; }
    catch { throw new HttpError(400, "Malformed JSON request body"); }
  }
