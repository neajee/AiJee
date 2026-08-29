import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { WebSocket } from "ws";
import { PiDeckHttpServer } from "../src/api/http-server.ts";
import { PiDeckRuntime } from "../src/runtime.ts";
import { SessionRegistry } from "../src/sessions/registry.ts";
import { fakeSession } from "./helpers/fake-session.ts";

async function authorize(server: PiDeckHttpServer): Promise<string> {
  const link = await server.bootstrapLink(server.url());
  const code = new URL(link).searchParams.get("k")!;
  const response = await fetch(`${server.url()}/api/devices`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, name: "Test owner" }) });
  return (await response.json() as { data: { token: string } }).data.token;
}

test("serves the SDK runtime health and workspace contract", async () => {
  const directory = await mkdtemp(join(tmpdir(), "pideck-runtime-"));
  const server = new PiDeckHttpServer(undefined, join(directory, "runtime.json"));
  await server.listen(0, "0.0.0.0");
  try {
    const health = await fetch(`${server.url()}/api/health`);
    assert.deepEqual(await health.json(), { status: "ok" });

    const token = await authorize(server);
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    const created = await fetch(`${server.url()}/api/workspaces`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name: "Pico", path: directory }),
    });
    const createdBody = await created.json() as { success: boolean; data: { id: string } };
    assert.equal(created.status, 201);
    assert.equal(createdBody.success, true);

    const listed = await fetch(`${server.url()}/api/workspaces`, { headers });
    const listedBody = await listed.json() as { success: boolean; data: Array<{ id: string }> };
    assert.equal(listedBody.data[0]?.id, createdBody.data.id);

    const filePath = join(directory, "note.txt");
    const written = await fetch(`${server.url()}/api/fs/write`, { method: "POST", headers, body: JSON.stringify({ path: filePath, content: "hello" }) });
    assert.equal(written.status, 200);
    const read = await fetch(`${server.url()}/api/fs/read?path=${encodeURIComponent(filePath)}`, { headers });
    const readBody = await read.json() as { data: { content: string } };
    assert.equal(readBody.data.content, "hello");

    const models = await fetch(`${server.url()}/api/custom-models`, { headers });
    assert.equal(models.status, 200);
    const mode = await fetch(`${server.url()}/api/modes`, { method: "POST", headers, body: JSON.stringify({ name: "Default" }) });
    assert.equal(mode.status, 201);
    const taskConfig = await fetch(`${server.url()}/api/tasks/config/${createdBody.data.id}`, { headers });
    assert.equal(taskConfig.status, 200);

    const outside = await fetch(`${server.url()}/api/fs/read?path=${encodeURIComponent("/etc/passwd")}`, { headers });
    assert.equal(outside.status, 403);
    const malformed = await fetch(`${server.url()}/api/workspaces`, { method: "POST", headers, body: "{" });
    assert.equal(malformed.status, 400);
  } finally {
    await server.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("reuses a hidden draft session and publishes it only after the first prompt", async () => {
  const directory = await mkdtemp(join(tmpdir(), "pideck-draft-"));
  const messages: unknown[] = [];
  let creates = 0;
  const registry = new SessionRegistry(async (input) => {
    creates++;
    const session = fakeSession("draft-session", { cwd: input.cwd, messages });
    session.prompt = async (text: string) => { messages.push({ role: "user", content: text }); };
    return session;
  });
  const server = new PiDeckHttpServer(new PiDeckRuntime(registry), join(directory, "runtime.json"));
  await server.listen(0, "0.0.0.0");
  try {
    const token = await authorize(server);
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const created = await fetch(`${server.url()}/api/workspaces`, { method: "POST", headers, body: JSON.stringify({ name: "Pico", path: directory }) });
    const workspaceId = (await created.json() as { data: { id: string } }).data.id;
    const body = JSON.stringify({ workspace_id: workspaceId, draft: true });

    const first = await fetch(`${server.url()}/api/agent/sessions`, { method: "POST", headers, body });
    const sessionId = (await first.json() as { data: { session_id: string } }).data.session_id;
    await fetch(`${server.url()}/api/agent/sessions`, { method: "POST", headers, body });
    assert.equal(creates, 1);

    const before = await fetch(`${server.url()}/api/workspaces/${workspaceId}/sessions`, { headers });
    assert.equal((await before.json() as { data: { total: number } }).data.total, 0);

    await fetch(`${server.url()}/api/agent/prompt`, { method: "POST", headers, body: JSON.stringify({ session_id: sessionId, message: "hello" }) });
    const after = await fetch(`${server.url()}/api/workspaces/${workspaceId}/sessions`, { headers });
    assert.equal((await after.json() as { data: { total: number } }).data.total, 1);

    const archivePath = `${server.url()}/api/workspaces/${workspaceId}/sessions/${sessionId}/archive`;
    assert.equal((await fetch(archivePath, { method: "POST", headers })).status, 200);
    assert.equal((await fetch(archivePath, { method: "POST", headers })).status, 200);
  } finally {
    await server.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("forwards image attachments and the queue behaviour to the engine", async () => {
  const directory = await mkdtemp(join(tmpdir(), "pideck-images-"));
  const sent: Array<{ text: string; options?: { images?: unknown; streamingBehavior?: string } }> = [];
  const registry = new SessionRegistry(async (input) => {
    const session = fakeSession("image-session", { cwd: input.cwd });
    session.prompt = async (text: string, options?: { images?: unknown; streamingBehavior?: string }) => {
      sent.push({ text, options });
    };
    return session;
  });
  const server = new PiDeckHttpServer(new PiDeckRuntime(registry), join(directory, "runtime.json"));
  await server.listen(0, "0.0.0.0");
  try {
    const token = await authorize(server);
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const created = await fetch(`${server.url()}/api/workspaces`, { method: "POST", headers, body: JSON.stringify({ name: "Pico", path: directory }) });
    const workspaceId = (await created.json() as { data: { id: string } }).data.id;
    const session = await fetch(`${server.url()}/api/agent/sessions`, { method: "POST", headers, body: JSON.stringify({ workspace_id: workspaceId }) });
    const sessionId = (await session.json() as { data: { session_id: string } }).data.session_id;

    const response = await fetch(`${server.url()}/api/agent/prompt`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        session_id: sessionId,
        message: "what is this",
        streaming_behavior: "followUp",
        images: [{ type: "image", data: "QUJD", mimeType: "image/png" }],
      }),
    });
    assert.equal(response.status, 200);

    assert.equal(sent.length, 1);
    assert.deepEqual(sent[0]!.options?.images, [{ type: "image", data: "QUJD", mimeType: "image/png" }]);
    assert.equal(sent[0]!.options?.streamingBehavior, "followUp", "pi rejects a mid-turn prompt without one");
  } finally {
    await server.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("legacy authentication endpoints are not routed", async () => {
  const directory = await mkdtemp(join(tmpdir(), "pideck-pair-"));
  const server = new PiDeckHttpServer(undefined, join(directory, "runtime.json"));
  await server.listen(0);
  try {
    const removed = await fetch(`${server.url()}/api/auth/login`, { method: "POST" });
    assert.equal(removed.status, 404);
  } finally {
    await server.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("claims a local-only session without exposing setup", async () => {
  const directory = await mkdtemp(join(tmpdir(), "pideck-local-"));
  const server = new PiDeckHttpServer(undefined, join(directory, "runtime.json"));
  await server.listen(0);
  try {
    const origin = server.url();
    const token = await authorize(server);
    const session = await fetch(`${origin}/api/auth/session`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(session.status, 200);
    const workspaces = await fetch(`${origin}/api/workspaces`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal((await workspaces.json() as { data: unknown[] }).data.length, 1);
  } finally {
    await server.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("authorizes, lists, and revokes device tokens", async () => {
  const directory = await mkdtemp(join(tmpdir(), "pideck-devices-"));
  const server = new PiDeckHttpServer(undefined, join(directory, "runtime.json"));
  await server.listen(0, "0.0.0.0");
  try {
    const ownerToken = await authorize(server);
    const code = await fetch(`${server.url()}/api/devices/code`, { method: "POST", headers: { Authorization: `Bearer ${ownerToken}` } });
    const codeValue = (await code.json() as { data: { code: string } }).data.code;
    const created = await fetch(`${server.url()}/api/devices`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: codeValue, name: "Test device" }) });
    const createdData = (await created.json() as { data: { device_id: string; token: string } }).data;
    assert.equal(created.status, 201);
    const listed = await fetch(`${server.url()}/api/devices`, { headers: { Authorization: `Bearer ${ownerToken}` } });
    assert.ok((await listed.json() as { data: unknown[] }).data.length >= 2);
    const revoked = await fetch(`${server.url()}/api/devices/${createdData.device_id}`, { method: "DELETE", headers: { Authorization: `Bearer ${ownerToken}` } });
    assert.equal(revoked.status, 200);
    const session = await fetch(`${server.url()}/api/auth/session`, { headers: { Authorization: `Bearer ${createdData.token}`, "X-Forwarded-For": "192.0.2.10" } });
    assert.equal(session.status, 401);
  } finally {
    await server.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("keeps one reusable device code until it is manually rotated", async () => {
  const directory = await mkdtemp(join(tmpdir(), "pideck-device-code-"));
  const statePath = join(directory, "runtime.json");
  let server = new PiDeckHttpServer(undefined, statePath);
  await server.listen(0, "0.0.0.0");
  try {
    const ownerToken = await authorize(server);
    const headers = { Authorization: `Bearer ${ownerToken}` };
    const current = await fetch(`${server.url()}/api/devices/code`, { headers });
    const firstCode = (await current.json() as { data: { code: string } }).data.code;
    for (const name of ["First", "Second"]) {
      const response = await fetch(`${server.url()}/api/devices`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: firstCode, name }) });
      assert.equal(response.status, 201);
    }

    await server.close();
    server = new PiDeckHttpServer(undefined, statePath);
    await server.listen(0, "0.0.0.0");
    const persisted = await fetch(`${server.url()}/api/devices/code`, { headers });
    assert.equal((await persisted.json() as { data: { code: string } }).data.code, firstCode);

    const rotated = await fetch(`${server.url()}/api/devices/code`, { method: "POST", headers });
    const nextCode = (await rotated.json() as { data: { code: string } }).data.code;
    assert.notEqual(nextCode, firstCode);
    const oldCode = await fetch(`${server.url()}/api/devices`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: firstCode }) });
    assert.equal(oldCode.status, 422);
    const newCode = await fetch(`${server.url()}/api/devices`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: nextCode }) });
    assert.equal(newCode.status, 201);
  } finally {
    await server.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("serves the global SSE handshake expected by client-sdk", async () => {
  const directory = await mkdtemp(join(tmpdir(), "pideck-stream-"));
  const server = new PiDeckHttpServer(undefined, join(directory, "runtime.json"));
  await server.listen(0, "0.0.0.0");
  const controller = new AbortController();
  try {
    const token = await authorize(server);
    const stream = await fetch(`${server.url()}/api/stream`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
    assert.equal(stream.headers.get("content-type"), "text/event-stream");
    const reader = stream.body!.getReader();
    const first = new TextDecoder().decode((await reader.read()).value);
    assert.match(first, /server_hello/);
    controller.abort();
  } finally {
    controller.abort();
    await server.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("serves the authenticated WebSocket stream handshake", async () => {
  const directory = await mkdtemp(join(tmpdir(), "pideck-ws-"));
  const server = new PiDeckHttpServer(undefined, join(directory, "runtime.json"));
  await server.listen(0, "0.0.0.0");
  let socket: WebSocket | undefined;
  try {
    const token = await authorize(server);
    socket = new WebSocket(`${server.url().replace("http://", "ws://")}/api/ws/stream?token=${encodeURIComponent(token)}`);
    const first = await new Promise<string>((resolve, reject) => {
      socket!.once("message", (value) => resolve(String(value)));
      socket!.once("error", reject);
    });
    assert.match(first, /server_hello/);
  } finally {
    socket?.close();
    await server.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("device authorization preserves persisted models and modes", async () => {
  const directory = await mkdtemp(join(tmpdir(), "pideck-state-"));
  const statePath = join(directory, "runtime.json");
  await writeFile(statePath, JSON.stringify({ workspaces: [], custom_models: { providers: { local: { models: [] } } }, modes: [{ id: "safe", name: "Safe" }] }));
  const server = new PiDeckHttpServer(undefined, statePath);
  await server.listen(0, "0.0.0.0");
  try {
    await authorize(server);
    const state = JSON.parse(await readFile(statePath, "utf8")) as { custom_models?: unknown; modes?: unknown[] };
    assert.deepEqual(state.custom_models, { providers: { local: { models: [] } } });
    assert.deepEqual(state.modes, [{ id: "safe", name: "Safe" }]);
  } finally {
    await server.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("restores persisted sessions on demand for model and history reads", async () => {
  const directory = await mkdtemp(join(tmpdir(), "pideck-restore-"));
  const statePath = join(directory, "runtime.json");
  const sessionFile = join(directory, "session.jsonl");
  await writeFile(sessionFile, `${JSON.stringify({ type: "session", version: 3, id: "seeded", timestamp: new Date().toISOString(), cwd: directory })}\n`);
  await writeFile(statePath, JSON.stringify({
    workspaces: [{ id: "workspace-1", path: directory, name: "Pico" }],
    sessions: [{ session_id: "seeded", session_file: sessionFile, workspace_id: "workspace-1", cwd: directory, created_at: new Date().toISOString(), last_active: Date.now() }],
  }));

  let creates = 0;
  const registry = new SessionRegistry(async (input) => {
    const session = fakeSession("seeded", { cwd: input.cwd, sessionFile: input.sessionFile, messages: [{ role: "user", content: "hi" }] });
    session.entries = () => [{ id: "entry-1", raw: { type: "message", message: { role: "user", content: "hi" } } }];
    return session;
  });
  const countingRegistry = new Proxy(registry, {
    get(target, property, receiver) {
      if (property === "create") {
        return (...args: Parameters<SessionRegistry["create"]>) => {
          creates++;
          return target.create(...args);
        };
      }
      return Reflect.get(target, property, receiver);
    },
  });
  const server = new PiDeckHttpServer(new PiDeckRuntime(countingRegistry as SessionRegistry), statePath);
  await server.listen(0, "0.0.0.0");
  try {
    const token = await authorize(server);
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    // A cold session must not 404: model and history reads both restore it, and
    // concurrent reads share a single restore instead of opening the file twice.
    const [models, history] = await Promise.all([
      fetch(`${server.url()}/api/agent/models`, { method: "POST", headers, body: JSON.stringify({ session_id: "seeded" }) }),
      fetch(`${server.url()}/api/sessions/seeded/history?limit=50`, { headers }),
    ]);
    assert.equal(models.status, 200);
    assert.equal(history.status, 200);
    const modelsBody = await models.json() as { data: { models: Array<{ id: string }> } };
    assert.deepEqual(modelsBody.data.models, [{ provider: "test", id: "test-model" }]);
    const historyBody = await history.json() as { data: { messages: Array<{ role?: string; content?: string }> } };
    assert.equal(historyBody.data.messages.length, 1);
    assert.deepEqual(historyBody.data.messages[0], { role: "user", content: "hi" });
    assert.equal(creates, 1, "concurrent restores must share one engine session");
  } finally {
    await server.close();
    await rm(directory, { recursive: true, force: true });
  }
});
