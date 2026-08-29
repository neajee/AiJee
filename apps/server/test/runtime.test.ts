import assert from "node:assert/strict";
import test from "node:test";
import { SessionRegistry } from "../src/sessions/registry.ts";
import { fakeSession } from "./helpers/fake-session.ts";

test("deduplicates concurrent SDK session creation", async () => {
  let creates = 0;
  const registry = new SessionRegistry(async () => fakeSession(`session-${++creates}`));
  const [first, second] = await Promise.all([
    registry.create("workspace-a", { cwd: "/tmp/a" }),
    registry.create("workspace-a", { cwd: "/tmp/a" }),
  ]);
  assert.equal(creates, 1);
  assert.equal(first.sessionId, second.sessionId);
  await registry.dispose();
});