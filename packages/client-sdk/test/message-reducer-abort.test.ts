import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createEmptySessionState,
  isAbortReason,
  reduceStreamEvent,
} from "../src/core/message-reducer.ts";
import type { SessionState } from "../src/core/message-reducer.ts";
import type { StreamEventEnvelope } from "../src/types/stream-events.ts";

let nextId = 1;

function envelope(type: string, data: Record<string, unknown>): StreamEventEnvelope {
  return {
    id: nextId++,
    session_id: "s1",
    type,
    data,
    timestamp: Date.now(),
  } as unknown as StreamEventEnvelope;
}

function run(events: StreamEventEnvelope[]): SessionState {
  let state = createEmptySessionState();
  for (const event of events) {
    state = reduceStreamEvent(state, event);
  }
  return state;
}

/** A turn that gets aborted while a tool is running. */
function abortedTurn(): SessionState {
  return run([
    envelope("agent_start", {}),
    envelope("message_start", { type: "message_start", message: { role: "assistant" } }),
    envelope("message_update", {
      type: "message_update",
      assistantMessageEvent: {
        type: "toolcall_start",
        contentIndex: 0,
        partial: { id: "tc1", name: "write" },
      },
    }),
    envelope("message_update", {
      type: "message_update",
      assistantMessageEvent: {
        type: "toolcall_end",
        contentIndex: 0,
        toolCall: { id: "tc1", name: "write", arguments: { path: "a.ts" } },
      },
    }),
    envelope("tool_execution_start", { type: "tool_execution_start", toolCallId: "tc1" }),
    envelope("message_update", {
      type: "message_update",
      assistantMessageEvent: { type: "error", reason: "This operation was aborted" },
    }),
    envelope("message_end", {
      type: "message_end",
      message: {
        role: "assistant",
        stopReason: "aborted",
        errorMessage: "This operation was aborted",
        content: [],
      },
    }),
    envelope("agent_end", {}),
    envelope("agent_settled", {}),
  ]);
}

test("isAbortReason recognises runtime abort noise", () => {
  for (const reason of [
    "aborted",
    "Aborted",
    "This operation was aborted",
    "The operation was aborted.",
    "AbortError: The user aborted a request.",
  ]) {
    assert.equal(isAbortReason(reason), true, reason);
  }
  for (const reason of ["rate limit exceeded", "", undefined, null, 500]) {
    assert.equal(isAbortReason(reason), false, String(reason));
  }
});

test("an aborted turn is not rendered as an agent error", () => {
  const state = abortedTurn();
  const assistant = state.messages.at(-1)!;
  assert.equal(assistant.role, "assistant");
  assert.equal(assistant.stopReason, "aborted");
  assert.equal(assistant.errorMessage, undefined);
});

test("an aborted turn stops streaming and cancels in-flight tool calls", () => {
  const state = abortedTurn();
  assert.equal(state.isStreaming, false);
  const assistant = state.messages.at(-1)!;
  assert.equal(assistant.isStreaming, false);
  assert.equal(assistant.toolCalls?.[0]?.status, "cancelled");
});

test("real errors still surface", () => {
  const state = run([
    envelope("agent_start", {}),
    envelope("message_start", { type: "message_start", message: { role: "assistant" } }),
    envelope("message_update", {
      type: "message_update",
      assistantMessageEvent: { type: "error", reason: "rate limit exceeded" },
    }),
    envelope("message_end", {
      type: "message_end",
      message: {
        role: "assistant",
        stopReason: "error",
        errorMessage: "rate limit exceeded",
        content: [],
      },
    }),
    envelope("agent_settled", {}),
  ]);
  const assistant = state.messages.at(-1)!;
  assert.equal(assistant.stopReason, "error");
  assert.equal(assistant.errorMessage, "rate limit exceeded");
});
