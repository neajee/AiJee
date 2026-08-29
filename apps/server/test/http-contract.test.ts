import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

type Contract = { openapi: string; paths: Record<string, Record<string, unknown>> };

test("freezes the public REST/SSE route contract during SDK migration", async () => {
  const contract = JSON.parse(await readFile(new URL("../../../packages/api-contract/openapi.yaml", import.meta.url), "utf8")) as Contract;
  assert.equal(contract.openapi, "3.1.0");
  const keys = Object.entries(contract.paths).flatMap(([path, methods]) => Object.keys(methods).map((method) => `${method.toUpperCase()} ${path}`));
  assert.ok(keys.length >= 100);
  for (const methods of Object.values(contract.paths)) for (const operation of Object.values(methods)) {
    const response = (operation as { responses?: Record<string, { content?: Record<string, { schema?: { $ref?: string } }> }> }).responses?.["200"];
    assert.equal(response?.content?.["application/json"]?.schema?.$ref, "#/components/schemas/ApiEnvelope");
  }
  for (const required of [
    "POST /api/agent/prompt",
    "POST /api/agent/steer",
    "POST /api/agent/follow-up",
    "POST /api/agent/abort",
    "GET /api/stream",
    "GET /api/stream/{session_id}",
  ]) assert.ok(keys.includes(required), `missing frozen route: ${required}`);
});
