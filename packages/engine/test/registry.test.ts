import assert from "node:assert/strict";
import test from "node:test";
import { EngineRegistry, type EngineAdapter } from "../src/index.ts";

const adapter = (id: "pi" | "codex" | "opencode"): EngineAdapter => ({
  id,
  capabilities: { models: true, tools: false, streaming: true, bash: false, steering: true, followUp: true, compaction: false, retry: false, fork: false, sessionHistory: true, extensions: false },
  probe: async () => true,
  describe: () => ({ id }),
  createSession: async () => { throw new Error("not used"); },
});

test("registry resolves a preferred engine without engine-name branching", async () => {
  const registry = new EngineRegistry();
  registry.register(adapter("pi"));
  registry.register(adapter("codex"));
  assert.equal((await registry.resolve("codex"))?.id, "codex");
  assert.deepEqual(registry.list().map((item) => item.id), ["pi", "codex"]);
});
