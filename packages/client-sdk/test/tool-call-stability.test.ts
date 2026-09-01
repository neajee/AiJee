import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createEmptySessionState,
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

function run(events: StreamEventEnvelope[], from?: SessionState): SessionState {
  let state = from ?? createEmptySessionState();
  for (const event of events) {
    state = reduceStreamEvent(state, event);
  }
  return state;
}

/** A turn that opens one tool, lets it finish, then keeps streaming text. */
function finishedToolTurn(): SessionState {
  return run([
    envelope("agent_start", {}),
    envelope("message_start", { type: "message_start", message: { role: "assistant" } }),
    envelope("message_update", {
      type: "message_update",
      assistantMessageEvent: {
        type: "toolcall_start",
        contentIndex: 0,
        partial: { id: "provisional-1", name: "bash" },
      },
    }),
    envelope("tool_execution_start", { type: "tool_execution_start", toolCallId: "provisional-1" }),
    envelope("tool_execution_end", {
      type: "tool_execution_end",
      toolCallId: "provisional-1",
      result: { content: [{ type: "text", text: "done" }] },
    }),
  ]);
}

test("a full snapshot with a different, stable id keeps a completed tool completed", () => {
  const state = finishedToolTurn();
  const before = state.messages.at(-1)!;
  assert.equal(before.toolCalls![0]!.status, "complete");

  // The server remixes the message into a snapshot whose tool call now carries
  // its final id — and the stream relayed it after `tool_execution_end`.
  const next = run(
    [
      envelope("message_update", {
        type: "message_update",
        message: {
          role: "assistant",
          content: [
            { type: "text", text: "finished" },
            { type: "toolCall", id: "final-1", name: "bash", arguments: { command: "ls" } },
          ],
        },
      }),
    ],
    state,
  );
  const tc = next.messages.at(-1)!.toolCalls![0]!;

  // Identity survived the remap: the old provisional id is remembered, the
  // completed status is never downgraded back to an in-flight one.
  assert.equal(tc.previousId, "provisional-1");
  assert.equal(tc.id, "final-1");
  assert.equal(tc.status, "complete");
  assert.equal(tc.result, "done");
});

test("a transient snapshot mentioning no tools does not drop an in-flight one", () => {
  const state = run([
    envelope("agent_start", {}),
    envelope("message_start", { type: "message_start", message: { role: "assistant" } }),
    envelope("message_update", {
      type: "message_update",
      assistantMessageEvent: {
        type: "toolcall_start",
        contentIndex: 0,
        partial: { id: "tc1", name: "bash" },
      },
    }),
  ]);
  assert.equal(state.messages.at(-1)!.toolCalls![0]!.status, "streaming");

  // The server remixed a snapshot that only knows about the text so far — the
  // running tool is still being assembled and must not vanish for a frame.
  const after = run(
    [
      envelope("message_update", {
        type: "message_update",
        message: {
          role: "assistant",
          content: [{ type: "text", text: "running…" }],
        },
      }),
      envelope("message_update", {
        type: "message_update",
        message: {
          role: "assistant",
          content: [
            { type: "text", text: "running…" },
            { type: "toolCall", id: "tc2", name: "search", arguments: { query: "x" } },
          ],
        },
      }),
    ],
    state,
  );

  const calls = after.messages.at(-1)!.toolCalls!;
  assert.deepEqual(
    calls.map((tc) => tc.name),
    ["bash", "search"],
  );
  assert.equal(calls[0]!.status, "streaming");
});

test("a snapshot mentioning neither keeps statuses and identity stable across frames", () => {
  const state = finishedToolTurn();
  const first = state.messages.at(-1)!.toolCalls![0]!;

  const after = run(
    [
      envelope("message_update", {
        type: "message_update",
        assistantMessageEvent: { type: "text_delta", delta: " more" },
      }),
      envelope("message_update", {
        type: "message_update",
        message: {
          role: "assistant",
          content: [{ type: "toolCall", id: "final-1", name: "bash", arguments: {} }],
        },
      }),
    ],
    state,
  );
  const tc = after.messages.at(-1)!.toolCalls![0]!;

  assert.equal(tc.previousId, first.id);
  assert.equal(tc.status, "complete");
});