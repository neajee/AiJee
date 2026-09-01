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
