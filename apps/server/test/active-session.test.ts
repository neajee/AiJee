import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { AiJeeHttpServer } from "../src/api/http-server.ts";
import { AiJeeRuntime } from "../src/runtime.ts";
import { SessionRegistry } from "../src/sessions/registry.ts";
import { fakeSession } from "./helpers/fake-session.ts";

async function authorize(server: AiJeeHttpServer): Promise<string> {
  const link = await server.bootstrapLink(server.url());
  const code = new URL(link).searchParams.get("k")!;
  const response = await fetch(`${server.url()}/api/devices`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, name: "Test owner" }) });
  return (await response.json() as { data: { token: string } }).data.token;
}

interface SseFrame {
  id?: number;
  data: { type?: string; session_id?: string; connection_id?: string };
}

function parseBlock(block: string): SseFrame | null {
  let id: number | undefined;
  let data = "";
  for (const line of block.split("\n")) {
    if (line.startsWith("id:")) id = Number(line.slice(3).trim());
    else if (line.startsWith("data:")) data += line.slice(5).trim();
  }
  if (!data) return null;
  try {
    return { ...(id !== undefined && Number.isFinite(id) ? { id } : {}), data: JSON.parse(data) as SseFrame["data"] };
  } catch {
    return null;
  }
}

function collectSseFrames(stream: ReadableStream<Uint8Array>): SseFrame[] {
  const frames: SseFrame[] = [];
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  void (async () => {
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) return;
        buffer += decoder.decode(value, { stream: true });
        let separator = buffer.indexOf("\n\n");
        while (separator !== -1) {
          const frame = parseBlock(buffer.slice(0, separator));
          if (frame) frames.push(frame);
          buffer = buffer.slice(separator + 2);
          separator = buffer.indexOf("\n\n");
        }
      }
    } catch {
      // The test aborts the stream once it has the frames it needs.
    }
  })();
  return frames;
}

async function waitFor(frames: SseFrame[], predicate: (frame: SseFrame) => boolean, timeoutMs = 3000): Promise<SseFrame> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const found = frames.find(predicate);
    if (found) return found;
    if (Date.now() > deadline) throw new Error("Timed out waiting for SSE frame");
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

test("replays a session's in-flight deltas when it becomes the active session", async () => {
  const directory = await mkdtemp(join(tmpdir(), "aijee-active-"));
  let session: any;
  const registry = new SessionRegistry(async (input) => {
    session = fakeSession("active-session", { cwd: input.cwd, sessionFile: input.sessionFile });
    return session;
  });
  const server = new AiJeeHttpServer(new AiJeeRuntime(registry), join(directory, "runtime.json"));
  await server.listen(0, "0.0.0.0");
  const controller = new AbortController();
  try {
    const token = await authorize(server);
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const created = await fetch(`${server.url()}/api/workspaces`, { method: "POST", headers, body: JSON.stringify({ name: "AiJee", path: directory }) });
    const workspaceId = (await created.json() as { data: { id: string } }).data.id;
    const opened = await fetch(`${server.url()}/api/agent/sessions`, { method: "POST", headers, body: JSON.stringify({ workspace_id: workspaceId }) });
    const sessionId = (await opened.json() as { data: { session_id: string } }).data.session_id;

    const stream = await fetch(`${server.url()}/api/stream`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
    const frames = collectSseFrames(stream.body!);
    const hello = await waitFor(frames, (frame) => frame.data.type === "server_hello");
    const connectionId = hello.data.connection_id!;
    assert.ok(connectionId, "the handshake must expose a connection id");

    // While no session is active, the delta must not reach this connection.
    session.emit("message_start", { message: { role: "assistant", content: [] } });
    session.emit("message_update", { assistantMessageEvent: { type: "text_delta", delta: "hello" } });
    session.emit("message_end", { message: { role: "assistant", content: [] } });
    const end = await waitFor(frames, (frame) => frame.data.type === "message_end");
    assert.ok(!frames.some((frame) => frame.data.type === "message_update"), "an inactive connection must not receive deltas");

    // Activating the session replays the delta it missed while inactive.
    const activated = await fetch(`${server.url()}/api/stream-active-session`, {
      method: "POST",
      headers,
      body: JSON.stringify({ connection_id: connectionId, session_id: sessionId, from_event_id: end.id, from_delta_event_id: 0 }),
    });
    assert.equal(activated.status, 200);
    const replayed = await waitFor(frames, (frame) => frame.data.type === "message_update");
    assert.equal(replayed.data.session_id, sessionId);
    assert.ok(replayed.id! < end.id!, "the replayed delta predates the last coarse event");

    // Once active, live deltas flow for that session.
    session.emit("message_update", { assistantMessageEvent: { type: "text_delta", delta: " world" } });
    const live = await waitFor(frames, (frame) => frame.data.type === "message_update" && frame.id! > end.id!);
    assert.equal(live.data.session_id, sessionId);
  } finally {
    controller.abort();
    await server.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("rejects an active-session update for an unknown connection", async () => {
  const directory = await mkdtemp(join(tmpdir(), "aijee-active-unknown-"));
  const server = new AiJeeHttpServer(undefined, join(directory, "runtime.json"));
  await server.listen(0, "0.0.0.0");
  try {
    const token = await authorize(server);
    const response = await fetch(`${server.url()}/api/stream-active-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ connection_id: "not-a-connection", session_id: "whatever", from_event_id: 0, from_delta_event_id: 0 }),
    });
    assert.equal(response.status, 404);
  } finally {
    await server.close();
    await rm(directory, { recursive: true, force: true });
  }
});
