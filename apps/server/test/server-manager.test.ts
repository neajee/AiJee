import assert from "node:assert/strict";
import test from "node:test";
import { isHealthPayload, localServerArgs } from "../src/server-manager.ts";

test("accepts only a PiDeck health payload", () => {
  assert.equal(isHealthPayload({ status: "ok" }), true);
  assert.equal(isHealthPayload({ ok: true }), true);
  assert.equal(isHealthPayload("<html>ok</html>"), false);
});

test("builds CLI arguments for a local gateway", () => {
  const args = localServerArgs("http://127.0.0.1:5545");
  assert.equal(args?.[0], "--experimental-strip-types");
  assert.match(args?.[1] ?? "", /apps\/server\/src\/main\.ts$/);
  assert.deepEqual(args?.slice(2), ["serve", "--host", "127.0.0.1", "--port", "5545"]);
});

test("does not start a remote gateway", () => {
  assert.equal(localServerArgs("https://pideck.example.com"), undefined);
});
