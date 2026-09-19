import assert from "node:assert/strict";
import test from "node:test";
import { routes } from "@aijee/protocol";

test("freezes the public REST route contract", () => {
  const keys = Object.entries(routes).map(([name, [method, path]]) => `${method} ${path} -> ${name}`);
  assert.ok(keys.length >= 100);
  for (const required of [
    "POST /api/agent/prompt",
    "POST /api/agent/steer",
    "POST /api/agent/follow-up",
    "POST /api/agent/abort",
    "GET /api/stream",
  ]) assert.ok(keys.some((key) => key.startsWith(required)), `missing frozen route: ${required}`);
});
