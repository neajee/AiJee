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

import { latestReleaseCheck, versionMetadata } from "./release-meta.ts";

export function version(ctx: HandlerContext, response: ServerResponse): void {
    const metadata = versionMetadata();
    ctx.json(response, 200, { name: "aijee", version: "0.1.0", server_id: ctx.localMode ? "local" : "runtime", remote: !ctx.localMode, auth_model: "device-token", ...metadata });
  }


export async function latestVersion(ctx: HandlerContext, response: ServerResponse): Promise<void> {
    const data = await latestReleaseCheck();
    if (!data) {
      return ctx.json(response, 200, {
        current: versionMetadata().tag,
        latest: null,
        update_available: false,
        release_url: null,
        published_at: null,
        checked_at: null,
      });
    }
    return ctx.json(response, 200, data);
  }
