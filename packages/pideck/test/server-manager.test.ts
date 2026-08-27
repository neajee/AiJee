import assert from "node:assert/strict";
import test from "node:test";
import { isHealthPayload, localServerArgs } from "../src/runtime/server-manager.ts";

test("accepts only a PiDeck health payload", () => {
  assert.equal(isHealthPayload({ status: "ok" }), true);
  assert.equal(isHealthPayload({ ok: true }), true);
  assert.equal(isHealthPayload("<html>ok</html>"), false);
});

test("builds CLI arguments for a local gateway", () => {
  assert.deepEqual(localServerArgs("http://127.0.0.1:5545"), [
    "--headless",
    "--host",
    "127.0.0.1",
    "--port",
    "5545",
  ]);
});

test("does not start a remote gateway", () => {
  assert.equal(localServerArgs("https://pideck.example.com"), undefined);
});
