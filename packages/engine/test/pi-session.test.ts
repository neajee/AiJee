import assert from "node:assert/strict";
import test from "node:test";
import type { AgentSessionEvent, AgentSessionRuntime } from "@earendil-works/pi-coding-agent";
import { PiSession } from "../src/adapters/pi/pi-session.ts";

function eventSource() {
  const listeners = new Set<(event: AgentSessionEvent) => void>();
  return {
    session: {
      subscribe(listener: (event: AgentSessionEvent) => void) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    },
    emit(type: string) {
      for (const listener of listeners) listener({ type } as AgentSessionEvent);
    },
  };
}

test("fork rebinds events to the replacement Pi session", async () => {
  const original = eventSource();
  const forked = eventSource();
  const runtime = {
    session: original.session,
    async fork() {
      this.session = forked.session;
      return { cancelled: false };
    },
  } as unknown as AgentSessionRuntime;
  const session = new PiSession(runtime, "/tmp/project");
  const received: string[] = [];
  session.subscribe((event) => received.push(event.type));

  await session.fork("entry-1", { position: "at" });
  original.emit("old_session_event");
  forked.emit("new_session_event");

  assert.deepEqual(received, ["new_session_event"]);
});

test("exposes Pi 0.86 product capabilities through an engine-neutral snapshot", () => {
  const source = eventSource();
  const piSession = {
    ...source.session,
    model: { provider: "openai", id: "gpt-6" },
    cacheWarmingStatus: { state: "scheduled", nextWarmAt: 123 },
    systemPrompt: "system",
    isIdle: true,
    isCompacting: false,
    retryAttempt: 2,
    getActiveToolNames: () => ["read", "bash"],
  };
  const runtime = {
    session: piSession,
    services: {
      settingsManager: {
        getCacheWarmingMode: () => "streaming",
        getCompactionSettings: () => ({ enabled: true, reserveTokens: 16_384, keepRecentTokens: 20_000 }),
        getRetrySettings: () => ({ enabled: true, maxRetries: 3, baseDelayMs: 1000, maxAgentDelayMs: 60_000 }),
      },
    },
  } as unknown as AgentSessionRuntime;

  const session = new PiSession(runtime, "/tmp/project");
  assert.deepEqual(session.productCapabilities(), {
    cacheWarming: { mode: "streaming", status: { state: "scheduled", nextWarmAt: 123 } },
    compaction: { enabled: true, reserveTokens: 16_384, keepRecentTokens: 20_000 },
    prompt: { activeToolNames: ["read", "bash"], hasSystemPrompt: true, systemPromptLength: 6, isIdle: true, isCompacting: false },
    retry: { enabled: true, maxRetries: 3, baseDelayMs: 1000, maxAgentDelayMs: 60_000, attempt: 2 },
  });
});
