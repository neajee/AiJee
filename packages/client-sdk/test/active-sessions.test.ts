import assert from "node:assert/strict";
import { test } from "node:test";
import { extractActiveSessionIds } from "../src/core/active-sessions.ts";

test("reads the ids the server actually sends, nested under data", () => {
  // This is the exact shape of a StreamEvent: `event_type` is serialised as
  // `type`, and the payload stays in `data`.
  const frame = {
    id: 42,
    session_id: "",
    workspace_id: "",
    type: "active_sessions",
    data: { type: "active_sessions", session_ids: ["a", "b"] },
    timestamp: 1,
  };

  assert.deepEqual(extractActiveSessionIds(frame), ["a", "b"]);
});

test("still reads a flat frame", () => {
  const frame = { type: "active_sessions", session_ids: ["only"] };
  assert.deepEqual(extractActiveSessionIds(frame), ["only"]);
});

test("an empty list is a result, not a miss", () => {
  const frame = { type: "active_sessions", data: { session_ids: [] } };
  assert.deepEqual(extractActiveSessionIds(frame), []);
});

test("non-string ids are dropped", () => {
  const frame = { type: "active_sessions", data: { session_ids: ["a", 7, null] } };
  assert.deepEqual(extractActiveSessionIds(frame), ["a"]);
});

test("other event types fall through", () => {
  assert.equal(extractActiveSessionIds({ type: "agent_start", data: {} }), null);
  assert.equal(extractActiveSessionIds({ type: "server_hello" }), null);
});

test("a malformed active_sessions frame falls through instead of clearing state", () => {
  const frame = { type: "active_sessions", data: { session_ids: "a,b" } };
  assert.equal(extractActiveSessionIds(frame), null);
});
