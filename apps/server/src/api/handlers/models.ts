import type { IncomingMessage, ServerResponse } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocket } from "ws";
import type { EngineSession } from "@aijee/engine";
import type { StreamEventEnvelope, AgentStreamEvent, ServerEvent } from "@aijee/protocol";
import type { HandlerContext, Workspace, ManagedSession, Mode, OAuthLogin, PersistedSession } from "./context.ts";
import { isObject } from "./context.ts";
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

export async function getCustomModels(ctx: HandlerContext, ): Promise<Record<string, unknown>> { return ctx.customModels; }

  /** Built-in providers are intentionally discovered from the installed Pi SDK,
   * not copied into AiJee.  This keeps the settings UI aligned with SDK updates. */

export async function listBuiltinProviders(ctx: HandlerContext, ): Promise<unknown[]> {
    const runtime = await ModelRuntime.create({ signal: AbortSignal.timeout(15_000) });
    const customIds = new Set(Object.keys((ctx.customModels.providers as Record<string, unknown>) ?? {}));
    return Promise.all(runtime.getProviders()
      .filter((provider) => !customIds.has(provider.id))
      .map(async (provider) => {
        const auth = await runtime.checkAuth(provider.id);
        return {
          id: provider.id,
          name: provider.name ?? provider.id,
          configured: auth !== undefined,
          model_count: runtime.getModels(provider.id).length,
          supports_oauth: provider.auth?.oauth !== undefined,
          supports_api_key: provider.auth?.apiKey !== undefined,
          auth_label: auth === undefined ? null : "已配置",
          auth_source: auth?.source ?? null,
        };
      }));
  }


export async function saveBuiltinProviderKey(ctx: HandlerContext, providerId: string, key: string): Promise<void> {
    const runtime = await ModelRuntime.create({ signal: AbortSignal.timeout(15_000) });
    const provider = runtime.getProviders().find((candidate) => candidate.id === providerId);
    if (!provider || provider.auth?.apiKey === undefined) throw new HttpError(404, "Provider does not accept an API key");
    if (!key.trim()) throw new HttpError(400, "API key is required");
    await ctx.saveApiKey(providerId, key.trim());
  }


export async function removeBuiltinProviderKey(_ctx: HandlerContext, providerId: string): Promise<void> {
    const runtime = await ModelRuntime.create({ signal: AbortSignal.timeout(15_000) });
    await runtime.logout(providerId, { signal: AbortSignal.timeout(15_000) });
  }


export async function startProviderOAuth(ctx: HandlerContext, providerId: string): Promise<Record<string, unknown>> {
    const runtime = await ModelRuntime.create({ signal: AbortSignal.timeout(15_000) });
    const provider = runtime.getProviders().find((candidate) => candidate.id === providerId);
    if (!provider?.auth?.oauth) throw new HttpError(404, "Provider does not support OAuth");
    const flow: OAuthLogin = { id: randomUUID(), providerId, url: null, instructions: null, status: "pending", error: null, controller: new AbortController(), expiresAt: Date.now() + 10 * 60_000, prompt: null, resolvePrompt: null };
    ctx.oauthLogins.set(flow.id, flow);
    void runtime.login(providerId, "oauth", {
      signal: flow.controller.signal,
      notify: (event: any) => { if (event.type === "auth_url") { flow.url = String(event.url); flow.instructions = typeof event.instructions === "string" ? event.instructions : null; } },
      prompt: async (prompt: any) => {
        const options = Array.isArray(prompt.options) ? prompt.options : [];
        if (prompt.type === "select" && options.some((option: any) => String(option.id) === "browser")) return "browser";
        return new Promise<string>((resolve, reject) => {
        const id = randomUUID();
        flow.resolvePrompt = resolve;
        flow.prompt = { id, message: String(prompt.message ?? "继续登录"), type: String(prompt.type ?? "text"), options: options.length ? options.map((option: any) => ({ id: String(option.id), label: String(option.label ?? option.id), ...(typeof option.description === "string" ? { description: option.description } : {}) })) : undefined };
        prompt.signal?.addEventListener("abort", () => reject(new Error("Login cancelled")), { once: true });
        });
      },
    }).then(() => { flow.status = "complete"; }).catch((error) => { flow.status = "failed"; flow.error = error instanceof Error ? error.message : "OAuth login failed"; });
    await new Promise((resolve) => setTimeout(resolve, 250));
    return ctx.oauthStatus(flow.id);
  }


export function oauthStatus(ctx: HandlerContext, loginId: string): Record<string, unknown> {
    const flow = ctx.oauthLogins.get(loginId);
    if (!flow || flow.expiresAt < Date.now()) { ctx.oauthLogins.delete(loginId); throw new HttpError(404, "OAuth login expired"); }
    return { id: flow.id, provider_id: flow.providerId, url: flow.url, instructions: flow.instructions, status: flow.status, error: flow.error, prompt: flow.prompt };
  }


export function resolveOAuthPrompt(ctx: HandlerContext, loginId: string, promptId: string, value: string): void { const flow = ctx.oauthLogins.get(loginId); if (!flow || flow.prompt?.id !== promptId || !flow.resolvePrompt) throw new HttpError(404, "OAuth prompt expired"); const resolve = flow.resolvePrompt; flow.resolvePrompt = null; flow.prompt = null; resolve(value); }


export async function saveCustomModels(ctx: HandlerContext, config: unknown): Promise<Record<string, unknown>> {
    if (!isObject(config) || !isObject(config.providers)) throw new HttpError(400, "providers must be an object");
    const submittedProviders = config.providers;
    for (const [id, provider] of Object.entries(submittedProviders)) {
      if (!id.trim() || !isObject(provider)) throw new HttpError(400, "Each provider needs an id and object configuration");
    }
    const root = await ctx.readPiModelsRoot();
    const providers: Record<string, unknown> = {};
    for (const [id, provider] of Object.entries(submittedProviders)) {
      const { apiKey, ...modelConfig } = provider as Record<string, unknown>;
      if (typeof apiKey === "string" && apiKey.trim()) await ctx.saveApiKey(id, apiKey.trim());
      providers[id] = modelConfig;
    }
    const next = { ...root, providers };
    await ctx.writePiModelsRoot(next);
    ctx.customModels = { providers };
    // Retain runtime.json only as a migration fallback for older AiJee installs.
    await ctx.persist();
    return ctx.customModels;
  }


export async function loadCustomModels(ctx: HandlerContext, legacy: Record<string, unknown> | undefined): Promise<void> {
    try {
      const root = await ctx.readPiModelsRoot();
      const providers = isObject(root.providers) ? root.providers : {};
      const sanitized: Record<string, unknown> = {};
      let migratedCredentials = false;
      for (const [id, value] of Object.entries(providers)) {
        if (!isObject(value)) continue;
        const { apiKey, ...modelConfig } = value;
        if (typeof apiKey === "string" && apiKey.trim()) {
          await ctx.saveApiKey(id, apiKey.trim());
          migratedCredentials = true;
        }
        sanitized[id] = modelConfig;
      }
      ctx.customModels = { providers: sanitized };
      if (migratedCredentials) await ctx.writePiModelsRoot({ ...root, providers: sanitized });
    } catch (error) {
      if (error instanceof SyntaxError) {
        ctx.customModels = { providers: {}, parseError: "~/.pi/agent/models.json is not valid JSON" };
        return;
      }
      throw error;
    }
    // One-way migration. Do not overwrite an existing Pi file, even if empty.
    if (Object.keys(ctx.customModels.providers as object).length === 0 && isObject(legacy?.providers)) {
      await ctx.saveCustomModels({ providers: legacy.providers });
    }
  }


export async function readPiModelsRoot(ctx: HandlerContext, ): Promise<Record<string, unknown>> {
    try {
      const raw = await readFile(ctx.piModelsPath, "utf8");
      if (!raw.trim()) return {};
      const parsed: unknown = JSON.parse(raw);
      if (!isObject(parsed)) throw new HttpError(422, "~/.pi/agent/models.json must contain an object");
      return parsed;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
      throw error;
    }
  }


export async function writePiModelsRoot(ctx: HandlerContext, root: Record<string, unknown>): Promise<void> {
    await mkdir(dirname(ctx.piModelsPath), { recursive: true });
    const temporary = `${ctx.piModelsPath}.${randomUUID()}.tmp`;
    await writeFile(temporary, `${JSON.stringify(root, null, 2)}\n`, "utf8");
    await rename(temporary, ctx.piModelsPath);
  }


export async function saveApiKey(_ctx: HandlerContext, providerId: string, key: string): Promise<void> {
    const runtime = await ModelRuntime.create({ signal: AbortSignal.timeout(15_000) });
    await runtime.setRuntimeApiKey(providerId, key.trim());
  }


export function persist(ctx: HandlerContext, ): Promise<void> { return ctx.store.save({ workspaces: [...ctx.workspaces.values()], identity: undefined, runtime_secret: ctx.runtimeSecret, devices: ctx.auth?.snapshot(), device_codes: ctx.auth?.codeSnapshot(), local_signing_secret: ctx.localSigningSecret, custom_models: ctx.customModels, modes: [...ctx.modes.values()], sessions: [...ctx.sessionRecords.values()], archived_session_ids: [...ctx.archivedSessionIds] }); }

  /** Pi owns the canonical models file.  The runtime creates a fresh Pi service
   * graph for every session, so writing here makes a saved provider available
   * to every subsequently created or reopened session. */
